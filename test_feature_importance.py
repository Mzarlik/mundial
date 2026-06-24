import os
import sys
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

# Import our custom functions
import predict_matches as pm

def main():
    print("[INFO] Executing Feature Importance Analysis...")
    
    # Reload the datasets using pm's global state to simulate actual run
    pm.MATCH_DATE = pd.Timestamp('2026-06-22')
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    df_all = pd.read_csv(csv_path, parse_dates=['date'])
    
    # Load dictionaries
    matches_js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    
    print("[INFO] Re-running Bayesian preparation (this will take a few seconds)...")
    # Quick trick: we only need the dataset, we don't need MCMC traces
    # Let's bypass MCMC and just use the feature generation
    # wait, predict_matches.py already has build_dataset which doesn't need MCMC traces,
    # it just needs dc_model, which also takes a few seconds to fit.
    
    train_mask = df_all['date'] < pm.VAL_CUTOFF
    df_train = df_all[train_mask].copy()
    
    # Fit DC
    dc_model = pm.fit_dixon_coles(df_train, pm.VAL_CUTOFF)
    
    print("[INFO] Calculando ratings Elo y Pi...")
    df_all, elo_by_team, final_elos = pm.compute_elo_ratings(df_train)
    df_all, pi_by_team, final_pis = pm.compute_pi_ratings(df_all)
    
    print("[INFO] Calculando rachas de forma...")
    long_list = []
    for r in df_all[df_all.date >= pm.DESDE].itertuples():
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
    
    print("[INFO] Building Dataset...")
    X, yh, ya, th, ta = pm.build_dataset(dc_model, pm.VAL_CUTOFF, df_train, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis)
    
    feature_names = [
        'Poisson_Lam', 'Poisson_Mu', 'Att_Diff', 'Def_Diff', 'Is_Host', 
        'Form_H1', 'Form_H2', 'Form_H3', 'Form_A1', 'Form_A2', 'Form_A3', 
        'Elo_H', 'Elo_A', 'Elo_Diff', 'Pi_H', 'Pi_A', 'H2H_GD', 'Is_Comp', 
        'MV_H', 'MV_A', 'MV_Diff', 'Age_H', 'Age_A', 'Age_Diff', 'Squad_H', 'Squad_A', 'Squad_Diff'
    ]
    
    print(f"[INFO] Training XGBoost with {X.shape[0]} matches and {X.shape[1]} features...")
    
    # Use exact same parameters as predict_matches
    params = dict(objective='count:poisson', n_estimators=1500, max_depth=4,
                  learning_rate=0.03, subsample=0.8, colsample_bytree=0.8, 
                  min_child_weight=2, reg_lambda=1.5, random_state=42)
    
    model_h = xgb.XGBRegressor(**params)
    model_h.fit(X, yh, verbose=False)
    
    # Get feature importances
    importances = model_h.feature_importances_
    
    # Pair with names and sort
    feat_imp = sorted(list(zip(feature_names, importances)), key=lambda x: x[1], reverse=True)
    
    print("\n--- FEATURE IMPORTANCE RANKING (HOME GOALS) ---")
    total_gain = 0
    for name, imp in feat_imp:
        total_gain += imp
        print(f"{name:15} | {imp*100:5.2f}%")
        
    # Check our scraped variables specifically
    scraped_vars = ['MV_H', 'MV_A', 'MV_Diff', 'Age_H', 'Age_A', 'Age_Diff', 'Squad_H', 'Squad_A', 'Squad_Diff']
    print("\n--- SCRAPED VARIABLES CONTRIBUTION ---")
    scraped_total = 0
    for name, imp in feat_imp:
        if name in scraped_vars:
            print(f"{name:15} | {imp*100:5.2f}%")
            scraped_total += imp
            
    print(f"TOTAL SCRAPED VAR CONTRIBUTION: {scraped_total*100:.2f}%\n")
    
    if scraped_total < 0.03: # Less than 3% overall impact
        print("[WARNING] Scraped variables (especially Age and Squad) are mostly noise.")
    else:
        print("[OK] Scraped variables contribute meaningfully to the model.")

if __name__ == '__main__':
    main()
