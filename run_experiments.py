# ==========================================================================
# 🧪 SCRIPT DE EXPERIMENTACIÓN AUTOMATIZADA (GRID SEARCH)
# ==========================================================================
# Este script realiza un Grid Search sobre el pipeline de predicción (predict_matches.py)
# optimizando para CPU (multiprocess parallel processing) con manejo estricto de memoria.
#
# Hiperparámetros a optimizar:
#   1. HALF_LIFE (Dixon-Coles)
#   2. theta_knockout (Cópula de Frank)
#   3. elo_scale_factor (Prioris MCMC Bayesiano)
#   4. mcmc_draws (Iteraciones NUTS)
#   5. cb_depth (Profundidad de CatBoost)
#
# Resultados y pesos w_opt son agregados automáticamente a 'experimentos_log.md'.

import os
import sys
import gc
import time
import inspect
import itertools
from datetime import datetime
import numpy as np
import pandas as pd
from scipy.optimize import minimize
import pymc as pm

# Agregar el directorio actual al path para importar predict_matches
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import predict_matches

# ────────────────────────────────────────────────────────────
# 🛠️ FUNCIONES PARCHADAS DE SOPORTE Y MONKEYPATCHING
# ────────────────────────────────────────────────────────────

def mcmc_matrix_mean_patched(mc, h, a, host, dc_model):
    """
    Versión optimizada de mcmc_matrix_mean que soporta valores precalculados.
    Permite descartar el objeto trace de PyMC de la memoria para evitar fugas.
    """
    if 'precalculated' in mc:
        p = mc['precalculated']
        am = p['am']
        dm = p['dm']
        hm = p['hm']
        bm = p['bm']
    else:
        post = mc['trace'].posterior
        am = post['ac'].mean(('chain','draw')).values
        dm = post['dc_'].mean(('chain','draw')).values
        hm = float(post['home'].mean())
        bm = float(post['base'].mean())
        
    idxb = mc['idxb']
    
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
    M = np.outer(predict_matches.poisson.pmf(range(predict_matches.MAXG), l), 
                 predict_matches.poisson.pmf(range(predict_matches.MAXG), m))
    return M / M.sum()


# ────────────────────────────────────────────────────────────
# 📊 PREPARACIÓN DE DATOS Y FUNCIÓN PRINCIPAL DE EJECUCIÓN
# ────────────────────────────────────────────────────────────

