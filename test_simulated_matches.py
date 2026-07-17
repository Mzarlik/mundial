import os
import sys

# Reconfigurar salida estándar para soportar caracteres UTF-8 en Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

# Asegurar importación de predict_matches
import predict_matches as pm
from scipy.optimize import minimize

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 1. Cargar partidos simulados desde CSV si existe
    csv_sim_path = os.path.join(script_dir, 'partidos_simulados.csv')
    simulated_results = {}
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
            for loc, vis, gh, ga in df_sim[['Local', 'Visitante', 'Goles Local', 'Goles Visitante']].itertuples(index=False, name=None):
                if pd.notna(gh) and pd.notna(ga) and str(gh).strip() != '' and str(ga).strip() != '':
                    h_abbr = TEAM_TO_ID_ABBR.get(loc, str(loc)[:3].lower())
                    a_abbr = TEAM_TO_ID_ABBR.get(vis, str(vis)[:3].lower())
                    m_id = f"{h_abbr}-{a_abbr}"
                    simulated_results[m_id] = (int(gh), int(ga))
        except Exception as e:
            print(f"[WARNING] Error al leer partidos_simulados.csv: {e}")
            
    if not simulated_results:
        print("[ERROR] No se encontraron resultados reales de partidos simulados en partidos_simulados.csv.")
        return

    # Cargar partidos de matches.js
    js_path = os.path.join(script_dir, 'src', 'config', 'matches.js')
    matches = pm.parse_matches(js_path)
    
    # Cargar datos históricos
    csv_path = os.path.join(script_dir, 'international_results-master', 'international_results-master', 'results.csv')
    df_raw = pd.read_csv(csv_path)
    df_raw['date'] = pd.to_datetime(df_raw['date'])
    df_all = df_raw[df_raw['home_score'].notna()].copy()
    df_all['home_score'] = df_all['home_score'].astype(int)
    df_all['away_score'] = df_all['away_score'].astype(int)
    
    # Calcular ratings ELO, Pi y forma
    df_all, elo_by_team, final_elos = pm.compute_elo_ratings(df_all)
    df_all, pi_by_team, final_pis = pm.compute_pi_ratings(df_all)
    
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
        
    h2h_dict = {}
    for r in df_all.itertuples():
        pair = tuple(sorted([r.home_team, r.away_team]))
        if pair not in h2h_dict:
            h2h_dict[pair] = []
        gd = r.home_score - r.away_score if r.home_team == pair[0] else r.away_score - r.home_score
        h2h_dict[pair].append((r.date, gd))
    for pair in h2h_dict:
        h2h_dict[pair].sort(key=lambda x: x[0])
        
    # Modelos
    dc_final = pm.fit_dixon_coles(df_all[(df_all.date >= pm.DESDE) & (df_all.date < pm.MATCH_DATE)], pm.MATCH_DATE)
    dc_nb_final = pm.fit_dixon_coles_nb(df_all[(df_all.date >= pm.DESDE) & (df_all.date < pm.MATCH_DATE)], pm.MATCH_DATE)
    mc_final = pm.fit_mcmc(df_all[(df_all.date >= pm.DESDE_BAYES) & (df_all.date < pm.MATCH_DATE)], final_elos, elo_by_team=elo_by_team, draws=1500, tune=1500)
    X_f, yh_f, ya_f, th_f, ta_f = pm.build_dataset(dc_final, pm.MATCH_DATE, df_all, form_by_team, elo_by_team, final_elos, h2h_dict, pi_by_team, final_pis)
    n_samples = len(X_f)
    decay_lambda = 0.0003
    time_weights = np.exp(-decay_lambda * (n_samples - np.arange(n_samples)))
    for idx_w in range(n_samples):
        if idx_w >= (n_samples - 25):
            time_weights[idx_w] *= 3.0
    time_weights = time_weights / np.mean(time_weights)
    reg_home, reg_away = pm.train_xgb_goals(X_f, yh_f, ya_f, sample_weight=time_weights)
    scaler_f, mlp_home, mlp_away = pm.train_mlp_goals(X_f, yh_f, ya_f, sample_weight=time_weights)
    cb_home, cb_away = pm.train_catboost_goals(X_f, yh_f, ya_f, th_f, ta_f, sample_weight=time_weights)
    
    # PASO 1: Recolectar datos y optimizar pesos del Ensamble
    opt_data = []
    for m_id, (goals_h, goals_a) in simulated_results.items():
        match_obj = next((m for m in matches if m['id'] == m_id), None)
        if not match_obj:
            continue
        h = match_obj['home']
        a = match_obj['away']
        h_eng = pm.SPANISH_TO_ENGLISH.get(h, h)
        a_eng = pm.SPANISH_TO_ENGLISH.get(a, a)
        
        M_dc = pm.dc_matrix(dc_final, h_eng, a_eng, 0.0)
        M_dcnb = pm.dc_nb_matrix(dc_nb_final, h_eng, a_eng, 0.0)
        elo_h_mc = pm.get_elo_at_date(h_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        elo_a_mc = pm.get_elo_at_date(a_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        M_mc = pm.mcmc_matrix_mean(mc_final, h_eng, a_eng, 0.0, dc_final, elo_h_mc, elo_a_mc)
        M_xgb, _, _ = pm.xgb_matrix(reg_home, reg_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        M_mlp, _, _ = pm.mlp_matrix(scaler_f, mlp_home, mlp_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        M_cb, _, _ = pm.catboost_matrix(cb_home, cb_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                      form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        elo_h = pm.get_elo_at_date(h_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        elo_a = pm.get_elo_at_date(a_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        fh = pm.get_form_at_date(h_eng, pm.MATCH_DATE, form_by_team)
        fa = pm.get_form_at_date(a_eng, pm.MATCH_DATE, form_by_team)
        form_h_val = fh[2] if fh else 0.5
        form_a_val = fa[2] if fa else 0.5
        M_mfa, _, _ = pm.montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, form_h_val, form_a_val, 0.0)
        
        o = pm.resultado_real(goals_h, goals_a)
        opt_data.append((M_dc, M_dcnb, M_mc, M_xgb, M_mlp, M_cb, M_mfa, o))
        
    def rps_opt_1x2(p, o):
        e = [0., 0., 0.]
        e[o] = 1.
        return 0.5 * ((p[0] - e[0])**2 + (p[0]+p[1] - e[0]-e[1])**2)
        
    def eval_w(w):
        tot = 0.0
        for M_dc_t, M_dcnb_t, M_mc_t, M_xg_t, M_ml_t, M_cb_t, M_mfa_t, o_t in opt_data:
            M_ens_t = (M_dc_t * w[0] + M_dcnb_t * w[1] + M_mc_t * w[2] + M_xg_t * w[3] + M_ml_t * w[4] + M_cb_t * w[5] + M_mfa_t * w[6])
            p_t = pm.matrix_to_1x2(M_ens_t)
            tot += rps_opt_1x2(p_t, o_t)
        return tot / len(opt_data)
        
    cons = ({'type': 'eq', 'fun': lambda w: 1.0 - sum(w)})
    bounds = [(0.0, 1.0) for _ in range(7)]
    w0 = [0.30, 0.20, 0.05, 0.15, 0.10, 0.10, 0.10]
    res_opt = minimize(eval_w, w0, method='SLSQP', bounds=bounds, constraints=cons)
    w_opt = res_opt.x

    print(f"\n[INFO] Evaluando acierto real sobre los {len(simulated_results)} partidos jugados de tu simulación...")
    
    eval_results = {
        'Dixon-Coles Poisson': {'hits': 0, 'rps_sum': 0.0},
        'Dixon-Coles NB': {'hits': 0, 'rps_sum': 0.0},
        'MCMC Bayesiano': {'hits': 0, 'rps_sum': 0.0},
        'XGBoost': {'hits': 0, 'rps_sum': 0.0},
        'Red Neuronal (MLP)': {'hits': 0, 'rps_sum': 0.0},
        'CatBoost': {'hits': 0, 'rps_sum': 0.0},
        'MFA Montecarlo': {'hits': 0, 'rps_sum': 0.0},
        'Ensemble Ponderado': {'hits': 0, 'rps_sum': 0.0}
    }
    
    matches_evaluated = 0
    
    for m_id, (goals_h, goals_a) in simulated_results.items():
        match_obj = next((m for m in matches if m['id'] == m_id), None)
        if not match_obj:
            continue
            
        h = match_obj['home']
        a = match_obj['away']
        h_eng = pm.SPANISH_TO_ENGLISH.get(h, h)
        a_eng = pm.SPANISH_TO_ENGLISH.get(a, a)
        
        M_dc = pm.dc_matrix(dc_final, h_eng, a_eng, 0.0)
        M_dcnb = pm.dc_nb_matrix(dc_nb_final, h_eng, a_eng, 0.0)
        elo_h_mc = pm.get_elo_at_date(h_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        elo_a_mc = pm.get_elo_at_date(a_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        M_mc = pm.mcmc_matrix_mean(mc_final, h_eng, a_eng, 0.0, dc_final, elo_h_mc, elo_a_mc)
        M_xgb, _, _ = pm.xgb_matrix(reg_home, reg_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        M_mlp, _, _ = pm.mlp_matrix(scaler_f, mlp_home, mlp_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        M_cb, _, _ = pm.catboost_matrix(cb_home, cb_away, dc_final, h_eng, a_eng, 0.0, pm.MATCH_DATE,
                                          form_by_team, elo_by_team, final_elos, h2h_dict, 1.0, pi_by_team, final_pis)
        
        elo_h = pm.get_elo_at_date(h_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        elo_a = pm.get_elo_at_date(a_eng, pm.MATCH_DATE, elo_by_team, final_elos)
        fh = pm.get_form_at_date(h_eng, pm.MATCH_DATE, form_by_team)
        fa = pm.get_form_at_date(a_eng, pm.MATCH_DATE, form_by_team)
        form_h_val = fh[2] if fh else 0.5
        form_a_val = fa[2] if fa else 0.5
        M_mfa, _, _ = pm.montecarlo_mfa_matrix(h_eng, a_eng, elo_h, elo_a, form_h_val, form_a_val, 0.0)
        
        # Ensemble con pesos óptimos SLSQP
        M_ens = (M_dc * w_opt[0] + M_dcnb * w_opt[1] + M_mc * w_opt[2] + M_xgb * w_opt[3] + M_mlp * w_opt[4] + M_cb * w_opt[5] + M_mfa * w_opt[6])
        
        real_outcome = 0 if goals_h > goals_a else (1 if goals_h == goals_a else 2)
        outcome_labels = ["Gana Local", "Empate", "Gana Visita"]
        
        models_predictions = {
            'Dixon-Coles Poisson': M_dc,
            'Dixon-Coles NB': M_dcnb,
            'MCMC Bayesiano': M_mc,
            'XGBoost': M_xgb,
            'Red Neuronal (MLP)': M_mlp,
            'CatBoost': M_cb,
            'MFA Montecarlo': M_mfa,
            'Ensemble Ponderado': M_ens
        }
        
        print(f"\n⚽ Partido: {h} {goals_h} - {goals_a} {a} (Resultado real: {outcome_labels[real_outcome]})")
        
        for name, M_pred in models_predictions.items():
            p_1x2 = pm.matrix_to_1x2(M_pred)
            pred_outcome = int(np.argmax(p_1x2))
            is_hit = pred_outcome == real_outcome
            if is_hit:
                eval_results[name]['hits'] += 1
            match_rps = pm.rps_1x2(p_1x2, real_outcome)
            eval_results[name]['rps_sum'] += match_rps
            
            if name == 'Ensemble Ponderado':
                print(f"   ↳ Pred Ensemble: Gana H: {p_1x2[0]*100:.1f}% | Empate: {p_1x2[1]*100:.1f}% | Gana A: {p_1x2[2]*100:.1f}% -> {'✅ ACERTADO' if is_hit else '❌ FALLADO'} (RPS: {match_rps:.4f})")
                
        matches_evaluated += 1

    if matches_evaluated == 0:
        print("[ERROR] No se pudo evaluar ningún partido.")
        return

    # 3. Imprimir Tabla Resumen de Métricas
    print(f"\n========================================================")
    print(f"📊 TABLA COMPARATIVA DE TU MUNDIAL SIMULADO (N = {matches_evaluated})")
    print(f"========================================================")
    print(f"{'Modelo':<25} | {'Aciertos':<8} | {'Accuracy 1X2':<12} | {'RPS Promedio':<12}")
    print("-" * 68)
    
    summary_list = []
    for name, metrics in eval_results.items():
        acc = (metrics['hits'] / matches_evaluated) * 100
        avg_rps = metrics['rps_sum'] / matches_evaluated
        summary_list.append((name, metrics['hits'], acc, avg_rps))
        
    summary_list.sort(key=lambda x: (-x[2], x[3]))
    
    for name, hits, acc, avg_rps in summary_list:
        print(f"{name:<25} | {hits:>3}/{matches_evaluated:<4} | {acc:>11.2f}% | {avg_rps:>12.4f}")
    print("========================================================\n")

if __name__ == '__main__':
    main()
