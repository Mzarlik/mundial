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
    
    # Redefinir dinámicamente las ventanas temporales en el módulo importado
    pm.DESDE = cutoff - pd.Timedelta(days=4*365)       # 4 años de ventana para ML/Dixon-Coles
    pm.DESDE_BAYES = cutoff - pd.Timedelta(days=8*365) # 8 años de ventana para Bayesiano (evita arrays vacíos)
    
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
    X_train, yh_train, ya_train, th_train, ta_train = pm.build_dataset(dc_model, cutoff, df_train, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis)
    
    n_samples = len(X_train)
    decay_lambda = 0.0003
    time_weights = np.exp(-decay_lambda * (n_samples - np.arange(n_samples)))
    for idx_w in range(n_samples):
        if idx_w >= (n_samples - 25):
            time_weights[idx_w] *= 3.0
    time_weights = time_weights / np.mean(time_weights)
    
    print("[INFO] Muestreando MCMC Bayesiano (PyMC)... Esto puede tardar ~1 min (draws=1500, tune=1500)...")
    mc_model = pm.fit_mcmc(df_train[df_train.date >= pm.DESDE_BAYES], final_elos, elo_by_team=elo_by_team, draws=1500, tune=1500, form_by_team=form_by_team)
    
    print("[INFO] Training XGBoost (early stopping)...")
    model_h, model_a = pm.train_xgb_goals(X_train, yh_train, ya_train, sample_weight=time_weights)
    
    print("[INFO] Training Red Neuronal (MLP)...")
    scaler, mlp_h, mlp_a = pm.train_mlp_goals(X_train, yh_train, ya_train, sample_weight=time_weights)
    
    print("[INFO] Training CatBoost...")
    cb_h, cb_a = pm.train_catboost_goals(X_train, yh_train, ya_train, th_train, ta_train, sample_weight=time_weights)
    
    print("[INFO] Evaluating all models on Tournament...")
    
    # Estructura para registrar aciertos (hits) y RPS para cada modelo
    eval_results = {
        'Dixon-Coles': {'hits': 0, 'rps_sum': 0.0},
        'MCMC Bayesiano': {'hits': 0, 'rps_sum': 0.0},
        'XGBoost': {'hits': 0, 'rps_sum': 0.0},
        'Red Neuronal (MLP)': {'hits': 0, 'rps_sum': 0.0},
        'CatBoost': {'hits': 0, 'rps_sum': 0.0},
        'MFA Montecarlo': {'hits': 0, 'rps_sum': 0.0},
        'Ensemble': {'hits': 0, 'rps_sum': 0.0}
    }
    
    n_test = len(df_test)
    
    for row in df_test.itertuples():
        h = row.home_team
        a = row.away_team
        host = 1.0 if row.country == h else 0.0
        
        # 1. Dixon-Coles
        M_dc = pm.dc_matrix(dc_model, h, a, host)
        
        # 2. MCMC Bayesiano
        elo_h_mc = pm.get_elo_at_date(h, row.date, elo_by_team, final_elos)
        elo_a_mc = pm.get_elo_at_date(a, row.date, elo_by_team, final_elos)
        fh_mc, gf5h_mc, ga5h_mc = pm.get_form_at_date(h, row.date, form_by_team)
        fa_mc, gf5a_mc, ga5a_mc = pm.get_form_at_date(a, row.date, form_by_team)
        form_diff_mc = fh_mc - fa_mc
        gf5_diff_mc = gf5h_mc - gf5a_mc
        ga5_diff_mc = ga5h_mc - ga5a_mc
        mv_h_mc = np.log(pm.MARKET_VALUES.get(h, 50.0) + 1)
        mv_a_mc = np.log(pm.MARKET_VALUES.get(a, 50.0) + 1)
        mv_diff_mc = mv_h_mc - mv_a_mc
        M_mc = pm.mcmc_matrix_mean(mc_model, h, a, host, dc_model, elo_h_mc, elo_a_mc, form_diff=form_diff_mc, mv_diff=mv_diff_mc, gf5_diff=gf5_diff_mc, ga5_diff=ga5_diff_mc)
        
        # 3. XGBoost
        M_xgb, _, _ = pm.xgb_matrix(model_h, model_a, dc_model, h, a, host, row.date, form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        # 4. MLP
        M_mlp, _, _ = pm.mlp_matrix(scaler, mlp_h, mlp_a, dc_model, h, a, host, row.date, form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        # 5. CatBoost
        M_cb, _, _ = pm.catboost_matrix(cb_h, cb_a, dc_model, h, a, host, row.date, form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        # 6. MFA Montecarlo (Elo + Forma a la fecha del partido histórico)
        elo_h = pm.get_elo_at_date(h, row.date, elo_by_team, final_elos)
        elo_a = pm.get_elo_at_date(a, row.date, elo_by_team, final_elos)
        fh = pm.get_form_at_date(h, row.date, form_by_team)
        fa = pm.get_form_at_date(a, row.date, form_by_team)
        form_h_val = fh[2] if fh else 0.5
        form_a_val = fa[2] if fa else 0.5
        M_mfa, _, _ = pm.montecarlo_mfa_matrix(h, a, elo_h, elo_a, form_h_val, form_a_val)
        
        # 7. Ensemble (Promedio de 5 modelos)
        M_ens = (M_mc + M_xgb + M_mlp + M_cb + M_mfa) / 5
        
        real_outcome = 0 if row.home_score > row.away_score else (2 if row.home_score < row.away_score else 1)
        
        # Evaluar cada modelo
        matrices = {
            'Dixon-Coles': M_dc,
            'MCMC Bayesiano': M_mc,
            'XGBoost': M_xgb,
            'Red Neuronal (MLP)': M_mlp,
            'CatBoost': M_cb,
            'MFA Montecarlo': M_mfa,
            'Ensemble': M_ens
        }
        
        for name, M_pred in matrices.items():
            p_1x2 = pm.matrix_to_1x2(M_pred)
            pred_outcome = int(np.argmax(p_1x2))
            
            if pred_outcome == real_outcome:
                eval_results[name]['hits'] += 1
            eval_results[name]['rps_sum'] += pm.rps_1x2(p_1x2, real_outcome)
            
    print(f"\nResultados Comparativos de Backtesting para {tournament_name}:")
    print(f"{'Modelo':<25} | {'Accuracy 1X2':<12} | {'RPS Promedio':<12}")
    print("-" * 57)
    
    for name, metrics in eval_results.items():
        acc = (metrics['hits'] / n_test) * 100
        avg_rps = metrics['rps_sum'] / n_test
        print(f"{name:<25} | {acc:>11.2f}% | {avg_rps:>12.4f}")
        
    # Verificar si el Ensemble pasa el umbral de aciertos
    ens_acc = eval_results['Ensemble']['hits'] / n_test
    if ens_acc > 0.50:
        print(f"\n[OK] El Ensemble pasa la prueba histórica en {tournament_name} (Accuracy > 50%).")
    else:
        print(f"\n[WARNING] El Ensemble tiene un rendimiento bajo en {tournament_name}.")

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