def main():
    print("[INFO] Iniciando parchado dinámico del módulo predict_matches...")

    # 1. Modificar fit_mcmc para leer ELO_SCALE_FACTOR de forma dinámica
    source_mcmc = inspect.getsource(predict_matches.fit_mcmc)
    source_mcmc = source_mcmc.replace("1200.0", "ELO_SCALE_FACTOR")
    local_mcmc = {}
    exec(source_mcmc, predict_matches.__dict__, local_mcmc)
    predict_matches.fit_mcmc = local_mcmc['fit_mcmc']
    print("  [OK] fit_mcmc parchado dinámicamente.")

    # 2. Modificar train_catboost_goals para usar CB_DEPTH y forzar thread_count=-1
    source_cb = inspect.getsource(predict_matches.train_catboost_goals)
    source_cb = source_cb.replace("depth=4", "depth=CB_DEPTH, thread_count=-1")
    local_cb = {}
    exec(source_cb, predict_matches.__dict__, local_cb)
    predict_matches.train_catboost_goals = local_cb['train_catboost_goals']
    print("  [OK] train_catboost_goals parchado dinámicamente.")

    # 3. Modificar train_xgb_goals para forzar n_jobs=-1
    source_xgb = inspect.getsource(predict_matches.train_xgb_goals)
    source_xgb = source_xgb.replace("early_stopping_rounds=50)", "early_stopping_rounds=50, n_jobs=-1)")
    local_xgb = {}
    exec(source_xgb, predict_matches.__dict__, local_xgb)
    predict_matches.train_xgb_goals = local_xgb['train_xgb_goals']
    print("  [OK] train_xgb_goals parchado dinámicamente.")

    # 4. Modificar mcmc_matrix_mean para soportar valores precalculados (ahorro masivo de RAM)
    predict_matches.mcmc_matrix_mean = mcmc_matrix_mean_patched
    print("  [OK] mcmc_matrix_mean parchado dinámicamente.")

    script_dir = os.path.dirname(os.path.abspath(__file__))

    # 1. Cargar configuración de partidos del mundial
    js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    matches = predict_matches.parse_matches(js_path)
    print(f"[INFO] Se cargaron {len(matches)} partidos del mundial.")

    # 2. Cargar y preparar datos históricos de results.csv
    csv_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    df_raw = pd.read_csv(csv_path)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_all = df_raw[df_raw['home_score'].notna()].copy()
    df_all['home_score'] = df_all['home_score'].astype(int)
    df_all['away_score'] = df_all['away_score'].astype(int)

    # Inyectar resultados reales actualizados del Mundial 2026
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
    ])
    real_matches['date'] = pd.to_datetime(real_matches['date'])
    df_all = pd.concat([df_all, real_matches], ignore_index=True)

    # Precalcular ELO y ratings una vez
    df_all, elo_by_team, final_elos = predict_matches.compute_elo_ratings(df_all)
    df_all, pi_by_team, final_pis = predict_matches.compute_pi_ratings(df_all)

    # Precalcular rachas de forma
    long_list = []
    for r in df_all[df_all.date >= predict_matches.DESDE].itertuples():
        long_list.append((r.date, r.home_team, r.home_score, r.away_score, 1))
        long_list.append((r.date, r.away_team, r.away_score, r.home_score, 0))
    L = pd.DataFrame(long_list, columns=['date', 'team', 'gf', 'ga', 'ishome']).sort_values('date')
    L['pts'] = np.where(L.gf > L.ga, 3, np.where(L.gf == L.ga, 1, 0))
    g = L.groupby('team')
    L['form5'] = g['pts'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())
    L['gf5'] = g['gf'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())
    L['ga5'] = g['ga'].transform(lambda s: s.shift().rolling(5, min_periods=1).mean())

    form_by_team = {}
    for row in L.itertuples():
        if row.team not in form_by_team:
            form_by_team[row.team] = []
        form_by_team[row.team].append((row.date, row.form5, row.gf5, row.ga5))
    for team in form_by_team:
        form_by_team[team].sort(key=lambda x: x[0])

    # Precalcular historial H2H
    h2h_dict = {}
    for r in df_all.itertuples():
        pair = tuple(sorted([r.home_team, r.away_team]))
        if pair not in h2h_dict:
            h2h_dict[pair] = []
        gd = r.home_score - r.away_score if r.home_team == pair[0] else r.away_score - r.home_score
        h2h_dict[pair].append((r.date, gd))
    for pair in h2h_dict:
        h2h_dict[pair].sort(key=lambda x: x[0])

    # Cargar partidos jugados para validación (partidos_simulados.csv)
    simulated_results = {}
    csv_sim_path = os.path.join(script_dir, 'partidos_simulados.csv')
    if os.path.exists(csv_sim_path):
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
    print(f"[INFO] Se cargaron {len(simulated_results)} partidos jugados de partidos_simulados.csv para validación.")

    # Configuración del espacio de búsqueda (Grid)
    grid = {
        'HALF_LIFE': [300, 400, 500],
        'theta_knockout': [-0.20, -0.40, -0.60],
        'elo_scale_factor': [1000.0, 1200.0, 1500.0],
        'mcmc_draws': [1500, 3000],
        'cb_depth': [3, 4]
    }

    # Generar combinaciones cartesianas
    keys, values = zip(*grid.items())
    experiments = [dict(zip(keys, v)) for v in itertools.product(*values)]
    total_runs = len(experiments)

    print(f"\n[INFO] Total de experimentos a ejecutar: {total_runs}")
    log_file = os.path.join(script_dir, 'experimentos_log.md')

    # Si no existe el archivo de bitácora, inicializar el encabezado general
    if not os.path.exists(log_file):
        with open(log_file, 'w', encoding='utf-8') as f:
            f.write("# 🧪 Bitácora Global de Experimentación e Hiperparámetros\n")
            f.write("Archivo de registro acumulativo de Grid Search de modelos del Mundial.\n\n")

    for i, config in enumerate(experiments, 1):
        t_run_start = time.time()
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        print(f"\n======================================================================")
        print(f"🔬 EXPERIMENTO {i}/{total_runs} | Config: {config}")
        print(f"======================================================================")

        # 1. Asignar hiperparámetros dinámicamente al módulo predict_matches
        predict_matches.HALF_LIFE = config['HALF_LIFE']
        predict_matches.ELO_SCALE_FACTOR = config['elo_scale_factor']
        predict_matches.CB_DEPTH = config['cb_depth']

        try:
            # 2. Ajustar modelos Dixon-Coles con la HALF_LIFE del ciclo
            print("  -> Entrenando Dixon-Coles...")
            dc_final = predict_matches.fit_dixon_coles(
                df_all[(df_all.date >= predict_matches.DESDE) & (df_all.date < predict_matches.MATCH_DATE)], 
                predict_matches.MATCH_DATE, 
                half_life=config['HALF_LIFE']
            )
            dc_nb_final = predict_matches.fit_dixon_coles_nb(
                df_all[(df_all.date >= predict_matches.DESDE) & (df_all.date < predict_matches.MATCH_DATE)], 
                predict_matches.MATCH_DATE, 
                half_life=config['HALF_LIFE']
            )

            # 3. Entrenar MCMC Bayesiano con Draws/Tune e ELO_SCALE_FACTOR del ciclo
            print(f"  -> Muestreando MCMC Bayesiano (draws={config['mcmc_draws']})...")
            mc_final = predict_matches.fit_mcmc(
                df_all[(df_all.date >= predict_matches.DESDE_BAYES) & (df_all.date < predict_matches.MATCH_DATE)], 
                final_elos, 
                draws=config['mcmc_draws'], 
                tune=config['mcmc_draws']
            )

            # Precalcular medias MCMC para descartar el trace masivo y liberar RAM
            post_temp = mc_final['trace'].posterior
            mc_final['precalculated'] = {
                'am': post_temp['ac'].mean(('chain','draw')).values,
                'dm': post_temp['dc_'].mean(('chain','draw')).values,
                'hm': float(post_temp['home'].mean()),
                'bm': float(post_temp['base'].mean())
            }
            del mc_final['trace']
            del post_temp

            # 4. Construir dataset y entrenar Machine Learning Regressors
            print("  -> Generando dataset y entrenando XGBoost, MLP y CatBoost...")
            X_f, yh_f, ya_f, th_f, ta_f = predict_matches.build_dataset(
                dc_final, predict_matches.MATCH_DATE, df_all, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis
            )

            reg_home, reg_away = predict_matches.train_xgb_goals(X_f, yh_f, ya_f)
            time_weights_mlp = np.exp(-0.0003 * (len(X_f) - np.arange(len(X_f))))
            for idx_w in range(len(X_f)):
                if idx_w >= (len(X_f) - 25):
                    time_weights_mlp[idx_w] *= 3.0
            time_weights_mlp = time_weights_mlp / np.mean(time_weights_mlp)
            scaler_f, mlp_home, mlp_away = predict_matches.train_mlp_goals(X_f, yh_f, ya_f, sample_weight=time_weights_mlp)
            cb_home, cb_away = predict_matches.train_catboost_goals(X_f, yh_f, ya_f, th_f, ta_f)

            # 5. Ejecutar validación sobre los partidos reales jugados
            print("  -> Ejecutando validación en partidos jugados...")
            res = {
                'Dixon-Coles': [0, 0.0],
                'Dixon-Coles NB': [0, 0.0],
                'MCMC Bayesiano': [0, 0.0],
                'XGBoost': [0, 0.0],
                'Red Neuronal': [0, 0.0],
                'CatBoost': [0, 0.0],
                'MFA Montecarlo': [0, 0.0]
            }

            opt_data = []
            n_test = 0

            for m_id, (goals_h, goals_a) in simulated_results.items():
                match_obj = next((m for m in matches if m['id'] == m_id), None)
                if not match_obj:
                    continue

                h = match_obj['home']
                a = match_obj['away']
                host = 0.0
                is_comp = 1.0

                h_eng = predict_matches.SPANISH_TO_ENGLISH.get(h, h)
                a_eng = predict_matches.SPANISH_TO_ENGLISH.get(a, a)

                o = predict_matches.resultado_real(goals_h, goals_a)

                # Determinar theta_param de Frank según tipo de fase
                is_knockout = 'jornada' not in match_obj.get('day', '').lower()
                theta_param = config['theta_knockout'] if is_knockout else -0.20

                # DIXON-COLES
                M_dc = predict_matches.dc_matrix(dc_final, h_eng, a_eng, host)
                p_dc = predict_matches.matrix_to_1x2(M_dc)
                res['Dixon-Coles'][0] += int(np.argmax(p_dc) == o)
                res['Dixon-Coles'][1] += predict_matches.rps_1x2(p_dc, o)

                # DIXON-COLES NB
                M_dcnb = predict_matches.dc_nb_matrix(dc_nb_final, h_eng, a_eng, host)
                p_dcnb = predict_matches.matrix_to_1x2(M_dcnb)
                res['Dixon-Coles NB'][0] += int(np.argmax(p_dcnb) == o)
                res['Dixon-Coles NB'][1] += predict_matches.rps_1x2(p_dcnb, o)

                # MCMC
                M_mc = predict_matches.mcmc_matrix_mean(mc_final, h_eng, a_eng, host, dc_final)
                p_mc = predict_matches.matrix_to_1x2(M_mc)
                res['MCMC Bayesiano'][0] += int(np.argmax(p_mc) == o)
                res['MCMC Bayesiano'][1] += predict_matches.rps_1x2(p_mc, o)

                # XGBoost
                M_xg = predict_matches.xgb_matrix(
                    reg_home, reg_away, dc_final, h_eng, a_eng, host, predict_matches.MATCH_DATE,
                    form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, None, theta=theta_param
                )[0]
                p_xg = predict_matches.matrix_to_1x2(M_xg)
                res['XGBoost'][0] += int(np.argmax(p_xg) == o)
                res['XGBoost'][1] += predict_matches.rps_1x2(p_xg, o)

                # MLP
                M_ml = predict_matches.mlp_matrix(
                    scaler_f, mlp_home, mlp_away, dc_final, h_eng, a_eng, host, predict_matches.MATCH_DATE,
                    form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, None, theta=theta_param
                )[0]
                p_ml = predict_matches.matrix_to_1x2(M_ml)
                res['Red Neuronal'][0] += int(np.argmax(p_ml) == o)
                res['Red Neuronal'][1] += predict_matches.rps_1x2(p_ml, o)

                # CatBoost
                M_cb = predict_matches.catboost_matrix(
                    cb_home, cb_away, dc_final, h_eng, a_eng, host, predict_matches.MATCH_DATE,
                    form_by_team, elo_by_team, final_elos, h2h_dict, is_comp, pi_by_team, final_pis, None, theta=theta_param
                )[0]
                p_cb = predict_matches.matrix_to_1x2(M_cb)
                res['CatBoost'][0] += int(np.argmax(p_cb) == o)
                res['CatBoost'][1] += predict_matches.rps_1x2(p_cb, o)

                # MFA Montecarlo
                elo_h = predict_matches.get_elo_at_date(h_eng, predict_matches.MATCH_DATE, elo_by_team, final_elos)
                elo_a = predict_matches.get_elo_at_date(a_eng, predict_matches.MATCH_DATE, elo_by_team, final_elos)
                fh = predict_matches.get_form_at_date(h_eng, predict_matches.MATCH_DATE, form_by_team)
                fa = predict_matches.get_form_at_date(a_eng, predict_matches.MATCH_DATE, form_by_team)
                form_h_val = fh[0] if fh else 0.5
                form_a_val = fa[0] if fa else 0.5
                M_mfa = predict_matches.montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, form_h_val, form_a_val, host)[0]
                p_mfa = predict_matches.matrix_to_1x2(M_mfa)
                res['MFA Montecarlo'][0] += int(np.argmax(p_mfa) == o)
                res['MFA Montecarlo'][1] += predict_matches.rps_1x2(p_mfa, o)

                opt_data.append((M_dc, M_dcnb, M_mc, M_xg, M_ml, M_cb, M_mfa, o))
                n_test += 1

            # 6. Optimización de Pesos del Ensemble con SLSQP
            print("  -> Optimizando ensamble SLSQP...")
            def eval_w(w):
                tot = 0.0
                for M_dc_t, M_dcnb_t, M_mc_t, M_xg_t, M_ml_t, M_cb_t, M_mfa_t, o_t in opt_data:
                    M_ens_t = (M_dc_t * w[0] + M_dcnb_t * w[1] + M_mc_t * w[2] + M_xg_t * w[3] + 
                               M_ml_t * w[4] + M_cb_t * w[5] + M_mfa_t * w[6])
                    p_t = predict_matches.matrix_to_1x2(M_ens_t)
                    tot += predict_matches.rps_1x2(p_t, o_t)
                return tot / len(opt_data)

            cons = ({'type': 'eq', 'fun': lambda w: 1.0 - sum(w)})
            bounds = [(0.0, 1.0) for _ in range(7)]
            w0 = [1.0 / 7.0] * 7
            res_opt = minimize(eval_w, w0, method='SLSQP', bounds=bounds, constraints=cons, tol=1e-6)
            w_opt = res_opt.x

            # Calcular métricas del Ensemble Optimizado
            opt_hits = 0
            opt_rps_sum = 0.0
            for M_dc_t, M_dcnb_t, M_mc_t, M_xg_t, M_ml_t, M_cb_t, M_mfa_t, o_t in opt_data:
                M_ens_t = (M_dc_t * w_opt[0] + M_dcnb_t * w_opt[1] + M_mc_t * w_opt[2] + M_xg_t * w_opt[3] + 
                           M_ml_t * w_opt[4] + M_cb_t * w_opt[5] + M_mfa_t * w_opt[6])
                p_t = predict_matches.matrix_to_1x2(M_ens_t)
                if np.argmax(p_t) == o_t:
                    opt_hits += 1
                opt_rps_sum += predict_matches.rps_1x2(p_t, o_t)

            acc_opt = (opt_hits / n_test) * 100 if n_test > 0 else 0
            rps_opt = opt_rps_sum / n_test if n_test > 0 else 0

            # 📝 ESCRITURA EN CALIENTE DE LA BITÁCORA (.MD)
            elapsed = time.time() - t_run_start
            print(f"  [OK] Finalizado en {elapsed:.1f}s | Ensemble Acc: {acc_opt:.2f}%, RPS: {rps_opt:.4f}")

            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"### 📍 Iteración {i}/{total_runs} - Realizada el {timestamp}\n\n")
                f.write(f"**Parámetros de Entrada:**\n")
                f.write(f"- `HALF_LIFE`: {config['HALF_LIFE']}\n")
                f.write(f"- `theta_knockout`: {config['theta_knockout']}\n")
                f.write(f"- `elo_scale_factor`: {config['elo_scale_factor']}\n")
                f.write(f"- `mcmc_draws`: {config['mcmc_draws']}\n")
                f.write(f"- `cb_depth`: {config['cb_depth']}\n\n")

                f.write("| Modelo | Accuracy 1X2 (%) | RPS Promedio |\n")
                f.write("| :--- | :---: | :---: |\n")
                for key, val in res.items():
                    acc = (val[0] / n_test) * 100 if n_test > 0 else 0
                    rps_val = val[1] / n_test if n_test > 0 else 0
                    f.write(f"| {key} | {acc:.2f}% | {rps_val:.4f} |\n")
                f.write(f"| **Ensemble Optimizado** | **{acc_opt:.2f}%** | **{rps_opt:.4f}** |\n\n")

                f.write("**Ponderaciones SLSQP (w_opt):**\n")
                models_names = ['DC Poisson', 'DC NB', 'MCMC', 'XGB', 'MLP', 'CatBoost', 'MFA']
                for name, w in zip(models_names, w_opt):
                    f.write(f"- {name}: `{w*100:.2f}%`\n")
                f.write(f"\nTiempo de ejecución de la corrida: `{elapsed:.1f}s`\n\n")
                f.write("---\n\n")

        except Exception as e:
            print(f"  [ERROR] Ocurrió un error en el Experimento {i}: {e}")
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(f"### 📍 Iteración {i}/{total_runs} - FALLIDA el {timestamp}\n\n")
                f.write(f"Error: `{str(e)}`\n\n---\n\n")

        finally:
            # 🧹 GESTIÓN ESTRICTA DE MEMORIA Y PROCESOS PyMC / PYTENSOR
            try:
                import pytensor
                pytensor.compile.function.types.clear_cache()
            except Exception:
                pass

            try:
                pm.close_all()
            except Exception:
                pass

            # Eliminar variables grandes de memoria local en cada ciclo
            for var in ['dc_final', 'dc_nb_final', 'mc_final', 'X_f', 'yh_f', 'ya_f', 'reg_home', 'reg_away', 'cb_home', 'cb_away', 'opt_data']:
                if var in locals():
                    del locals()[var]

            gc.collect()

    print("\n🎉 [GRID SEARCH COMPLETADO] Todos los experimentos han sido ejecutados. Revisa el archivo 'experimentos_log.md' para ver la bitácora.")


if __name__ == '__main__':
    main()
