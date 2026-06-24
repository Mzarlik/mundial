import React, { useState, useEffect } from 'react';
import { MATCHES, flagUrl, DAYS } from '../config/matches';
import { Link } from 'react-router-dom';

export default function Parlays() {
  const [predictions, setPredictions] = useState(null);

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => setPredictions(data))
      .catch(e => console.error("Error loading predictions for parlays", e));
  }, []);

  if (!predictions) {
    return <div style={{textAlign:'center', padding:'3rem'}}>Cargando algoritmos de apuestas...</div>;
  }

  // Find the top 4 safest bets across all matches
  const safeBets = [];
  MATCHES.forEach(match => {
    const pred = predictions[match.id];
    if (pred) {
      const { home: pH, draw: pD, away: pA } = pred;
      if (pH > 0.60) safeBets.push({ ...match, pick: `Gana ${match.home}`, prob: pH, type: 'Victoria' });
      else if (pA > 0.60) safeBets.push({ ...match, pick: `Gana ${match.away}`, prob: pA, type: 'Victoria' });
      else if (pH + pD > 0.80) safeBets.push({ ...match, pick: `Doble Oportunidad: ${match.home} o Empate`, prob: pH + pD, type: 'Seguridad' });
      else if (pA + pD > 0.80) safeBets.push({ ...match, pick: `Doble Oportunidad: ${match.away} o Empate`, prob: pA + pD, type: 'Seguridad' });
    }
  });

  // Sort by highest probability
  safeBets.sort((a, b) => b.prob - a.prob);

  // Take Top 4 for a parlay
  const parlayPicks = safeBets.slice(0, 4);
  const combinedProb = parlayPicks.reduce((acc, pick) => acc * pick.prob, 1);
  const impliedOdds = (1 / combinedProb).toFixed(2);

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', marginBottom: '0.5rem', color: '#f39c12' }}>
          🎟️ Parleys Recomendados (IA)
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Esta sección utiliza el modelo matemático Ensemble para escanear toda la jornada y armar apuestas combinadas maximizando la ventaja estadística contra las casas de apuestas.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', border: '1px solid #f39c12', background: 'linear-gradient(180deg, rgba(243,156,18,0.1) 0%, rgba(20,20,20,1) 100%)' }}>
        <h2 style={{ color: '#f39c12', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.8rem' }}>
          🔥 Parley Óptimo del Torneo
        </h2>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
          {parlayPicks.map((pick, i) => {
            const dayInfo = DAYS.find(d => d.id === pick.day);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #2ecc71' }}>
                <div style={{ marginRight: '1rem', width: '40px', textAlign: 'center' }}>
                  <img src={flagUrl(pick.pick.includes(pick.home) ? pick.homeCode : pick.awayCode)} style={{ width: '30px', borderRadius: '4px' }} alt="" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dayInfo?.label} - {pick.home} vs {pick.away}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#fff' }}>{pick.pick}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.2rem' }}>{(pick.prob * 100).toFixed(1)}%</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confianza</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.5rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Probabilidad Combinada</div>
            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>{(combinedProb * 100).toFixed(1)}%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>Cuota Implícita (Fair Odds)</div>
            <div style={{ color: '#f39c12', fontSize: '2rem', fontWeight: 'bold' }}>{impliedOdds}</div>
          </div>
        </div>
        
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Busca esta cuota combinada en tu casa de apuestas favorita. Si te ofrecen una cuota superior a {impliedOdds}, es una <strong>apuesta de gran valor (+EV)</strong>.
        </p>
      </div>
      
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Todos los "Safe Bets" Detectados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {safeBets.map((pick, i) => (
             <Link to={`/partido/${pick.id}`} key={i} style={{ textDecoration: 'none' }}>
                <div className="card hover-effect" style={{ padding: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{pick.home} vs {pick.away}</div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{pick.pick}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>{(pick.prob * 100).toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Ver Análisis &rarr;</span>
                  </div>
                </div>
             </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
