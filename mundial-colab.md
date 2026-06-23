Prediccion del marcador: Argentina vs Austria
Mundial FIFA 2026 - Grupo J - segunda jornada (lunes 22 de junio)
Predice el marcador exacto del Argentina vs Austria con dos modelos y, al final, incluye un apartado para medir el accuracy de cada uno.

Repositorio de datos (GitHub):

martj42/international_results https://github.com/martj42/international_results

Modelos:

MCMC bayesiano (Baio-Blangiardo). Poisson jerarquico muestreado con PyMC. El marcador sale de la distribucion predictiva posterior (promedio sobre las muestras), reflejando la incertidumbre.

XGBoost (regresion de goles). Dos regresores con objetivo Poisson predicen los goles esperados de cada equipo; la estructura de Poisson convierte esas tasas en marcador. Enfoque hibrido de Groll.

Notas sobre este partido:

Argentina y Austria solo se han enfrentado dos veces en la historia (1980 y 1990, amistosos en Viena), asi que no hay head-to-head util; los modelos se apoyan en la fuerza general estimada de cada seleccion.
El partido se juega en cancha neutral (AT&T Stadium, Dallas), asi que ninguno de los dos tiene ventaja de local. A diferencia de los partidos de Mexico (anfitrion), aqui la ventaja de local NO se aplica.
Apartado final: mide el accuracy fuera de muestra (acierto del resultado y RPS) de los modelos, entrenando con datos hasta una fecha de corte y validando con los partidos posteriores.

# ============================================================
# CELDA 1: Instalar dependencias
# ============================================================
!pip install pymc xgboost scipy pandas numpy matplotlib seaborn --quiet
print('Dependencias listas')

# ============================================================
# CELDA 2: Importar librerias
# ============================================================
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from scipy.stats import poisson
from scipy.optimize import minimize
import pymc as pm
import xgboost as xgb
import warnings, time
warnings.filterwarnings('ignore')
sns.set_style('whitegrid')
print('Librerias cargadas')

# ============================================================
# CELDA 3: Descargar dataset desde el repositorio martj42
# ============================================================
REPO = 'martj42/international_results'
url = f'https://raw.githubusercontent.com/{REPO}/master/results.csv'
print(f'Repositorio: {REPO}')
df_raw = pd.read_csv(url)
df_raw['date'] = pd.to_datetime(df_raw['date'])
df_all = df_raw[df_raw['home_score'].notna()].copy()
df_all['home_score'] = df_all['home_score'].astype(int)
df_all['away_score'] = df_all['away_score'].astype(int)
print(f'Partidos con marcador: {len(df_all):,}  ({df_all.date.min().date()} a {df_all.date.max().date()})')

# ============================================================
# CELDA 4: Configuracion
# ============================================================
HOME_TEAM   = 'Argentina'
AWAY_TEAM   = 'Austria'
ABBR_HOME   = 'ARG'
ABBR_AWAY   = 'AUT'
MATCH_DATE  = pd.Timestamp('2026-06-22')
HOME_IS_HOST = False                         # cancha NEUTRAL (Dallas): nadie tiene ventaja de local

DESDE        = pd.Timestamp('2018-01-01')    # historia para Dixon-Coles / XGBoost
DESDE_BAYES  = pd.Timestamp('2022-09-01')    # ventana del MCMC
VAL_CUTOFF   = pd.Timestamp('2025-09-01')    # frontera para el apartado de accuracy
HALF_LIFE    = 547
MIN_PARTIDOS_BAYES = 25
MAXG = 7

C_HOME, C_DRAW, C_AWAY = '#75AADB', '#BDBDBD', '#ED2939'   # celeste ARG, gris, rojo AUT

def resultado_real(hs, as_):
    return 0 if hs > as_ else (1 if hs == as_ else 2)
def rps_1x2(p, o):
    e=[0.,0.,0.]; e[o]=1.; cp=ce=s=0.
    for k in range(2): cp+=p[k]; ce+=e[k]; s+=(cp-ce)**2
    return s/2
