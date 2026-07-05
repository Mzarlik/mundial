import React, { useState, useEffect } from 'react';
import { MATCHES } from '../config/matches';

const SPANISH_TO_ENGLISH = {
  "México": "Mexico", "Sudáfrica": "South Africa", "Corea del Sur": "Korea Republic", "Chequia": "Czechia",
  "Canadá": "Canada", "Bosnia": "Bosnia-Herzegovina", "Bosnia y Herzegovina": "Bosnia-Herzegovina", "Catar": "Qatar", "Suiza": "Switzerland",
  "Brasil": "Brazil", "Marruecos": "Morocco", "Haití": "Haiti", "Escocia": "Scotland", "Estados Unidos": "USA", "USA": "USA",
  "Paraguay": "Paraguay", "Australia": "Australia", "Turquía": "Turkiye", "Alemania": "Germany", "Curazao": "Curaçao",
  "Costa de Marfil": "Ivory Coast", "Ecuador": "Ecuador", "Países Bajos": "Netherlands", "Japón": "Japan", "Suecia": "Sweden", "Túnez": "Tunisia",
  "Bélgica": "Belgium", "Egipto": "Egypt", "Irán": "Iran", "Nueva Zelanda": "New Zealand", "España": "Spain", "Cabo Verde": "Cape Verde",
  "Arabia Saudita": "Saudi Arabia", "Uruguay": "Uruguay", "Francia": "France", "Senegal": "Senegal", "Irak": "Iraq", "Noruega": "Norway",
  "Argentina": "Argentina", "Argelia": "Algeria", "Austria": "Austria", "Jordania": "Jordan", "Portugal": "Portugal", "RD Congo": "DR Congo",
  "Uzbekistán": "Uzbekistan", "Colombia": "Colombia", "Inglaterra": "England", "Croacia": "Croatia", "Ghana": "Ghana", "Panamá": "Panama"
};

const TEAM_SYNONYMS = {
  "estados unidos": ["united states", "usa"],
  "usa": ["united states", "usa"],
  "corea del sur": ["korea republic", "korea rep", "south korea", "korea"],
  "bosnia": ["bosnia", "bosnia-herzegovina", "bosnia and herzegovina"],
  "bosnia y herzegovina": ["bosnia", "bosnia-herzegovina", "bosnia and herzegovina"],
  "turquia": ["turkey", "turkiye", "türkiye"],
  "turquía": ["turkey", "turkiye", "türkiye"],
  "costa de marfil": ["cote d'ivoire", "côte d'ivoire", "ivory coast"],
  "iran": ["iran", "ir iran"],
  "irán": ["iran", "ir iran"],
  "curazao": ["curacao", "curaçao"],
  "rd congo": ["congo dr", "dr congo", "congo"],
  "paises bajos": ["netherlands", "holland"],
  "países bajos": ["netherlands", "holland"],
  "cabo verde": ["cape verde", "cabo verde"],
  "brasil": ["brazil", "brazilia", "brazília", "brasil"],
  "inglaterra": ["england"],
  "españa": ["spain"],
  "alemania": ["germany"],
  "belgica": ["belgium"],
  "bélgica": ["belgium"],
  "croacia": ["croatia"],
  "argelia": ["algeria"],
  "jordania": ["jordan"],
  "uzbekistan": ["uzbekistan"],
  "uzbekistán": ["uzbekistan"],
  "panama": ["panama"],
  "panamá": ["panama"]
};

const getKeywords = (teamName) => {
  const norm = teamName.toLowerCase().trim();
  
  // Traducir primero a inglés usando el mapeo maestro
  const englishName = SPANISH_TO_ENGLISH[teamName] || teamName;
  const engNorm = englishName.toLowerCase().trim();
  
  // Buscar sinónimos para el nombre original y el traducido
  const synonyms1 = TEAM_SYNONYMS[norm] || [];
  const synonyms2 = TEAM_SYNONYMS[engNorm] || [];
  
  // Consolidar todos los keywords posibles en un set único
  const result = new Set([norm, engNorm, ...synonyms1, ...synonyms2]);
  return Array.from(result);
};

