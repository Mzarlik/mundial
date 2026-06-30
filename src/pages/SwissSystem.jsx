import React, { useState, useEffect } from 'react';
import { flagUrl } from '../config/matches';

export default function SwissSystem() {
  const [data, setData] = useState(null);
  const [mcData, setMcData] = useState(null);
  const [activeTab, setActiveTab] = useState('standings');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/swiss_tournament.json')
      .then(res => {
        if (!res.ok) throw new Error("JSON not found");
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading swiss data:", err);
        setLoading(false);
      });

    fetch('/knockout_probabilities.json')
      .then(res => res.json())
      .then(d => setMcData(d))
      .catch(err => console.error("Error loading knockout data:", err));
  }, []);

  if (loading) {
    return (
      <div>
        <h1 style={{marginBottom:'0.3rem'}}>Laboratorios de IA 🧪</h1>
        <p style={{color:'var(--text-secondary)'}}>Simulación cargando...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <h1 style={{marginBottom:'0.3rem'}}>Laboratorios de IA 🧪</h1>
        <div className="card" style={{textAlign:'center',padding:'3rem', marginTop:'2rem'}}>
          <p style={{color:'var(--text-muted)'}}>No se encontraron datos del torneo suizo.</p>
          <p style={{color:'var(--text-muted)'}}>Ejecuta <code>python simulate_swiss.py</code> en tu terminal para generar la simulación.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{marginBottom:'0.3rem'}}>Laboratorios de IA 🧪</h1>
      <p style={{color:'var(--text-secondary)',marginBottom:'1rem'}}>
        Torneo de {data.rounds.length} rondas emparejado por Sistema Suizo y simulado con ELO.
        <br/>
        <span style={{color: 'var(--accent)', fontSize: '0.9rem'}}>
          ⚡ Promedio exacto tras {data.iterations.toLocaleString()} iteraciones Monte Carlo.
        </span>
      </p>
      
      <div className="day-tabs" style={{marginBottom: '2rem'}}>
        <button 
          className={`day-tab ${activeTab === 'standings' ? 'active' : ''}`}
          onClick={() => setActiveTab('standings')}
          style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', color: 'inherit'}}
        >
          🏆 Tabla de Clasificación Esperada
        </button>
        <button 
          className={`day-tab ${activeTab === 'rounds' ? 'active' : ''}`}
          onClick={() => setActiveTab('rounds')}
          style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', color: 'inherit'}}
        >
          ⚔️ Suizo: Partidos (Iteración #1)
        </button>
        <button 
          className={`day-tab ${activeTab === 'knockout' ? 'active' : ''}`}
          onClick={() => setActiveTab('knockout')}
          style={{background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '1rem', color: 'inherit'}}
        >
          🎲 Eliminatorias: Probabilidades
        </button>
      </div>

      {activeTab === 'standings' && (
        <div className="card" style={{overflowX: 'auto'}}>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
                <th style={{padding: '1rem 0.5rem'}} title="Posición Esperada Promedio"># Prom</th>
                <th style={{padding: '1rem 0.5rem'}}>Selección</th>
                <th style={{padding: '1rem 0.5rem'}} title="Puntos Esperados">xPts</th>
                <th style={{padding: '1rem 0.5rem'}} title="Buchholz Esperado">xBchlz</th>
                <th style={{padding: '1rem 0.5rem'}} title="Victorias Esperadas">xV</th>
                <th style={{padding: '1rem 0.5rem'}} title="Empates Esperados">xE</th>
                <th style={{padding: '1rem 0.5rem'}} title="Derrotas Esperadas">xD</th>
                <th style={{padding: '1rem 0.5rem'}} title="Goles Esperados a Favor">xGF</th>
                <th style={{padding: '1rem 0.5rem'}} title="Goles Esperados en Contra">xGC</th>
                <th style={{padding: '1rem 0.5rem'}} title="Goles Esperados Reales (Estocásticos)">xG Total</th>
                <th style={{padding: '1rem 0.5rem'}}>ELO Base</th>
              </tr>
            </thead>
            <tbody>
              {data.standings.map((team, idx) => (
                <tr key={team.team} style={{borderBottom: '1px solid var(--border-color)'}}>
                  <td style={{padding: '0.75rem 0.5rem', fontWeight: 'bold'}}>{team.avg_pos}</td>
                  <td style={{padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold'}}>
                    <img src={flagUrl(team.code)} alt={team.team} style={{width: '24px', borderRadius: '2px'}} />
                    {team.team}
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', color: 'var(--accent)', fontWeight: 'bold'}}>{team.points}</td>
                  <td style={{padding: '0.75rem 0.5rem'}}>{team.buchholz}</td>
                  <td style={{padding: '0.75rem 0.5rem', color: '#2ecc71'}}>{team.wins}</td>
                  <td style={{padding: '0.75rem 0.5rem', color: '#f39c12'}}>{team.draws}</td>
                  <td style={{padding: '0.75rem 0.5rem', color: '#e74c3c'}}>{team.losses}</td>
                  <td style={{padding: '0.75rem 0.5rem'}}>{team.gf}</td>
                  <td style={{padding: '0.75rem 0.5rem'}}>{team.ga}</td>
                  <td style={{padding: '0.75rem 0.5rem', color: 'var(--accent)', fontWeight: 'bold'}}>{team.xG}</td>
                  <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{Math.round(team.elo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rounds' && (
        <div>
          {data.rounds.map((round) => (
            <div key={round.round} style={{marginBottom: '3rem'}}>
              <h2 style={{borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--accent)'}}>
                Ronda {round.round}
              </h2>
              <div className="matches-grid">
                {round.matches.map((m, idx) => (
                  <div key={idx} className="card" style={{padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', width: '40%'}}>
                        <img src={flagUrl(m.homeCode)} alt={m.home} style={{width: '24px', borderRadius: '2px'}} />
                        <span style={{fontWeight: m.homeGoals > m.awayGoals ? 'bold' : 'normal'}}>{m.home}</span>
                      </div>
                      <div style={{fontWeight: 'bold', fontSize: '1.2rem', padding: '0.2rem 0.8rem', background: 'var(--bg-darker)', borderRadius: '4px'}}>
                        {m.homeGoals} - {m.awayGoals}
                      </div>
                      <div style={{display: 'flex', alignItems: 'center', gap: '10px', width: '40%', flexDirection: 'row-reverse'}}>
                        <img src={flagUrl(m.awayCode)} alt={m.away} style={{width: '24px', borderRadius: '2px'}} />
                        <span style={{fontWeight: m.awayGoals > m.homeGoals ? 'bold' : 'normal'}}>{m.away}</span>
                      </div>
                    </div>
                    <div style={{textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem'}}>
                      xG Estocástico: {m.homexG.toFixed(2)} - {m.awayxG.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'knockout' && mcData && (
        <div className="card" style={{overflowX: 'auto', marginBottom: '2rem'}}>
          <div style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>
            <h3 style={{margin: 0, color: 'var(--accent)'}}>
              Probabilidades de Avance (Promedio de {mcData.iterations.toLocaleString()} simulaciones)
            </h3>
            <p style={{margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)'}}>
              Basado en emparejamientos dinámicos estocásticos a partir de 16avos de final. Se incluyen clasificados oficiales en partidos ya jugados.
            </p>
          </div>
          <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
            <thead>
              <tr style={{borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
                <th style={{padding: '1rem 0.5rem'}}>Selección</th>
                <th style={{padding: '1rem 0.5rem'}}>ELO</th>
                <th style={{padding: '1rem 0.5rem'}}>Octavos</th>
                <th style={{padding: '1rem 0.5rem'}}>Cuartos</th>
                <th style={{padding: '1rem 0.5rem'}}>Semis</th>
                <th style={{padding: '1rem 0.5rem'}}>Final</th>
                <th style={{padding: '1rem 0.5rem', color: '#f1c40f'}}>🏆 Campeón</th>
              </tr>
            </thead>
            <tbody>
              {mcData.probabilities.map((team, idx) => (
                <tr key={team.team} style={{borderBottom: '1px solid var(--border-color)'}}>
                  <td style={{padding: '0.75rem 0.5rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold'}}>
                    <img src={flagUrl(team.code)} alt={team.team} style={{width: '24px', borderRadius: '2px'}} />
                    {team.team}
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', color: 'var(--text-muted)'}}>{Math.round(team.elo)}</td>
                  
                  {/* Heatmap effect for probabilities */}
                  <td style={{padding: '0.75rem 0.5rem', background: `rgba(46, 204, 113, ${team.r16/100 * 0.3})`}}>
                    {team.r16}%
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', background: `rgba(46, 204, 113, ${team.qf/100 * 0.4})`}}>
                    {team.qf}%
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', background: `rgba(46, 204, 113, ${team.sf/100 * 0.5})`}}>
                    {team.sf}%
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', background: `rgba(52, 152, 219, ${team.final/100 * 0.6})`}}>
                    {team.final}%
                  </td>
                  <td style={{padding: '0.75rem 0.5rem', fontWeight: 'bold', color: '#f1c40f', background: `rgba(241, 196, 15, ${team.champion/100 * 0.4})`}}>
                    {team.champion}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