print('Partido:', HOME_TEAM, 'vs', AWAY_TEAM, '-', MATCH_DATE.date())

# ============================================================
# CELDA 5: Funciones del modelo Dixon-Coles (base de las variables)
# ============================================================
def fit_dixon_coles(train, cutoff, half_life=HALF_LIFE):
    train = train.copy()
    train['w'] = 0.5 ** ((cutoff - train['date']).dt.days / half_life)
    teams = sorted(set(train['home_team']) | set(train['away_team']))
    idx = {t:i for i,t in enumerate(teams)}; n = len(teams)
    hi = train['home_team'].map(idx).values; ai = train['away_team'].map(idx).values
    hs = train['home_score'].values; as_ = train['away_score'].values; w = train['w'].values
    lm = (train['neutral']==False).values.astype(float)
    def tau(x,y,l,m,r):
        t=np.ones_like(l)
        a=(x==0)&(y==0);t[a]=1-l[a]*m[a]*r; a=(x==0)&(y==1);t[a]=1+l[a]*r
        a=(x==1)&(y==0);t[a]=1+m[a]*r;       a=(x==1)&(y==1);t[a]=1-r
        return t
    def nll(p):
        at=p[:n]-p[:n].mean(); dn=p[n:2*n]; h=p[2*n]; r=p[2*n+1]
        l=np.exp(at[hi]-dn[ai]+h*lm); m=np.exp(at[ai]-dn[hi])
        t=np.clip(tau(hs,as_,l,m,r),1e-10,None)
        return -(w*(np.log(t)+poisson.logpmf(hs,l)+poisson.logpmf(as_,m))).sum()
    r=minimize(nll,np.concatenate([np.zeros(n),np.zeros(n),[.25,-.05]]),method='L-BFGS-B')
    at=r.x[:n]-r.x[:n].mean()
    return {'att':at,'dfn':r.x[n:2*n],'home':r.x[2*n],'rho':r.x[2*n+1],'idx':idx,'teams':teams}

def dc_matrix(dcm, h, a, host):
    att,dfn,idx,home,rho = dcm['att'],dcm['dfn'],dcm['idx'],dcm['home'],dcm['rho']
    l=np.exp(att[idx[h]]-dfn[idx[a]]+(home if host else 0)); m=np.exp(att[idx[a]]-dfn[idx[h]])
    M=np.outer(poisson.pmf(range(MAXG),l),poisson.pmf(range(MAXG),m))
    M[0,0]*=1-l*m*rho; M[0,1]*=1+l*rho; M[1,0]*=1+m*rho; M[1,1]*=1-rho
    return M/M.sum()

def matrix_to_1x2(M):
    return [np.tril(M,-1).sum(), np.trace(M), np.triu(M,1).sum()]

print('Ajustando Dixon-Coles final (hasta la fecha del partido)...')
t0=time.time()
dc_final = fit_dixon_coles(df_all[(df_all.date>=DESDE)&(df_all.date<MATCH_DATE)], MATCH_DATE)
print(f'Listo en {time.time()-t0:.0f}s. Ventaja de local x{np.exp(dc_final["home"]):.2f}')

# ============================================================
# CELDA 6: MODELO 1 - MCMC bayesiano (funcion reutilizable)
# ============================================================
def fit_mcmc(train, draws=1000, tune=1000, seed=1):
    cnt = pd.concat([train.home_team, train.away_team]).value_counts()
    keep = set(cnt[cnt>=MIN_PARTIDOS_BAYES].index)
    tb = train[train.home_team.isin(keep)&train.away_team.isin(keep)]
    teams=sorted(keep); idxb={t:i for i,t in enumerate(teams)}; n=len(teams)
    hi=tb.home_team.map(idxb).values; ai=tb.away_team.map(idxb).values
    hs=tb.home_score.values; as_=tb.away_score.values
    lm=(tb.neutral==False).values.astype(float)
    with pm.Model():
        sa=pm.HalfNormal('sa',1.0); sd=pm.HalfNormal('sd',1.0)
        att=pm.Normal('att',0,sa,shape=n); dfn=pm.Normal('dfn',0,sd,shape=n)
        home=pm.Normal('home',0.25,0.5); base=pm.Normal('base',0,1)
        ac=att-att.mean(); dc_=dfn-dfn.mean()
        pm.Poisson('gh',pm.math.exp(base+home*lm+ac[hi]-dc_[ai]),observed=hs)
        pm.Poisson('ga',pm.math.exp(base+ac[ai]-dc_[hi]),observed=as_)
        trace=pm.sample(draws,tune=tune,chains=2,cores=2,target_accept=0.9,
                        progressbar=True,random_seed=seed)
    return {'trace':trace,'idxb':idxb,'keep':keep}

