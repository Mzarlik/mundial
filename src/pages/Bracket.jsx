import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MATCHES, flagUrl } from '../config/matches';

export default function Bracket() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' o 'list'

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(res => res.json())
      .then(data => {
        setPredictions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando predicciones:", err);
        setLoading(false);
      });

    // Cambiar a vista de lista automáticamente en pantallas pequeñas
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setViewMode('list');
      } else {
        setViewMode('tree');
      }
    };
    
    handleResize(); // Carga inicial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>Cargando simulación del cuadro...</p>
      </div>
    );
  }

  // 1. Obtener los 16 partidos de 16avos de final
  const r32Matches = MATCHES.filter(m => m.day === 'dieciseisavos');

  // Buscar o estimar ELO de un equipo
  const getTeamElo = (teamName) => {
    if (!predictions) return 1500;
    for (const key in predictions) {
      const pred = predictions[key];
      const matchObj = MATCHES.find(m => m.id === key);
      if (matchObj) {
        if (matchObj.home === teamName) return pred.home_elo || 1500;
        if (matchObj.away === teamName) return pred.away_elo || 1500;
      }
    }
    return 1500;
  };

  // Calcular la probabilidad de clasificar (To Advance)
  const getClassificationProb = (match) => {
    const pred = predictions ? predictions[match.id] : null;
    if (!pred) return { homeAdv: 50, awayAdv: 50, winner: match.home };

    const pH = pred.home;
    const pD = pred.draw;
    const pA = pred.away;
    const eloH = pred.home_elo || 1500;
    const eloA = pred.away_elo || 1500;

    // Convertir ELO a expectativa de ganar tanda de penaltis (fallback)
    const wHome = 1.0 / (1.0 + Math.pow(10, (eloA - eloH) / 400.0));
    
    // Cargar la tanda simulada Beta-Binomial si existe
    const shootoutHome = pred.shootout_home !== undefined ? pred.shootout_home : wHome;
    const shootoutAway = pred.shootout_away !== undefined ? pred.shootout_away : (1.0 - wHome);

    const homeAdv = (pH + pD * shootoutHome) * 100;
    const awayAdv = (pA + pD * shootoutAway) * 100;

    const winner = homeAdv >= awayAdv ? match.home : match.away;
    return { homeAdv, awayAdv, winner };
  };

  const realResults = {
    'rsa-can': 'Canadá',         // Jugado, avanzó Canadá
    'bra-jpn': 'Brasil',          // Jugado, avanzó Brasil
    'ger-par': 'Paraguay',        // Jugado, avanzó Paraguay
    'ned-mar': 'Marruecos',       // Jugado, avanzó Marruecos
    'civ-nor': 'Noruega',         // Jugado, avanzó Noruega
    'fra-swe': 'Francia',         // Jugado, avanzó Francia
    'mex-ecu': 'México',          // Jugado, avanzó México
    'usa-bih': 'Estados Unidos',  // Jugado, avanzó EE.UU.
    'bel-sen': 'Bélgica',         // Jugado, avanzó Bélgica
    'eng-cod': 'Inglaterra',      // Jugado, avanzó Inglaterra
    'por-cro': 'Portugal',        // Jugado, avanzó Portugal (2-1 vs Croacia)
    'esp-aut': 'España',          // Jugado, avanzó España (3-0 vs Austria)
    'sui-alg': 'Suiza',           // Jugado, avanzó Suiza (2-0 vs Argelia)
    'aus-egy': 'Egipto',          // Jugado, avanzó Egipto (1-1 en regulatorio, ganó en penales)
    'arg-cpv': 'Argentina',       // Jugado, avanzó Argentina (3-2 vs Cabo Verde)
    'col-gha': 'Colombia',        // Jugado, avanzó Colombia (1-0 vs Ghana)
    'par-fra': 'Francia',         // Jugado, avanzó Francia (0-1 vs Paraguay)
    'can-mar': 'Marruecos',       // Jugado, avanzó Marruecos (0-3 vs Canadá)
    'bra-nor': 'Noruega',         // Jugado, avanzó Noruega (1-2 vs Brasil)
    'mex-eng': 'Inglaterra',      // Jugado, avanzó Inglaterra (2-3 vs México)
    'por-esp': 'España',          // Jugado, avanzó España (0-1 vs Portugal)
    'usa-bel': 'Bélgica',         // Jugado, avanzó Bélgica (1-4 vs EE.UU.)
    'arg-egy': 'Argentina',       // Jugado, avanzó Argentina (3-2 vs Egipto)
    'sui-col': 'Suiza',        // Jugado, avanzó Colombia (0-0, ganó penales vs Suiza)
  };

  // Pre-calcular los resultados de 16avos de final
  const r32Results = {};
  r32Matches.forEach(m => {
    const calculated = getClassificationProb(m);
    if (realResults[m.id]) {
      calculated.winner = realResults[m.id];
      if (realResults[m.id] === m.home) {
        calculated.homeAdv = 100;
        calculated.awayAdv = 0;
      } else {
        calculated.homeAdv = 0;
        calculated.awayAdv = 100;
      }
    }
    r32Results[m.id] = calculated;
  });

  // Simulación de una llave por ELO
  const simulateEloMatch = (teamA, teamB, matchId = null) => {
    if (teamA === 'TBD' || !teamA) return { winner: teamB || 'TBD', probA: 0, probB: 100 };
    if (teamB === 'TBD' || !teamB) return { winner: teamA, probA: 100, probB: 0 };
    
    if (matchId && realResults[matchId]) {
      const winner = realResults[matchId];
      return {
        winner,
        probA: winner === teamA ? 100 : 0,
        probB: winner === teamB ? 100 : 0,
        eloA: getTeamElo(teamA),
        eloB: getTeamElo(teamB)
      };
    }
    
    const eloA = getTeamElo(teamA);
    const eloB = getTeamElo(teamB);
    const probA = (1.0 / (1.0 + Math.pow(10, (eloB - eloA) / 400.0))) * 100;
    const probB = 100 - probA;
    return {
      winner: probA >= probB ? teamA : teamB,
      probA,
      probB,
      eloA,
      eloB
    };
  };

  // --- SIMULAR TODO EL TORNEO ---
  
  // 1. Octavos de Final (Round of 16)
  const octL1 = simulateEloMatch(r32Results['ger-par']?.winner, r32Results['fra-swe']?.winner, 'par-fra');
  const octL2 = simulateEloMatch(r32Results['rsa-can']?.winner, r32Results['ned-mar']?.winner, 'can-mar');
  const octL3 = simulateEloMatch(r32Results['por-cro']?.winner, r32Results['esp-aut']?.winner, 'por-esp');
  const octL4 = simulateEloMatch(r32Results['usa-bih']?.winner, r32Results['bel-sen']?.winner, 'usa-bel');
  
  const octR1 = simulateEloMatch(r32Results['bra-jpn']?.winner, r32Results['civ-nor']?.winner, 'bra-nor');
  const octR2 = simulateEloMatch(r32Results['mex-ecu']?.winner, r32Results['eng-cod']?.winner, 'mex-eng');
  const octR3 = simulateEloMatch(r32Results['arg-cpv']?.winner, r32Results['aus-egy']?.winner, 'arg-egy');
  const octR4 = simulateEloMatch(r32Results['sui-alg']?.winner, r32Results['col-gha']?.winner, 'sui-col');

  // 2. Cuartos de Final (Quarterfinals)
  const qL1 = simulateEloMatch(octL1.winner, octL2.winner, 'q-L1');
  const qL2 = simulateEloMatch(octL3.winner, octL4.winner, 'q-L2');
  const qR1 = simulateEloMatch(octR1.winner, octR2.winner, 'q-R1');
  const qR2 = simulateEloMatch(octR3.winner, octR4.winner, 'q-R2');

  // 3. Semifinales
  const semiL = simulateEloMatch(qL1.winner, qL2.winner, 'semi-L');
  const semiR = simulateEloMatch(qR1.winner, qR2.winner, 'semi-R');

  // 4. Gran Final
  const grandFinal = simulateEloMatch(semiL.winner, semiR.winner, 'final');

  const getMatchBySlugId = (slugId) => {
    return r32Matches.find(m => m.id === slugId) || {
      id: slugId, home: "TBD", away: "TBD", homeCode: "UN", awayCode: "UN"
    };
  };

  const getTeamCode = (teamName) => {
    const match = MATCHES.find(m => m.home === teamName || m.away === teamName);
    if (!match) return "un";
    return match.home === teamName ? match.homeCode : match.awayCode;
  };

  // Helper para renderizar una tarjeta de partido simulación
  const renderSimMatch = (teamA, teamB, resultObj, isR32 = false, r32MatchObj = null) => {
    const codeA = r32MatchObj ? r32MatchObj.homeCode : getTeamCode(teamA);
    const codeB = r32MatchObj ? r32MatchObj.awayCode : getTeamCode(teamB);

    const probA = isR32 ? r32Results[r32MatchObj.id]?.homeAdv : resultObj.probA;
    const probB = isR32 ? r32Results[r32MatchObj.id]?.awayAdv : resultObj.probB;
    const winner = isR32 ? r32Results[r32MatchObj.id]?.winner : resultObj.winner;

    // Buscar si existe un partido en la lista precalculada (MATCHES) para esta combinación
    const matchObj = r32MatchObj || MATCHES.find(m => 
      (m.home === teamA && m.away === teamB) || 
      (m.home === teamB && m.away === teamA)
    );

    return (
      <div className="bracket-match-card" style={{ position: 'relative' }}>
        {matchObj && (
          <Link to={`/partido/${matchObj.id}`} className="bracket-match-link-overlay" title="Ver análisis de IAs" />
        )}
        <div className={`bracket-team-row ${winner === teamA ? 'winner' : ''}`}>
          <img src={flagUrl(codeA || "un")} alt={teamA} className="bracket-flag" />
          <span className="bracket-team-name">{teamA}</span>
          <span className="bracket-prob">{probA ? `${probA.toFixed(0)}%` : '--'}</span>
        </div>
        <div className="bracket-divider" />
        <div className={`bracket-team-row ${winner === teamB ? 'winner' : ''}`}>
          <img src={flagUrl(codeB || "un")} alt={teamB} className="bracket-flag" />
          <span className="bracket-team-name">{teamB}</span>
          <span className="bracket-prob">{probB ? `${probB.toFixed(0)}%` : '--'}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div className="home-hero" style={{ padding: '2rem 1.5rem', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Simulador de Llaves <span>Mundial 2026</span></h1>
        <p style={{ maxWidth: '800px', margin: '0 auto', fontSize: '0.9rem' }}>
          Visualiza el camino completo desde los 16avos hasta el campeón. Los 16avos se calculan combinando el Ensamble Ponderado y los ELO. Las rondas posteriores se proyectan simulando cruces de fuerza relativa mediante ratings ELO.
        </p>
      </div>

      {/* Selector de Modos de Vista */}
      <div className="view-toggle-bar" style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <button 
          className={`btn ${viewMode === 'tree' ? 'btn-accent' : 'btn-outline'}`} 
          onClick={() => setViewMode('tree')}
          style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
        >
          🌳 Vista de Árbol (Ideal para PC)
        </button>
        <button 
          className={`btn ${viewMode === 'list' ? 'btn-accent' : 'btn-outline'}`} 
          onClick={() => setViewMode('list')}
          style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
        >
          📋 Vista de Lista (Ideal para Celular)
        </button>
      </div>



      {/* MODO VISTA DE ÁRBOL */}
      {viewMode === 'tree' ? (
        <div className="bracket-container">
          {/* LADO IZQUIERDO */}
          <div className="bracket-column">
            <div className="bracket-round-title">16avos de Final</div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('ger-par').home, getMatchBySlugId('ger-par').away, null, true, getMatchBySlugId('ger-par'))}
              {renderSimMatch(getMatchBySlugId('fra-swe').home, getMatchBySlugId('fra-swe').away, null, true, getMatchBySlugId('fra-swe'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('rsa-can').home, getMatchBySlugId('rsa-can').away, null, true, getMatchBySlugId('rsa-can'))}
              {renderSimMatch(getMatchBySlugId('ned-mar').home, getMatchBySlugId('ned-mar').away, null, true, getMatchBySlugId('ned-mar'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('por-cro').home, getMatchBySlugId('por-cro').away, null, true, getMatchBySlugId('por-cro'))}
              {renderSimMatch(getMatchBySlugId('esp-aut').home, getMatchBySlugId('esp-aut').away, null, true, getMatchBySlugId('esp-aut'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('usa-bih').home, getMatchBySlugId('usa-bih').away, null, true, getMatchBySlugId('usa-bih'))}
              {renderSimMatch(getMatchBySlugId('bel-sen').home, getMatchBySlugId('bel-sen').away, null, true, getMatchBySlugId('bel-sen'))}
            </div>
          </div>

          <div className="bracket-column">
            <div className="bracket-round-title">Octavos (Izq)</div>
            <div className="bracket-match-group-spaced">
              {renderSimMatch(r32Results['ger-par']?.winner, r32Results['fra-swe']?.winner, octL1)}
              {renderSimMatch(r32Results['rsa-can']?.winner, r32Results['ned-mar']?.winner, octL2)}
              {renderSimMatch(r32Results['por-cro']?.winner, r32Results['esp-aut']?.winner, octL3)}
              {renderSimMatch(r32Results['usa-bih']?.winner, r32Results['bel-sen']?.winner, octL4)}
            </div>
          </div>

          <div className="bracket-column">
            <div className="bracket-round-title">Cuartos (Izq)</div>
            <div className="bracket-match-group-spaced">
              {renderSimMatch(octL1.winner, octL2.winner, qL1)}
              {renderSimMatch(octL3.winner, octL4.winner, qL2)}
            </div>
          </div>

          {/* CENTRO: SEMIFINALES Y GRAN FINAL */}
          <div className="bracket-column center-column">
            <div className="bracket-round-title" style={{ color: '#f59e0b' }}>🏆 CAMPEÓN PREDICTIVO</div>
            
            <div className="champion-display-card">
              <span className="trophy-icon">🏆</span>
              <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0' }}>{grandFinal.winner}</h3>
              <div className="champion-badge">CAMPEÓN ML</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem', lineHeight: '1.3' }}>
                Simulación: {grandFinal.winner} gana la final con un <strong>{grandFinal.winner === semiL.winner ? grandFinal.probA.toFixed(0) : grandFinal.probB.toFixed(0)}%</strong> de probabilidad.
              </p>
            </div>

            <div style={{ marginTop: '1.5rem', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div className="bracket-round-title" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Semifinal Izq</div>
                {renderSimMatch(qL1.winner, qL2.winner, semiL)}
              </div>
              <div>
                <div className="bracket-round-title" style={{ fontSize: '0.7rem', marginBottom: '0.2rem' }}>Semifinal Der</div>
                {renderSimMatch(qR1.winner, qR2.winner, semiR)}
              </div>
              <div>
                <div className="bracket-round-title">Gran Final</div>
                {renderSimMatch(semiL.winner, semiR.winner, grandFinal)}
              </div>
            </div>
          </div>

          {/* LADO DERECHO */}
          <div className="bracket-column">
            <div className="bracket-round-title">Cuartos (Der)</div>
            <div className="bracket-match-group-spaced">
              {renderSimMatch(octR1.winner, octR2.winner, qR1)}
              {renderSimMatch(octR3.winner, octR4.winner, qR2)}
            </div>
          </div>

          <div className="bracket-column">
            <div className="bracket-round-title">Octavos (Der)</div>
            <div className="bracket-match-group-spaced">
              {renderSimMatch(r32Results['bra-jpn']?.winner, r32Results['civ-nor']?.winner, octR1)}
              {renderSimMatch(r32Results['mex-ecu']?.winner, r32Results['eng-cod']?.winner, octR2)}
              {renderSimMatch(r32Results['arg-cpv']?.winner, r32Results['aus-egy']?.winner, octR3)}
              {renderSimMatch(r32Results['sui-alg']?.winner, r32Results['col-gha']?.winner, octR4)}
            </div>
          </div>

          <div className="bracket-column">
            <div className="bracket-round-title">16avos de Final (Der)</div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('bra-jpn').home, getMatchBySlugId('bra-jpn').away, null, true, getMatchBySlugId('bra-jpn'))}
              {renderSimMatch(getMatchBySlugId('civ-nor').home, getMatchBySlugId('civ-nor').away, null, true, getMatchBySlugId('civ-nor'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('mex-ecu').home, getMatchBySlugId('mex-ecu').away, null, true, getMatchBySlugId('mex-ecu'))}
              {renderSimMatch(getMatchBySlugId('eng-cod').home, getMatchBySlugId('eng-cod').away, null, true, getMatchBySlugId('eng-cod'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('arg-cpv').home, getMatchBySlugId('arg-cpv').away, null, true, getMatchBySlugId('arg-cpv'))}
              {renderSimMatch(getMatchBySlugId('aus-egy').home, getMatchBySlugId('aus-egy').away, null, true, getMatchBySlugId('aus-egy'))}
            </div>
            <div className="bracket-match-group">
              {renderSimMatch(getMatchBySlugId('sui-alg').home, getMatchBySlugId('sui-alg').away, null, true, getMatchBySlugId('sui-alg'))}
              {renderSimMatch(getMatchBySlugId('col-gha').home, getMatchBySlugId('col-gha').away, null, true, getMatchBySlugId('col-gha'))}
            </div>
          </div>
        </div>
      ) : (
        /* MODO VISTA DE LISTA (RESPONSIVE) */
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 1rem' }}>
          <div className="champion-display-card" style={{ maxWidth: '100%', margin: '0 auto 2.5rem auto' }}>
            <span className="trophy-icon">🏆</span>
            <h3>{grandFinal.winner}</h3>
            <div className="champion-badge">CAMPEÓN PREDICTIVO</div>
          </div>

          <div className="bracket-round-section" style={{ marginBottom: '2rem' }}>
            <h2 className="bracket-round-title" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'left', color: 'var(--accent)' }}>
              1. Dieciseisavos de Final (16avos)
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {r32Matches.map(m => (
                <div key={m.id}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{m.group} - {m.date}</div>
                  {renderSimMatch(m.home, m.away, null, true, m)}
                </div>
              ))}
            </div>
          </div>

          <div className="bracket-round-section" style={{ marginBottom: '2rem' }}>
            <h2 className="bracket-round-title" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'left', color: '#10b981' }}>
              2. Octavos de Final
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {renderSimMatch(r32Results['ger-par']?.winner, r32Results['fra-swe']?.winner, octL1)}
              {renderSimMatch(r32Results['rsa-can']?.winner, r32Results['ned-mar']?.winner, octL2)}
              {renderSimMatch(r32Results['por-cro']?.winner, r32Results['esp-aut']?.winner, octL3)}
              {renderSimMatch(r32Results['usa-bih']?.winner, r32Results['bel-sen']?.winner, octL4)}
              {renderSimMatch(r32Results['bra-jpn']?.winner, r32Results['civ-nor']?.winner, octR1)}
              {renderSimMatch(r32Results['mex-ecu']?.winner, r32Results['eng-cod']?.winner, octR2)}
              {renderSimMatch(r32Results['arg-cpv']?.winner, r32Results['aus-egy']?.winner, octR3)}
              {renderSimMatch(r32Results['sui-alg']?.winner, r32Results['col-gha']?.winner, octR4)}
            </div>
          </div>

          <div className="bracket-round-section" style={{ marginBottom: '2rem' }}>
            <h2 className="bracket-round-title" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'left', color: '#8b5cf6' }}>
              3. Cuartos de Final
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {renderSimMatch(octL1.winner, octL2.winner, qL1)}
              {renderSimMatch(octL3.winner, octL4.winner, qL2)}
              {renderSimMatch(octR1.winner, octR2.winner, qR1)}
              {renderSimMatch(octR3.winner, octR4.winner, qR2)}
            </div>
          </div>

          <div className="bracket-round-section" style={{ marginBottom: '2rem' }}>
            <h2 className="bracket-round-title" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'left', color: '#ec4899' }}>
              4. Semifinales
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {renderSimMatch(qL1.winner, qL2.winner, semiL)}
              {renderSimMatch(qR1.winner, qR2.winner, semiR)}
            </div>
          </div>

          <div className="bracket-round-section" style={{ marginBottom: '2rem' }}>
            <h2 className="bracket-round-title" style={{ fontSize: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', textAlign: 'left', color: '#f59e0b' }}>
              5. Gran Final
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {renderSimMatch(semiL.winner, semiR.winner, grandFinal)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
