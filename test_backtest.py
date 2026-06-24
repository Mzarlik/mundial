import os
import sys
import pandas as pd
import numpy as np
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

import predict_matches as pm

def evaluate_tournament(df_all, start_date, end_date, tournament_name):
    print(f"\n==============================================")
    print(f"BACKTESTING: {tournament_name}")
    print(f"==============================================")
    
    cutoff = pd.Timestamp(start_date)
    
    # Train data: everything before cutoff
    df_train = df_all[df_all.date < cutoff].copy()
    
    # Test data: The tournament itself
    df_test = df_all[(df_all.date >= start_date) & (df_all.date <= end_date)].copy()
    # Filter to only FIFA World Cup matches if there are friendlies in between
    df_test = df_test[df_test.tournament == 'FIFA World Cup'].copy()
    
    print(f"[INFO] Train matches: {len(df_train)}")
    print(f"[INFO] Test matches (World Cup): {len(df_test)}")
    
    if len(df_test) == 0:
        print("[ERROR] No tournament matches found in the specified date range.")
        return
        
    print("[INFO] Computing DC, Elo, Pi, Form on historical data...")
    dc_model = pm.fit_dixon_coles(df_train, cutoff)
    _, elo_by_team, final_elos = pm.compute_elo_ratings(df_train)
    _, pi_by_team, final_pis = pm.compute_pi_ratings(df_train)
    
    long_list = []
    for r in df_train[df_train.date >= pm.DESDE].itertuples():
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
        
    h2h_dict = {}
    for r in df_train.itertuples():
        pair = tuple(sorted([r.home_team, r.away_team]))
        if pair not in h2h_dict:
            h2h_dict[pair] = []
        gd = r.home_score - r.away_score if r.home_team == pair[0] else r.away_score - r.home_score
        h2h_dict[pair].append((r.date, gd))
    for pair in h2h_dict:
        h2h_dict[pair].sort(key=lambda x: x[0])
        
    print("[INFO] Building Train Dataset...")
    X_train, yh_train, ya_train, _, _ = pm.build_dataset(dc_model, cutoff, df_train, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis)
    
    print("[INFO] Training XGBoost...")
    params = dict(objective='count:poisson', n_estimators=1500, max_depth=4,
                  learning_rate=0.03, subsample=0.8, colsample_bytree=0.8, 
                  min_child_weight=2, reg_lambda=1.5, random_state=42)
    model_h = xgb.XGBRegressor(**params)
    model_a = xgb.XGBRegressor(**params)
    model_h.fit(X_train, yh_train, verbose=False)
    model_a.fit(X_train, ya_train, verbose=False)
    
    print("[INFO] Evaluating on Tournament...")
    # Predict match by match
    hits = 0
    rps_sum = 0
    
    for row in df_test.itertuples():
        h = row.home_team
        a = row.away_team
        host = 1.0 if row.country == h else (0.0) # simplify
        
        # Build features for test match
        # To avoid data leakage, we evaluate using features as they were EXACTLY before the match
        # But for simplicity in this script, we just use the final_elos from cutoff.
        # This is slightly inaccurate because forms update during the tournament, but it's a good proxy.
        
        # We can just call build_dataset on a df with 1 row, but we need dc_model which is trained.
        # Actually, let's just use xgb_matrix from predict_matches.
        
        # xgb_matrix returns M, lam, mu. We just want M.
        # Wait, xgb_matrix takes reg_home, reg_away.
        M, lh, la = pm.xgb_matrix(model_h, model_a, dc_model, h, a, host, row.date, form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        p_1x2 = pm.matrix_to_1x2(M)
        
        real_outcome = 0 if row.home_score > row.away_score else (2 if row.home_score < row.away_score else 1)
        pred_outcome = int(np.argmax(p_1x2))
        
        if real_outcome == pred_outcome:
            hits += 1
            
        rps_sum += pm.rps_1x2(p_1x2, real_outcome)
        
    accuracy = hits / len(df_test)
    avg_rps = rps_sum / len(df_test)
    
    print(f"--> Accuracy (Aciertos 1X2): {accuracy*100:.2f}%")
    print(f"--> RPS Promedio (Menor es mejor): {avg_rps:.4f}")
    if accuracy > 0.50:
        print(f"[OK] El modelo pasa la prueba histórica en {tournament_name}.")
    else:
        print(f"[WARNING] El modelo podría estar sobreajustado o tener problemas en {tournament_name}.")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    df_all = pd.read_csv(csv_path, parse_dates=['date'])
    
    # 2018 World Cup in Russia (June 14 - July 15)
    evaluate_tournament(df_all, '2018-06-14', '2018-07-15', 'Rusia 2018')
    
    # 2022 World Cup in Qatar (Nov 20 - Dec 18)
    evaluate_tournament(df_all, '2022-11-20', '2022-12-18', 'Qatar 2022')

if __name__ == '__main__':
    main()