print('Muestreando MCMC final (prediccion)... ~1 min')
t0=time.time()
mc_final = fit_mcmc(df_all[(df_all.date>=DESDE_BAYES)&(df_all.date<MATCH_DATE)], draws=1000, tune=1000)
print(f'MCMC listo en {time.time()-t0:.0f}s')

def mcmc_matrix_mean(mc, h, a, host):
    post=mc['trace'].posterior; idxb=mc['idxb']
    am=post['att'].mean(('chain','draw')).values; am-=am.mean()
    dm=post['dfn'].mean(('chain','draw')).values; dm-=dm.mean()
    hm=float(post['home'].mean()); bm=float(post['base'].mean())
    l=np.exp(bm+hm*host+am[idxb[h]]-dm[idxb[a]]); m=np.exp(bm+am[idxb[a]]-dm[idxb[h]])
    M=np.outer(poisson.pmf(range(MAXG),l),poisson.pmf(range(MAXG),m)); return M/M.sum()


# ============================================================
# CELDA 7: Variables + regresores XGBoost de goles (funciones)
# ============================================================
# Forma reciente (mira solo al pasado): se calcula una vez sobre todo el dataset.
long=[]
for r in df_all[df_all.date>=DESDE].itertuples():
    long.append((r.date, r.home_team, r.home_score, r.away_score, 1))
    long.append((r.date, r.away_team, r.away_score, r.home_score, 0))
L=pd.DataFrame(long,columns=['date','team','gf','ga','ishome']).sort_values('date')
L['pts']=np.where(L.gf>L.ga,3,np.where(L.gf==L.ga,1,0))
g=L.groupby('team')
L['form5']=g['pts'].transform(lambda s:s.shift().rolling(5,min_periods=1).mean())
L['gf5']=g['gf'].transform(lambda s:s.shift().rolling(5,min_periods=1).mean())
L['ga5']=g['ga'].transform(lambda s:s.shift().rolling(5,min_periods=1).mean())
FORM={(row.date,row.team,row.ishome):(row.form5,row.gf5,row.ga5) for row in L.itertuples()}

def make_features(dcm, h, a, host, date):
    idx=dcm['idx']
    if h not in idx or a not in idx: return None
    att,dfn,home=dcm['att'],dcm['dfn'],dcm['home']
    lam=np.exp(att[idx[h]]-dfn[idx[a]]+home*host); mu=np.exp(att[idx[a]]-dfn[idx[h]])
    fh=FORM.get((date,h,1),(1,1,1)); fa=FORM.get((date,a,0),(1,1,1))
    return [lam,mu,att[idx[h]]-att[idx[a]],dfn[idx[h]]-dfn[idx[a]],float(host),
            fh[0],fh[1],fh[2],fa[0],fa[1],fa[2]]

def build_dataset(dcm, fecha_max):
    known=set(dcm['teams']); rows=[]; yh=[]; ya=[]; dates=[]; meta=[]
    sub = df_all[(df_all.date>=DESDE)&(df_all.date<fecha_max)]
    for r in sub.itertuples():
        if r.home_team not in known or r.away_team not in known: continue
        host=1.0 if r.neutral==False else 0.0
        f=make_features(dcm,r.home_team,r.away_team,host,r.date)
        if f is None or any(pd.isna(f)): continue
        rows.append(f); yh.append(r.home_score); ya.append(r.away_score)
        dates.append(r.date); meta.append((r.home_team,r.away_team,host))
    return np.array(rows),np.array(yh),np.array(ya),np.array(dates),meta

