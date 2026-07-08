# =====================================================================
# 📊 PREDICCIÓN DE PARTIDOS DEL MUNDIAL 2026 - MÓDULO MACHINE LEARNING
# =====================================================================
# Este script realiza la predicción de resultados de fútbol utilizando:
# 1. Dixon-Coles (Modelo probabilístico de Poisson con ajuste de correlación de empates y decaimiento temporal).
# 2. MCMC Bayesiano (Simulación estocástica implementada con PyMC para distribuciones de goles).
# 3. XGBoost Regressor (Modelo de Gradient Boosting basado en ELO, Pi-Ratings, valor de mercado y rachas).
# 4. MLP Regressor (Red Neuronal Multicapa para aproximar la media de goles).
# 5. CatBoost Regressor (Modelo de boosting optimizado para variables categóricas).
# 6. Ensemble (Ponderación óptima de todos los modelos anteriores para máxima precisión).
#
# Adicionalmente, genera gráficos estadísticos explicativos para la visualización del frontend.

import os
import re
import bisect
import warnings
import time
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches   # modificado para importar patches de forma explícita
import matplotlib.patches as mpatches
import seaborn as sns
from scipy.optimize import minimize
from scipy.stats import poisson, nbinom
import pymc as pm
import arviz as az
import xgboost as xgb
from catboost import CatBoostRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

warnings.filterwarnings('ignore')
sns.set_style('whitegrid')

# Cargar datos financieros y scrapeados (Market Value, Edad, Plantilla) a nivel de módulo
MARKET_VALUES = {}
AVG_AGE = {}
SQUAD_SIZE = {}

script_dir = os.path.dirname(os.path.abspath(__file__))
mv_path = os.path.join(script_dir, 'public', 'data', 'market_values.csv')
if os.path.exists(mv_path):
    try:
        df_mv = pd.read_csv(mv_path)
        alias_map = {
            'United States': 'USA', 'South Korea': 'South Korea',
            'Ivory Coast': 'Ivory Coast', 'DR Congo': 'DR Congo',
            'Republic of Ireland': 'Republic of Ireland'
        }
        for row in df_mv.itertuples():
            t_name = alias_map.get(row.team, row.team)
            MARKET_VALUES[t_name] = getattr(row, 'market_value_num', 0.0)
            AVG_AGE[t_name] = getattr(row, 'avg_age', 27.0)
            SQUAD_SIZE[t_name] = getattr(row, 'squad_size', 23.0)
    except Exception as e:
        pass

# Cargar datos de clima y altitud de estadios
STADIUMS_CLIMATE = {}
stadiums_climate_path = os.path.join(script_dir, 'public', 'data', 'stadiums_climate.json')
if os.path.exists(stadiums_climate_path):
    try:
        import json
        with open(stadiums_climate_path, 'r', encoding='utf-8') as f:
            STADIUMS_CLIMATE = json.load(f)
    except Exception as e:
        pass

OPTA_ATT_MODIFIER = {}
OPTA_DFN_MODIFIER = {}

def load_opta_modifiers(script_dir):
    global OPTA_ATT_MODIFIER, OPTA_DFN_MODIFIER
    import json
    
    # 1. Cargar partidos_simulados.csv para saber goles reales del torneo
    csv_sim_path = os.path.join(script_dir, 'partidos_simulados.csv')
    played_goals = {} # (team_a, team_b) -> (goals_a, goals_b)
    if os.path.exists(csv_sim_path):
        try:
            df_sim = pd.read_csv(csv_sim_path)
            for _, row in df_sim.iterrows():
                gh = row['Goles Local']
                ga = row['Goles Visitante']
                if pd.notna(gh) and pd.notna(ga) and str(gh).strip() != '' and str(ga).strip() != '':
                    played_goals[(row['Local'].strip(), row['Visitante'].strip())] = (int(gh), int(ga))
        except Exception as e:
            print(f"[WARNING] Error al cargar partidos_simulados.csv en load_opta_modifiers: {e}")

    # 2. Cargar player_stats.json
    json_path = os.path.join(script_dir, 'public', 'data', 'player_stats.json')
    if not os.path.exists(json_path):
        print("[INFO] No se encontró player_stats.json. Se usarán multiplicadores base 1.0.")
        return
        
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"[WARNING] Error al cargar player_stats.json: {e}")
        return

    # Mapeo de nombres en inglés de player_stats.json a los nombres estándar en predict_matches.py
    OPTA_TO_STANDARD_ENGLISH = {
        "korea republic": "South Korea",
        "korea rep": "South Korea",
        "united states": "USA",
        "united states of america": "USA",
        "bosnia-herzegovina": "Bosnia",
        "bosnia and herzegovina": "Bosnia",
        "cote d'ivoire": "Ivory Coast",
        "côte d'ivoire": "Ivory Coast",
        "congo dr": "DR Congo",
        "dr congo": "DR Congo",
        "turkey": "Turkiye",
        "turkiye": "Turkiye",
        "türkiye": "Turkiye",
        "curacao": "Curaçao",
        "curaçao": "Curaçao",
        "brazília": "Brazil",
        "brazilia": "Brazil",
        "ir_iran": "Iran",
        "ir iran": "Iran"
    }

    # Acumular xG y goles reales
    team_xg_scored = {}
    team_xg_conceded = {}
    team_goals_scored = {}
    team_goals_conceded = {}

    for match_key, match in data.items():
        if not match or 'teams' not in match or 'players' not in match:
            continue
        
        teams_list = match['teams']
        if len(teams_list) < 2:
            continue
            
        t0_eng = teams_list[0]
        t1_eng = teams_list[1]
        
        t0_std = OPTA_TO_STANDARD_ENGLISH.get(t0_eng.lower().strip(), t0_eng.strip())
        t1_std = OPTA_TO_STANDARD_ENGLISH.get(t1_eng.lower().strip(), t1_eng.strip())

        # Buscar goles reales del partido en partidos_simulados.csv
        goals = played_goals.get((t0_std, t1_std))
        if not goals:
            # Intentar reverso
            goals = played_goals.get((t1_std, t0_std))
            if goals:
                goals = (goals[1], goals[0]) # invertir goles
                
        if not goals:
            continue
            
        g0, g1 = goals
        
        # Calcular xG acumulado para cada equipo
        xg0 = sum(p.get('expected_goals', 0.0) for p in match['players'] if p.get('team') == t0_eng)
        xg1 = sum(p.get('expected_goals', 0.0) for p in match['players'] if p.get('team') == t1_eng)
        
        if xg0 == 0.0 and xg1 == 0.0:
            continue

        # Acumular
        for t in [t0_std, t1_std]:
            if t not in team_xg_scored:
                team_xg_scored[t] = 0.0
                team_xg_conceded[t] = 0.0
                team_goals_scored[t] = 0.0
                team_goals_conceded[t] = 0.0
                
        team_xg_scored[t0_std] += xg0
        team_xg_conceded[t0_std] += xg1
        team_goals_scored[t0_std] += g0
        team_goals_conceded[t0_std] += g1
        
        team_xg_scored[t1_std] += xg1
        team_xg_conceded[t1_std] += xg0
        team_goals_scored[t1_std] += g1
        team_goals_conceded[t1_std] += g0

    # Calcular factores suavizados (Laplace +1.0)
    for team in team_xg_scored:
        att_factor = (team_xg_scored[team] + 1.0) / (team_goals_scored[team] + 1.0)
        dfn_factor = (team_xg_conceded[team] + 1.0) / (team_goals_conceded[team] + 1.0)
        
        OPTA_ATT_MODIFIER[team] = att_factor
        OPTA_DFN_MODIFIER[team] = dfn_factor
        
        print(f"[OPTA ADJUST] {team}: xG Scored = {team_xg_scored[team]:.2f}, Goals = {team_goals_scored[team]:.0f} -> Mod_Att = {att_factor:.3f}")
        print(f"[OPTA ADJUST] {team}: xG Conceded = {team_xg_conceded[team]:.2f}, Goals Conceded = {team_goals_conceded[team]:.0f} -> Mod_Dfn = {dfn_factor:.3f}")

# Configuración global de los modelos (Optimizados por Grid Search)
DESDE = pd.Timestamp('2018-01-01')       # Ventana de datos históricos para Dixon-Coles, XGBoost, MLP y CatBoost
DESDE_BAYES = pd.Timestamp('2021-01-01') # Ventana para MCMC Bayesiano (Ciclos mundialistas completos)
VAL_CUTOFF = pd.Timestamp('2025-09-01')  # Fecha límite para separar el conjunto de entrenamiento y validación
MATCH_DATE = pd.Timestamp('2026-06-22')  # Fecha base de las predicciones del Mundial

HALF_LIFE = 300                          # Decaimiento dinámico Dixon-Coles óptimo
THETA_KNOCKOUT = -0.40                   # Cópula Frank para fase de eliminación directa
THETA_GROUPS = -0.20                     # Cópula Frank para fase de grupos
ELO_SCALE_FACTOR = 1500.0                # Escala de prioris informadas en MCMC Bayesiano
MCMC_DRAWS = 1500                        # Iteraciones NUTS optimizadas para MCMC
MCMC_TUNE = 1500                         # Iteraciones de tuning NUTS optimizadas
CB_DEPTH = 3                             # Profundidad de CatBoost optimizada
MIN_PARTIDOS_BAYES = 10                  # Filtro mínimo de partidos para entrenar variables en MCMC
MAXG = 7

# Colores premium consistentes
C_HOME = '#1d4ed8'  # Azul rey
C_DRAW = '#94a3b8'  # Gris pizarra
C_AWAY = '#b91c1c'  # Rojo oscuro

# Diccionario maestro de mapeo: Español (UI/matches.js) -> Inglés (results.csv)
SPANISH_TO_ENGLISH = {
    'Alemania': 'Germany', 'Arabia Saudita': 'Saudi Arabia', 'Argelia': 'Algeria',
    'Argentina': 'Argentina', 'Australia': 'Australia', 'Austria': 'Austria',
    'Bosnia y Herzegovina': 'Bosnia and Herzegovina', 'Brasil': 'Brazil',
    'Bélgica': 'Belgium', 'Cabo Verde': 'Cape Verde', 'Canadá': 'Canada',
    'Catar': 'Qatar', 'Chequia': 'Czech Republic', 'Colombia': 'Colombia',
    'Corea del Sur': 'South Korea', 'Costa de Marfil': 'Ivory Coast',
    'Croacia': 'Croatia', 'Curazao': 'Curaçao', 'Ecuador': 'Ecuador',
    'Egipto': 'Egypt', 'Escocia': 'Scotland', 'España': 'Spain',
    'Estados Unidos': 'United States', 'Francia': 'France', 'Ghana': 'Ghana',
    'Haití': 'Haiti', 'Inglaterra': 'England', 'Irak': 'Iraq', 'Irán': 'Iran',
    'Japón': 'Japan', 'Jordania': 'Jordan', 'Marruecos': 'Morocco',
    'México': 'Mexico', 'Noruega': 'Norway', 'Nueva Zelanda': 'New Zealand',
    'Panamá': 'Panama', 'Paraguay': 'Paraguay', 'Países Bajos': 'Netherlands',
    'Portugal': 'Portugal', 'RD Congo': 'DR Congo', 'Senegal': 'Senegal',
    'Sudáfrica': 'South Africa', 'Suecia': 'Sweden', 'Suiza': 'Switzerland',
    'Turquía': 'Turkey', 'Túnez': 'Tunisia', 'Uruguay': 'Uruguay',
    'Uzbekistán': 'Uzbekistan'
}

def resultado_real(hs, as_):
    return 0 if hs > as_ else (1 if hs == as_ else 2)

def rps_1x2(p, o):
    e = [0., 0., 0.]
    e[o] = 1.
    cp = ce = s = 0.
    for k in range(2):
        cp += p[k]
        ce += e[k]
        s += (cp - ce) ** 2
    return s / 2

