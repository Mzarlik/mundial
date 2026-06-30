import os
import json
import re
import numpy as np
import pandas as pd
import time

from predict_matches import (
    montecarlo_mfa_matrix, 
    compute_elo_ratings,
    SPANISH_TO_ENGLISH
)

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
        MATRIX_CACHE[cache_key] = (flat_M, M.shape[1], float(lh), float(la))
        
    flat_M, cols, lh, la = MATRIX_CACHE[cache_key]
    idx = np.random.choice(len(flat_M), p=flat_M)
    goals_h = int(idx // cols)
    goals_a = int(idx % cols)
    
    # In knockout, no draws allowed. 
    if goals_h == goals_a:
        # Simulate Extra Time / Penalties using a simple ELO-weighted coin flip
        prob_h_advances = 1 / (1 + 10 ** ((elo_h - elo_a) / 400)) # Standard ELO expected score
        if np.random.rand() < prob_h_advances:
            goals_h += 1
        else:
            goals_a += 1
            
    return h if goals_h > goals_a else a

def run_knockout_montecarlo():
    ITERATIONS = 2000
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
    ])
    real_matches['date'] = pd.to_datetime(real_matches['date'])
    df_all = pd.concat([df_all, real_matches], ignore_index=True)
    
    df_all, elo_by_team, final_elos = compute_elo_ratings(df_all)
    
    teams = {}
    real_results = {
        'rsa-can': 'away', # Canadá
        'bra-jpn': 'home', # Brasil
        'ger-par': 'away', # Paraguay
        'ned-mar': 'away', # Marruecos
    }
    
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
            qf_winner = simulate_knockout_match(w1, w2, teams[w1]['elo'], teams[w2]['elo'])
            qf_teams.append(qf_winner)
            teams[qf_winner]['qf'] += 1
            
        # Quarterfinals (Cuartos -> Semis)
        sf_teams = []
        for i in range(0, len(qf_teams), 2):
            winner = simulate_knockout_match(qf_teams[i], qf_teams[i+1], teams[qf_teams[i]]['elo'], teams[qf_teams[i+1]]['elo'])
            sf_teams.append(winner)
            teams[winner]['sf'] += 1
                
        # Semifinals (Semis -> Final)
        final_teams = []
        for i in range(0, len(sf_teams), 2):
            winner = simulate_knockout_match(sf_teams[i], sf_teams[i+1], teams[sf_teams[i]]['elo'], teams[sf_teams[i+1]]['elo'])
            final_teams.append(winner)
            teams[winner]['final'] += 1
                
        # Final
        champion = simulate_knockout_match(final_teams[0], final_teams[1], teams[final_teams[0]]['elo'], teams[final_teams[1]]['elo'])
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