def train_xgb_goals(X,yh,ya):
    params=dict(objective='count:poisson',n_estimators=300,max_depth=4,
                learning_rate=0.05,subsample=0.8,colsample_bytree=0.8)
    return xgb.XGBRegressor(**params).fit(X,yh), xgb.XGBRegressor(**params).fit(X,ya)

def xgb_matrix(rh, ra, dcm, h, a, host, date):
    f=np.array(make_features(dcm,h,a,host,date)).reshape(1,-1)
    lh=float(rh.predict(f)[0]); la=float(ra.predict(f)[0])
    M=np.outer(poisson.pmf(range(MAXG),lh),poisson.pmf(range(MAXG),la))
    return M/M.sum(), lh, la

print('Construyendo variables y entrenando XGBoost (prediccion)...')
Xf,yhf,yaf,_,_ = build_dataset(dc_final, MATCH_DATE)
reg_home, reg_away = train_xgb_goals(Xf,yhf,yaf)
print(f'Regresores entrenados con {len(Xf)} partidos')

# ============================================================
# CELDA 8: Marcador de cada modelo + top 10
# ============================================================
host = 1.0 if HOME_IS_HOST else 0.0
M_mcmc = mcmc_matrix_mean(mc_final, HOME_TEAM, AWAY_TEAM, host)
M_xgb, lh_xgb, la_xgb = xgb_matrix(reg_home, reg_away, dc_final, HOME_TEAM, AWAY_TEAM, host, MATCH_DATE)

def resumen(M, nombre):
    pH,pD,pA = matrix_to_1x2(M)
    mi,mj=np.unravel_index(np.argmax(M),M.shape)
    print(f'\n--- {nombre} ---')
    print(f'Gana {HOME_TEAM}: {pH*100:.1f}%   Empate: {pD*100:.1f}%   Gana {AWAY_TEAM}: {pA*100:.1f}%')
    print(f'MARCADOR MAS PROBABLE: {HOME_TEAM} {mi}-{mj} {AWAY_TEAM}  ({M[mi,mj]*100:.1f}%)')
    rows=[]
    for i in range(MAXG):
        for j in range(MAXG):
            rs=f'{HOME_TEAM} gana' if i>j else ('Empate' if i==j else f'{AWAY_TEAM} gana')
            rows.append({'Marcador':f'{i}-{j}','Prob (%)':round(M[i,j]*100,2),'Resultado':rs})
    return pd.DataFrame(rows).sort_values('Prob (%)',ascending=False).reset_index(drop=True)

top_mcmc=resumen(M_mcmc,'MCMC bayesiano')
print('\nTop 10 (MCMC):'); print(top_mcmc.head(10).to_string(index=False))
top_xgb=resumen(M_xgb,'XGBoost (regresion de goles)')
print('\nTop 10 (XGBoost):'); print(top_xgb.head(10).to_string(index=False))

