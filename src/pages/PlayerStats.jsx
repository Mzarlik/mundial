import React, { useState, useEffect } from 'react';

export default function PlayerStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passes'); // 'passes', 'xg', 'sca', 'duels'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('/data/player_stats.json')
      .then(res => {
        if (!res.ok) throw new Error("No data yet");
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading player stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div>
        <h1 style={{ marginBottom: '0.3rem' }}>📊 Estadísticas de Jugadores</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando estadísticas de Opta...</p>
      </div>
    );
  }

  // Si no hay datos, mostrar instrucciones para el scrapeo
  if (!data || Object.keys(data).length === 0) {
    return (
      <div>
        <h1 style={{ marginBottom: '0.3rem' }}>📊 Estadísticas de Jugadores</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          Integra las estadísticas oficiales de Opta en tiempo real para los finalistas.
        </p>
        
        <div className="card" style={{ padding: '2.5rem', marginTop: '1.5rem' }}>
          <h2 style={{ color: 'var(--accent)', marginTop: 0 }}>¿Cómo cargar estadísticas de Opta?</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            Debido a las protecciones anti-scrapeo del portal de Opta (`optaplayerstats.statsperform.com`), hemos habilitado una forma local súper sencilla y 100% segura para cargar los datos:
          </p>
          
          <ol style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', lineHeight: '1.8', margin: '1.5rem 0' }}>
            <li>Abre la página del partido en tu navegador y selecciona la pestaña <strong>"MATCH DETAILS"</strong> (para que la tabla de estadísticas se dibuje en pantalla).</li>
            <li>Presiona la tecla <code>F12</code> (o haz Clic Derecho -> <strong>Inspeccionar</strong>) para abrir las Herramientas de Desarrollador.</li>
            <li>En la pestaña <strong>"Elements"</strong>, busca la etiqueta <code>&lt;html&gt;</code> al principio de todo (o el contenedor principal).</li>
            <li>Haz clic derecho sobre ella y elige <strong>"Copy" -> "Copy outerHTML"</strong> (esto copiará el código con la tabla ya cargada).</li>
            <li>Crea un archivo de texto nuevo en tu computadora, ponle extensión <code>.html</code> (ej. <code>partido1.html</code>), pega el código dentro y guárdalo en la carpeta:
              <br />
              <code style={{ background: 'var(--bg-darker)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.4rem', color: 'var(--accent)' }}>
                /opta_html/
              </code>
            </li>
            <li>Ejecuta el script de procesamiento en tu terminal:
              <br />
              <code style={{ background: 'var(--bg-darker)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.4rem', color: '#10b981' }}>
                python parse_opta_html.py
              </code>
            </li>
          </ol>
          
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', color: '#fca5a5' }}>
            💡 <strong>Nota:</strong> Puedes meter tantos archivos HTML de partidos como quieras en la carpeta. El script los fusionará automáticamente acumulando los goles, pases y xG de cada jugador a lo largo de todo el torneo.
          </div>
        </div>
      </div>
    );
  }

  // Acumular y consolidar estadísticas de jugadores
  const playersMap = {};
  Object.keys(data).forEach(matchKey => {
    const match = data[matchKey];
    match.players.forEach(p => {
      const key = p.name;
      if (!playersMap[key]) {
        playersMap[key] = {
          name: p.name,
          position: p.position,
          accurate_passes: 0,
          duels_won: 0,
          shots_inside_box: 0,
          shots_outside_box: 0,
          expected_goals: 0.0,
          corner_kicks: 0,
          tackles: 0,
          shot_creating_actions: 0,
          fouls_against: 0,
          matches: 0
        };
      }
      const entry = playersMap[key];
      entry.accurate_passes += p.accurate_passes;
      entry.duels_won += p.duels_won;
      entry.shots_inside_box += p.shots_inside_box;
      entry.shots_outside_box += p.shots_outside_box;
      entry.expected_goals += p.expected_goals;
      entry.corner_kicks += p.corner_kicks;
      entry.tackles += p.tackles;
      entry.shot_creating_actions += p.shot_creating_actions;
      entry.fouls_against += p.fouls_against;
      entry.matches += 1;
    });
  });

  const playersList = Object.values(playersMap);

  // Filtrar y ordenar
  const filteredPlayers = playersList
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (activeTab === 'passes') return b.accurate_passes - a.accurate_passes;
      if (activeTab === 'xg') return b.expected_goals - a.expected_goals;
      if (activeTab === 'sca') return b.shot_creating_actions - a.shot_creating_actions;
      if (activeTab === 'duels') return b.duels_won - a.duels_won;
      return 0;
    });

  return (
    <div>
      <h1 style={{ marginBottom: '0.3rem' }}>📊 Estadísticas de Jugadores (Opta)</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Líderes de rendimiento individuales acumulados del Mundial 2026.
      </p>

      {/* Barra de Filtros / Búsqueda */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar jugador por nombre..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              background: 'var(--bg-darker)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>

        <div className="day-tabs" style={{ margin: 0 }}>
          <button
            className={`day-tab ${activeTab === 'passes' ? 'active' : ''}`}
            onClick={() => setActiveTab('passes')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
          >
            🎯 Pases Acertados
          </button>
          <button
            className={`day-tab ${activeTab === 'xg' ? 'active' : ''}`}
            onClick={() => setActiveTab('xg')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
          >
            ⚽ Goles Esperados (xG)
          </button>
          <button
            className={`day-tab ${activeTab === 'sca' ? 'active' : ''}`}
            onClick={() => setActiveTab('sca')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
          >
            ⚡ Creación de Tiros (SCA)
          </button>
          <button
            className={`day-tab ${activeTab === 'duels' ? 'active' : ''}`}
            onClick={() => setActiveTab('duels')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
          >
            🛡️ Duelos Ganados
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '1rem' }}>Jugador</th>
              <th style={{ padding: '1rem' }}>Pos.</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Partidos</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'passes' ? 'var(--accent)' : 'inherit' }}>Pases Acertados</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'xg' ? 'var(--accent)' : 'inherit' }}>xG Acumulado</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'sca' ? 'var(--accent)' : 'inherit' }}>Acciones Creación (SCA)</th>
              <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'duels' ? 'var(--accent)' : 'inherit' }}>Duelos Ganados</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Tiros (Área / Fuera)</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((p, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: '#fff' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <span className={`model-badge badge-${p.position.toLowerCase() === 'gk' ? 'ml' : (p.position.toLowerCase() === 'df' ? 'xg' : (p.position.toLowerCase() === 'mf' ? 'cb' : 'mc'))}`} style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                      {p.position}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontFamily: 'monospace' }}>
                    {p.matches}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'passes' ? 'bold' : 'normal', color: activeTab === 'passes' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                    {p.accurate_passes}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'xg' ? 'bold' : 'normal', color: activeTab === 'xg' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                    {p.expected_goals.toFixed(3)}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'sca' ? 'bold' : 'normal', color: activeTab === 'sca' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                    {p.shot_creating_actions}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'duels' ? 'bold' : 'normal', color: activeTab === 'duels' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                    {p.duels_won}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                    {p.shots_inside_box} / {p.shots_outside_box}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No se encontraron jugadores que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
