import os
import json
import re
import numpy as np
import pandas as pd
import time

from predict_matches import (
    montecarlo_mfa_matrix, 
    compute_elo_ratings,
    SPANISH_TO_ENGLISH,
    simulate_knockout_resolution
)

RESULTS_TO_CSV = {
    'Czech Republic': 'Czechia',
    'Bosnia and Herzegovina': 'Bosnia',
    'United States': 'USA',
    'Turkey': 'Turkiye'
}

def extract_r32_matches():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    
    matches = []
    with open(js_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'day:"dieciseisavos"' in line or "day:'dieciseisavos'" in line:
                id_match = re.search(r'id:"([^"]+)"', line)
                h_match = re.search(r'home:"([^"]+)"', line)
                a_match = re.search(r'away:"([^"]+)"', line)
                hc_match = re.search(r'homeCode:"([^"]+)"', line)
                ac_match = re.search(r'awayCode:"([^"]+)"', line)
                if h_match and a_match and hc_match and ac_match and id_match:
                    matches.append({
                        'id': id_match.group(1),
                        'home': h_match.group(1),
                        'away': a_match.group(1),
                        'homeCode': hc_match.group(1),
                        'awayCode': ac_match.group(1)
                    })
    return matches

MATRIX_CACHE = {}

def simulate_knockout_match(h, a, elo_h, elo_a):
    h_eng = SPANISH_TO_ENGLISH.get(h, h)
    a_eng = SPANISH_TO_ENGLISH.get(a, a)
    
    cache_key = (h_eng, a_eng)
    if cache_key not in MATRIX_CACHE:
        M, lh, la = montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, 0.5, 0.5, 0.0)
        flat_M = M.flatten()
        flat_M = flat_M / flat_M.sum()
        
        # Calculate knockout resolution once per matchup and cache it
        prob_et_h, prob_et_a, prob_pk_h, prob_pk_a = simulate_knockout_resolution(
            float(elo_h), float(elo_a), float(lh), float(la)
        )
        prob_h_advances = prob_et_h + prob_pk_h
        MATRIX_CACHE[cache_key] = (flat_M, M.shape[1], float(lh), float(la), prob_h_advances)
        
    flat_M, cols, lh, la, prob_h_advances = MATRIX_CACHE[cache_key]
    idx = np.random.choice(len(flat_M), p=flat_M)
    goals_h = int(idx // cols)
    goals_a = int(idx % cols)
    
    # In knockout, no draws allowed. 
    if goals_h == goals_a:
        if np.random.rand() < prob_h_advances:
            goals_h += 1
        else:
            goals_a += 1
            
    return h if goals_h > goals_a else a

def run_knockout_montecarlo():
    ITERATIONS = 50000
    print("[INFO] Cargando emparejamientos de Dieciseisavos...")
    r32_matches = extract_r32_matches()
    
    if len(r32_matches) != 16:
        print(f"[ERROR] Se esperaban 16 partidos, se encontraron {len(r32_matches)}. Revisa matches.js.")
    
    print("[INFO] Calculando ELO histórico...")
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'international_results-master', 'international_results-master', 'results.csv')
    df_raw = pd.read_csv(csv_path)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_all = df_raw[df_raw['home_score'].notna()].copy()
    df_all['home_score'] = df_all['home_score'].astype(int)
    df_all['away_score'] = df_all['away_score'].astype(int)
    
    # Inyectar resultados reales del Mundial 2026 para calibrar el ELO dinámicamente
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
        {'date': '2026-07-09', 'home_team': 'France', 'away_team': 'Morocco', 'home_score': 2, 'away_score': 0, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-10', 'home_team': 'Spain', 'away_team': 'Belgium', 'home_score': 2, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-11', 'home_team': 'Norway', 'away_team': 'England', 'home_score': 1, 'away_score': 2, 'tournament': 'FIFA World Cup', 'neutral': True},
        {'date': '2026-07-11', 'home_team': 'Argentina', 'away_team': 'Switzerland', 'home_score': 3, 'away_score': 1, 'tournament': 'FIFA World Cup', 'neutral': True},
    ])
    real_matches['date'] = pd.to_datetime(real_matches['date'])
    df_all = pd.concat([df_all, real_matches], ignore_index=True)
    
    df_all, elo_by_team, final_elos = compute_elo_ratings(df_all)
    
    teams = {}
    real_results = {}
    csv_sim_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'partidos_simulados.csv')
    if os.path.exists(csv_sim_path):
        try:
            df_sim = pd.read_csv(csv_sim_path)
            # Los equipos de octavos están en las filas 88 a 95 (rango de 8 partidos)
            r16_teams = set()
            if len(df_sim) >= 96:
                for idx in range(88, 96):
                    loc = df_sim.iloc[idx]['Local']
                    vis = df_sim.iloc[idx]['Visitante']
                    if pd.notna(loc): r16_teams.add(loc.strip())
                    if pd.notna(vis): r16_teams.add(vis.strip())
            
            # Map de nombres a abreviación de ID
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
            
            for idx in range(72, 88):
                loc = df_sim.iloc[idx]['Local']
                vis = df_sim.iloc[idx]['Visitante']
                if pd.isna(loc) or pd.isna(vis):
                    continue
                loc_s, vis_s = loc.strip(), vis.strip()
                
                h_abbr = TEAM_TO_ID_ABBR.get(loc_s, loc_s[:3].lower())
                a_abbr = TEAM_TO_ID_ABBR.get(vis_s, vis_s[:3].lower())
                m_id = f"{h_abbr}-{a_abbr}"
                
                if loc_s in r16_teams:
                    real_results[m_id] = 'home'
                elif vis_s in r16_teams:
                    real_results[m_id] = 'away'
            
            print(f"[INFO] Detectados {len(real_results)} partidos de dieciseisavos finalizados y bloqueados en el cuadro.")
        except Exception as e:
            print(f"[WARNING] Error al detectar ganadores reales en simulate_knockout.py: {e}")
    
    # Exactly matching Bracket.jsx tree structure
    bracket_tree = [
        ('ger-par', 'fra-swe'),
        ('rsa-can', 'ned-mar'),
        ('por-cro', 'esp-aut'),
        ('usa-bih', 'bel-sen'),
        ('bra-jpn', 'civ-nor'),
        ('mex-ecu', 'eng-cod'),
        ('arg-cpv', 'aus-egy'),
        ('sui-alg', 'col-gha')
    ]
    
    r32_dict = {m['id']: m for m in r32_matches}

    for m in r32_matches:
        for t, c in [(m['home'], m['homeCode']), (m['away'], m['awayCode'])]:
            teams[t] = {
                'team': t,
                'code': c,
                'elo': final_elos.get(SPANISH_TO_ENGLISH.get(t, t), 1500.0),
                'r16': 0,
                'qf': 0,
                'sf': 0,
                'final': 0,
                'champion': 0
            }
            
    REAL_MATCH_CACHE = {}
    
    def get_real_winner(w1, w2):
        cache_key = (w1, w2)
        if cache_key in REAL_MATCH_CACHE:
            return REAL_MATCH_CACHE[cache_key]
        reverse_key = (w2, w1)
        if reverse_key in REAL_MATCH_CACHE:
            return REAL_MATCH_CACHE[reverse_key]
            
        w1_eng = SPANISH_TO_ENGLISH.get(w1, w1)
        w2_eng = SPANISH_TO_ENGLISH.get(w2, w2)
        w1_csv = RESULTS_TO_CSV.get(w1_eng, w1_eng)
        w2_csv = RESULTS_TO_CSV.get(w2_eng, w2_eng)
        
        real_winner = None
        mask = ((df_sim['Local'] == w1_csv) & (df_sim['Visitante'] == w2_csv)) | ((df_sim['Local'] == w2_csv) & (df_sim['Visitante'] == w1_csv))
        match_rows = df_sim[mask]
        if len(match_rows) > 0:
            row = match_rows.iloc[0]
            idx_row = match_rows.index[0]
            gl = row['Goles Local']
            gv = row['Goles Visitante']
            if pd.notna(gl) and pd.notna(gv) and str(gl).strip() != '' and str(gv).strip() != '':
                gl = int(gl)
                gv = int(gv)
                if gl > gv:
                    real_winner = w1 if row['Local'] == w1_csv else w2
                elif gv > gl:
                    real_winner = w2 if row['Local'] == w1_csv else w1
                else:
                    subsequent_teams = set()
                    for idx_sub in range(idx_row + 1, len(df_sim)):
                        loc_sub = df_sim.iloc[idx_sub]['Local']
                        vis_sub = df_sim.iloc[idx_sub]['Visitante']
                        if pd.notna(loc_sub): subsequent_teams.add(loc_sub.strip())
                        if pd.notna(vis_sub): subsequent_teams.add(vis_sub.strip())
                    
                    if w1_csv in subsequent_teams:
                        real_winner = w1
                    elif w2_csv in subsequent_teams:
                        real_winner = w2
                    else:
                        real_winner = w1 if teams[w1]['elo'] > teams[w2]['elo'] else w2
                        
        REAL_MATCH_CACHE[cache_key] = real_winner
        return real_winner

    print(f"[INFO] Iniciando Monte Carlo de {ITERATIONS} iteraciones del Cuadro Eliminatorio...")
    start_t = time.time()
    
    for it in range(ITERATIONS):
        # Round of 32
        r32_winners = {}
        for match_id, m in r32_dict.items():
            if match_id in real_results:
                winner = m['home'] if real_results[match_id] == 'home' else m['away']
            else:
                winner = simulate_knockout_match(m['home'], m['away'], teams[m['home']]['elo'], teams[m['away']]['elo'])
            r32_winners[match_id] = winner
            teams[winner]['r16'] += 1
            
        # Round of 16 (Octavos -> Cuartos)
        qf_teams = []
        for match1_id, match2_id in bracket_tree:
            w1 = r32_winners[match1_id]
            w2 = r32_winners[match2_id]
            
            real_winner = get_real_winner(w1, w2)
            if real_winner:
                qf_winner = real_winner
            else:
                qf_winner = simulate_knockout_match(w1, w2, teams[w1]['elo'], teams[w2]['elo'])
                
            qf_teams.append(qf_winner)
            teams[qf_winner]['qf'] += 1
            
        # Quarterfinals (Cuartos -> Semis)
        sf_teams = []
        for i in range(0, len(qf_teams), 2):
            w1 = qf_teams[i]
            w2 = qf_teams[i+1]
            
            real_winner = get_real_winner(w1, w2)
            if real_winner:
                winner = real_winner
            else:
                winner = simulate_knockout_match(w1, w2, teams[w1]['elo'], teams[w2]['elo'])
            sf_teams.append(winner)
            teams[winner]['sf'] += 1
                
        # Semifinals (Semis -> Final)
        final_teams = []
        for i in range(0, len(sf_teams), 2):
            w1 = sf_teams[i]
            w2 = sf_teams[i+1]
            
            real_winner = get_real_winner(w1, w2)
            if real_winner:
                winner = real_winner
            else:
                winner = simulate_knockout_match(w1, w2, teams[w1]['elo'], teams[w2]['elo'])
            final_teams.append(winner)
            teams[winner]['final'] += 1
                
        # Final
        w1 = final_teams[0]
        w2 = final_teams[1]
        
        real_winner = get_real_winner(w1, w2)
        if real_winner:
            champion = real_winner
        else:
            champion = simulate_knockout_match(w1, w2, teams[w1]['elo'], teams[w2]['elo'])
        teams[champion]['champion'] += 1
            
    print(f"[INFO] Monte Carlo completado en {round(time.time() - start_t, 2)} segundos.")
    
    results = []
    for t, stats in teams.items():
        results.append({
            'team': t,
            'code': stats['code'],
            'elo': stats['elo'],
            'r16': round(stats['r16'] / ITERATIONS * 100, 1),
            'qf': round(stats['qf'] / ITERATIONS * 100, 1),
            'sf': round(stats['sf'] / ITERATIONS * 100, 1),
            'final': round(stats['final'] / ITERATIONS * 100, 1),
            'champion': round(stats['champion'] / ITERATIONS * 100, 1)
        })
        
    results = sorted(results, key=lambda x: (x['champion'], x['final'], x['sf'], x['qf'], x['r16']), reverse=True)
    
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'knockout_probabilities.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'iterations': ITERATIONS, 'probabilities': results}, f, ensure_ascii=False, indent=2)
        
    print(f"[ÉXITO] Resultados guardados en {out_path}")

if __name__ == '__main__':
    run_knockout_montecarlo()