# ============================================================
# CELDA 9: Grafica de tres paneles (reutilizable)
# ============================================================
def plot_3panel(M, top_df, nombre, fname):
    pH,pD,pA = matrix_to_1x2(M)
    fig,axes=plt.subplots(1,3,figsize=(18,5))
    fig.suptitle(f'Prediccion: {HOME_TEAM} vs {AWAY_TEAM} | Mundial FIFA 2026\nModelo: {nombre}',
                 fontsize=13, fontweight='bold')
    ax=axes[0]
    hd=pd.DataFrame(M[:6,:6]*100, index=[f'{ABBR_HOME} {i}' for i in range(6)],
                    columns=[f'{ABBR_AWAY} {j}' for j in range(6)])
    sns.heatmap(hd,annot=True,fmt='.1f',cmap='YlOrRd',ax=ax,cbar_kws={'label':'Probabilidad (%)'})
    ax.set_title('Probabilidad por marcador (%)',fontweight='bold')
    ax.set_xlabel(f'Goles {AWAY_TEAM}'); ax.set_ylabel(f'Goles {HOME_TEAM}')
    ax=axes[1]
    labs=[f'{HOME_TEAM}\ngana','Empate',f'{AWAY_TEAM}\ngana']; vals=[pH*100,pD*100,pA*100]
    bars=ax.bar(labs,vals,color=[C_HOME,C_DRAW,C_AWAY],width=0.5,edgecolor='white',linewidth=1.5)
    for b,v in zip(bars,vals): ax.text(b.get_x()+b.get_width()/2,v+0.5,f'{v:.1f}%',ha='center',fontweight='bold',fontsize=12)
    ax.set_ylim(0,max(vals)*1.2); ax.set_title('Probabilidad de resultado',fontweight='bold')
    ax.set_ylabel('Probabilidad (%)'); ax.spines[['top','right']].set_visible(False)
    ax=axes[2]
    t10=top_df.head(10).copy()
    cmap={f'{HOME_TEAM} gana':C_HOME,'Empate':C_DRAW,f'{AWAY_TEAM} gana':C_AWAY}
    labels=[f'{ABBR_HOME} {m} {ABBR_AWAY}' for m in t10['Marcador']]
    colors=[cmap[r] for r in t10['Resultado']]
    ax.barh(labels[::-1], t10['Prob (%)'][::-1], color=colors[::-1])
    for k,v in enumerate(t10['Prob (%)'][::-1]): ax.text(v+0.1,k,f'{v:.1f}%',va='center',fontsize=8)
    ax.set_title('Top 10 marcadores mas probables',fontweight='bold'); ax.set_xlabel('Probabilidad (%)')
    ax.legend(handles=[mpatches.Patch(color=C_HOME,label=f'{HOME_TEAM} gana'),
                       mpatches.Patch(color=C_DRAW,label='Empate'),
                       mpatches.Patch(color=C_AWAY,label=f'{AWAY_TEAM} gana')],loc='lower right',fontsize=8)
    ax.spines[['top','right']].set_visible(False)
    plt.tight_layout(); plt.savefig(fname,dpi=150,bbox_inches='tight'); plt.show()
    print(f'Guardada: {fname}')

    # ============================================================
# CELDA 10: Grafica de tres paneles - XGBoost
# ============================================================
plot_3panel(M_xgb, top_xgb, 'XGBoost - regresion de goles (Groll et al. 2019)', 'marcador_arg_aut_xgboost.png')


# ============================================================
# CELDA 11: APARTADO DE ACCURACY (validacion fuera de muestra)
# ============================================================
# Mide el acierto de cada modelo en partidos que NO vio: entrena hasta
# VAL_CUTOFF y predice los partidos posteriores. Metricas:
#   - Accuracy 1X2: % de aciertos del resultado (local/empate/visita)
#   - RPS (Ranked Probability Score): error de la distribucion (menor = mejor)
print('Entrenando versiones de validacion (hasta', VAL_CUTOFF.date(), ')...')
t0=time.time()
dc_val = fit_dixon_coles(df_all[(df_all.date>=DESDE)&(df_all.date<VAL_CUTOFF)], VAL_CUTOFF)
mc_val = fit_mcmc(df_all[(df_all.date>=DESDE_BAYES)&(df_all.date<VAL_CUTOFF)], draws=600, tune=600)
Xv,yhv,yav,_,_ = build_dataset(dc_val, VAL_CUTOFF)
rh_val, ra_val = train_xgb_goals(Xv,yhv,yav)
print(f'Listo en {time.time()-t0:.0f}s')

# Conjunto de prueba: partidos posteriores conocidos por todos los modelos
known = set(dc_val['teams']) & mc_val['keep']
test = df_all[(df_all.date>=VAL_CUTOFF)&(df_all.date<MATCH_DATE)].copy()
test = test[test.home_team.isin(known) & test.away_team.isin(known)]

