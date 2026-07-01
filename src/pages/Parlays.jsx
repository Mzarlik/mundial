import React, { useState, useEffect } from 'react';
import { MATCHES, flagUrl, DAYS } from '../config/matches';
import { Link } from 'react-router-dom';

export default function Parlays() {
  const [predictions, setPredictions] = useState(null);
  const [activeTab, setActiveTab] = useState(DAYS[0]?.id || 'all');
  const [activeDate, setActiveDate] = useState('all');
  const [bankroll, setBankroll] = useState(1000);
  const [userOdds, setUserOdds] = useState('');
  const [kellyFraction, setKellyFraction] = useState(0.25); // Quarter Kelly

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => setPredictions(data))
      .catch(e => console.error("Error loading predictions for parlays", e));
  }, []);

  if (!predictions) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'pulse 1.5s infinite' }}>⚙️</div>
        <h2>Analizando cuotas y ventajas matemáticas...</h2>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>Combinando probabilidades de 7 inteligencias artificiales</p>
      </div>
    );
  }

  // Helper to extract the safest pick for a match
  const getSafestPick = (match) => {
    const pred = predictions[match.id];
    if (!pred) return null;

    const { home: pH, draw: pD, away: pA } = pred;
    const candidates = [];

    // Victoria simple (umbral > 55%)
    if (pH > 0.55) {
      candidates.push({ pick: `Gana ${match.home}`, prob: pH, type: 'Victoria Simple', shortType: '1', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' });
    }
    if (pA > 0.55) {
      candidates.push({ pick: `Gana ${match.away}`, prob: pA, type: 'Victoria Simple', shortType: '2', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)' });
    }
    
    // Doble oportunidad (umbral > 75%)
    if (pH + pD > 0.75) {
      candidates.push({ pick: `Doble Oportunidad: ${match.home} o Empate`, prob: pH + pD, type: 'Doble Oportunidad', shortType: '1X', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' });
    }
    if (pA + pD > 0.75) {
      candidates.push({ pick: `Doble Oportunidad: ${match.away} o Empate`, prob: pA + pD, type: 'Doble Oportunidad', shortType: 'X2', color: '#fb7185', bg: 'rgba(251, 113, 133, 0.15)' });
    }

    // Doble oportunidad Local o Visitante (umbral > 80%)
    if (pH + pA > 0.80) {
      candidates.push({ pick: `Doble Oportunidad: ${match.home} o ${match.away}`, prob: pH + pA, type: 'Doble Oportunidad', shortType: '12', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)' });
    }

    // Clasificación a la siguiente ronda (solo eliminatorias)
    if (match.day === 'dieciseisavos' || match.day === 'octavos' || match.day === 'cuartos' || match.day === 'semifinal' || match.day === 'final') {
      const eloH = pred.home_elo || 1500;
      const eloA = pred.away_elo || 1500;
      const wHome = 1.0 / (1.0 + Math.pow(10, (eloA - eloH) / 400.0));
      const shootoutHome = pred.shootout_home !== undefined ? pred.shootout_home : wHome;
      const shootoutAway = pred.shootout_away !== undefined ? pred.shootout_away : (1.0 - wHome);
      
      const homeAdv = pH + pD * shootoutHome;
      const awayAdv = pA + pD * shootoutAway;
      
      if (homeAdv > 0.58) {
        candidates.push({ pick: `Clasifica: ${match.home}`, prob: homeAdv, type: 'Clasificación', shortType: 'Pase', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' });
      }
      if (awayAdv > 0.58) {
        candidates.push({ pick: `Clasifica: ${match.away}`, prob: awayAdv, type: 'Clasificación', shortType: 'Pase', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' });
      }
    }

    // Over / Under Goles (evaluado de forma conjunta de las 7 IAs)
    if (pred.over15 !== undefined && pred.over15 > 0.75) {
      candidates.push({ pick: 'Más de 1.5 Goles', prob: pred.over15, type: 'Total Goles', shortType: '+1.5 G', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' });
    }
    if (pred.under15 !== undefined && pred.under15 > 0.65) {
      candidates.push({ pick: 'Menos de 1.5 Goles', prob: pred.under15, type: 'Total Goles', shortType: '-1.5 G', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' });
    }
    if (pred.over25 !== undefined && pred.over25 > 0.62) {
      candidates.push({ pick: 'Más de 2.5 Goles', prob: pred.over25, type: 'Total Goles', shortType: '+2.5 G', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' });
    }
    if (pred.under25 !== undefined && pred.under25 > 0.62) {
      candidates.push({ pick: 'Menos de 2.5 Goles', prob: pred.under25, type: 'Total Goles', shortType: '-2.5 G', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' });
    }
    if (pred.over35 !== undefined && pred.over35 > 0.58) {
      candidates.push({ pick: 'Más de 3.5 Goles', prob: pred.over35, type: 'Total Goles', shortType: '+3.5 G', color: '#f87171', bg: 'rgba(248, 113, 113, 0.15)' });
    }
    if (pred.under35 !== undefined && pred.under35 > 0.75) {
      candidates.push({ pick: 'Menos de 3.5 Goles', prob: pred.under35, type: 'Total Goles', shortType: '-3.5 G', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' });
    }

    if (candidates.length === 0) return null;

    // Seleccionamos el pick con mayor probabilidad absoluta
    candidates.sort((a, b) => b.prob - a.prob);
    return candidates[0];
  };

  // Build list of safest picks for ALL matches
  const allSafePicks = [];
  MATCHES.forEach(match => {
    const safest = getSafestPick(match);
    if (safest) {
      allSafePicks.push({
        ...match,
        ...safest
      });
    }
  });

  // Group matches and picks by Day & Date
  const getDailyParlay = (dayId, selectedDate) => {
    let dayPicks = allSafePicks.filter(pick => pick.day === dayId);
    if (selectedDate && selectedDate !== 'all') {
      dayPicks = dayPicks.filter(pick => pick.date === selectedDate);
    }
    
    // Sort by confidence
    dayPicks.sort((a, b) => b.prob - a.prob);

    // Build parlay with top 3 safest picks of the day (limit to 3 for stability)
    const parlayPicks = dayPicks.slice(0, 3);
    const combinedProb = parlayPicks.length > 0 ? parlayPicks.reduce((acc, pick) => acc * pick.prob, 1) : 0;
    const impliedOdds = parlayPicks.length > 0 ? (1 / (combinedProb || 1)).toFixed(2) : '1.00';

    return {
      picks: parlayPicks,
      prob: combinedProb,
      odds: impliedOdds,
      totalMatches: dayPicks.length
    };
  };

  const currentDayInfo = DAYS.find(d => d.id === activeTab);
  const dailyParlay = activeTab !== 'all' ? getDailyParlay(activeTab, activeDate) : null;

  // Get unique dates for the active Jornada
  const matchesInJornada = MATCHES.filter(m => m.day === activeTab);
  const datesInJornada = [...new Set(matchesInJornada.map(m => m.date))].sort();

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '2.2rem' }}>🎟️</span>
          <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase', fontSize: '2rem', margin: 0, background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Parleys Recomendados (IA)
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', lineHeight: '1.6' }}>
          Escanea la jornada futbolística utilizando el modelo <strong>Ensemble (7 IAs)</strong> y calcula de forma probabilística apuestas combinadas con ventaja matemática real (+EV) frente a las cuotas de las casas de apuestas.
        </p>
      </div>

      {/* Tabs Selector */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        overflowX: 'auto',
        padding: '0.4rem',
        background: 'rgba(255, 255, 255, 0.03)',
        borderRadius: '10px',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        marginBottom: '1rem',
        scrollbarWidth: 'none'
      }}>
        {DAYS.map(day => (
          <button
            key={day.id}
            onClick={() => { setActiveTab(day.id); setActiveDate('all'); }}
            style={{
              padding: '0.7rem 1.2rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === day.id ? '#f59e0b' : 'transparent',
              color: activeTab === day.id ? '#0f172a' : 'rgba(255, 255, 255, 0.65)',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.1rem'
            }}
          >
            <span style={{ fontSize: '0.88rem' }}>{day.label}</span>
            <span style={{ fontSize: '0.68rem', opacity: activeTab === day.id ? 0.8 : 0.5 }}>Jornada</span>
          </button>
        ))}
        <button
          onClick={() => { setActiveTab('all'); setActiveDate('all'); }}
          style={{
            padding: '0.7rem 1.2rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'all' ? '#f59e0b' : 'transparent',
            color: activeTab === 'all' ? '#0f172a' : 'rgba(255, 255, 255, 0.65)',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.85rem'
          }}
        >
          🔍 Ver Todos los Safe Bets
        </button>
      </div>

      {/* Sub-tabs for Dates in selected Jornada */}
      {activeTab !== 'all' && datesInJornada.length > 0 && (
        <div style={{
          display: 'flex',
          gap: '0.4rem',
          overflowX: 'auto',
          padding: '0.3rem',
          background: 'rgba(255, 255, 255, 0.015)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.03)',
          marginBottom: '2rem',
          scrollbarWidth: 'none'
        }}>
          <button
            onClick={() => setActiveDate('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              background: activeDate === 'all' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              border: activeDate === 'all' ? '1px solid #f59e0b' : '1px solid transparent',
              color: activeDate === 'all' ? '#f59e0b' : 'rgba(255, 255, 255, 0.6)',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.8rem',
              transition: 'all 0.2s ease'
            }}
          >
            Toda la Jornada
          </button>
          {datesInJornada.map(d => {
            const parts = d.split('-');
            const displayDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : d;
            return (
              <button
                key={d}
                onClick={() => setActiveDate(d)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: activeDate === d ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                  border: activeDate === d ? '1px solid #f59e0b' : '1px solid transparent',
                  color: activeDate === d ? '#f59e0b' : 'rgba(255, 255, 255, 0.6)',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  transition: 'all 0.2s ease'
                }}
              >
                📅 {displayDate}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab !== 'all' ? (
        <div>
          {/* Display Daily Parlay Slip */}
          {dailyParlay.picks.length >= 2 ? (
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
              marginBottom: '2.5rem',
              position: 'relative',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}>
              {/* Ticket Top Highlight */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, #f59e0b 0%, #ea580c 100%)' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Sugerencia del Día</span>
                  <h2 style={{ margin: '0.2rem 0 0 0', color: '#fff', fontSize: '1.5rem', fontFamily: 'var(--font-display)' }}>
                    🎫 TICKET COMBINADO: {currentDayInfo?.full}
                  </h2>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>ESTADO</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '0.25rem 0.6rem', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    VENTAJA (+EV)
                  </span>
                </div>
              </div>

              {/* Picks list */}
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {dailyParlay.picks.map((pick, index) => (
                  <div key={pick.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    padding: '1rem 1.25rem',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}>
                    <span style={{ position: 'absolute', left: 0, top: '25%', height: '50%', width: '3px', background: pick.color }}></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '70px', justifyContent: 'center' }}>
                      {pick.type === 'Total Goles' ? (
                        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '38px', height: '18px' }}>
                          <img src={flagUrl(pick.homeCode)} style={{ width: '22px', height: '14px', borderRadius: '2px', objectFit: 'cover', position: 'absolute', left: 0, zIndex: 2, border: '1px solid rgba(0,0,0,0.2)' }} alt="" />
                          <img src={flagUrl(pick.awayCode)} style={{ width: '22px', height: '14px', borderRadius: '2px', objectFit: 'cover', position: 'absolute', right: 0, zIndex: 1, border: '1px solid rgba(0,0,0,0.2)' }} alt="" />
                        </div>
                      ) : (
                        <img src={flagUrl(pick.pick.includes(pick.home) ? pick.homeCode : pick.awayCode)} style={{ width: '28px', height: '18px', borderRadius: '2px', objectFit: 'cover', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} alt="" />
                      )}
                      <span style={{ fontSize: '0.72rem', fontWeight: 'bold', background: pick.bg, color: pick.color, padding: '0.15rem 0.4rem', borderRadius: '4px', border: `1px solid rgba(255,255,255,0.03)` }}>
                        {pick.shortType}
                      </span>
                    </div>
                    <div style={{ flex: 1, paddingLeft: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pick.group} &bull; {pick.home} vs {pick.away}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#fff', marginTop: '0.1rem' }}>{pick.pick}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.15rem', display: 'block' }}>
                        {(pick.prob * 100).toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confianza</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Calculation Slip */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1.5rem',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Probabilidad Combinada</span>
                  <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.02em', marginTop: '0.1rem' }}>
                    {(dailyParlay.prob * 100).toFixed(1)}%
                  </div>
                </div>
                <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '1.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuota Implícita (Fair Odds)</span>
                  <div style={{ color: '#f59e0b', fontSize: '2rem', fontWeight: 'bold', letterSpacing: '0.02em', marginTop: '0.1rem' }}>
                    {dailyParlay.odds}
                  </div>
                </div>
              </div>

              {/* Value warning */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '1.5rem', padding: '0.8rem 1rem', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.1)', marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '1.1rem' }}>💡</span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.4' }}>
                  Si tu casa de apuestas ofrece una cuota combinada <strong>superior a {dailyParlay.odds}</strong>, estarás apostando con valor matemático a largo plazo (+EV).
                </p>
              </div>

              {/* Kelly Calculator Panel */}
              {(() => {
                const pCombined = dailyParlay.prob;
                const fairOdds = dailyParlay.odds;
                const currentOdds = parseFloat(userOdds) || parseFloat(fairOdds) || 1.0;
                const ev = (pCombined * currentOdds) - 1;
                const fullKelly = currentOdds > 1 ? (pCombined * currentOdds - 1) / (currentOdds - 1) : 0;
                const suggestedFraction = Math.max(0, fullKelly) * kellyFraction;
                const suggestedStake = bankroll * suggestedFraction;

                return (
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(245, 158, 11, 0.15)',
                    borderRadius: '12px',
                    boxSizing: 'border-box'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#f59e0b', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      💰 Calculadora de Gestión de Riesgo (Kelly)
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Mi Bankroll ($)</label>
                        <input 
                          type="number" 
                          value={bankroll} 
                          onChange={e => setBankroll(parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Cuota Ofrecida (Odds)</label>
                        <input 
                          type="number" 
                          step="0.05"
                          placeholder={fairOdds}
                          value={userOdds} 
                          onChange={e => setUserOdds(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>Fracción de Kelly</label>
                        <select 
                          value={kellyFraction} 
                          onChange={e => setKellyFraction(parseFloat(e.target.value))}
                          style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-darker)', border: '1px solid var(--border-color)', borderRadius: '6px', color: '#fff', fontSize: '0.88rem', outline: 'none', cursor: 'pointer' }}
                        >
                          <option value={1.0}>Full Kelly (100% - Riesgo Alto)</option>
                          <option value={0.5}>Half Kelly (50% - Riesgo Medio)</option>
                          <option value={0.25}>Quarter Kelly (25% - Recomendado)</option>
                          <option value={0.125}>Eighth Kelly (12.5% - Conservador)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Valor Esperado (EV)</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: ev > 0 ? '#10b981' : '#ef4444' }}>
                          {ev > 0 ? `+${(ev * 100).toFixed(1)}% (+EV)` : `${(ev * 100).toFixed(1)}% (-EV)`}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block' }}>Inversión Sugerida ({kellyFraction * 100}%)</span>
                        <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: ev > 0 ? '#f59e0b' : '#94a3b8' }}>
                          {ev > 0 ? `$${suggestedStake.toFixed(2)} USD` : '$0.00 USD'}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>
                          {ev > 0 ? `(${(suggestedFraction * 100).toFixed(2)}% del bankroll)` : '(Sin ventaja matemática)'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            /* Banner if not enough safe matches for a daily parlay */
            <div style={{
              background: 'rgba(30, 41, 59, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '2rem',
              textAlign: 'center',
              marginBottom: '2.5rem',
              color: 'var(--text-secondary)'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '0.8rem' }}>🛡️</span>
              <h3 style={{ color: '#fff', fontSize: '1.25rem', fontFamily: 'var(--font-display)', margin: 0 }}>
                JORNADA DE MÁXIMA CAUTELA
              </h3>
              <p style={{ maxWidth: '600px', margin: '0.5rem auto 0 auto', fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Para el {currentDayInfo?.full}, el Ensemble no detecta suficientes partidos seguros para armar un parley de alta confianza. La recomendación de la IA es apostar de forma <strong>individual (singles)</strong> en los partidos viables para mitigar riesgos.
              </p>
            </div>
          )}

          {/* List of matches for the selected day */}
          <div>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Análisis y Apuestas Seguras del Día ({activeDate === 'all' ? currentDayInfo?.label : activeDate.split('-').reverse().slice(0, 2).join('/')})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {MATCHES.filter(m => m.day === activeTab && (activeDate === 'all' || m.date === activeDate)).map(match => {
                const safest = getSafestPick(match);
                return (
                  <Link to={`/partido/${match.id}`} key={match.id} style={{ textDecoration: 'none' }}>
                    <div className="card hover-effect" style={{
                      padding: '1.25rem 1.5rem',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <span>{match.group}</span>
                          <span>{match.time}</span>
                        </div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          <span>{match.home}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs</span>
                          <span>{match.away}</span>
                        </div>
                      </div>

                      {safest ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <div>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Pick IA Recomendado</span>
                            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{safest.pick.split(':')[1] || safest.pick}</span>
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', background: safest.bg, color: safest.color, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                            {(safest.prob * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', padding: '0.4rem 0' }}>
                          ⚠️ Sin ventaja estadística clara (Juego muy equilibrado)
                        </div>
                      )}

                      <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.8rem', fontWeight: 'bold' }}>
                        Ver Análisis Completo &rarr;
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* "Ver Todos" Pestaña */
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem', fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Todas las Ventajas Estadísticas Detectadas (Safe Bets)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {allSafePicks.map(pick => {
              const dayLabel = DAYS.find(d => d.id === pick.day)?.label;
              return (
                <Link to={`/partido/${pick.id}`} key={pick.id} style={{ textDecoration: 'none' }}>
                  <div className="card hover-effect" style={{
                    padding: '1.25rem 1.5rem',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderLeft: `3px solid ${pick.color}`
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>📅 {dayLabel}</span>
                        <span>{pick.group}</span>
                      </div>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <span>{pick.home}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>vs</span>
                        <span>{pick.away}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '0.5rem 0.8rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block' }}>Pick IA ({pick.type})</span>
                        <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{pick.pick}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', background: pick.bg, color: pick.color, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                        {(pick.prob * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.8rem', fontWeight: 'bold' }}>
                      Ver Análisis Completo &rarr;
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
