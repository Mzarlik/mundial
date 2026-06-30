import os
import json
import random
import re
import numpy as np
import pandas as pd
import time

# Importamos las funciones necesarias del motor principal
from predict_matches import (
    montecarlo_mfa_matrix, 
    compute_elo_ratings,
    SPANISH_TO_ENGLISH
)

ROUNDS = 5

def extract_teams_from_config():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    
    teams = {}
    with open(js_path, 'r', encoding='utf-8') as f:
        for line in f:
            if 'home:' in line and 'away:' in line:
                h_match = re.search(r'home:"([^"]+)"', line)
                a_match = re.search(r'away:"([^"]+)"', line)
                hc_match = re.search(r'homeCode:"([^"]+)"', line)
                ac_match = re.search(r'awayCode:"([^"]+)"', line)
                if h_match and hc_match:
                    teams[h_match.group(1)] = hc_match.group(1)
                if a_match and ac_match:
                    teams[a_match.group(1)] = ac_match.group(1)
    return teams

MATRIX_CACHE = {}

def simulate_match_stochastic(h, a, elo_h, elo_a):
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
    
    return goals_h, goals_a, lh, la

def run_swiss_tournament():
    ITERATIONS = 1000
    print("[INFO] Cargando selecciones...")
    teams_dict = extract_teams_from_config()
    print(f"[INFO] {len(teams_dict)} selecciones encontradas.")
    
    print("[INFO] Calculando ELO histórico (esto tomará unos segundos)...")
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'international_results-master', 'international_results-master', 'results.csv')
    df_raw = pd.read_csv(csv_path)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_all = df_raw[df_raw['home_score'].notna()].copy()
    df_all['home_score'] = df_all['home_score'].astype(int)
    df_all['away_score'] = df_all['away_score'].astype(int)
    df_all, elo_by_team, final_elos = compute_elo_ratings(df_all)
    
    # Aggregated stats across 1000 iterations
    agg_stats = {team: {'points': 0, 'played': 0, 'gf': 0, 'ga': 0, 'gd': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'buchholz': 0, 'xG': 0, 'positions': 0} for team in teams_dict.keys()}
    example_rounds = []
    
    print(f"[INFO] Iniciando Monte Carlo de {ITERATIONS} iteraciones del Torneo Suizo...")
    start_t = time.time()
    
    for it in range(ITERATIONS):
        standings = {team: {'team': team, 'elo': final_elos.get(SPANISH_TO_ENGLISH.get(team, team), 1500.0), 'points': 0, 'gd': 0, 'opponents': [], 'stats': {'played': 0, 'gf': 0, 'ga': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'xG': 0}} for team in teams_dict.keys()}
        rounds_data = []
        
        for rnd in range(1, ROUNDS + 1):
            sorted_teams = sorted(standings.values(), key=lambda x: (x['points'], x['gd'], x['elo']), reverse=True)
            unpaired = [t['team'] for t in sorted_teams]
            pairings = []
            
            while len(unpaired) >= 2:
                team_a = unpaired.pop(0)
                opponent_idx = next((i for i, c in enumerate(unpaired) if c not in standings[team_a]['opponents']), 0)
                team_b = unpaired.pop(opponent_idx)
                pairings.append((team_a, team_b))
                
            round_matches = []
            for h, a in pairings:
                gh, ga, lh, la = simulate_match_stochastic(h, a, standings[h]['elo'], standings[a]['elo'])
                
                # Update iteration stats
                standings[h]['stats']['played'] += 1
                standings[a]['stats']['played'] += 1
                standings[h]['stats']['gf'] += gh
                standings[a]['stats']['gf'] += ga
                standings[h]['stats']['ga'] += ga
                standings[a]['stats']['ga'] += gh
                standings[h]['gd'] += (gh - ga)
                standings[a]['gd'] += (ga - gh)
                standings[h]['stats']['xG'] += lh
                standings[a]['stats']['xG'] += la
                
                standings[h]['opponents'].append(a)
                standings[a]['opponents'].append(h)
                
                if gh > ga:
                    standings[h]['points'] += 3
                    standings[h]['stats']['wins'] += 1
                    standings[a]['stats']['losses'] += 1
                elif gh < ga:
                    standings[a]['points'] += 3
                    standings[a]['stats']['wins'] += 1
                    standings[h]['stats']['losses'] += 1
                else:
                    standings[h]['points'] += 1
                    standings[a]['points'] += 1
                    standings[h]['stats']['draws'] += 1
                    standings[a]['stats']['draws'] += 1
                    
                if it == 0:
                    round_matches.append({'home': h, 'homeCode': teams_dict[h], 'away': a, 'awayCode': teams_dict[a], 'homeGoals': gh, 'awayGoals': ga, 'homexG': round(lh, 2), 'awayxG': round(la, 2)})
            
            if it == 0:
                rounds_data.append({'round': rnd, 'matches': round_matches})
                
        if it == 0:
            example_rounds = rounds_data
            
        # Calculate Buchholz for this iteration
        for team, st in standings.items():
            bchlz = sum(standings[op]['points'] for op in st['opponents'])
            st['buchholz'] = bchlz
            
        # Determine final positions for this iteration
        final_iter_standings = sorted(standings.values(), key=lambda x: (x['points'], x['buchholz'], x['gd'], x['stats']['gf'], x['elo']), reverse=True)
        for pos, st in enumerate(final_iter_standings):
            t = st['team']
            agg_stats[t]['points'] += st['points']
            agg_stats[t]['buchholz'] += st['buchholz']
            agg_stats[t]['positions'] += (pos + 1)
            agg_stats[t]['gd'] += st['gd']
            for k in ['played', 'gf', 'ga', 'wins', 'draws', 'losses', 'xG']:
                agg_stats[t][k] += st['stats'][k]

    print(f"[INFO] Monte Carlo completado en {round(time.time() - start_t, 2)} segundos.")
    
    # Average out the stats
    avg_standings = []
    for team, stats in agg_stats.items():
        avg_standings.append({
            'team': team,
            'code': teams_dict[team],
            'elo': final_elos.get(SPANISH_TO_ENGLISH.get(team, team), 1500.0),
            'points': round(stats['points'] / ITERATIONS, 1),
            'buchholz': round(stats['buchholz'] / ITERATIONS, 1),
            'avg_pos': round(stats['positions'] / ITERATIONS, 1),
            'played': round(stats['played'] / ITERATIONS, 1),
            'gf': round(stats['gf'] / ITERATIONS, 1),
            'ga': round(stats['ga'] / ITERATIONS, 1),
            'gd': round(stats['gd'] / ITERATIONS, 1),
            'wins': round(stats['wins'] / ITERATIONS, 1),
            'draws': round(stats['draws'] / ITERATIONS, 1),
            'losses': round(stats['losses'] / ITERATIONS, 1),
            'xG': round(stats['xG'] / ITERATIONS, 2)
        })
        
    avg_standings = sorted(avg_standings, key=lambda x: (x['points'], x['buchholz'], x['gd'], x['gf'], x['elo']), reverse=True)
    for i, st in enumerate(avg_standings):
        st['position'] = i + 1
        
    output_data = {'standings': avg_standings, 'rounds': example_rounds, 'iterations': ITERATIONS}                

    
    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public', 'swiss_tournament.json')
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"\n[ÉXITO] Torneo Suizo simulado. Resultados guardados en {out_path}")

if __name__ == '__main__':
    run_swiss_tournament()
