import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchById, flagUrl, DAYS } from '../config/matches';
import { jsPDF } from 'jspdf';

const loadImageAsBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataURL = canvas.toDataURL('image/png');
      resolve(dataURL);
    };
    img.onerror = (err) => {
      console.error("Error loading image for PDF:", url, err);
      resolve(null);
    };
    img.src = url;
  });
};


function GraphImage({ src, alt }) {
  if (!src) return (<div className="graph-placeholder">Gráfica pendiente — coloca el PNG en <code>public/graphs/</code> y actualiza <code>matches.js</code></div>);
  return <img src={src} alt={alt} style={{width:'100%',borderRadius:'var(--radius-md)'}} />;
}

function Top3ScoresBanner({ prediction, home, away }) {
  if (!prediction || !prediction.top3_scores) return null;
  const top3 = prediction.top3_scores;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.3)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(8px)',
      borderRadius: '12px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      color: '#fff',
      borderLeft: '5px solid #f59e0b'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem' }}>📊</span>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>
            Top 3 Marcadores Promediados (Ensemble)
          </span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '500' }}>
          Promedio de 5 IAs
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.6rem' }}>
        {top3.map((item, idx) => {
          const scores = item.score.split('-');
          const goalsHome = parseInt(scores[0]);
          const goalsAway = parseInt(scores[1]);
          
          let badgeText = "Empate";
          let badgeBg = 'rgba(148, 163, 184, 0.15)';
          let badgeColor = '#cbd5e1';
          
          if (goalsHome > goalsAway) {
            badgeText = `Gana ${home}`;
            badgeBg = 'rgba(59, 130, 246, 0.18)';
            badgeColor = '#60a5fa';
          } else if (goalsAway > goalsHome) {
            badgeText = `Gana ${away}`;
            badgeBg = 'rgba(239, 68, 68, 0.18)';
            badgeColor = '#f87171';
          }

          const borderHighlight = idx === 0 ? '1px solid rgba(245, 158, 11, 0.45)' : (idx === 1 ? '1px solid rgba(203, 213, 225, 0.3)' : '1px solid rgba(180, 83, 9, 0.3)');
          const positionLabel = idx === 0 ? '🥇 1er Marcador' : (idx === 1 ? '🥈 2do Marcador' : '🥉 3er Marcador');
          const medalColor = idx === 0 ? '#f59e0b' : (idx === 1 ? '#94a3b8' : '#b45309');

          return (
            <div key={idx} style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: borderHighlight,
              borderRadius: '8px',
              padding: '0.75rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '3px', background: medalColor }}></div>
              <div style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {positionLabel}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff', margin: '0.2rem 0', letterSpacing: '0.05em' }}>
                {item.score}
              </div>
              <div style={{ fontSize: '0.72rem', padding: '0.25rem 0.4rem', borderRadius: '4px', background: badgeBg, color: badgeColor, fontWeight: 'bold', margin: '0.4rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {badgeText}
              </div>
              <div style={{ marginTop: '0.3rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>{item.prob.toFixed(1)}%</div>
                <div style={{ width: '100%', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(100, item.prob * 5.5)}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', borderRadius: '2px' }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SafeBetBanner({ prediction, home, away }) {
  if (!prediction) return null;

  const { home: pH, draw: pD, away: pA } = prediction;
  let suggestion = null;
  let prob = 0;

  if (pH > 0.65) { suggestion = `Gana ${home}`; prob = pH; }
  else if (pA > 0.65) { suggestion = `Gana ${away}`; prob = pA; }
  else if (pH + pD > 0.85) { suggestion = `Doble Oportunidad: ${home} o Empate`; prob = pH + pD; }
  else if (pA + pD > 0.85) { suggestion = `Doble Oportunidad: ${away} o Empate`; prob = pA + pD; }

  if (!suggestion) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg, rgba(46, 204, 113, 0.15) 0%, rgba(39, 174, 96, 0.05) 100%)',
      border: '1px solid #2ecc71',
      borderRadius: '8px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1.2rem'
    }}>
      <div style={{ fontSize: '2.2rem' }}>💎</div>
      <div>
        <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sugerencia de Apuesta de Valor (IA)
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.4' }}>
          El modelo Ensemble detecta una ventaja matemática significativa: 
          <strong style={{ color: '#fff', marginLeft: '0.4rem', fontSize: '1rem' }}>{suggestion} ({(prob * 100).toFixed(1)}%)</strong>
        </div>
      </div>
    </div>
  );
}

function StatsAndFormPanel({ prediction, home, away }) {
  if (!prediction) return null;

  // Obtener doble oportunidad más probable (resultados menos improbables)
  const getTop2Outcomes = () => {
    const { home: pH, draw: pD, away: pA } = prediction;
    const outcomes = [
      { label: `Gana ${home}`, prob: pH, code: '1' },
      { label: 'Empate', prob: pD, code: 'X' },
      { label: `Gana ${away}`, prob: pA, code: '2' }
    ];
    outcomes.sort((a, b) => b.prob - a.prob);
    
    const combinedProb = outcomes[0].prob + outcomes[1].prob;
    let label = "";
    if (outcomes[0].code !== 'X' && outcomes[1].code !== 'X') {
      label = `${home} o ${away}`;
    } else if (outcomes[0].code === '1' || outcomes[1].code === '1') {
      label = `${home} o Empate`;
    } else {
      label = `${away} o Empate`;
    }
    
    return { label, prob: combinedProb };
  };

  const doubleChance = getTop2Outcomes();

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      {/* Panel Form y Goles Promedio */}
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚽ Goles Promedio e Historial
        </h3>
        
        {/* xG Esperados */}
        {prediction.exp_goles_home !== undefined && (
          <div style={{ marginBottom: '1.2rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Goles Esperados Promedio (xG Ensemble)
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
              <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{home}:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1rem' }}>
                {prediction.exp_goles_home.toFixed(2)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.2rem' }}>
              <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.9rem' }}>{away}:</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#f59e0b', fontSize: '1.1rem' }}>
                {prediction.exp_goles_away.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Historial Form Goles */}
        {prediction.home_form_gf !== undefined && (
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Rendimiento Goles (Últimos 5 partidos)
            </span>
            <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{home}:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  A favor: <strong>{prediction.home_form_gf.toFixed(1)}</strong> | En contra: <strong>{prediction.home_form_ga.toFixed(1)}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{away}:</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  A favor: <strong>{prediction.away_form_gf.toFixed(1)}</strong> | En contra: <strong>{prediction.away_form_ga.toFixed(1)}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panel Menos Improbables */}
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🛡️ Resultados Menos Improbables
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '1rem' }}>
            Combinación de las dos opciones de resultado directo con mayor probabilidad acumulada del modelo Ensemble (cobertura matemática).
          </p>
        </div>
        
        {doubleChance && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
              Doble Oportunidad Recomendada
            </span>
            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.1rem', display: 'block' }}>
              {doubleChance.label}
            </span>
            <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', display: 'block', marginTop: '0.3rem' }}>
              {(doubleChance.prob * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function OverUnderPanel({ prediction }) {
  if (!prediction) return null;

  const lines = [
    { label: 'Línea de 1.5 Goles', over: prediction.over15, under: prediction.under15, type: '1.5' },
    { label: 'Línea de 2.5 Goles', over: prediction.over25, under: prediction.under25, type: '2.5' },
    { label: 'Línea de 3.5 Goles', over: prediction.over35, under: prediction.under35, type: '3.5' }
  ];

  if (prediction.over25 === undefined) return null;

  return (
    <div className="card" style={{ padding: '1.5rem 2rem', background: 'rgba(30, 41, 59, 0.4)', height: '100%', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Mercado de Goles (Over / Under)
      </h3>
      
      <div style={{ display: 'grid', gap: '1.2rem' }}>
        {lines.map((line, idx) => {
          const overPct = line.over * 100;
          const underPct = line.under * 100;
          
          return (
            <div key={idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#fff' }}>
                <span>{line.label}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Umbral {line.type} goles</span>
              </div>
              
              {/* Progress bar split */}
              <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                {/* Over label */}
                <span style={{ fontSize: '0.75rem', width: '70px', color: '#f59e0b', fontWeight: 'bold' }}>
                  +{line.type} ({overPct.toFixed(1)}%)
                </span>
                
                {/* Visual split progress bar */}
                <div style={{
                  flex: 1,
                  height: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '5px',
                  overflow: 'hidden',
                  display: 'flex'
                }}>
                  <div style={{
                    width: `${overPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)'
                  }}></div>
                  <div style={{
                    width: `${underPct}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)'
                  }}></div>
                </div>
                
                {/* Under label */}
                <span style={{ fontSize: '0.75rem', width: '70px', textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>
                  -{line.type} ({underPct.toFixed(1)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeibullSummaryPanel({ prediction }) {
  if (!prediction) return null;

  return (
    <div className="card" style={{ padding: '1.5rem 2rem', background: 'rgba(30, 41, 59, 0.4)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⏱️ Línea de Tiempo (Weibull)
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.3', marginBottom: '1.25rem' }}>
          Expectativa de goles minuto a minuto considerando fatiga física, pausas de hidratación y ajustes tácticos (DT).
        </p>
      </div>
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '180px' }}>
        {prediction.timeline_file ? (
          <>
            <img 
              src={prediction.timeline_file} 
              alt="Línea de tiempo Weibull" 
              style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} 
            />
            {prediction.weibull_analysis?.top_halftime_scores && (
              <div style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box', textAlign: 'center' }}>
                ⏱️ <strong>Medio Tiempo Proyectado:</strong> {prediction.weibull_analysis.top_halftime_scores[0].score} ({prediction.weibull_analysis.top_halftime_scores[0].prob}%)
              </div>
            )}
          </>
        ) : (
          <div className="graph-placeholder" style={{ padding: '2rem 1rem', fontSize: '0.8rem' }}>
            Simulación temporal no disponible.
          </div>
        )}
      </div>
    </div>
  );
}

function KnockoutAdvancePanel({ prediction, match, home, away }) {
  if (!prediction || match.day !== 'dieciseisavos') return null;

  const pH = prediction.home;
  const pD = prediction.draw;
  const pA = prediction.away;
  const eloH = prediction.home_elo || 1500;
  const eloA = prediction.away_elo || 1500;

  // Calculate ELO win expectancy as a fallback
  const wHome = 1.0 / (1.0 + Math.pow(10, (eloA - eloH) / 400.0));
  
  // Utilizar la simulación Beta-Binomial si está disponible en predictions.json
  const shootoutHome = prediction.shootout_home !== undefined ? prediction.shootout_home : wHome;
  const shootoutAway = prediction.shootout_away !== undefined ? prediction.shootout_away : (1.0 - wHome);

  // Cargar desgloses condicionales de prórroga y penales (simulados)
  const probEtH = prediction.prob_et_home !== undefined ? prediction.prob_et_home : 0.0;
  const probEtA = prediction.prob_et_away !== undefined ? prediction.prob_et_away : 0.0;
  const probPkH = prediction.prob_pk_home !== undefined ? prediction.prob_pk_home : shootoutHome;
  const probPkA = prediction.prob_pk_away !== undefined ? prediction.prob_pk_away : shootoutAway;

  // Probabilidad final de avanzar acumulada
  const homeAdv = (pH + pD * (probEtH + probPkH)) * 100;
  const awayAdv = (pA + pD * (probEtA + probPkA)) * 100;

  return (
    <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.01) 100%)', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
      <h3 style={{ fontSize: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        🏆 Probabilidad de Clasificación (Eliminatoria Directa)
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
        En fase de eliminación directa no hay empates. Si empatan en los 90', la probabilidad de avanzar se calcula combinando la <strong>simulación de prórroga de 30' (Poisson)</strong> y la <strong>tanda de penaltis (Beta-Binomial)</strong> estocástica de 10,000 iteraciones (Ratings ELO: {Math.round(eloH)} vs {Math.round(eloA)}).
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', width: '120px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {home}
        </span>
        <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex', position: 'relative' }}>
          <div style={{ width: `${homeAdv}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold', zIndex: 2 }}>{homeAdv.toFixed(1)}%</span>
          </div>
          <div style={{ width: `${awayAdv}%`, height: '100%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.75rem', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 'bold', zIndex: 2 }}>{awayAdv.toFixed(1)}%</span>
          </div>
        </div>
        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', width: '120px', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {away}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Tiempo Regular (90'):</strong></span>
          <span>{home}: <span style={{color:'#f59e0b',fontWeight:'bold'}}>{(pH*100).toFixed(0)}%</span> | {away}: <span style={{color:'#3b82f6',fontWeight:'bold'}}>{(pA*100).toFixed(0)}%</span> | Empate: <span style={{color:'#cbd5e1',fontWeight:'bold'}}>{(pD*100).toFixed(0)}%</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Tiempo Extra (Prórroga 30'):</strong></span>
          <span>{home}: <span style={{color:'#f59e0b',fontWeight:'bold'}}>{(pD * probEtH * 100).toFixed(1)}%</span> | {away}: <span style={{color:'#3b82f6',fontWeight:'bold'}}>{(pD * probEtA * 100).toFixed(1)}%</span></span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><strong>Tanda de Penaltis (Beta-Binomial):</strong></span>
          <span>{home}: <span style={{color:'#f59e0b',fontWeight:'bold'}}>{(pD * probPkH * 100).toFixed(1)}%</span> | {away}: <span style={{color:'#3b82f6',fontWeight:'bold'}}>{(pD * probPkA * 100).toFixed(1)}%</span></span>
        </div>
      </div>
      
      {Math.abs(homeAdv - awayAdv) <= 10.0 && (
        <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.82rem', lineHeight: '1.5' }}>
          <strong>⚠️ Alerta de Paridad Extrema (Coin Toss):</strong> La diferencia de clasificación es menor al 10%. El Ensamble de IA detecta un duelo matemáticamente muy cerrado. Una ventaja tan ligera (ej. 51% a 49%) no garantiza ningún dominio claro; el partido tiene altísima probabilidad de decidirse por detalles mínimos, estado anímico, o en la ruleta de los penales. ¡Mucha cautela al interpretar este favoritismo!
        </div>
      )}
    </div>
  );
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const match = getMatchById(matchId);
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'timeline', 'models', 'accuracy'
  const [selectedModel, setSelectedModel] = useState('ensemble'); // 'ensemble', 'dixoncoles', 'dcnb', 'xgboost', 'catboost', 'mlp', 'mfa', 'mcmc'
  
  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => {
        if (data && data[matchId]) {
          setPrediction(data[matchId]);
        }
      })
      .catch(e => console.error("Error loading predictions", e));
  }, [matchId]);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const docWidth = doc.internal.pageSize.getWidth();
      const docHeight = doc.internal.pageSize.getHeight();
      
      const primaryColor = [15, 23, 42]; // Slate 900
      const accentColor = [245, 158, 11]; // Amber 500
      const textColor = [51, 65, 85]; // Slate 700
      const slateLight = [248, 250, 252]; // Slate 50
      const borderLight = [226, 232, 240]; // Slate 200
      
      // Helper para dibujar barra de acento naranja al lado de títulos
      const drawAccentBar = (currentY) => {
        doc.setFillColor(...accentColor);
        doc.rect(15, currentY - 4.5, 3.5, 6, 'F');
      };
      
      // Helper para dibujar un recuadro con fondo gris suave
      const drawCardBackground = (currentY, height) => {
        doc.setFillColor(...slateLight);
        doc.setDrawColor(...borderLight);
        doc.rect(15, currentY, docWidth - 30, height, 'FD');
      };
      
      // ==========================================
      // PAGINA 1: CABECERA Y CONSENSO GENERAL
      // ==========================================
      
      // Cabecera Principal (Banner Oscuro)
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, docWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('COPA MUNDIAL FIFA 2026 - REPORTE DE PREDICCION ML', 15, 15);
      
      doc.setFontSize(22);
      doc.text(`${match.home.toUpperCase()} vs ${match.away.toUpperCase()}`, 15, 27);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.text(`${day?.full || ''} | ${match.time || ''} | ${match.venue || ''} | ${match.group || ''}`, 15, 34);
      
      doc.setFillColor(...accentColor);
      doc.rect(0, 40, docWidth, 3, 'F');
      
      let y = 53;
      
      // Sección 1: Análisis de Clasificación y Consenso
      drawAccentBar(y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('1. ANALISIS DE CLASIFICACION Y CONSENSO', 21, y);
      doc.setDrawColor(...borderLight);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 10;
      
      // Datos de clasificación calculados
      const pH = prediction.home || 0.33;
      const pD = prediction.draw || 0.33;
      const pA = prediction.away || 0.33;
      
      const eloH = prediction.home_elo || 1500;
      const eloA = prediction.away_elo || 1500;
      const wHome = 1.0 / (1.0 + Math.pow(10, (eloA - eloH) / 400.0));
      
      const shootoutHome = prediction.shootout_home !== undefined ? prediction.shootout_home : wHome;
      const shootoutAway = prediction.shootout_away !== undefined ? prediction.shootout_away : (1.0 - wHome);
      
      const probEtH = prediction.prob_et_home !== undefined ? prediction.prob_et_home : 0.0;
      const probEtA = prediction.prob_et_away !== undefined ? prediction.prob_et_away : 0.0;
      const probPkH = prediction.prob_pk_home !== undefined ? prediction.prob_pk_home : shootoutHome;
      const probPkA = prediction.prob_pk_away !== undefined ? prediction.prob_pk_away : shootoutAway;
      
      const homeAdv = (pH + pD * (probEtH + probPkH)) * 100;
      const awayAdv = (pA + pD * (probEtA + probPkA)) * 100;
      
      // Recuadro de probabilidad detallada
      drawCardBackground(y - 2, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...textColor);
      
      doc.text(`Probabilidad Tiempo Regular (90'):`, 18, y + 3.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${match.home}: ${(pH*100).toFixed(0)}%  |  ${match.away}: ${(pA*100).toFixed(0)}%  |  Empate: ${(pD*100).toFixed(0)}%`, 88, y + 3.5);
      
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.text(`Desglose Extra Time (Proroga 30'):`, 18, y + 3.5);
      doc.text(`${match.home}: ${(pD * probEtH * 100).toFixed(1)}%  |  ${match.away}: ${(pD * probEtA * 100).toFixed(1)}%`, 88, y + 3.5);
      
      y += 6;
      doc.text(`Tanda de Penaltis (Beta-Binomial):`, 18, y + 3.5);
      doc.text(`${match.home}: ${(pD * probPkH * 100).toFixed(1)}%  |  ${match.away}: ${(pD * probPkA * 100).toFixed(1)}%`, 88, y + 3.5);
      
      y += 12;
      // Fila destacada de clasificación final
      doc.setFillColor(254, 243, 199); // Amber 100
      doc.setDrawColor(251, 191, 36); // Amber 400
      doc.rect(15, y - 4, docWidth - 30, 7.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`EXPECTATIVA FINAL DE CLASIFICACION:`, 18, y + 1);
      doc.setTextColor(...accentColor);
      doc.text(`${match.home}: ${homeAdv.toFixed(1)}%  vs  ${match.away}: ${awayAdv.toFixed(1)}%`, 95, y + 1);
      
      y += 7;
      // Nueva fila destacada de ELO de Fuerza
      doc.setFillColor(...slateLight);
      doc.setDrawColor(...borderLight);
      doc.rect(15, y - 4, docWidth - 30, 6.5, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text(`Rating ELO de Fuerza de los Equipos:`, 18, y + 0.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`${match.home}: ${Math.round(eloH)} ELO  |  ${match.away}: ${Math.round(eloA)} ELO (Dif: ${Math.abs(Math.round(eloH) - Math.round(eloA))} pts)`, 85, y + 0.5);
      
      // Alerta de paridad extrema si aplica
      if (Math.abs(homeAdv - awayAdv) <= 10.0) {
        y += 9;
        doc.setFillColor(254, 242, 242); // Red 50
        doc.setDrawColor(248, 113, 113); // Red 400
        doc.rect(15, y - 4, docWidth - 30, 11.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red 600
        doc.text(`ALERTA DE PARIDAD EXTREMA:`, 18, y);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(127, 29, 29); // Red 900
        doc.text(`La diferencia de clasificacion es menor al 10%. El Ensamble detecta un duelo matematicamente muy cerrado.`, 18, y + 4.5);
        doc.text(`Se recomienda mucha cautela, ya que el partido tiene alta probabilidad de decidirse por detalles minimos.`, 18, y + 8);
        y += 5;
      }
      
      y += 9;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...textColor);
      if (prediction.top3_scores && prediction.top3_scores.length > 0) {
        const top3Text = prediction.top3_scores.map(s => `${s.score} (${s.prob}%)`).join(', ');
        doc.text(`Top 3 Marcadores mas probables (Ensemble):  ${top3Text}`, 15, y);
        y += 6;
      }
      
      let recommendedBet = 'Doble Oportunidad: Local o Empate';
      let valueProb = ((pH + pD) * 100).toFixed(1);
      if (pA + pD > pH + pD) {
        recommendedBet = 'Doble Oportunidad: Empate o Visitante';
        valueProb = ((pA + pD) * 100).toFixed(1);
      }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...accentColor);
      doc.text(`Apuesta Recomendada (IA):  ${recommendedBet} (${valueProb}%)`, 15, y);
      doc.setTextColor(...textColor);
      
      y += 10;
      
      // Bloque de Rendimiento Reciente (Racha de goles)
      drawCardBackground(y - 2, 17);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('Rendimiento Reciente y Goles (Ultimos 5 partidos):', 18, y + 3.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textColor);
      doc.text(`${match.home}:  A favor: ${prediction.home_form_gf.toFixed(1)}  |  En contra: ${prediction.home_form_ga.toFixed(1)}`, 18, y + 10);
      doc.text(`${match.away}:  A favor: ${prediction.away_form_gf.toFixed(1)}  |  En contra: ${prediction.away_form_ga.toFixed(1)}`, 110, y + 10);
      
      y += 24;
      
      // Sección 2: Consenso Comparativo de Modelos
      drawAccentBar(y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('2. CONSENSO COMPARATIVO DE MODELOS (90 MINUTOS)', 21, y);
      doc.setDrawColor(...borderLight);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 6;
      
      if (match.graphs && match.graphs.Resumen) {
        const resumenImg = await loadImageAsBase64(match.graphs.Resumen);
        if (resumenImg) {
          const imgWidth = docWidth - 30; // 180mm
          const imgHeight = 72; // 72mm
          doc.addImage(resumenImg, 'PNG', 15, y, imgWidth, imgHeight);
          doc.setDrawColor(...borderLight);
          doc.rect(15, y, imgWidth, imgHeight, 'S'); // Borde sutil alrededor
        }
      }
      
      // Pie de pagina 1
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado por Ensemble ML Engine por Antig.', 15, docHeight - 10);
      doc.text('Pagina 1 de 4', docWidth - 30, docHeight - 10);
      
      // ==========================================
      // PAGINA 2: DESGLOSE DE MATRICES (PARTE 1)
      // ==========================================
      doc.addPage();
      y = 15;
      
      // Mini Cabecera
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, docWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`DESGLOSE DE MATRICES Y DISTRIBUCION (PARTE 1) | ${match.home.toUpperCase()} VS ${match.away.toUpperCase()}`, 15, 8);
      
      y = 23;
      drawAccentBar(y);
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('3. DESGLOSE DE MATRICES Y DISTRIBUCION DE GOLES', 21, y);
      doc.setDrawColor(...borderLight);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...primaryColor);
      doc.text('A) Ensemble Ponderado (Consenso General)', 15, y);
      y += 4;
      
      if (match.graphs && match.graphs.ensemble) {
        const ensembleImg = await loadImageAsBase64(match.graphs.ensemble);
        if (ensembleImg) {
          const imgWidth = docWidth - 30; // 180mm
          const imgHeight = 72; // 72mm
          doc.addImage(ensembleImg, 'PNG', 15, y, imgWidth, imgHeight);
          doc.setDrawColor(...borderLight);
          doc.rect(15, y, imgWidth, imgHeight, 'S');
          y += imgHeight + 9;
        }
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...primaryColor);
      
      let dcWeight = 'Dixon-Coles NB (Modelo Base Principal - Peso: 66.20% - 84.35%)';
      if (match.id === 'mex-ecu') {
        dcWeight = 'B) Modelo Base 1: Dixon-Coles NB (Poder de Ataque/Defensa - Peso: 83.35%)';
      } else if (match.id === 'ger-par') {
        dcWeight = 'B) Modelo Base 1: Dixon-Coles NB (Poder de Ataque/Defensa - Peso: 66.20%)';
      } else if (match.id === 'bra-jpn') {
        dcWeight = 'B) Modelo Base 1: Dixon-Coles NB (Poder de Ataque/Defensa - Peso: 84.35%)';
      }
      
      doc.text(dcWeight, 15, y);
      y += 4;
      
      if (match.graphs && match.graphs.dixoncoles) {
        const dcImg = await loadImageAsBase64(match.graphs.dixoncoles);
        if (dcImg) {
          const imgWidth = docWidth - 30; // 180mm
          const imgHeight = 72; // 72mm
          doc.addImage(dcImg, 'PNG', 15, y, imgWidth, imgHeight);
          doc.setDrawColor(...borderLight);
          doc.rect(15, y, imgWidth, imgHeight, 'S');
        }
      }
      
      // Pie de pagina 2
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado por Ensemble ML Engine por Antig.', 15, docHeight - 10);
      doc.text('Pagina 2 de 4', docWidth - 30, docHeight - 10);
      
      // ==========================================
      // PAGINA 3: DESGLOSE DE MATRICES (PARTE 2)
      // ==========================================
      doc.addPage();
      y = 15;
      
      // Mini Cabecera
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, docWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`DESGLOSE DE MATRICES Y DISTRIBUCION (PARTE 2) | ${match.home.toUpperCase()} VS ${match.away.toUpperCase()}`, 15, 8);
      
      y = 23;
      drawAccentBar(y);
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('3. DESGLOSE DE MATRICES (CONTINUACION)', 21, y);
      doc.setDrawColor(...borderLight);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...primaryColor);
      
      let xgbWeight = 'C) Modelo Base 2: XGBoost (Machine Learning - Peso: 15.65% - 33.80%)';
      if (match.id === 'mex-ecu') {
        xgbWeight = 'C) Modelo Base 2: XGBoost (Machine Learning - Peso: 16.65%)';
      } else if (match.id === 'ger-par') {
        xgbWeight = 'C) Modelo Base 2: XGBoost (Machine Learning - Peso: 33.80%)';
      } else if (match.id === 'bra-jpn') {
        xgbWeight = 'C) Modelo Base 2: XGBoost (Machine Learning - Peso: 15.65%)';
      }
      
      doc.text(xgbWeight, 15, y);
      y += 4;
      
      if (match.graphs && match.graphs.xgboost) {
        const xgbImg = await loadImageAsBase64(match.graphs.xgboost);
        if (xgbImg) {
          const imgWidth = docWidth - 30; // 180mm
          const imgHeight = 72; // 72mm
          doc.addImage(xgbImg, 'PNG', 15, y, imgWidth, imgHeight);
          doc.setDrawColor(...borderLight);
          doc.rect(15, y, imgWidth, imgHeight, 'S');
          y += imgHeight + 9;
        }
      }
      
      // Explicación técnica de la influencia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('D) Analisis Comparativo del Consenso:', 15, y);
      y += 5;
      
      drawCardBackground(y - 2, 24);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...textColor);
      
      let explanationText = '';
      if (match.id === 'mex-ecu') {
        explanationText = 'El Ensemble Ponderado esta fuertemente influenciado en un 83.35% por el modelo Dixon-Coles NB, debido a su precision en el historico de goles. Sin embargo, para capturar tendencias no lineales, la IA incorpora un 16.65% del modelo XGBoost. Al contrastar ambas matrices, se observa como XGBoost distribuye de forma mas conservadora la probabilidad en empates con pocos goles (0-0 y 1-1), mientras que Dixon-Coles NB estima mayor probabilidad de marcadores con ventaja para el local.';
      } else if (match.id === 'ger-par') {
        explanationText = 'El Ensemble Ponderado combina de manera equilibrada el modelo Dixon-Coles NB (66.20%) y XGBoost (33.80%). Esto permite compensar el sesgo de Poisson en marcadores extremos y ponderar mejor la consistencia defensiva de Paraguay. La matriz de XGBoost muestra una distribucion de goles mas dispersa en comparacion con Dixon-Coles NB, lo que genera un consenso que suaviza la expectativa y eleva la probabilidad de la linea de mas de 2.5 goles.';
      } else {
        explanationText = 'El optimizador SLSQP calibra los modelos basándose en el menor error RPS de la validacion. La combinacion de Dixon-Coles NB (principal) y XGBoost (secundario) permite capturar tanto el rendimiento estocastico historico como las rachas recientes de goles, logrando una precision global superior al 70%.';
      }
      
      // Dividir el texto en lineas para que quepa en el recuadro
      const lines = doc.splitTextToSize(explanationText, docWidth - 38);
      doc.text(lines, 18, y + 3.5);
      
      // Pie de pagina 3
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado por Ensemble ML Engine por Antig.', 15, docHeight - 10);
      doc.text('Pagina 3 de 4', docWidth - 30, docHeight - 10);
      
      // ==========================================
      // PAGINA 4: WEIBULL Y RECOMENDACIONES
      // ==========================================
      doc.addPage();
      y = 15;
      
      // Mini Cabecera
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, docWidth, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`ANALISIS TEMPORAL WEIBULL Y APUESTAS | ${match.home.toUpperCase()} VS ${match.away.toUpperCase()}`, 15, 8);
      
      y = 23;
      drawAccentBar(y);
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('4. ANALISIS TEMPORAL Y EXPECTATIVA (WEIBULL)', 21, y);
      doc.setDrawColor(...borderLight);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 8;
      
      // Datos Weibull detallados en una franja gris
      drawCardBackground(y - 2, 27);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...textColor);
      
      const expGHome = prediction.exp_goles_home || 0.0;
      const expGAway = prediction.exp_goles_away || 0.0;
      
      doc.text(`Goles Esperados Promedio (xG):  ${match.home}: ${expGHome.toFixed(2)} | ${match.away}: ${expGAway.toFixed(2)} (Total: ${(expGHome+expGAway).toFixed(2)})`, 18, y + 3.5);
      y += 6;
      doc.text(`Mercado Over/Under:  +1.5 Goles: ${(prediction.over15*100).toFixed(0)}% | +2.5 Goles: ${(prediction.over25*100).toFixed(0)}% | +3.5 Goles: ${(prediction.over35*100).toFixed(0)}%`, 18, y + 3.5);
      y += 6;
      
      if (prediction.weibull_analysis) {
        const wa = prediction.weibull_analysis;
        doc.text(`Expectativa de Minuto Primer Gol: Minuto ${wa.avg_first_goal_minute}'`, 18, y + 3.5);
        y += 6;
        doc.text(`Probabilidad de Gol por Período: Gol en el 1er Tiempo (1T): ${wa.prob_goals_1t.toFixed(0)}% | Gol en el 2do Tiempo (2T): ${wa.prob_goals_2t.toFixed(0)}%`, 18, y + 3.5);
        y += 6;
        if (wa.top_halftime_scores && wa.top_halftime_scores.length > 0) {
          const htText = wa.top_halftime_scores.map(s => `${s.score} (${s.prob}%)`).join(', ');
          doc.text(`Top 3 Marcadores al Medio Tiempo Proyectados (45'): ${htText}`, 18, y + 3.5);
        }
      }
      
      y += 16;
      
      if (prediction.timeline_file) {
        const timelineImg = await loadImageAsBase64(prediction.timeline_file);
        if (timelineImg) {
          const imgWidth = docWidth - 40; // 170mm
          const imgHeight = 65; // 65mm
          doc.addImage(timelineImg, 'PNG', 20, y, imgWidth, imgHeight);
          doc.setDrawColor(...borderLight);
          doc.rect(20, y, imgWidth, imgHeight, 'S');
          y += imgHeight + 9;
        }
      }
      
      // Sección 5: Recomendaciones y Parlay
      drawAccentBar(y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('5. RECOMENDACIONES DE PARLAY DEL DIA (IA)', 21, y);
      doc.line(15, y + 2.5, docWidth - 15, y + 2.5);
      
      y += 7;
      
      doc.setFillColor(...slateLight);
      doc.setDrawColor(...accentColor);
      doc.rect(15, y, docWidth - 30, 22, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...primaryColor);
      doc.text('APUESTA Y PARLAY RECOMENDADO POR NUESTRA IA:', 20, y + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...textColor);
      
      let parlayText = '';
      if (match.id === 'ger-par') {
        parlayText = 'Alemania vs Paraguay (Mas de 2.5 Goles | -140) + Paises Bajos vs Marruecos (Marruecos se clasifica | +120) = Momio +277';
      } else if (match.id === 'ned-mar') {
        parlayText = 'Paises Bajos vs Marruecos (Marruecos se clasifica | +120) + Alemania vs Paraguay (Mas de 2.5 Goles | -140) = Momio +277';
      } else {
        parlayText = 'Combina el "Mas de 2.5 Goles" o la "Clasificacion Directa" del favorito de hoy con el pase de Argentina en Cuartos para asegurar bonificaciones.';
      }
      
      doc.text(parlayText, 20, y + 13);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text('Nota: Recuerda que las eliminatorias directas pueden resolverse en prorroga o penales. El parlay tiene mayor valor de cuota combinada.', 20, y + 18);
      
      // Pie de pagina 4
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado por Ensemble ML Engine por Antig.', 15, docHeight - 10);
      doc.text('Pagina 4 de 4', docWidth - 30, docHeight - 10);
      
      doc.save(`reporte-${match.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!match) return (<div className="card" style={{textAlign:'center',padding:'3rem'}}><h2>Partido no encontrado</h2><Link to="/" className="btn btn-outline" style={{marginTop:'1rem'}}>Volver al inicio</Link></div>);
  
  const day = DAYS.find(d => d.id === match.day);
  
  return (<div>
    <div className="ficha" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <div style={{fontSize:'0.78rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>Ficha técnica</div>
        {prediction && (
          <button 
            className="btn btn-outline" 
            style={{ 
              fontSize: '0.75rem', 
              padding: '0.3rem 0.6rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            onClick={downloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? '⏳ Generando...' : '📥 Descargar PDF'}
          </button>
        )}
      </div>
      <div className="flags-big">
        <div style={{textAlign:'center'}}><img src={flagUrl(match.homeCode)} alt={match.home} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.home}</div></div>
        <span className="vs-big">VS</span>
        <div style={{textAlign:'center'}}><img src={flagUrl(match.awayCode)} alt={match.away} /><div style={{fontFamily:'var(--font-display)',marginTop:'0.5rem',fontSize:'1.1rem',textTransform:'uppercase',color:'#fff'}}>{match.away}</div></div>
      </div>
      <div className="detail-row"><span>{day?.full}</span><span>{match.time}</span><span>{match.venue}</span><span>{match.group}</span></div>
    </div>
    
    <Top3ScoresBanner prediction={prediction} home={match.home} away={match.away} />
    <SafeBetBanner prediction={prediction} home={match.home} away={match.away} />
    <KnockoutAdvancePanel prediction={prediction} match={match} home={match.home} away={match.away} />
    
    {/* Selector de Pestañas */}
    <div className="day-tabs" style={{ marginBottom: '2rem' }}>
      <button className={`day-tab ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
        📋 Resumen y Consenso
      </button>
      <button className={`day-tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
        ⏱️ Línea de Tiempo (Weibull)
      </button>
      <button className={`day-tab ${activeTab === 'models' ? 'active' : ''}`} onClick={() => setActiveTab('models')}>
        🔬 Detalle de Modelos
      </button>
      <button className={`day-tab ${activeTab === 'accuracy' ? 'active' : ''}`} onClick={() => setActiveTab('accuracy')}>
        📊 Validación Científica
      </button>
    </div>

    {/* CONTENIDO DE PESTAÑAS */}
    {activeTab === 'summary' && (
      <div>
        <StatsAndFormPanel prediction={prediction} home={match.home} away={match.away} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <OverUnderPanel prediction={prediction} />
          <WeibullSummaryPanel prediction={prediction} />
        </div>
        
        <div className="graph-section">
          <h2>Consenso Comparativo de Modelos</h2>
          <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}>
            Comparación directa de las probabilidades asignadas por cada modelo al resultado del partido en los 90 minutos reglamentarios.
          </p>
          <GraphImage src={match.graphs.Resumen} alt={`Resumen comparativo ${match.home} vs ${match.away}`} />
        </div>
      </div>
    )}

    {activeTab === 'timeline' && (
      <div className="graph-section" style={{ borderLeft: '4px solid var(--orange)' }}>
        <h2>Evolución Temporal (Expectativa Weibull)</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1rem'}}>
          Simulación dinámica minuto a minuto de la expectativa acumulada de goles. Incorpora <strong>pausas de hidratación</strong> a los minutos 30' y 75' (donde la intensidad de gol cae a cero) y el <strong>Efecto DT</strong> (ajustes tácticos defensivos automáticos de los entrenadores cuando van perdiendo).
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {prediction?.timeline_file ? (
            <GraphImage src={prediction.timeline_file} alt={`Línea de tiempo Weibull ${match.home} vs ${match.away}`} />
          ) : (
            <div className="graph-placeholder">Simulación de línea de tiempo no disponible para este partido.</div>
          )}
          
          {prediction?.weibull_analysis && (
            <div className="card" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxSizing: 'border-box' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Análisis de Tiempos y Goles
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expectativa de Primer Gol:</span>
                  <div style={{ fontSize: '1.2rem', color: 'var(--orange)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                    ⏱️ Minuto {prediction.weibull_analysis.avg_first_goal_minute}'
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gol en el 1er Tiempo (1T):</div>
                    <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {prediction.weibull_analysis.prob_goals_1t}%
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gol en el 2do Tiempo (2T):</div>
                    <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginTop: '0.2rem' }}>
                      {prediction.weibull_analysis.prob_goals_2t}%
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                  Resultados al Medio Tiempo Proyectados (45'):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {prediction.weibull_analysis.top_halftime_scores?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: idx === 0 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid transparent' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: idx === 0 ? 'var(--orange)' : '#fff' }}>
                        ⚽ Marcador {item.score}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {item.prob}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', lineHeight: '1.5' }}>
          <strong>🔬 Fundamento Científico del Modelo:</strong>
          <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Fatiga Física (Weibull $k=1.15$):</strong> A diferencia de una Poisson clásica de tasa constante, el proceso de Weibull con $k &gt; 1$ modela que la probabilidad de gol aumenta gradualmente a medida que avanza cada tiempo debido al cansancio acumulado.
            </li>
            <li style={{ marginBottom: '0.4rem' }}>
              <strong>Pausas de Hidratación:</strong> Representan un cese total de juego (refrigerio táctico). En la gráfica se aprecian como mesetas planas alrededor de los minutos 30 y 75.
            </li>
            <li>
              <strong>Recalibración del Coach (DT):</strong> Si un equipo va perdiendo tras una pausa, el entrenador reorganiza marcas y táctica, lo cual reduce la efectividad del ataque rival en un 15% (segundo tiempo) o 25% (cierre desesperado del partido).
            </li>
          </ul>
        </div>
      </div>
    )}

    {activeTab === 'models' && (
      <div className="graph-section" style={{ borderLeft: '4px solid var(--accent)' }}>
        <h2>Análisis Detallado por Algoritmo</h2>
        <p style={{color:'var(--text-secondary)',fontSize:'0.88rem',marginBottom:'1.5rem'}}>
          Inspecciona el desglose de predicción, distribución de goles y simulación de resultados para cada IA individual.
        </p>
        
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {[
            { id: 'ensemble', name: 'Ensemble Ponderado', style: {background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent)', borderColor: 'var(--accent)'} },
            { id: 'dcnb', name: 'Dixon-Coles NB (Binomial Negativa)', style: {background: 'rgba(244, 63, 94, 0.12)', color: '#f43f5e', borderColor: '#f43f5e'} },
            { id: 'dixoncoles', name: 'Dixon-Coles Poisson', style: {background: 'rgba(148, 163, 184, 0.12)', color: '#cbd5e1', borderColor: '#cbd5e1'} },
            { id: 'xgboost', name: 'XGBoost (Pi-Ratings)', style: {background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', borderColor: '#10b981'} },
            { id: 'catboost', name: 'CatBoost', style: {background: 'rgba(236, 72, 153, 0.12)', color: '#ec4899', borderColor: '#ec4899'} },
            { id: 'mlp', name: 'Red Neuronal (MLP)', style: {background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', borderColor: '#8b5cf6'} },
            { id: 'mfa', name: 'MFA Montecarlo', style: {background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', borderColor: '#0ea5e9'} },
            { id: 'mcmc', name: 'MCMC Bayesiano', style: {background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', borderColor: '#3b82f6'} },
          ].map(m => (
            <button 
              key={m.id} 
              className={`btn ${selectedModel === m.id ? 'btn-accent' : 'btn-outline'}`}
              style={{ fontSize: '0.74rem', padding: '0.4rem 0.8rem', borderRadius: '20px', ...(selectedModel === m.id ? {} : m.style) }}
              onClick={() => setSelectedModel(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
        
        {selectedModel === 'ensemble' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>Ensemble Ponderado:</strong> Veredicto final del sistema. Pondera dinámicamente las predicciones individuales usando el optimizador SLSQP basado en la precisión empírica. Actualmente concentrado en <strong>Dixon-Coles NB (83.35%)</strong> y <strong>XGBoost (16.65%)</strong>.
            </p>
            <GraphImage src={match.graphs.ensemble} alt="Ensemble" />
          </div>
        )}
        {selectedModel === 'dixoncoles' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>Dixon-Coles Poisson:</strong> Modelo de regresión Poisson clásico ponderado por tiempo (vida media de 100 días). Modela los goles asumiendo independencia Poisson corregida para empates bajos.
            </p>
            <GraphImage src={match.graphs.dixoncoles} alt="Dixon-Coles Poisson" />
          </div>
        )}
        {selectedModel === 'dcnb' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>Dixon-Coles NB (Binomial Negativa):</strong> Modela los goles con una distribución binomial negativa para capturar la sobredispersión (varianza mayor que la media). Es el modelo dominante del ensamble actual (83.35%).
            </p>
            <GraphImage src={`/graphs/${match.day}/${match.id}_dcnb.png`} alt="Dixon-Coles NB" />
          </div>
        )}
        {selectedModel === 'xgboost' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>XGBoost:</strong> Modelo de Gradient Boosting. Utiliza Pi-Ratings y ELO para predecir las medias de anotación. Aporta un 16.65% de peso al ensamble.
            </p>
            <GraphImage src={match.graphs.xgboost} alt="XGBoost" />
          </div>
        )}
        {selectedModel === 'catboost' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>CatBoost:</strong> Algoritmo de boosting categórico que trata de forma nativa los nombres de las selecciones y su peso financiero.
            </p>
            <GraphImage src={match.graphs.catboost} alt="CatBoost" />
          </div>
        )}
        {selectedModel === 'mlp' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>Red Neuronal MLP:</strong> Perceptrón multicapa que utiliza regularización L2 para aproximar la no linealidad en el rendimiento de los equipos.
            </p>
            <GraphImage src={match.graphs.mlp} alt="Red Neuronal MLP" />
          </div>
        )}
        {selectedModel === 'mfa' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>MFA Montecarlo:</strong> Simulación de Poisson que utiliza penalizaciones por fatiga física y ratings de plantilla subjetivos.
            </p>
            <GraphImage src={match.graphs.mfa} alt="MFA Montecarlo" />
          </div>
        )}
        {selectedModel === 'mcmc' && (
          <div>
            <p style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'1rem'}}>
              <strong>MCMC Bayesiano:</strong> Muestreador bayesiano (PyMC) que infiere la capacidad ofensiva/defensiva latente de cada selección simulando miles de cadenas estocásticas.
            </p>
            <GraphImage src={match.graphs.mcmc} alt="MCMC Bayesiano" />
          </div>
        )}
      </div>
    )}

    {activeTab === 'accuracy' && (
      <div className="graph-section">
        <h2>Prueba Fuera de Muestra y Calibración Histórica</h2>
        <div style={{color:'var(--text-secondary)',fontSize:'0.9rem',lineHeight:'1.6',marginBottom:'1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)'}}>
          <p style={{marginBottom: '1rem'}}>Esta sección demuestra el <strong>rendimiento empírico</strong> de nuestros algoritmos evaluándolos a ciegas sobre resultados reales ya conocidos del torneo (Fase de Grupos + Eliminatorias).</p>
          <ul style={{paddingLeft: '1.5rem', marginBottom: '1rem'}}>
            <li style={{marginBottom: '0.5rem'}}><strong>Accuracy 1X2 (Panel Izquierdo):</strong> Porcentaje de acierto de victoria local/empate/visita. En fútbol internacional, superar el 60% es de rango profesional. Nuestro Ensamble optimizado ronda actualmente el <strong>69.9%</strong>.</li>
            <li><strong>RPS - Ranked Probability Score (Panel Derecho):</strong> Métrica que castiga la sobreconfianza errónea. Mide qué tan prudentes e impecablemente calibradas están las probabilidades. Valores más bajos indican un modelo estadísticamente superior y más balanceado.</li>
          </ul>
        </div>
        <GraphImage src={match.graphs.accuracy} alt={`Accuracy ${match.home} vs ${match.away}`} />
      </div>
    )}

    <div className="match-disclaimer" style={{ marginTop: '2.5rem' }}><strong>Aviso:</strong> Las predicciones son estimaciones generadas por modelos estadísticos con fines exclusivamente académicos y de entretenimiento. La precisión es limitada debido a la aleatoriedad del fútbol. No utilizar para decisiones de riesgo.</div>
    <div className="data-note"><strong>Nota:</strong> Los datos se calculan dinámicamente con cortes temporales para simular precisión fuera de muestra.</div>

    <div style={{textAlign:'center', marginTop: '3rem'}}>
      <Link to={`/resultados/${match.day}`} className="btn btn-outline">Volver a los partidos</Link>
    </div>
  </div>);
}