export default function PlayerStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('passes'); // 'passes', 'xg', 'sca', 'duels'
  const [activeView, setActiveView] = useState('rankings'); // 'rankings', 'control'
  const [searchQuery, setSearchQuery] = useState('');
  const [matchSearchQuery, setMatchSearchQuery] = useState('');

  // Scraper states
  const [scraperUrl, setScraperUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [scraperMessage, setScraperMessage] = useState(null);

  const fetchData = () => {
    setLoading(true);
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
        setData(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScrape = async (e) => {
    if (e) e.preventDefault();
    if (!scraperUrl) return;

    setScraping(true);
    setScraperMessage({ 
      type: 'info', 
      text: '⚡ Conectando con el servidor de scraping... Se abrirá Chromium en segundo plano para pasar Cloudflare. Por favor espera.' 
    });

    try {
      const response = await fetch(`http://localhost:5000/scrape?url=${encodeURIComponent(scraperUrl)}`);
      const result = await response.json();

      if (result.status === 'success') {
        setScraperMessage({ type: 'success', text: `✅ ${result.message}` });
        setScraperUrl('');
        fetchData();
      } else {
        setScraperMessage({ type: 'error', text: `❌ Error: ${result.message}` });
      }
    } catch (err) {
      setScraperMessage({ 
        type: 'error', 
        text: '❌ Error: No se pudo conectar al servidor local en http://localhost:5000. Asegúrate de iniciar el backend en tu terminal: python server_opta.py' 
      });
    } finally {
      setScraping(false);
    }
  };

  // Helper para verificar si un partido de la lista ya está escrapeado
  const isMatchScraped = (match) => {
    if (!data) return false;
    
    const homeKeywords = getKeywords(match.home);
    const awayKeywords = getKeywords(match.away);
    
    return Object.keys(data).some(key => {
      // Normalize key (remove accents and keep letters/numbers)
      const k = key.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
      
      const matchHome = homeKeywords.some(kw => {
        const cleanKw = kw.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        return k.includes(cleanKw);
      });

      const matchAway = awayKeywords.some(kw => {
        const cleanKw = kw.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, "");
        return k.includes(cleanKw);
      });

      return matchHome && matchAway;
    });
  };

  const getGoogleSearchUrl = (match) => {
    const homeEng = SPANISH_TO_ENGLISH[match.home] || match.home;
    const awayEng = SPANISH_TO_ENGLISH[match.away] || match.away;
    const query = `site:optaplayerstats.statsperform.com "${homeEng}" "${awayEng}" match details`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  };

  // Consolidar estadísticas acumuladas
  const playersMap = {};
  if (data) {
    Object.keys(data).forEach(matchKey => {
      const match = data[matchKey];
      if (match && match.players) {
        match.players.forEach(p => {
          // Clean name: remove "Starter" or "Substitute" prefix
          const cleanName = p.name.replace(/^(Starter|Substitute)\s*/i, '').trim();
          const key = cleanName;
          if (!playersMap[key]) {
            playersMap[key] = {
              name: cleanName,
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
          entry.accurate_passes += p.accurate_passes || 0;
          entry.duels_won += p.duels_won || 0;
          entry.shots_inside_box += p.shots_inside_box || 0;
          entry.shots_outside_box += p.shots_outside_box || 0;
          entry.expected_goals += p.expected_goals || 0;
          entry.corner_kicks += p.corner_kicks || 0;
          entry.tackles += p.tackles || 0;
          entry.shot_creating_actions += p.shot_creating_actions || 0;
          entry.fouls_against += p.fouls_against || 0;
          entry.matches += 1;
        });
      }
    });
  }

  const players = Object.values(playersMap);

  const filteredPlayers = players
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (activeTab === 'passes') return b.accurate_passes - a.accurate_passes;
      if (activeTab === 'xg') return b.expected_goals - a.expected_goals;
      if (activeTab === 'sca') return b.shot_creating_actions - a.shot_creating_actions;
      if (activeTab === 'duels') return b.duels_won - a.duels_won;
      if (activeTab === 'corners') return b.corner_kicks - a.corner_kicks;
      if (activeTab === 'tackles') return b.tackles - a.tackles;
      if (activeTab === 'fouls') return b.fouls_against - a.fouls_against;
      return 0;
    });

  const totalMatches = MATCHES.length;
  const scrapedCount = MATCHES.filter(isMatchScraped).length;
  const progressPercent = Math.round((scrapedCount / totalMatches) * 100);

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>Estadísticas de Jugadores</h1>

      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Líderes de rendimiento acumulados del Mundial 2026 sincronizados con Opta.
      </p>

      {/* Tarjeta de Servidor Scraper */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.02)' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⚡ Cargador de Estadísticas Directo (Local)
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1rem 0' }}>
          Pega la URL de Opta de cualquier partido. El servidor de scraping se encargará de abrir Chromium, saltar las protecciones e inyectar las estadísticas de los jugadores en la base de datos local.
        </p>

        <form onSubmit={handleScrape} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            id="scraper-input-field"
            type="url"
            placeholder="Pega la URL de Opta (ej. https://optaplayerstats.statsperform.com/...)"
            value={scraperUrl}
            onChange={e => setScraperUrl(e.target.value)}
            disabled={scraping}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              background: 'var(--bg-darker)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            className="btn btn-outline" 
            disabled={scraping || !scraperUrl}
            style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16,185,129,0.05)', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {scraping ? 'Cargando...' : '⚡ Cargar Estadísticas'}
          </button>
        </form>

        {scraperMessage && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '0.75rem 1rem', 
            borderRadius: '6px', 
            fontSize: '0.88rem',
            background: scraperMessage.type === 'error' ? 'rgba(239,68,68,0.1)' : scraperMessage.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${scraperMessage.type === 'error' ? 'rgba(239,68,68,0.2)' : scraperMessage.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'}`,
            color: scraperMessage.type === 'error' ? '#fca5a5' : scraperMessage.type === 'success' ? '#a7f3d0' : '#bfdbfe'
          }}>
            {scraperMessage.text}
          </div>
        )}
      </div>

      {/* Selector de Vistas principales */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveView('rankings')} 
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'rankings' ? '2px solid var(--orange)' : '2px solid transparent',
            color: activeView === 'rankings' ? '#fff' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeView === 'rankings' ? 'bold' : 'normal',
            fontSize: '0.95rem'
          }}
        >
          📊 Ver Rankings Acumulados
        </button>
        <button 
          onClick={() => setActiveView('control')} 
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeView === 'control' ? '2px solid var(--orange)' : '2px solid transparent',
            color: activeView === 'control' ? '#fff' : 'var(--text-muted)',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            fontWeight: activeView === 'control' ? 'bold' : 'normal',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          ⚙️ Control de Partidos Escrapeados
          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.08)', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
            {scrapedCount}/{totalMatches}
          </span>
        </button>
      </div>

      {/* VISTA 1: RANKINGS */}
      {activeView === 'rankings' && (
        <div>
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

            <div className="day-tabs" style={{ margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
              <button
                className={`day-tab ${activeTab === 'passes' ? 'active' : ''}`}
                onClick={() => setActiveTab('passes')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                🎯 Pases
              </button>
              <button
                className={`day-tab ${activeTab === 'xg' ? 'active' : ''}`}
                onClick={() => setActiveTab('xg')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                ⚽ xG
              </button>
              <button
                className={`day-tab ${activeTab === 'sca' ? 'active' : ''}`}
                onClick={() => setActiveTab('sca')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                ⚡ SCA
              </button>
              <button
                className={`day-tab ${activeTab === 'duels' ? 'active' : ''}`}
                onClick={() => setActiveTab('duels')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                🛡️ Duelos
              </button>
              <button
                className={`day-tab ${activeTab === 'corners' ? 'active' : ''}`}
                onClick={() => setActiveTab('corners')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                ⛳ Córners
              </button>
              <button
                className={`day-tab ${activeTab === 'tackles' ? 'active' : ''}`}
                onClick={() => setActiveTab('tackles')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                ⚔️ Entradas
              </button>
              <button
                className={`day-tab ${activeTab === 'fouls' ? 'active' : ''}`}
                onClick={() => setActiveTab('fouls')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0.5rem 1rem' }}
              >
                🩹 Faltas
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
                  <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'corners' ? 'var(--accent)' : 'inherit' }}>Córners</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'tackles' ? 'var(--accent)' : 'inherit' }}>Entradas (Tackles)</th>
                  <th style={{ padding: '1rem', textAlign: 'center', color: activeTab === 'fouls' ? 'var(--accent)' : 'inherit' }}>Faltas Rec.</th>
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
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'corners' ? 'bold' : 'normal', color: activeTab === 'corners' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                        {p.corner_kicks}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'tackles' ? 'bold' : 'normal', color: activeTab === 'tackles' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                        {p.tackles}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: activeTab === 'fouls' ? 'bold' : 'normal', color: activeTab === 'fouls' ? 'var(--accent)' : 'inherit', fontFamily: 'monospace' }}>
                        {p.fouls_against}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                        {p.shots_inside_box} / {p.shots_outside_box}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No hay datos acumulados de jugadores aún. Por favor inyecta estadísticas de Opta usando el panel de arriba o el menú de Control de Partidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Glosario de Términos */}
          <div className="card" style={{ marginTop: '2rem', padding: '1.75rem', background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', color: '#fff', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
              📚 Glosario de Términos Tácticos y Métricas Opta
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: 'var(--orange)', fontSize: '0.88rem', marginBottom: '0.2rem' }}>xG (Expected Goals / Goles Esperados)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Mide la probabilidad de que un tiro termine en gol según la distancia, ángulo, posición de defensas y arquero. Un valor acumulado de 1.5 indica que el jugador debió anotar entre 1 y 2 goles según la calidad de sus ocasiones de remate.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6', fontSize: '0.88rem', marginBottom: '0.2rem' }}>SCA (Shot-Creating Actions / Creación de Tiros)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Acciones ofensivas directas (como pases clave, regates exitosos o faltas recibidas) que conducen inmediatamente a un tiro de un compañero. Refleja la influencia creativa del jugador en el último tercio de la cancha.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Pases Acertados (Accurate Passes)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Cantidad total de pases entregados con éxito a un compañero. Es el indicador principal de control, precisión técnica, fluidez en la posesión del balón y visión de juego distributiva.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#a78bfa', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Duelos Ganados (Duels Won)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Enfrentamientos uno a uno ganados por el jugador, tanto terrestres (regates, desposesiones) como aéreos. Mide la fortaleza física, anticipación e intensidad en la disputa directa del balón.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#f43f5e', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Entradas (Tackles)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Desposesiones defensivas exitosas donde el jugador le quita el balón a un oponente. Refleja la efectividad defensiva individual y la agresividad limpia en la recuperación tras pérdida.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Córners (Corner Kicks)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Tiros de esquina ejecutados por el jugador. Indica la especialización en balón parado, centros al área y volumen de peligro en jugadas de táctica fija de su selección.
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#cbd5e1', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Faltas Recibidas (Fouls Against)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Infracciones cometidas por el rival sobre el jugador. Es un indicador indirecto de la dificultad del rival para frenarlo (muy común en extremos movedizos, mediapuntas desequilibrantes o delanteros de espaldas).
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#94a3b8', fontSize: '0.88rem', marginBottom: '0.2rem' }}>Tiros (Área / Fuera)</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Desglose de remates realizados por el jugador dentro del área grande/chica versus remates de larga distancia desde fuera del área. Mide la agresividad ofensiva y el perfil del rematador.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: CONTROL DE PARTIDOS */}
      {activeView === 'control' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="🔍 Filtrar partidos por selección o fase..."
                value={matchSearchQuery}
                onChange={e => setMatchSearchQuery(e.target.value)}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Progreso de estadísticas:</span>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#fff' }}>
                  {scrapedCount} / {totalMatches} partidos ({progressPercent}%)
                </div>
              </div>
              <div style={{ width: '120px', background: 'var(--bg-darker)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, background: '#10b981', height: '100%' }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 'bold' }}>
              <div style={{ width: '120px' }}>Fase</div>
              <div style={{ flex: 1 }}>Partido</div>
              <div style={{ width: '120px', textAlign: 'center' }}>Estado</div>
              <div style={{ width: '220px', textAlign: 'right' }}>Acciones</div>
            </div>

            {MATCHES
              .filter(m => {
                const query = matchSearchQuery.toLowerCase();
                return m.home.toLowerCase().includes(query) || 
                       m.away.toLowerCase().includes(query) || 
                       m.group.toLowerCase().includes(query);
              })
              .map((m, idx) => {
                const scraped = isMatchScraped(m);
                return (
                  <div key={m.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem 1.5rem', 
                    borderBottom: '1px solid var(--border-color)',
                    background: idx % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'
                  }}>
                    {/* Fase */}
                    <div style={{ width: '120px' }}>
                      <span className={`model-badge badge-${m.day.startsWith('jornada') ? 'cb' : 'mc'}`} style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}>
                        {m.group.replace('Fase de Grupos', 'Grupos')}
                      </span>
                    </div>

                    {/* Equipos */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{m.home}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>vs</span>
                      <span style={{ fontWeight: '600', color: '#fff' }}>{m.away}</span>
                    </div>

                    {/* Estado */}
                    <div style={{ width: '120px', textAlign: 'center' }}>
                      {scraped ? (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'rgba(16,185,129,0.1)', 
                          color: '#10b981', 
                          border: '1px solid rgba(16,185,129,0.2)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '20px',
                          fontWeight: 'bold'
                        }}>
                          ✅ Cargado
                        </span>
                      ) : (
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: 'rgba(239,68,68,0.1)', 
                          color: '#ef4444', 
                          border: '1px solid rgba(239,68,68,0.2)', 
                          padding: '0.2rem 0.6rem', 
                          borderRadius: '20px',
                          fontWeight: 'bold'
                        }}>
                          ⚠️ Pendiente
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div style={{ width: '220px', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {!scraped && (
                        <>
                          <a 
                            href={getGoogleSearchUrl(m)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-outline" 
                            style={{ 
                              fontSize: '0.72rem', 
                              padding: '0.3rem 0.6rem', 
                              borderColor: 'var(--border-color)', 
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                              textDecoration: 'none'
                            }}
                          >
                            🔍 Buscar
                          </a>
                          <button
                            onClick={() => {
                              const input = document.getElementById('scraper-input-field');
                              if (input) {
                                input.focus();
                                setScraperUrl('');
                              }
                              // Pre-completar URL con la búsqueda si se desea, o simplemente scroll
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                              setScraperMessage({
                                type: 'info',
                                text: `💡 Haz clic en "Buscar" para abrir la página de Opta de ${m.home} vs ${m.away} en Google. Una vez la tengas, pega su URL aquí arriba.`
                              });
                            }}
                            className="btn btn-outline"
                            style={{ 
                              fontSize: '0.72rem', 
                              padding: '0.3rem 0.6rem', 
                              borderColor: '#10b981', 
                              color: '#10b981',
                              background: 'transparent'
                            }}
                          >
                            📋 Cargar
                          </button>
                        </>
                      )}
                      {scraped && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Sin acciones requeridas
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