res={'Dixon-Coles':[0,0.], 'MCMC bayesiano':[0,0.], 'XGBoost':[0,0.]}
n_test=0
for r in test.itertuples():
    host_t = 1.0 if r.neutral==False else 0.0
    o = resultado_real(r.home_score, r.away_score)
    p = matrix_to_1x2(dc_matrix(dc_val, r.home_team, r.away_team, host_t))
    res['Dixon-Coles'][0]+=int(np.argmax(p)==o); res['Dixon-Coles'][1]+=rps_1x2(p,o)
    p = matrix_to_1x2(mcmc_matrix_mean(mc_val, r.home_team, r.away_team, host_t))
    res['MCMC bayesiano'][0]+=int(np.argmax(p)==o); res['MCMC bayesiano'][1]+=rps_1x2(p,o)
    p = matrix_to_1x2(xgb_matrix(rh_val, ra_val, dc_val, r.home_team, r.away_team, host_t, r.date)[0])
    res['XGBoost'][0]+=int(np.argmax(p)==o); res['XGBoost'][1]+=rps_1x2(p,o)
    n_test+=1

print(f'\nAccuracy fuera de muestra ({n_test} partidos identicos para los tres):\n')
print(f'{"Modelo":<18}{"Accuracy 1X2":>14}{"RPS":>10}')
print('-'*42)
summary=[]
for k,(acc,rps) in res.items():
    a=acc/n_test*100; rr=rps/n_test; summary.append((k,a,rr))
    print(f'{k:<18}{a:>13.1f}%{rr:>10.4f}')
print('\n(Accuracy mayor = mejor. RPS menor = mejor.)')

fig,axes=plt.subplots(1,2,figsize=(13,4.5))
names=[s[0] for s in summary]; accs=[s[1] for s in summary]; rpss=[s[2] for s in summary]
cols=['#888888', C_AWAY, C_HOME]
axes[0].bar(names,accs,color=cols,width=0.55,edgecolor='white',linewidth=1.5)
for i,v in enumerate(accs): axes[0].text(i,v+0.2,f'{v:.1f}%',ha='center',fontweight='bold')
axes[0].set_title('Accuracy 1X2 (mayor = mejor)',fontweight='bold'); axes[0].set_ylabel('%')
axes[0].set_ylim(min(accs)-3,max(accs)+3); axes[0].spines[['top','right']].set_visible(False)
axes[1].bar(names,rpss,color=cols,width=0.55,edgecolor='white',linewidth=1.5)
for i,v in enumerate(rpss): axes[1].text(i,v+0.0004,f'{v:.4f}',ha='center',fontweight='bold')
axes[1].set_title('RPS (menor = mejor)',fontweight='bold'); axes[1].set_ylabel('RPS')
axes[1].set_ylim(min(rpss)-0.004,max(rpss)+0.004); axes[1].spines[['top','right']].set_visible(False)
plt.tight_layout(); plt.savefig('accuracy_arg_aut.png',dpi=140,bbox_inches='tight'); plt.show()

# ============================================================
# CELDA 12: Resumen
# ============================================================
def ml(M):
    mi,mj=np.unravel_index(np.argmax(M),M.shape); return mi,mj,M[mi,mj]*100
m1=ml(M_mcmc); m2=ml(M_xgb)
print('='*58)
print(f'  MARCADOR MAS PROBABLE: {HOME_TEAM} vs {AWAY_TEAM} (22 jun)')
print('='*58)
print(f'  MCMC bayesiano:  {HOME_TEAM} {m1[0]}-{m1[1]} {AWAY_TEAM}   ({m1[2]:.1f}%)')
print(f'  XGBoost:         {HOME_TEAM} {m2[0]}-{m2[1]} {AWAY_TEAM}   ({m2[2]:.1f}%)')
print(f'\n  Accuracy fuera de muestra (n={n_test}):')
for k,a,rr in summary:
    print(f'    {k:<18} accuracy {a:.1f}%   RPS {rr:.4f}')
print(f'\n  Repositorio de datos: {REPO}')
print('='*58)
print('\nDISCLAIMER: el futbol tiene aleatoriedad irreducible.')
print('Ejercicio academico, no una recomendacion de apuesta.')