# --- PARSEO DE PARTIDOS DESDE JS ---
def parse_matches(js_path):
    if not os.path.exists(js_path):
        print(f"[ERROR] No se encontró el archivo de configuración en {js_path}")
        return []
    
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    start = content.find("export const MATCHES = [")
    if start == -1:
        return []
    end = content.find("];", start)
    matches_block = content[start:end]
    
    # Dividir por "}," para obtener cada bloque de objeto
    match_objs = matches_block.split("},")
    matches = []
    for obj_str in match_objs:
        if 'id:' not in obj_str:
            continue
        # Limpiar saltos de línea para facilitar regex
        obj_str = obj_str.replace('\n', ' ').replace('\r', ' ')
        
        match_id = re.search(r"id\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        day = re.search(r"day\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        home = re.search(r"home\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        away = re.search(r"away\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        home_code = re.search(r"homeCode\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        away_code = re.search(r"awayCode\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        
        mcmc_path = re.search(r"mcmc\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        xgb_path = re.search(r"xgboost\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        acc_path = re.search(r"accuracy\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        res_path = re.search(r"Resumen\s*:\s*['\"]([^'\"]*)['\"]", obj_str)
        
        if match_id and day and home and away:
            matches.append({
                'id': match_id.group(1),
                'day': day.group(1),
                'home': home.group(1),
                'away': away.group(1),
                'homeCode': home_code.group(1) if home_code else 'default',
                'awayCode': away_code.group(1) if away_code else 'default',
                'mcmc_file': mcmc_path.group(1).split('/')[-1] if mcmc_path else f"{match_id.group(1)}_mcmc.png",
                'xgb_file': xgb_path.group(1).split('/')[-1] if xgb_path else f"{match_id.group(1)}_xgboost.png",
                'accuracy_file': acc_path.group(1).split('/')[-1] if acc_path else f"{match_id.group(1)}_accuracy.png",
                'resumen_file': res_path.group(1).split('/')[-1] if res_path else f"{match_id.group(1)}_resumen.png",
            })
    return matches

# --- CÁLCULO ELO DINÁMICO ---
def compute_elo_ratings(df):
    """
    Calcula los ratings ELO históricos para todas las selecciones.
    El ELO inicial es 1500. Se actualiza después de cada partido según:
      new_elo = old_elo + K * (Resultado_Real - Probabilidad_Esperada)
    Donde:
      - K = 60 para partidos de Mundial.
      - K = 40 para torneos continentales / oficiales.
      - K = 20 para amistosos.
      - Se añade ventaja de localía (+100 puntos en rating) si el partido no es neutral.
    """
    print("[INFO] Calculando ratings ELO históricos...")
    df = df.sort_values('date').reset_index(drop=True)
    elos = {}
    elo_history = []
    elo_by_team = {}
    
    for row in df.itertuples():
        h = row.home_team
        a = row.away_team
        date = row.date
        
        if h not in elos: elos[h] = 1500.0
        if a not in elos: elos[a] = 1500.0
        
        elo_h = elos[h]
        elo_a = elos[a]
        
        elo_history.append((row.Index, elo_h, elo_a))
        
        # Diferencia de rating con ventaja de localía si no es neutral
        dr = elo_h - elo_a
        if not row.neutral:
            dr += 100.0
            
        we_h = 1.0 / (10.0 ** (-dr / 400.0) + 1.0)
        we_a = 1.0 - we_h
        
        # Resultado real
        if row.home_score > row.away_score:
            w_h, w_a = 1.0, 0.0
        elif row.home_score == row.away_score:
            w_h, w_a = 0.5, 0.5
        else:
            w_h, w_a = 0.0, 1.0
            
        # Importancia del torneo (K-factor)
        tournament = str(row.tournament).lower()
        if 'world cup' in tournament:
            K = 60
        elif 'cup' in tournament or 'championship' in tournament or 'nations' in tournament:
            K = 40
        else:
            K = 20
            
        new_elo_h = elo_h + K * (w_h - we_h)
        new_elo_a = elo_a + K * (w_a - we_a)
        
        elos[h] = new_elo_h
        elos[a] = new_elo_a
        
        if h not in elo_by_team: elo_by_team[h] = []
        if a not in elo_by_team: elo_by_team[a] = []
        elo_by_team[h].append((date, new_elo_h))
        elo_by_team[a].append((date, new_elo_a))
        
    elo_df = pd.DataFrame(elo_history, columns=['index', 'home_elo', 'away_elo']).set_index('index')
    df = df.join(elo_df)
    
    # Ordenar historial para búsquedas rápidas con bisect
    for team in elo_by_team:
        elo_by_team[team].sort(key=lambda x: x[0])
        
    return df, elo_by_team, elos

def get_elo_at_date(team, date, elo_by_team, final_elos):
    if team not in elo_by_team:
        return 1500.0
    history = elo_by_team[team]
    dates = [x[0] for x in history]
    idx = bisect.bisect_left(dates, date)
    if idx == 0:
        return 1500.0
    return history[idx-1][1]

# --- CÁLCULO PI-RATINGS ---
def compute_pi_ratings(df):
    """
    Calcula los Pi-Ratings históricos (ratings basados en la diferencia de goles esperada).
    A diferencia de ELO, Pi-Ratings se enfoca en medir la superioridad ofensiva/defensiva
    directamente relacionada con el marcador final del partido.
      - Tasa de aprendizaje (lambda) = 0.05.
      - Ventaja de localía = +0.5 goles esperados si no es neutral.
    """
    print("[INFO] Calculando Pi-Ratings históricos...")
    df = df.sort_values('date').reset_index(drop=True)
    pis = {}
    pi_history = []
    pi_by_team = {}
    
    lambda_rate = 0.05
    
    for row in df.itertuples():
        h = row.home_team
        a = row.away_team
        date = row.date
        
        if h not in pis: pis[h] = 0.0
        if a not in pis: pis[a] = 0.0
        
        pi_h = pis[h]
        pi_a = pis[a]
        
        pi_history.append((row.Index, pi_h, pi_a))
        
        expected_gd = pi_h - pi_a
        if not row.neutral:
            expected_gd += 0.5  # ventaja de local en goles
            
        actual_gd = row.home_score - row.away_score
        
        if actual_gd > 0:
            adj_gd = 1.5 * np.log10(1 + actual_gd)
        elif actual_gd < 0:
            adj_gd = -1.5 * np.log10(1 + abs(actual_gd))
        else:
            adj_gd = 0.0
            
        error = adj_gd - expected_gd
        
        new_pi_h = pi_h + lambda_rate * error
        new_pi_a = pi_a - lambda_rate * error
        
        pis[h] = new_pi_h
        pis[a] = new_pi_a
        
        if h not in pi_by_team: pi_by_team[h] = []
        if a not in pi_by_team: pi_by_team[a] = []
        pi_by_team[h].append((date, new_pi_h))
        pi_by_team[a].append((date, new_pi_a))
        
    pi_df = pd.DataFrame(pi_history, columns=['index', 'home_pi', 'away_pi']).set_index('index')
    df = df.join(pi_df)
    
    for team in pi_by_team:
        pi_by_team[team].sort(key=lambda x: x[0])
        
    return df, pi_by_team, pis

def get_pi_at_date(team, date, pi_by_team, final_pis):
    if team not in pi_by_team:
        return 0.0
    history = pi_by_team[team]
    dates = [x[0] for x in history]
    idx = bisect.bisect_left(dates, date)
    if idx == 0:
        return 0.0
    return history[idx-1][1]

# --- MODELO DIXON-COLES ---
def fit_dixon_coles(train, cutoff, half_life=HALF_LIFE):
    """
    Ajusta el modelo probabilístico de Dixon-Coles.
    Calcula los parámetros de ataque (att) y defensa (dfn) de cada equipo, la ventaja
    de localía (home), y el parámetro de ajuste de empates de pocos goles (rho), utilizando
    una regresión de Poisson ponderada por tiempo (decaimiento exponencial).
    """
    train = train.copy()
    train['w'] = 0.5 ** ((cutoff - train['date']).dt.days / half_life)
    teams = sorted(set(train['home_team']) | set(train['away_team']))
    idx = {t:i for i,t in enumerate(teams)}; n = len(teams)
    hi = train['home_team'].map(idx).values; ai = train['away_team'].map(idx).values
    hs = train['home_score'].values; as_ = train['away_score'].values; w = train['w'].values
    lm = (train['neutral'] == False).values.astype(float)
    
    def tau(x, y, l, m, r):
        t = np.ones_like(l)
        a = (x==0)&(y==0); t[a] = 1 - l[a]*m[a]*r
        a = (x==0)&(y==1); t[a] = 1 + l[a]*r
        a = (x==1)&(y==0); t[a] = 1 + m[a]*r
        a = (x==1)&(y==1); t[a] = 1 - r
        return t
        
    def nll(p):
        at = p[:n] - p[:n].mean(); dn = p[n:2*n]; h = p[2*n]; r = p[2*n+1]
        l = np.exp(at[hi] - dn[ai] + h*lm); m = np.exp(at[ai] - dn[hi])
        t = np.clip(tau(hs, as_, l, m, r), 1e-10, None)
        return -(w * (np.log(t) + poisson.logpmf(hs, l) + poisson.logpmf(as_, m))).sum()
        
    r = minimize(nll, np.concatenate([np.zeros(n), np.zeros(n), [.25, -.05]]), method='L-BFGS-B')
    at = r.x[:n] - r.x[:n].mean()
    return {'att': at, 'dfn': r.x[n:2*n], 'home': r.x[2*n], 'rho': r.x[2*n+1], 'idx': idx, 'teams': teams}

def dc_matrix(dcm, h, a, host):
    idx = dcm['idx']
    if h not in idx or a not in idx:
        # Fallback si el equipo no está en Dixon-Coles
        M = np.outer(poisson.pmf(range(MAXG), 1.2), poisson.pmf(range(MAXG), 1.2))
        return M / M.sum()
        
    att, dfn, home, rho = dcm['att'], dcm['dfn'], dcm['home'], dcm['rho']
    l = np.exp(att[idx[h]] - dfn[idx[a]] + (home if host else 0))
    m = np.exp(att[idx[a]] - dfn[idx[h]])
    
    # Aplicar modificadores de Opta
    w = 0.35 # Peso de suavizado
    h_att_mod = 1.0 - w + w * OPTA_ATT_MODIFIER.get(h, 1.0)
    a_dfn_mod = 1.0 - w + w * OPTA_DFN_MODIFIER.get(a, 1.0)
    a_att_mod = 1.0 - w + w * OPTA_ATT_MODIFIER.get(a, 1.0)
    h_dfn_mod = 1.0 - w + w * OPTA_DFN_MODIFIER.get(h, 1.0)
    
    l = l * h_att_mod / a_dfn_mod
    m = m * a_att_mod / h_dfn_mod
    
    M = np.outer(poisson.pmf(range(MAXG), l), poisson.pmf(range(MAXG), m))
    M[0,0] *= 1 - l*m*rho; M[0,1] *= 1 + l*rho; M[1,0] *= 1 + m*rho; M[1,1] *= 1 - rho
    return M / M.sum()

def matrix_to_1x2(M):
    return [np.tril(M, -1).sum(), np.trace(M), np.triu(M, 1).sum()]

# --- MODELO DIXON-COLES CON BINOMIAL NEGATIVA (DC-NB) ---
def fit_dixon_coles_nb(train, cutoff, half_life=HALF_LIFE):
    """
    Ajusta el modelo de Dixon-Coles utilizando distribuciones Binomial Negativa (NB) bivariadas.
    Permite modelar la sobredispersión (varianza > media) de goles en partidos reales.
    Optimiza parámetros de ataque, defensa, ventaja de localía, correlación de empates (rho)
    y parámetros de dispersión alpha_h y alpha_a.
    """
    train = train.copy()
    train['w'] = 0.5 ** ((cutoff - train['date']).dt.days / half_life)
    teams = sorted(set(train['home_team']) | set(train['away_team']))
    idx = {t:i for i,t in enumerate(teams)}; n = len(teams)
    hi = train['home_team'].map(idx).values; ai = train['away_team'].map(idx).values
    hs = train['home_score'].values; as_ = train['away_score'].values; w = train['w'].values
    lm = (train['neutral'] == False).values.astype(float)
    
    def tau(x, y, l, m, r):
        t = np.ones_like(l)
        a = (x==0)&(y==0); t[a] = 1 - l[a]*m[a]*r
        a = (x==0)&(y==1); t[a] = 1 + l[a]*r
        a = (x==1)&(y==0); t[a] = 1 + m[a]*r
        a = (x==1)&(y==1); t[a] = 1 - r
        return t
        
    def nll(p):
        at = p[:n] - p[:n].mean(); dn = p[n:2*n]; h = p[2*n]; r = p[2*n+1]
        alpha_h = np.exp(p[2*n+2])
        alpha_a = np.exp(p[2*n+3])
        l = np.exp(at[hi] - dn[ai] + h*lm)
        m = np.exp(at[ai] - dn[hi])
        t = np.clip(tau(hs, as_, l, m, r), 1e-10, None)
        
        n_h = 1.0 / alpha_h
        p_h = 1.0 / (1.0 + alpha_h * l)
        n_a = 1.0 / alpha_a
        p_a = 1.0 / (1.0 + alpha_a * m)
        
        logpmf_h = nbinom.logpmf(hs, n_h, p_h)
        logpmf_a = nbinom.logpmf(as_, n_a, p_a)
        
        return -(w * (np.log(t) + logpmf_h + logpmf_a)).sum()
        
    init_p = np.concatenate([np.zeros(n), np.zeros(n), [.25, -.05, -1.0, -1.0]])
    r = minimize(nll, init_p, method='L-BFGS-B')
    at = r.x[:n] - r.x[:n].mean()
    return {
        'att': at, 'dfn': r.x[n:2*n], 'home': r.x[2*n], 'rho': r.x[2*n+1],
        'alpha_h': np.exp(r.x[2*n+2]), 'alpha_a': np.exp(r.x[2*n+3]),
        'idx': idx, 'teams': teams
    }

def dc_nb_matrix(dcm, h, a, host):
    idx = dcm['idx']
    if h not in idx or a not in idx:
        M = np.outer(poisson.pmf(range(MAXG), 1.2), poisson.pmf(range(MAXG), 1.2))
        return M / M.sum()
        
    att, dfn, home, rho = dcm['att'], dcm['dfn'], dcm['home'], dcm['rho']
    alpha_h, alpha_a = dcm['alpha_h'], dcm['alpha_a']
    l = np.exp(att[idx[h]] - dfn[idx[a]] + (home if host else 0))
    m = np.exp(att[idx[a]] - dfn[idx[h]])
    
    # Aplicar modificadores de Opta
    w = 0.35 # Peso de suavizado
    h_att_mod = 1.0 - w + w * OPTA_ATT_MODIFIER.get(h, 1.0)
    a_dfn_mod = 1.0 - w + w * OPTA_DFN_MODIFIER.get(a, 1.0)
    a_att_mod = 1.0 - w + w * OPTA_ATT_MODIFIER.get(a, 1.0)
    h_dfn_mod = 1.0 - w + w * OPTA_DFN_MODIFIER.get(h, 1.0)
    
    l = l * h_att_mod / a_dfn_mod
    m = m * a_att_mod / h_dfn_mod
    
    n_h = 1.0 / alpha_h
    p_h = 1.0 / (1.0 + alpha_h * l)
    n_a = 1.0 / alpha_a
    p_a = 1.0 / (1.0 + alpha_a * m)
    
    M = np.outer(nbinom.pmf(range(MAXG), n_h, p_h), nbinom.pmf(range(MAXG), n_a, p_a))
    M[0,0] *= 1 - l*m*rho; M[0,1] *= 1 + l*rho; M[1,0] *= 1 + m*rho; M[1,1] *= 1 - rho
    return M / M.sum()

# --- MODELO MCMC BAYESIANO ---
def fit_mcmc(train, final_elos, draws=1000, tune=1000, seed=1):
    """
    Ajusta un modelo predictivo bayesiano jerárquico de Poisson.
    Utiliza PyMC para estimar la distribución posterior de las habilidades de ataque
    y defensa a través de muestreo por cadenas de Montecarlo (MCMC NUTS).
    Incopora prioris informadas basadas en el rating ELO de cada selección.
    """
    cnt = pd.concat([train.home_team, train.away_team]).value_counts()
    keep = set(cnt[cnt >= MIN_PARTIDOS_BAYES].index)
    tb = train[train.home_team.isin(keep) & train.away_team.isin(keep)]
    teams = sorted(keep); idxb = {t:i for i,t in enumerate(teams)}; n = len(teams)
    hi = tb.home_team.map(idxb).values; ai = tb.away_team.map(idxb).values
    hs = tb.home_score.values; as_ = tb.away_score.values
    lm = (tb.neutral == False).values.astype(float)
    
    # Prioris informadas basadas en ELO (escalado ELO -> goles esperados relativos)
    elo_means = []
    for t in teams:
        current_elo = final_elos.get(t, 1500.0)
        elo_means.append((current_elo - 1500.0) / ELO_SCALE_FACTOR)
    elo_means = np.array(elo_means)
    
    with pm.Model():
        sa = pm.HalfNormal('sa', 0.5); sd = pm.HalfNormal('sd', 0.5)
        # Inicializar medias con los ratings ELO correspondientes
        att = pm.Normal('att', mu=elo_means, sigma=sa, shape=n)
        dfn = pm.Normal('dfn', mu=-elo_means, sigma=sd, shape=n)
        home = pm.Normal('home', 0.25, 0.2)
        base = pm.Normal('base', 0, 0.5)
        ac = pm.Deterministic('ac', att - att.mean())
        dc_ = pm.Deterministic('dc_', dfn - dfn.mean())
        
        pm.Poisson('gh', pm.math.exp(base + home*lm + ac[hi] - dc_[ai]), observed=hs)
        pm.Poisson('ga', pm.math.exp(base + ac[ai] - dc_[hi]), observed=as_)
        
        trace = pm.sample(draws, tune=tune, chains=4, cores=4, target_accept=0.95,
                          progressbar=False, random_seed=seed)
        
        # Auditoría de convergencia Gelman-Rubin
        summary = az.summary(trace, var_names=['att', 'dfn', 'home', 'base'])
        max_rhat = float(pd.to_numeric(summary['r_hat'], errors='coerce').max())
        if max_rhat > 1.05:
            print(f"  [ADVERTENCIA MCMC] Las cadenas no han convergido (Max R-hat = {max_rhat:.4f} > 1.05).")
            
    return {'trace': trace, 'idxb': idxb, 'keep': keep}

def mcmc_matrix_mean(mc, h, a, host, dc_model):
    post = mc['trace'].posterior
    idxb = mc['idxb']
    
    am = post['ac'].mean(('chain','draw')).values
    dm = post['dc_'].mean(('chain','draw')).values
    hm = float(post['home'].mean())
    bm = float(post['base'].mean())
    
    # Fallback si el equipo no está en MCMC
    if h in idxb:
        att_h = am[idxb[h]]
        dfn_h = dm[idxb[h]]
    else:
        dc_idx = dc_model['idx']
        if h in dc_idx:
            att_h = dc_model['att'][dc_idx[h]]
            dfn_h = dc_model['dfn'][dc_idx[h]]
        else:
            att_h, dfn_h = 0.0, 0.0
            
    if a in idxb:
        att_a = am[idxb[a]]
        dfn_a = dm[idxb[a]]
    else:
        dc_idx = dc_model['idx']
        if a in dc_idx:
            att_a = dc_model['att'][dc_idx[a]]
            dfn_a = dc_model['dfn'][dc_idx[a]]
        else:
            att_a, dfn_a = 0.0, 0.0
            
    l = np.exp(bm + hm * host + att_h - dfn_a)
    m = np.exp(bm + att_a - dfn_h)
    M = np.outer(poisson.pmf(range(MAXG), l), poisson.pmf(range(MAXG), m))
    return M / M.sum()

# --- PREPARACIÓN DE CARACTERÍSTICAS XGBOOST ---
def get_form_at_date(team, date, form_by_team):
    if team not in form_by_team:
        return (1.0, 1.0, 1.0)
    history = form_by_team[team]
    dates = [x[0] for x in history]
    idx = bisect.bisect_left(dates, date)
    if idx == 0:
        return (1.0, 1.0, 1.0)
    return (history[idx-1][1], history[idx-1][2], history[idx-1][3])

def get_h2h_at_date(h, a, date, h2h_dict):
    pair = tuple(sorted([h, a]))
    if pair not in h2h_dict:
        return 0.0
    history = h2h_dict[pair]
    dates = [x[0] for x in history]
    idx = bisect.bisect_left(dates, date)
    if idx == 0:
        return 0.0
    recent = history[max(0, idx-5):idx]
    gd = sum([x[1] for x in recent]) / len(recent)
    if h != pair[0]:
        gd = -gd
    return gd

def make_features(dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue=None):
    idx = dcm['idx']
    if h not in idx or a not in idx:
        return None
        
    att, dfn, home = dcm['att'], dcm['dfn'], dcm['home']
    lam = np.exp(att[idx[h]] - dfn[idx[a]] + home * host)
    mu = np.exp(att[idx[a]] - dfn[idx[h]])
    
    fh = get_form_at_date(h, date, form_by_team)
    fa = get_form_at_date(a, date, form_by_team)
    
    # ELO rating (Mejora clave de precisión)
    elo_h = get_elo_at_date(h, date, elo_by_team, final_elos)
    elo_a = get_elo_at_date(a, date, elo_by_team, final_elos)
    elo_diff = elo_h - elo_a
    
    # Pi-Ratings
    pi_h = get_pi_at_date(h, date, pi_by_team, final_pis)
    pi_a = get_pi_at_date(a, date, pi_by_team, final_pis)
    
    h2h_gd = get_h2h_at_date(h, a, date, h2h_dict)
    
    # Market Values & Scraped Features (valores en escala real, óptimos para XGBoost y CatBoost)
    mv_h = MARKET_VALUES.get(h, 0.0) if 'MARKET_VALUES' in globals() else 0.0
    mv_a = MARKET_VALUES.get(a, 0.0) if 'MARKET_VALUES' in globals() else 0.0
    mv_diff = mv_h - mv_a
    
    # Cargar datos de clima y altitud
    altitude = 100.0
    temp = 20.0
    taxing = 0.1
    if venue and venue in STADIUMS_CLIMATE:
        st_info = STADIUMS_CLIMATE[venue]
        altitude = st_info.get("altitude_m", 100.0)
        temp = st_info.get("effective_temp_c", 20.0)
        taxing = st_info.get("taxing_score", 0.1)
        
    # Devolvemos un vector purgado de ruido con datos climáticos y de altitud agregados
    return [
        lam, mu, att[idx[h]] - att[idx[a]], dfn[idx[h]] - dfn[idx[a]], float(host),
        fh[0], fh[1], fh[2], fa[0], fa[1], fa[2],
        elo_h, elo_a, elo_diff, pi_h, pi_a, h2h_gd, float(is_comp),
        mv_h, mv_a, mv_diff,
        float(altitude), float(temp), float(taxing)
    ]

def build_dataset(dcm, fecha_max, df_all, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis):
    known = set(dcm['teams'])
    rows, yh, ya = [], [], []
    th, ta = [], []
    sub = df_all[(df_all.date >= DESDE) & (df_all.date < fecha_max)]
    for r in sub.itertuples():
        if r.home_team not in known or r.away_team not in known:
            continue
        host = 1.0 if r.neutral == False else 0.0
        is_comp = 0.0 if 'friendly' in str(r.tournament).lower() else 1.0
        f = make_features(dcm, r.home_team, r.away_team, host, r.date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis)
        if f is None or any(pd.isna(f)):
            continue
        rows.append(f)
        yh.append(r.home_score)
        ya.append(r.away_score)
        th.append(r.home_team)
        ta.append(r.away_team)
    return np.array(rows), np.array(yh), np.array(ya), th, ta

def train_xgb_goals(X, yh, ya):
    # Ajuste de hiperparámetros y Early Stopping
    # Aumentamos reg_lambda a 4.0 y reducimos max_depth a 3 para forzar conservadurismo anti-sobreajuste
    params = dict(objective='count:poisson', n_estimators=1500, max_depth=3,
                  learning_rate=0.03, subsample=0.8, colsample_bytree=0.8, 
                  min_child_weight=2, reg_lambda=4.0, random_state=42, early_stopping_rounds=50, n_jobs=-1)
    
    # Hacemos validación interna 85/15
    X_train_h, X_val_h, y_train_h, y_val_h = train_test_split(X, yh, test_size=0.15, random_state=42)
    X_train_a, X_val_a, y_train_a, y_val_a = train_test_split(X, ya, test_size=0.15, random_state=42)
    
    model_h = xgb.XGBRegressor(**params)
    model_h.fit(X_train_h, y_train_h, eval_set=[(X_val_h, y_val_h)], verbose=False)
    
    model_a = xgb.XGBRegressor(**params)
    model_a.fit(X_train_a, y_train_a, eval_set=[(X_val_a, y_val_a)], verbose=False)
    
    print(f"[INFO] XGBoost Home detenido en {model_h.best_iteration} iteraciones. Away en {model_a.best_iteration}.")
    return model_h, model_a

def clip_lambda(val):
    # Acota los goles esperados de media a un rango razonable [0.35, 3.2] para evitar que distribuciones extremas arruinen el RPS
    return max(0.35, min(3.2, val))

def train_mlp_goals(X, yh, ya):
    # La Red Neuronal ahora utiliza todas las 21 características (incluyendo Market Values normalizados)
    X_mlp = X
    scaler = StandardScaler().fit(X_mlp)
    X_s = scaler.transform(X_mlp)
    # Aumentamos regularización L2 alpha a 2.5 y simplificamos la arquitectura a (32, 16) para prevenir sobreajuste
    params = dict(
        hidden_layer_sizes=(32, 16),
        activation='relu',
        max_iter=400,
        alpha=2.5,
        early_stopping=True,
        validation_fraction=0.15,
        n_iter_no_change=15,
        random_state=42
    )
    return scaler, MLPRegressor(**params).fit(X_s, yh), MLPRegressor(**params).fit(X_s, ya)

def train_catboost_goals(X, yh, ya, teams_h, teams_a):
    import pandas as pd
    df_x = pd.DataFrame(X)
    df_x['home'] = teams_h
    df_x['away'] = teams_a
    cat_features = ['home', 'away']
    
    cb_h = CatBoostRegressor(iterations=300, depth=CB_DEPTH, learning_rate=0.05, loss_function='Poisson',
                             cat_features=cat_features, verbose=False, random_seed=42, thread_count=-1)
    cb_a = CatBoostRegressor(iterations=300, depth=CB_DEPTH, learning_rate=0.05, loss_function='Poisson',
                             cat_features=cat_features, verbose=False, random_seed=42, thread_count=-1)
    
    cb_h.fit(df_x, yh)
    cb_a.fit(df_x, ya)
    return cb_h, cb_a

def mlp_matrix(scaler, rh, ra, dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue=None, theta=-0.25):
    f = make_features(dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue)
    if f is None:
        M = frank_copula_matrix(1.2, 1.2, theta=theta)
        return M / M.sum(), 1.2, 1.2
    
    # Utilizar las 24 características para la predicción de la red neuronal
    f_mlp = f
    f_arr = scaler.transform(np.array(f_mlp).reshape(1, -1))
    lh = float(rh.predict(f_arr)[0])
    la = float(ra.predict(f_arr)[0])
    lh = clip_lambda(lh)
    la = clip_lambda(la)
    M = frank_copula_matrix(lh, la, theta=theta)
    return M / M.sum(), lh, la

def xgb_matrix(rh, ra, dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue=None, theta=-0.25):
    f = make_features(dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue)
    if f is None:
        M = frank_copula_matrix(1.2, 1.2, theta=theta)
        return M / M.sum(), 1.2, 1.2
    
    f_arr = np.array(f).reshape(1, -1)
    lh = float(rh.predict(f_arr)[0])
    la = float(ra.predict(f_arr)[0])
    M = frank_copula_matrix(lh, la, theta=theta)
    return M / M.sum(), lh, la

def catboost_matrix(cb_h, cb_a, dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue=None, theta=-0.25):
    f = make_features(dcm, h, a, host, date, form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, venue)
    if f is None:
        M = frank_copula_matrix(1.2, 1.2, theta=theta)
        return M / M.sum(), 1.2, 1.2
    
    import pandas as pd
    df_x = pd.DataFrame([f])
    df_x['home'] = [h]
    df_x['away'] = [a]
    
    lh = float(cb_h.predict(df_x)[0])
    la = float(cb_a.predict(df_x)[0])
    M = frank_copula_matrix(lh, la, theta=theta)
    return M / M.sum(), lh, la

def montecarlo_mfa_matrix(h, a, elo_h, elo_a, form_h, form_a, host=0.0):
    """Integración del Motor Matemático del Repositorio MFA (Simulador 10k) optimizado y calibrado"""
    racha_h = form_h / 3.0 if form_h else 0.5
    racha_a = form_a / 3.0 if form_a else 0.5
    
    # Mapeo extraído del notebook externo de simulaciones
    mfa_modifiers = {
        'Spain': (1.10, 0.96), 'France': (1.05, 0.98), 'Portugal': (1.10, 1.00),
        'England': (1.00, 0.98), 'Germany': (1.05, 0.97), 'Argentina': (1.05, 1.00),
        'Netherlands': (1.00, 0.94), 'Brazil': (1.00, 0.92)
    }
    
    mod_h, inj_h = mfa_modifiers.get(h, (1.0, 1.0))
    mod_a, inj_a = mfa_modifiers.get(a, (1.0, 1.0))
    
    fuerza_h = elo_h * (1 + (racha_h - 0.5) * 0.04) * mod_h * inj_h
    fuerza_a = elo_a * (1 + (racha_a - 0.5) * 0.04) * mod_a * inj_a
    
    if host > 0:
        fuerza_h *= 1.03  # Ventaja local sutil del 3% si juega de local/anfitrión
        
    # CALIBRACIÓN LOGÍSTICA / SIGMOIDE DE ELO
    # Calculamos la expectativa de victoria de Elo clásica (We) acotada entre 0 y 1
    dr = fuerza_h - fuerza_a
    we_h = 1.0 / (10.0 ** (-dr / 400.0) + 1.0)
    
    # Mapeamos we_h a diferencia de goles usando una función sigmoide no lineal (tanh)
    diff_ajuste = np.tanh((we_h - 0.5) * 2.0) * 0.90
    
    media_goles_base = 1.25  # Reducido sutilmente alineado con los mundiales
    
    lh = max(0.35, media_goles_base + diff_ajuste)
    la = max(0.35, media_goles_base - diff_ajuste)
    
    # Liberar el límite superior para capturar outliers en partidos disparejos
    lh = max(0.35, min(4.5, lh))
    la = max(0.35, min(4.5, la))
    
    M = np.outer(poisson.pmf(range(MAXG), lh), poisson.pmf(range(MAXG), la))
    return M / M.sum(), lh, la

# --- GRAFICACIÓN ---
def plot_3panel(M, top_df, nombre, home, away, abbr_home, abbr_away, out_path):
    pH, pD, pA = matrix_to_1x2(M)
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    fig.suptitle(f'Predicción: {home} vs {away} | Mundial FIFA 2026\nModelo: {nombre}',
                 fontsize=13, fontweight='bold')
    
    # 1. Heatmap
    ax = axes[0]
    hd = pd.DataFrame(M[:6,:6]*100, index=[f'{abbr_home} {i}' for i in range(6)],
                    columns=[f'{abbr_away} {j}' for j in range(6)])
    sns.heatmap(hd, annot=True, fmt='.1f', cmap='YlOrRd', ax=ax, cbar_kws={'label': 'Probabilidad (%)'})
    ax.set_title('Probabilidad por marcador (%)', fontweight='bold')
    ax.set_xlabel(f'Goles {away}'); ax.set_ylabel(f'Goles {home}')
    
    # 2. Resultado 1X2
    ax = axes[1]
    labs = [f'{home}\ngana', 'Empate', f'{away}\ngana']
    vals = [pH*100, pD*100, pA*100]
    bars = ax.bar(labs, vals, color=[C_HOME, C_DRAW, C_AWAY], width=0.5, edgecolor='white', linewidth=1.5)
    for b, v in zip(bars, vals):
        ax.text(b.get_x() + b.get_width()/2, v + 0.5, f'{v:.1f}%', ha='center', fontweight='bold', fontsize=12)
    ax.set_ylim(0, max(vals)*1.2)
    ax.set_title('Probabilidad de resultado', fontweight='bold')
    ax.set_ylabel('Probabilidad (%)')
    ax.spines[['top', 'right']].set_visible(False)
    
    # 3. Top 10 Marcadores
    ax = axes[2]
    t10 = top_df.head(10).copy()
    cmap = {f'{home} gana': C_HOME, 'Empate': C_DRAW, f'{away} gana': C_AWAY}
    labels_h = [f'{abbr_home} {m} {abbr_away}' for m in t10['Marcador']]
    colors = [cmap[r] for r in t10['Resultado']]
    ax.barh(labels_h[::-1], t10['Prob (%)'][::-1], color=colors[::-1])
    for k, v in enumerate(t10['Prob (%)'][::-1]):
        ax.text(v + 0.1, k, f'{v:.1f}%', va='center', fontsize=8, fontweight='bold')
    ax.set_title('Top 10 marcadores más probables', fontweight='bold')
    ax.set_xlabel('Probabilidad (%)')
    ax.legend(handles=[mpatches.Patch(color=C_HOME, label=f'{home} gana'),
                       mpatches.Patch(color=C_DRAW, label='Empate'),
                       mpatches.Patch(color=C_AWAY, label=f'{away} gana')], loc='lower right', fontsize=8)
    ax.spines[['top', 'right']].set_visible(False)
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    plt.savefig(out_path, dpi=120, bbox_inches='tight')
    plt.close()

def plot_resumen(M_dc, M_dcnb, M_mc, M_xg, M_mlp, M_cb, M_mfa, M_ens, home, away, out_path):
    # Genera un barplot de 1X2 para comparar TODOS los modelos
    pH_dc, pD_dc, pA_dc = matrix_to_1x2(M_dc)
    pH_dcnb, pD_dcnb, pA_dcnb = matrix_to_1x2(M_dcnb)
    pH_mc, pD_mc, pA_mc = matrix_to_1x2(M_mc)
    pH_xg, pD_xg, pA_xg = matrix_to_1x2(M_xg)
    pH_mlp, pD_mlp, pA_mlp = matrix_to_1x2(M_mlp)
    pH_cb, pD_cb, pA_cb = matrix_to_1x2(M_cb)
    pH_mfa, pD_mfa, pA_mfa = matrix_to_1x2(M_mfa)
    pH_ens, pD_ens, pA_ens = matrix_to_1x2(M_ens)
    
    labels = [f'Gana {home}', 'Empate', f'Gana {away}']
    x = np.arange(len(labels))
    width = 0.09
    
    fig, ax = plt.subplots(figsize=(12, 5))
    rects1 = ax.bar(x - width*3.5, [pH_dc*100, pD_dc*100, pA_dc*100], width, label='Dixon-Coles Poisson', color=C_DRAW)
    rects2 = ax.bar(x - width*2.5, [pH_dcnb*100, pD_dcnb*100, pA_dcnb*100], width, label='Dixon-Coles NB', color='#f43f5e')
    rects3 = ax.bar(x - width*1.5, [pH_mc*100, pD_mc*100, pA_mc*100], width, label='MCMC', color='#3b82f6')
    rects4 = ax.bar(x - width*0.5, [pH_xg*100, pD_xg*100, pA_xg*100], width, label='XGBoost', color='#10b981')
    rects5 = ax.bar(x + width*0.5, [pH_mlp*100, pD_mlp*100, pA_mlp*100], width, label='MLP', color='#8b5cf6')
    rects6 = ax.bar(x + width*1.5, [pH_cb*100, pD_cb*100, pA_cb*100], width, label='CatBoost', color='#ec4899')
    rects7 = ax.bar(x + width*2.5, [pH_mfa*100, pD_mfa*100, pA_mfa*100], width, label='MFA Montecarlo', color='#0ea5e9')
    rects8 = ax.bar(x + width*3.5, [pH_ens*100, pD_ens*100, pA_ens*100], width, label='Ensemble', color='#f59e0b')
    
    ax.set_ylabel('Probabilidad (%)', fontweight='bold')
    ax.set_title(f'Resumen de Modelos: {home} vs {away}', fontweight='bold', fontsize=12)
    ax.set_xticks(x)
    ax.set_xticklabels(labels, fontweight='bold')
    ax.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    ax.set_ylim(0, 100)
    
    for rects in [rects1, rects2, rects3, rects4, rects5, rects6, rects7, rects8]:
        for rect in rects:
            height = rect.get_height()
            if height > 1:
                ax.annotate(f'{height:.0f}%', xy=(rect.get_x() + rect.get_width() / 2, height), xytext=(0, 2), textcoords="offset points", ha='center', va='bottom', fontsize=7, fontweight='bold')
                    
    sns.despine()
    plt.tight_layout()
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    plt.savefig(out_path, dpi=120, bbox_inches='tight')
    plt.close()

def build_top_df(M, home, away):
    rows = []
    for i in range(MAXG):
        for j in range(MAXG):
            rs = f'{home} gana' if i > j else ('Empate' if i == j else f'{away} gana')
            rows.append({'Marcador': f'{i}-{j}', 'Prob (%)': round(M[i,j]*100, 2), 'Resultado': rs})
    return pd.DataFrame(rows).sort_values('Prob (%)', ascending=False).reset_index(drop=True)

def frank_copula_matrix(lh, la, theta=-0.25, max_g=MAXG):
    """
    Acopla dos marginales de Poisson independientes usando una Cópula de Frank bivariada
    para generar una matriz de probabilidad conjunta con covarianza táctica.
    """
    pmf_h = np.array([poisson.pmf(i, lh) for i in range(max_g)])
    pmf_a = np.array([poisson.pmf(j, la) for j in range(max_g)])
    
    # Normalizar marginales
    pmf_h = pmf_h / sum(pmf_h)
    pmf_a = pmf_a / sum(pmf_a)
    
    cdf_h = np.cumsum(pmf_h)
    cdf_a = np.cumsum(pmf_a)
    
    def C(u, v):
        if theta == 0:
            return u * v
        num = (np.exp(-theta * u) - 1.0) * (np.exp(-theta * v) - 1.0)
        den = np.exp(-theta) - 1.0
        val = -1.0 / theta * np.log(1.0 + num / den)
        return np.clip(val, 0.0, 1.0)
        
    F = np.zeros((max_g, max_g))
    for x in range(max_g):
        for y in range(max_g):
            F[x, y] = C(cdf_h[x], cdf_a[y])
            
    M = np.zeros((max_g, max_g))
    for x in range(max_g):
        for y in range(max_g):
            val = F[x, y]
            if x > 0:
                val -= F[x-1, y]
            if y > 0:
                val -= F[x, y-1]
            if x > 0 and y > 0:
                val += F[x-1, y-1]
            M[x, y] = max(0.0, val)
            
    return M / M.sum()

# --- SIMULACIÓN BETA-BINOMIAL DE PENALTIS ---
def simulate_shootout_beta_binomial(elo_h, elo_a, simulations=10000):
    """
    Simula una tanda de penaltis utilizando una distribución Beta-Binomial.
    La probabilidad de anotar de cada equipo (p_h, p_a) en cada tanda es una variable aleatoria
    extraída de una distribución Beta, modelando la influencia de la presión psicológica
    y la variabilidad del momento.
    """
    diff = elo_h - elo_a
    mean_h = np.clip(0.75 + (diff / 400.0) * 0.04, 0.60, 0.90)
    mean_a = np.clip(0.75 - (diff / 400.0) * 0.04, 0.60, 0.90)
    
    S = 20.0
    alpha_h, beta_h = mean_h * S, (1.0 - mean_h) * S
    alpha_a, beta_a = mean_a * S, (1.0 - mean_a) * S
    
    wins_h = 0
    for _ in range(simulations):
        p_h = np.random.beta(alpha_h, beta_h)
        p_a = np.random.beta(alpha_a, beta_a)
        
        sh_h, sh_a = 0, 0
        g_h, g_a = 0, 0
        winner = None
        
        for r in range(5):
            if np.random.rand() < p_h:
                g_h += 1
            sh_h += 1
            if g_h > g_a + (5 - sh_a):
                winner = 'H'
                break
            if g_a > g_h + (5 - sh_h):
                winner = 'A'
                break
                
            if np.random.rand() < p_a:
                g_a += 1
            sh_a += 1
            if g_h > g_a + (5 - sh_a):
                winner = 'H'
                break
            if g_a > g_h + (5 - sh_h):
                winner = 'A'
                break
                
        if winner is None:
            while True:
                scored_h = np.random.rand() < p_h
                scored_a = np.random.rand() < p_a
                if scored_h and not scored_a:
                    winner = 'H'
                    break
                if scored_a and not scored_h:
                    winner = 'A'
                    break
                    
        if winner == 'H':
            wins_h += 1
            
    prob_h = wins_h / simulations
    return prob_h, 1.0 - prob_h

def simulate_knockout_resolution(elo_h, elo_a, exp_goles_h, exp_goles_a, simulations=10000):
    """
    Simula de forma combinada la prórroga (tiempo extra de 30 minutos) y, en caso de empate,
    la tanda de penaltis Beta-Binomial. Retorna el desglose de probabilidades:
    - Clasifica en prórroga (Home)
    - Clasifica en prórroga (Away)
    - Clasifica en penales (Home)
    - Clasifica en penales (Away)
    """
    diff = elo_h - elo_a
    mean_h = np.clip(0.75 + (diff / 400.0) * 0.04, 0.60, 0.90)
    mean_a = np.clip(0.75 - (diff / 400.0) * 0.04, 0.60, 0.90)
    S = 20.0
    alpha_h, beta_h = mean_h * S, (1.0 - mean_h) * S
    alpha_a, beta_a = mean_a * S, (1.0 - mean_a) * S
    
    rate_h = (exp_goles_h / 90.0) * 0.75
    rate_a = (exp_goles_a / 90.0) * 0.75
    
    wins_et_h = 0
    wins_et_a = 0
    wins_pk_h = 0
    wins_pk_a = 0
    
    for _ in range(simulations):
        et_g_h = np.random.poisson(rate_h * 30.0)
        et_g_a = np.random.poisson(rate_a * 30.0)
        
        if et_g_h > et_g_a:
            wins_et_h += 1
        elif et_g_a > et_g_h:
            wins_et_a += 1
        else:
            p_h = np.random.beta(alpha_h, beta_h)
            p_a = np.random.beta(alpha_a, beta_a)
            
            sh_h, sh_a = 0, 0
            g_h, g_a = 0, 0
            winner = None
            
            for r in range(5):
                if np.random.rand() < p_h:
                    g_h += 1
                sh_h += 1
                if g_h > g_a + (5 - sh_a):
                    winner = 'H'
                    break
                if g_a > g_h + (5 - sh_h):
                    winner = 'A'
                    break
                    
                if np.random.rand() < p_a:
                    g_a += 1
                sh_a += 1
                if g_h > g_a + (5 - sh_a):
                    winner = 'H'
                    break
                if g_a > g_h + (5 - sh_h):
                    winner = 'A'
                    break
                    
            if winner is None:
                while True:
                    scored_h = np.random.rand() < p_h
                    scored_a = np.random.rand() < p_a
                    if scored_h and not scored_a:
                        winner = 'H'
                        break
                    if scored_a and not scored_h:
                        winner = 'A'
                        break
                        
            if winner == 'H':
                wins_pk_h += 1
            else:
                wins_pk_a += 1
                
    return (
        wins_et_h / simulations,
        wins_et_a / simulations,
        wins_pk_h / simulations,
        wins_pk_a / simulations
    )

# --- SIMULACIÓN DE LÍNEA DE TIEMPO WEIBULL CON PAUSAS DE HIDRATACIÓN ---
def simulate_match_timeline_weibull(l_h, l_a, h_name, a_name, out_path, simulations=2000, save_plot=True, is_knockout=False, elo_h=1500, elo_a=1500):
    """
    Simula el transcurso de un partido minuto a minuto mediante un proceso de Weibull.
    Incorpora pausas de hidratación oficiales en los minutos [22-24] y [67-69] (tasa de gol = 0).
    Aplica el 'Efecto DT' (recalibración táctica): si un equipo va perdiendo después de una pausa,
    su defensa se incrementa, reduciendo la tasa de gol del rival en un 15% (tras min 24) o 25% (tras min 69).
    Si is_knockout=True, la simulación se extiende hasta los 120 minutos en caso de empate a los 90.
    Genera un gráfico acumulativo de la expectativa de goles y lo guarda en out_path si save_plot=True.
    """
    k = 1.15
    max_min = 120 if is_knockout else 90
    t_grid = np.arange(1, max_min + 1)
    
    goals_h_timeline = np.zeros((simulations, max_min))
    goals_a_timeline = np.zeros((simulations, max_min))
    
    for sim in range(simulations):
        g_h, g_a = 0, 0
        hist_h = []
        hist_a = []
        
        # Minutos 1 a 90
        for t in range(1, 91):
            adj_h = 1.0
            adj_a = 1.0
            
            if t > 24 and t <= 69:
                if g_h > g_a:
                    adj_h = 0.85
                elif g_a > g_h:
                    adj_a = 0.85
            elif t > 69:
                if g_h > g_a:
                    adj_h = 0.75
                elif g_a > g_h:
                    adj_a = 0.75
                    
            r_h = adj_h * (l_h * k / 90.0) * ((t / 90.0) ** (k - 1))
            r_a = adj_a * (l_a * k / 90.0) * ((t / 90.0) ** (k - 1))
            
            if (t >= 22 and t <= 24) or (t >= 67 and t <= 69):
                r_h = 0.0
                r_a = 0.0
                
            if np.random.rand() < r_h:
                g_h += 1
            if np.random.rand() < r_a:
                g_a += 1
                
            hist_h.append(g_h)
            hist_a.append(g_a)
            
        # Minutos 91 a 120 (Prórroga si hay empate y es eliminatoria)
        if is_knockout:
            if g_h == g_a:
                for t in range(91, 121):
                    # Penalización de fatiga de 30% en prórroga
                    r_h_et = 0.7 * (l_h * k / 90.0) * ((t / 90.0) ** (k - 1))
                    r_a_et = 0.7 * (l_a * k / 90.0) * ((t / 90.0) ** (k - 1))
                    
                    if np.random.rand() < r_h_et:
                        g_h += 1
                    if np.random.rand() < r_a_et:
                        g_a += 1
                    
                    hist_h.append(g_h)
                    hist_a.append(g_a)
            else:
                # El partido ya terminó, arrastramos marcador de minuto 90
                for t in range(91, 121):
                    hist_h.append(g_h)
                    hist_a.append(g_a)
                    
        goals_h_timeline[sim, :] = hist_h
        goals_a_timeline[sim, :] = hist_a
        
    mean_h = np.mean(goals_h_timeline, axis=0)
    mean_a = np.mean(goals_a_timeline, axis=0)
    
    if save_plot:
        fig, ax = plt.subplots(figsize=(8, 4.5))
        ax.plot(t_grid, mean_h, label=f'Expectativa {h_name}', color='#f59e0b', linewidth=2.5)
        ax.plot(t_grid, mean_a, label=f'Expectativa {a_name}', color='#3b82f6', linewidth=2.5)
        
        ax.axvspan(22, 24, color='#3b82f6', alpha=0.15)
        ax.axvline(22, color='gray', linestyle='--', linewidth=0.8, alpha=0.7)
        
        max_val = max(max(mean_h), max(mean_a)) if len(mean_h) > 0 else 1.0
        ax.text(23, max_val * 0.1, 'Pausa de\nHidratación', ha='center', fontsize=7, color='gray', fontweight='bold')
        
        ax.axvspan(67, 69, color='#3b82f6', alpha=0.15)
        ax.axvline(67, color='gray', linestyle='--', linewidth=0.8, alpha=0.7)
        ax.text(68, max_val * 0.1, 'Pausa de\nHidratación', ha='center', fontsize=7, color='gray', fontweight='bold')
        
        ax.annotate('Efecto DT (Ajuste)', xy=(25, mean_h[24]), xytext=(30, mean_h[24] + 0.15),
                    arrowprops=dict(facecolor='black', arrowstyle="->", lw=0.8), fontsize=7, color='gray')
        
        if is_knockout:
            ax.axvline(90, color='red', linestyle=':', linewidth=1.2)
            ax.text(90.5, max_val * 0.85, 'Inicio Prórroga\n(Si hay empate)', color='red', fontsize=7, fontweight='bold')
            ax.axvline(120, color='darkred', linestyle='--', linewidth=1.2)
            ax.text(120.5, max_val * 0.5, 'Tanda de\nPenales', color='darkred', fontsize=7, fontweight='bold')
            
            # Annotate shootout probability
            w_h = 1.0 / (1.0 + 10 ** ((elo_a - elo_h) / 400.0))
            ax.text(105, max_val * 0.2, f"Prob. PK: {w_h*100:.1f}% vs {(1-w_h)*100:.1f}%", fontsize=7.5, color='darkred', bbox=dict(boxstyle='round,pad=0.2', facecolor='white', alpha=0.8, edgecolor='darkred'))
        
        ax.set_title('Evolución Temporal del Partido (Modelo Weibull)', fontweight='bold', fontsize=11)
        ax.set_xlabel('Minuto del Partido', fontweight='bold', fontsize=9)
        ax.set_ylabel('Expectativa de Goles Acumulados', fontweight='bold', fontsize=9)
        ax.set_xlim(1, max_min)
        ax.set_ylim(0, max_val * 1.25)
        ax.legend(loc='upper left', fontsize=8)
        sns.despine()
        plt.tight_layout()
        os.makedirs(os.path.dirname(out_path), exist_ok=True)
        plt.savefig(out_path, dpi=120, bbox_inches='tight')
        plt.close()
    
    # Calcular frecuencias de marcadores al medio tiempo (minuto 45, índice 44)
    ht_scores = {}
    for sim in range(simulations):
        score_str = f"{int(goals_h_timeline[sim, 44])}-{int(goals_a_timeline[sim, 44])}"
        ht_scores[score_str] = ht_scores.get(score_str, 0) + 1
        
    # Convertir a lista ordenada de dicts
    top_ht = []
    for score_str, count in sorted(ht_scores.items(), key=lambda x: x[1], reverse=True)[:3]:
        top_ht.append({
            "score": score_str,
            "prob": round((count / simulations) * 100, 1)
        })
        
    # Probabilidad de goles en 1T (al menos 1 gol anotado en min 1-45)
    gt_1t = np.sum((goals_h_timeline[:, 44] + goals_a_timeline[:, 44]) > 0)
    prob_1t = float(gt_1t / simulations)
    
    # Probabilidad de goles en 2T (al menos 1 gol anotado en min 46-90)
    goals_2t = (goals_h_timeline[:, 89] - goals_h_timeline[:, 44]) + (goals_a_timeline[:, 89] - goals_a_timeline[:, 44])
    gt_2t = np.sum(goals_2t > 0)
    prob_2t = float(gt_2t / simulations)
    
    # Minuto de primer gol promedio y a favor de quién
    first_goal_minutes = []
    home_first_count = 0
    away_first_count = 0
    for sim in range(simulations):
        goals_h = goals_h_timeline[sim, :]
        goals_a = goals_a_timeline[sim, :]
        
        idx_h = np.where(goals_h > 0)[0]
        idx_a = np.where(goals_a > 0)[0]
        
        first_h = idx_h[0] if len(idx_h) > 0 else 999
        first_a = idx_a[0] if len(idx_a) > 0 else 999
        
        if first_h < first_a:
            first_goal_minutes.append(int(first_h + 1))
            home_first_count += 1
        elif first_a < first_h:
            first_goal_minutes.append(int(first_a + 1))
            away_first_count += 1
        elif first_h == first_a and first_h != 999:
            first_goal_minutes.append(int(first_h + 1))
            home_first_count += 0.5
            away_first_count += 0.5
            
    avg_first_goal = int(np.mean(first_goal_minutes)) if first_goal_minutes else 45
    
    total_first = home_first_count + away_first_count
    if total_first > 0:
        pct_home = (home_first_count / total_first) * 100
        first_goal_favor = "home" if pct_home >= 50 else "away"
        first_goal_favor_prob = round(max(pct_home, 100 - pct_home), 1)
    else:
        first_goal_favor = "draw"
        first_goal_favor_prob = 0.0
        
    return {
        "prob_goals_1t": round(prob_1t * 100, 1),
        "prob_goals_2t": round(prob_2t * 100, 1),
        "avg_first_goal_minute": avg_first_goal,
        "first_goal_favor": first_goal_favor,
        "first_goal_favor_prob": first_goal_favor_prob,
        "top_halftime_scores": top_ht
    }

# --- PROGRAMA PRINCIPAL ---
if __name__ == '__main__':
    t_start = time.time()
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Cargar partidos de matches.js
    js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    matches = parse_matches(js_path)
    print(f"[INFO] Se cargaron {len(matches)} partidos de config/matches.js")
    
    # 1.5 Cargar datos financieros y scrapeados (Market Value, Edad, Plantilla)
    print(f"[INFO] Cargados valores scrapeados para {len(MARKET_VALUES)} selecciones (a nivel de módulo).")
    
    # 1.6 Cargar modificadores tácticos de Opta
    print("[INFO] Cargando y calculando multiplicadores xG de Opta...")
    load_opta_modifiers(script_dir)
    
    # 2. Cargar datos locales CSV
    csv_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    if not os.path.exists(csv_path):
        print(f"[ERROR] Archivo CSV no encontrado en: {csv_path}")
        exit(1)
        
    print("[INFO] Cargando resultados históricos...")
    df_raw = pd.read_csv(csv_path)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_all = df_raw[df_raw['home_score'].notna()].copy()
    df_all['home_score'] = df_all['home_score'].astype(int)
    df_all['away_score'] = df_all['away_score'].astype(int)
    print(f"[INFO] {len(df_all):,} partidos históricos cargados ({df_all.date.min().date()} a {df_all.date.max().date()})")
    
    real_matches = pd.DataFrame([
        {'date': '2026-06-28', 'home_team': 'South Africa', 'away_team': 'Canada', 'home_score': 0, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-29', 'home_team': 'Brazil', 'away_team': 'Japan', 'home_score': 2, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-29', 'home_team': 'Germany', 'away_team': 'Paraguay', 'home_score': 1, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-29', 'home_team': 'Netherlands', 'away_team': 'Morocco', 'home_score': 1, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-30', 'home_team': 'Ivory Coast', 'away_team': 'Norway', 'home_score': 1, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-30', 'home_team': 'France', 'away_team': 'Sweden', 'home_score': 3, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-06-30', 'home_team': 'Mexico', 'away_team': 'Ecuador', 'home_score': 2, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-01', 'home_team': 'USA', 'away_team': 'Bosnia', 'home_score': 2, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-01', 'home_team': 'Belgium', 'away_team': 'Senegal', 'home_score': 3, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-01', 'home_team': 'England', 'away_team': 'DR Congo', 'home_score': 2, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-02', 'home_team': 'Portugal', 'away_team': 'Croatia', 'home_score': 2, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-02', 'home_team': 'Spain', 'away_team': 'Austria', 'home_score': 3, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-02', 'home_team': 'Switzerland', 'away_team': 'Algeria', 'home_score': 2, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-03', 'home_team': 'Australia', 'away_team': 'Egypt', 'home_score': 1, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-03', 'home_team': 'Argentina', 'away_team': 'Cape Verde', 'home_score': 3, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-03', 'home_team': 'Colombia', 'away_team': 'Ghana', 'home_score': 1, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-04', 'home_team': 'Paraguay', 'away_team': 'France', 'home_score': 0, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-04', 'home_team': 'Canada', 'away_team': 'Morocco', 'home_score': 0, 'away_score': 3, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-05', 'home_team': 'Brazil', 'away_team': 'Norway', 'home_score': 1, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-05', 'home_team': 'Mexico', 'away_team': 'England', 'home_score': 2, 'away_score': 3, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-06', 'home_team': 'Portugal', 'away_team': 'Spain', 'home_score': 0, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-06', 'home_team': 'USA', 'away_team': 'Belgium', 'home_score': 1, 'away_score': 4, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-07', 'home_team': 'Argentina', 'away_team': 'Egypt', 'home_score': 3, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-07', 'home_team': 'Switzerland', 'away_team': 'Colombia', 'home_score': 0, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
    ])
    real_matches['date'] = pd.to_datetime(real_matches['date'])
    df_all = pd.concat([df_all, real_matches], ignore_index=True)
    
    # 3. Calcular ratings ELO, Pi y forma
    df_all, elo_by_team, final_elos = compute_elo_ratings(df_all)
    df_all, pi_by_team, final_pis = compute_pi_ratings(df_all)
    
    print("[INFO] Calculando rachas de forma...")
    long_list = []
    for r in df_all[df_all.date >= DESDE].itertuples():
        long_list.append((r.date, r.home_team, r.home_score, r.away_score, 1))
        long_list.append((r.date, r.away_team, r.away_score, r.home_score, 0))
    L = pd.DataFrame(long_list, columns=['date', 'team', 'gf', 'ga', 'ishome']).sort_values('date')
    L['pts'] = np.where(L.gf > L.ga, 3, np.where(L.gf == L.ga, 1, 0))
    g = L.groupby('team')
    L['form5'] = g['pts'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())
    L['gf5'] = g['gf'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())
    L['ga5'] = g['ga'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())
    
    # Agrupar historial de forma para bisect rápido
    form_by_team = {}
    for row in L.itertuples():
        if row.team not in form_by_team:
            form_by_team[row.team] = []
        form_by_team[row.team].append((row.date, row.form5, row.gf5, row.ga5))
    for team in form_by_team:
        form_by_team[team].sort(key=lambda x: x[0])
        
    print("[INFO] Calculando historial Head-to-Head (H2H)...")
    h2h_dict = {}
    for r in df_all.itertuples():
        pair = tuple(sorted([r.home_team, r.away_team]))
        if pair not in h2h_dict:
            h2h_dict[pair] = []
        gd = r.home_score - r.away_score if r.home_team == pair[0] else r.away_score - r.home_score
        h2h_dict[pair].append((r.date, gd))
    for pair in h2h_dict:
        h2h_dict[pair].sort(key=lambda x: x[0])
        
    # 4. Ajustar modelos GLOBALES finales
    print("\n[INFO] Ajustando Dixon-Coles global...")
    dc_final = fit_dixon_coles(df_all[(df_all.date >= DESDE) & (df_all.date < MATCH_DATE)], MATCH_DATE)
    
    print("[INFO] Ajustando Dixon-Coles NB (Binomial Negativa) global...")
    dc_nb_final = fit_dixon_coles_nb(df_all[(df_all.date >= DESDE) & (df_all.date < MATCH_DATE)], MATCH_DATE)
    
    print("[INFO] Muestreando MCMC Bayesiano global (PyMC)... Esto puede tardar ~2-4 min...")
    mc_final = fit_mcmc(df_all[(df_all.date >= DESDE_BAYES) & (df_all.date < MATCH_DATE)], final_elos, draws=MCMC_DRAWS, tune=MCMC_TUNE)
    
    print("[INFO] Entrenando regresores XGBoost globales...")
    X_f, yh_f, ya_f, th_f, ta_f = build_dataset(dc_final, MATCH_DATE, df_all, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis)
    reg_home, reg_away = train_xgb_goals(X_f, yh_f, ya_f)
    print(f"[INFO] XGBoost entrenado con {len(X_f)} partidos.")
    
    print("[INFO] Entrenando Red Neuronal (MLP) global...")
    scaler_f, mlp_home, mlp_away = train_mlp_goals(X_f, yh_f, ya_f)
    print("[INFO] Entrenando CatBoost global...")
    cb_home, cb_away = train_catboost_goals(X_f, yh_f, ya_f, th_f, ta_f)
    
    print("\n[INFO] Ejecutando simulación de validación basada en tus partidos jugados...")
    simulated_results = {}
    csv_sim_path = os.path.join(script_dir, 'partidos_simulados.csv')
    if os.path.exists(csv_sim_path):
        try:
            df_sim = pd.read_csv(csv_sim_path)
            TEAM_TO_ID_ABBR = {
                'Mexico': 'mex', 'South Africa': 'rsa', 'South Korea': 'kor', 'Czechia': 'cze',
                'Canada': 'can', 'Bosnia': 'bih', 'Qatar': 'qat', 'Switzerland': 'sui',
                'Brazil': 'bra', 'Morocco': 'mar', 'Haiti': 'hai', 'Scotland': 'sco', 'USA': 'usa',
                'Paraguay': 'par', 'Australia': 'aus', 'Turkiye': 'tur', 'Germany': 'ger', 'Curaçao': 'cur',
                'Ivory Coast': 'civ', 'Ecuador': 'ecu', 'Netherlands': 'ned', 'Japan': 'jpn', 'Sweden': 'swe', 'Tunisia': 'tun',
                'Belgium': 'bel', 'Egypt': 'egy', 'Iran': 'irn', 'New Zealand': 'nzl', 'Spain': 'esp', 'Cape Verde': 'cpv',
                'Saudi Arabia': 'sau', 'Uruguay': 'uru', 'France': 'fra', 'Senegal': 'sen', 'Iraq': 'irq', 'Norway': 'nor',
                'Argentina': 'arg', 'Algeria': 'alg', 'Austria': 'aut', 'Jordan': 'jor', 'Portugal': 'por', 'DR Congo': 'cod',
                'Uzbekistan': 'uzb', 'Colombia': 'col', 'England': 'eng', 'Croatia': 'cro', 'Ghana': 'gha', 'Panama': 'pan'
            }
            for _, row in df_sim.iterrows():
                gh = row['Goles Local']
                ga = row['Goles Visitante']
                if pd.notna(gh) and pd.notna(ga) and str(gh).strip() != '' and str(ga).strip() != '':
                    h_abbr = TEAM_TO_ID_ABBR.get(row['Local'], row['Local'][:3].lower())
                    a_abbr = TEAM_TO_ID_ABBR.get(row['Visitante'], row['Visitante'][:3].lower())
                    m_id = f"{h_abbr}-{a_abbr}"
                    simulated_results[m_id] = (int(gh), int(ga))
        except Exception as e:
            print(f"[WARNING] Error al leer partidos_simulados.csv en predict_matches: {e}")
            
    # Si no hay partidos de simulación jugados, caemos a una lista vacía
    res = {
        'Dixon-Coles': [0, 0.],
        'Dixon-Coles NB': [0, 0.],
        'MCMC Bayesiano': [0, 0.],
        'XGBoost': [0, 0.],
        'Red Neuronal': [0, 0.],
        'CatBoost': [0, 0.],
        'MFA Montecarlo': [0, 0.],
        'Ensemble': [0, 0.]
    }
    n_test = 0
    opt_data = []
    
    for m_id, (goals_h, goals_a) in simulated_results.items():
        match_obj = next((m for m in matches if m['id'] == m_id), None)
        if not match_obj:
            continue
            
        h = match_obj['home']
        a = match_obj['away']
        host = 0.0
        is_comp = 1.0
        
        h_eng = SPANISH_TO_ENGLISH.get(h, h)
        a_eng = SPANISH_TO_ENGLISH.get(a, a)
        
        o = resultado_real(goals_h, goals_a)
        
        # DC
        M_dc = dc_matrix(dc_final, h_eng, a_eng, host)
        p_dc = matrix_to_1x2(M_dc)
        res['Dixon-Coles'][0] += int(np.argmax(p_dc) == o)
        res['Dixon-Coles'][1] += rps_1x2(p_dc, o)
        
        # DC NB
        M_dcnb = dc_nb_matrix(dc_nb_final, h_eng, a_eng, host)
        p_dcnb = matrix_to_1x2(M_dcnb)
        res['Dixon-Coles NB'][0] += int(np.argmax(p_dcnb) == o)
        res['Dixon-Coles NB'][1] += rps_1x2(p_dcnb, o)
        
        # MCMC
        M_mc = mcmc_matrix_mean(mc_final, h_eng, a_eng, host, dc_final)
        p_mc = matrix_to_1x2(M_mc)
        res['MCMC Bayesiano'][0] += int(np.argmax(p_mc) == o)
        res['MCMC Bayesiano'][1] += rps_1x2(p_mc, o)
        
        # Obtener sede para cargar datos climáticos
        v_val = match_obj.get('venue')

        # XGB
        M_xg = xgb_matrix(reg_home, reg_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v_val)[0]
        p_xg = matrix_to_1x2(M_xg)
        res['XGBoost'][0] += int(np.argmax(p_xg) == o)
        res['XGBoost'][1] += rps_1x2(p_xg, o)
        
        # MLP
        M_ml = mlp_matrix(scaler_f, mlp_home, mlp_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v_val)[0]
        p_ml = matrix_to_1x2(M_ml)
        res['Red Neuronal'][0] += int(np.argmax(p_ml) == o)
        res['Red Neuronal'][1] += rps_1x2(p_ml, o)
        
        # CatBoost
        M_cb = catboost_matrix(cb_home, cb_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v_val)[0]
        p_cb = matrix_to_1x2(M_cb)
        res['CatBoost'][0] += int(np.argmax(p_cb) == o)
        res['CatBoost'][1] += rps_1x2(p_cb, o)
        
        # MFA Montecarlo
        elo_h = get_elo_at_date(h_eng, MATCH_DATE, elo_by_team, final_elos)
        elo_a = get_elo_at_date(a_eng, MATCH_DATE, elo_by_team, final_elos)
        fh = get_form_at_date(h_eng, MATCH_DATE, form_by_team)
        fa = get_form_at_date(a_eng, MATCH_DATE, form_by_team)
        form_h_val = fh[0] if fh else 0.5
        form_a_val = fa[0] if fa else 0.5
        M_mfa = montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, form_h_val, form_a_val, host)[0]
        p_mfa = matrix_to_1x2(M_mfa)
        res['MFA Montecarlo'][0] += int(np.argmax(p_mfa) == o)
        res['MFA Montecarlo'][1] += rps_1x2(p_mfa, o)
        
        opt_data.append((M_dc, M_dcnb, M_mc, M_xg, M_ml, M_cb, M_mfa, o))
        
        # Ensemble por defecto
        M_ens_val = (M_dc * 0.70 + M_dcnb * 0.10 + M_xg * 0.10 + M_cb * 0.10)
        p_en = matrix_to_1x2(M_ens_val)
        res['Ensemble'][0] += int(np.argmax(p_en) == o)
        res['Ensemble'][1] += rps_1x2(p_en, o)
        
        n_test += 1
        
    # Optimización de Pesos del Ensamble
    from scipy.optimize import minimize
    def rps_opt_1x2(p, o):
        e = [0., 0., 0.]
        e[o] = 1.
        return 0.5 * ((p[0] - e[0])**2 + (p[0]+p[1] - e[0]-e[1])**2)
        
    def eval_w(w):
        tot = 0.0
        for M_dc_t, M_dcnb_t, M_mc_t, M_xg_t, M_ml_t, M_cb_t, M_mfa_t, o_t in opt_data:
            M_ens_t = (M_dc_t * w[0] + M_dcnb_t * w[1] + M_mc_t * w[2] + M_xg_t * w[3] + M_ml_t * w[4] + M_cb_t * w[5] + M_mfa_t * w[6])
            p_t = matrix_to_1x2(M_ens_t)
            tot += rps_opt_1x2(p_t, o_t)
        return tot / len(opt_data)
        
    cons = ({'type': 'eq', 'fun': lambda w: 1.0 - sum(w)})
    bounds = [(0.0, 1.0) for _ in range(7)]
    
    # Inicialización democrática: 1/7 para cada modelo
    w0 = [1.0 / 7.0] * 7
    
    # Añadimos tol=1e-6 para evitar que SLSQP se rinda rápido
    res_opt = minimize(eval_w, w0, method='SLSQP', bounds=bounds, constraints=cons, tol=1e-6)
    w_opt = res_opt.x
    
    print("\n[OPTIMIZACIÓN] Ponderación Matemática Óptima por Mínimo RPS:")
    names_opt = ['Dixon-Coles Poisson', 'Dixon-Coles NB', 'MCMC Bayesiano', 'XGBoost', 'Red Neuronal (MLP)', 'CatBoost', 'MFA Montecarlo']
    for i, name_o in enumerate(names_opt):
        print(f"  {name_o}: {w_opt[i]*100:.2f}%")
        
    # Calcular métricas con la ponderación óptima
    opt_hits = 0
    opt_rps = 0.0
    for M_dc_t, M_dcnb_t, M_mc_t, M_xg_t, M_ml_t, M_cb_t, M_mfa_t, o_t in opt_data:
        M_ens_t = (M_dc_t * w_opt[0] + M_dcnb_t * w_opt[1] + M_mc_t * w_opt[2] + M_xg_t * w_opt[3] + M_ml_t * w_opt[4] + M_cb_t * w_opt[5] + M_mfa_t * w_opt[6])
        p_t = matrix_to_1x2(M_ens_t)
        if np.argmax(p_t) == o_t:
            opt_hits += 1
        opt_rps += rps_opt_1x2(p_t, o_t)
    opt_acc = (opt_hits / n_test) * 100 if n_test > 0 else 0
    opt_rps_mean = opt_rps / n_test if n_test > 0 else 0
    
    # --- CORRECCIÓN CRÍTICA ---
    # Sobrescribimos el Ensemble por defecto en 'res' con los resultados optimizados
    # para que las gráficas y el frontend muestren el verdadero poder del modelo.
    res['Ensemble'][0] = opt_hits
    res['Ensemble'][1] = opt_rps
    # --------------------------
    
    print(f"  --> Ensemble Optimizado: Accuracy 1X2 = {opt_acc:.2f}% | RPS = {opt_rps_mean:.4f}")
        
    summary_metrics = []
    for k, (acc, rps) in res.items():
        acc_pct = (acc / n_test) * 100 if n_test > 0 else 0
        rps_mean = rps / n_test if n_test > 0 else 0
        summary_metrics.append((k, acc_pct, rps_mean))
        
    print("\nResultados de Validación:")
    for k, acc_pct, rps_mean in summary_metrics:
        print(f"  {k:<18} Accuracy 1X2: {acc_pct:>5.1f}%  RPS: {rps_mean:.4f}")
        
    # Generar la gráfica global de Accuracy
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    names = [s[0] for s in summary_metrics]
    accs = [s[1] for s in summary_metrics]
    rpss = [s[2] for s in summary_metrics]
    cols = ['#94a3b8', '#f43f5e', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#0ea5e9', '#f59e0b']
    
    axes[0].bar(names, accs, color=cols, width=0.52, edgecolor='white', linewidth=1.5)
    for i, v in enumerate(accs):
        axes[0].text(i, v + 0.2, f'{v:.1f}%', ha='center', fontweight='bold', fontsize=9)
    axes[0].set_title('Accuracy 1X2 (mayor = mejor)', fontweight='bold')
    axes[0].set_ylabel('%')
    axes[0].set_ylim(min(accs) - 5, max(accs) + 5)
    axes[0].spines[['top', 'right']].set_visible(False)
    axes[0].tick_params(axis='x', rotation=22, labelsize=9)
    
    axes[1].bar(names, rpss, color=cols, width=0.52, edgecolor='white', linewidth=1.5)
    for i, v in enumerate(rpss):
        axes[1].text(i, v + 0.0004, f'{v:.4f}', ha='center', fontweight='bold', fontsize=9)
    axes[1].set_title('RPS (menor = mejor)', fontweight='bold')
    axes[1].set_ylabel('RPS')
    axes[1].set_ylim(min(rpss) - 0.005, max(rpss) + 0.005)
    axes[1].spines[['top', 'right']].set_visible(False)
    axes[1].tick_params(axis='x', rotation=22, labelsize=9)
    plt.tight_layout()
    
    temp_acc_path = os.path.join(script_dir, 'public', 'graphs', 'accuracy_temp.png')
    os.makedirs(os.path.dirname(temp_acc_path), exist_ok=True)
    plt.savefig(temp_acc_path, dpi=130, bbox_inches='tight')
    plt.close()
    
    # 6. Bucle de predicción para los 32 partidos del Mundial
    print(f"\n[INFO] Generando gráficas de predicción para los {len(matches)} partidos...")
    match_predictions = {}
    for idx, match in enumerate(matches):
        h = match['home']
        a = match['away']
        day = match['day']
        m_id = match['id']
        abbr_h = match['homeCode'].upper()
        abbr_a = match['awayCode'].upper()
        
        # En el mundial todos juegan en sede NEUTRAL (neutral=True)
        # por ende host = 0.0
        host = 0.0
        is_comp = 1.0
        
        # Traducir al inglés para la inferencia algorítmica
        h_eng = SPANISH_TO_ENGLISH.get(h, h)
        a_eng = SPANISH_TO_ENGLISH.get(a, a)
        
        v = match.get('venue')
        
        # Identificar si es eliminación directa (Cópula Dinámica)
        is_knockout = 'jornada' not in day.lower()
        theta_param = THETA_KNOCKOUT if is_knockout else THETA_GROUPS
        
        # Sin Poda Computacional: Generar todas las matrices siempre para que el frontend (React) 
        # tenga las imágenes de los modelos individuales para mostrar en la pestaña "Detalle de Modelos",
        # sin importar si el optimizador les dio un peso de 0%.
        M_dc = dc_matrix(dc_final, h_eng, a_eng, host)
        M_dcnb = dc_nb_matrix(dc_nb_final, h_eng, a_eng, host)
        M_mc = mcmc_matrix_mean(mc_final, h_eng, a_eng, host, dc_final)
        
        M_xgb, lh_xgb, la_xgb = xgb_matrix(reg_home, reg_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v, theta=theta_param)
                                          
        M_mlp, lh_mlp, la_mlp = mlp_matrix(scaler_f, mlp_home, mlp_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v, theta=theta_param)
                                          
        M_cb, lh_cb, la_cb = catboost_matrix(cb_home, cb_away, dc_final, h_eng, a_eng, host, MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, v, theta=theta_param)
        
        # Extraer Elo y Forma para MFA Montecarlo
        elo_h = get_elo_at_date(h_eng, MATCH_DATE, elo_by_team, final_elos)
        elo_a = get_elo_at_date(a_eng, MATCH_DATE, elo_by_team, final_elos)
        fh = get_form_at_date(h_eng, MATCH_DATE, form_by_team)
        fa = get_form_at_date(a_eng, MATCH_DATE, form_by_team)
        form_h_val = fh[0] if fh else 0.5
        form_a_val = fa[0] if fa else 0.5
        
        M_mfa, lh_mfa, la_mfa = montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, form_h_val, form_a_val, host)
        
        # Ensemble Optimizado con pesos SLSQP dinámicos
        M_ens = (M_dc * w_opt[0] + M_dcnb * w_opt[1] + M_mc * w_opt[2] + M_xgb * w_opt[3] + M_mlp * w_opt[4] + M_cb * w_opt[5] + M_mfa * w_opt[6])
        
        # Dataframes ordenados para top 10
        top_dc = build_top_df(M_dc, h, a)
        top_dcnb = build_top_df(M_dcnb, h, a)
        top_mc = build_top_df(M_mc, h, a)
        top_xgb = build_top_df(M_xgb, h, a)
        top_mlp = build_top_df(M_mlp, h, a)
        top_cb = build_top_df(M_cb, h, a)
        top_mfa = build_top_df(M_mfa, h, a)
        top_ens = build_top_df(M_ens, h, a)

        # Calcular probabilidades 1X2 para JSON
        p_1x2 = matrix_to_1x2(M_ens)
        
        # Extraer Top 3 marcadores exactos del Ensemble
        top3_list = []
        for idx_top in range(min(3, len(top_ens))):
            row_top = top_ens.iloc[idx_top]
            top3_list.append({
                'score': str(row_top['Marcador']),
                'prob': float(row_top['Prob (%)'])
            })

        # Calcular probabilidades de total de goles (Over/Under)
        # M_ens es la matriz de probabilidad conjunta promedio (7x7) de las 5 IAs
        prob_under15 = 0.0
        prob_under25 = 0.0
        prob_under35 = 0.0
        for h_g in range(MAXG):
            for a_g in range(MAXG):
                total_goals = h_g + a_g
                p_cell = float(M_ens[h_g, a_g])
                if total_goals < 1.5:
                    prob_under15 += p_cell
                if total_goals < 2.5:
                    prob_under25 += p_cell
                if total_goals < 3.5:
                    prob_under35 += p_cell
                    
        prob_over15 = 1.0 - prob_under15
        prob_over25 = 1.0 - prob_under25
        prob_over35 = 1.0 - prob_under35

        exp_goles_h = float(np.sum(M_ens * np.arange(MAXG)[:, None]))
        exp_goles_a = float(np.sum(M_ens * np.arange(MAXG)[None, :]))
        home_form_gf = float(fh[1]) if fh else 1.2
        home_form_ga = float(fh[2]) if fh else 1.2
        away_form_gf = float(fa[1]) if fa else 1.2
        away_form_ga = float(fa[2]) if fa else 1.2

        # Definir rutas de salida físicas
        graphs_dir = os.path.join(script_dir, 'public', 'graphs', day)
        timeline_out = os.path.join(graphs_dir, f"{m_id}_timeline.png")
        mcmc_out = os.path.join(graphs_dir, match['mcmc_file'])
        xgb_out = os.path.join(graphs_dir, match['xgb_file'])
        mlp_out = os.path.join(graphs_dir, f"{m_id}_mlp.png")
        cb_out = os.path.join(graphs_dir, f"{m_id}_catboost.png")
        dc_out = os.path.join(graphs_dir, f"{m_id}_dixoncoles.png")
        dcnb_out = os.path.join(graphs_dir, f"{m_id}_dcnb.png")
        mfa_out = os.path.join(graphs_dir, f"{m_id}_mfa.png")
        ens_out = os.path.join(graphs_dir, f"{m_id}_ensemble.png")
        acc_out = os.path.join(graphs_dir, match['accuracy_file'])
        res_out = os.path.join(graphs_dir, match['resumen_file'])
        
        # Verificar si el partido ya concluyó (está registrado en los resultados reales)
        is_played = False
        for rm in real_matches.itertuples():
            if (rm.home_team == h_eng and rm.away_team == a_eng) or (rm.home_team == a_eng and rm.away_team == h_eng):
                is_played = True
                break
                
        # Saltar renderizado de gráficos si es fase de grupos para optimizar velocidad, o si ya se jugó y existen las imágenes
        is_group_stage = 'jornada' in day.lower()
        skip_plotting = is_group_stage or (is_played and os.path.exists(timeline_out) and os.path.exists(ens_out))
        
        # Generar simulación de línea de tiempo Weibull
        weibull_data = simulate_match_timeline_weibull(exp_goles_h, exp_goles_a, h, a, timeline_out, save_plot=not skip_plotting, is_knockout=not is_group_stage, elo_h=elo_h, elo_a=elo_a)

        # Simulación de tanda de penaltis Beta-Binomial simple (compatibilidad)
        p_shoot_h, p_shoot_a = simulate_shootout_beta_binomial(float(elo_h), float(elo_a))

        # Simulación combinada de prórroga (extra time) y penaltis
        prob_et_h, prob_et_a, prob_pk_h, prob_pk_a = simulate_knockout_resolution(
            float(elo_h), float(elo_a), exp_goles_h, exp_goles_a
        )

        match_predictions[m_id] = {
            'home': float(p_1x2[0]),
            'draw': float(p_1x2[1]),
            'away': float(p_1x2[2]),
            'top3_scores': top3_list,
            'under15': prob_under15,
            'over15': prob_over15,
            'under25': prob_under25,
            'over25': prob_over25,
            'under35': prob_under35,
            'over35': prob_over35,
            'exp_goles_home': exp_goles_h,
            'exp_goles_away': exp_goles_a,
            'home_form_gf': home_form_gf,
            'home_form_ga': home_form_ga,
            'away_form_gf': away_form_gf,
            'away_form_ga': away_form_ga,
            'home_elo': float(elo_h),
            'away_elo': float(elo_a),
            'shootout_home': float(p_shoot_h),
            'shootout_away': float(p_shoot_a),
            'prob_et_home': float(prob_et_h),
            'prob_et_away': float(prob_et_a),
            'prob_pk_home': float(prob_pk_h),
            'prob_pk_away': float(prob_pk_a),
            'timeline_file': f"/graphs/{day}/{m_id}_timeline.png",
            'weibull_analysis': {
                'prob_goals_1t': float(weibull_data['prob_goals_1t']),
                'prob_goals_2t': float(weibull_data['prob_goals_2t']),
                'avg_first_goal_minute': int(weibull_data['avg_first_goal_minute']),
                'first_goal_favor': weibull_data['first_goal_favor'],
                'first_goal_favor_prob': float(weibull_data['first_goal_favor_prob']),
                'top_halftime_scores': [
                    {'score': s['score'], 'prob': float(s['prob'])} for s in weibull_data['top_halftime_scores']
                ]
            }
        }
        
        if not skip_plotting:
            # Guardar gráficos de 3 paneles
            plot_3panel(M_dc, top_dc, 'Dixon-Coles Dinámico (Poisson)', h, a, abbr_h, abbr_a, dc_out)
            plot_3panel(M_dcnb, top_dcnb, 'Dixon-Coles NB (Binomial Negativa)', h, a, abbr_h, abbr_a, dcnb_out)
            plot_3panel(M_mc, top_mc, 'MCMC Bayesiano (PyMC)', h, a, abbr_h, abbr_a, mcmc_out)
            plot_3panel(M_xgb, top_xgb, 'XGBoost (Regresión de Goles + Pi-Ratings)', h, a, abbr_h, abbr_a, xgb_out)
            plot_3panel(M_mlp, top_mlp, 'Red Neuronal (MLP)', h, a, abbr_h, abbr_a, mlp_out)
            plot_3panel(M_cb, top_cb, 'CatBoost', h, a, abbr_h, abbr_a, cb_out)
            plot_3panel(M_mfa, top_mfa, 'Simulación Montecarlo (MFA)', h, a, abbr_h, abbr_a, mfa_out)
            plot_3panel(M_ens, top_ens, 'Ensemble (Promedio Ponderado)', h, a, abbr_h, abbr_a, ens_out)
            
            # Guardar gráfico resumen comparativo
            plot_resumen(M_dc, M_dcnb, M_mc, M_xgb, M_mlp, M_cb, M_mfa, M_ens, h, a, res_out)
            
            # Copiar gráfico de Accuracy general
            if os.path.exists(temp_acc_path):
                import shutil
                shutil.copy(temp_acc_path, acc_out)
                
            print(f"  [{idx+1}/{len(matches)}] Gráficas generadas para: {h} vs {a} ({m_id}) -> public/graphs/{day}/")
        else:
            # En caso de que se necesite copiar el gráfico de accuracy en la primera ejecución
            if os.path.exists(temp_acc_path) and not os.path.exists(acc_out):
                import shutil
                shutil.copy(temp_acc_path, acc_out)
            print(f"  [{idx+1}/{len(matches)}] Gráficas ya existen para: {h} vs {a} ({m_id}) -> SKIPPED (Caché)")
        
    # Eliminar gráfica temporal de accuracy
    if os.path.exists(temp_acc_path):
        os.remove(temp_acc_path)
        
    print(f"\n[OK] Finalizado exitosamente en {time.time() - t_start:.1f} segundos!")
    print("[INFO] Todos los gráficos de predicción han sido actualizados en public/graphs/")
    
    # Exportar JSON con las predicciones para el Frontend
    import json
    predictions_path = os.path.join(script_dir, 'public', 'data', 'predictions.json')
    os.makedirs(os.path.dirname(predictions_path), exist_ok=True)
    with open(predictions_path, 'w', encoding='utf-8') as f:
        json.dump(match_predictions, f, indent=4)
    print(f"[INFO] Exportadas las probabilidades a {predictions_path}")
    
    # Forzar la salida del proceso para evitar que PyMC / PyTensor mantengan hilos activos que congelen la consola en Windows
    os._exit(0)
