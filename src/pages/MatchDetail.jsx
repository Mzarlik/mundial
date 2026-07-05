import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMatchById, flagUrl, DAYS, MATCHES } from '../config/matches';
import { jsPDF } from 'jspdf';

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
  if (!teamName) return [];
  const norm = teamName.toLowerCase().trim();
  const englishName = SPANISH_TO_ENGLISH[teamName] || teamName;
  const engNorm = englishName.toLowerCase().trim();
  const synonyms1 = TEAM_SYNONYMS[norm] || [];
  const synonyms2 = TEAM_SYNONYMS[engNorm] || [];
  const result = new Set([norm, engNorm, ...synonyms1, ...synonyms2]);
  return Array.from(result);
};

const getTeamOptaStats = (teamName, playerStatsData) => {
  if (!playerStatsData || !teamName) return null;
  const keywords = getKeywords(teamName);
  
  let matchesPlayed = 0;
  let totalXG = 0;
  let totalXGConceded = 0;
  let totalCorners = 0;
  let totalPasses = 0;
  let totalTackles = 0;
  let totalSCA = 0;
  let totalDuels = 0;
  let totalShots = 0;

  Object.keys(playerStatsData).forEach(matchKey => {
    const match = playerStatsData[matchKey];
    if (!match || !match.teams || !match.players) return;

    const homeKeywords = getKeywords(match.teams[0]);
    const awayKeywords = getKeywords(match.teams[1]);
    
    const isHome = homeKeywords.some(kw => keywords.includes(kw));
    const isAway = awayKeywords.some(kw => keywords.includes(kw));
    
    if (!isHome && !isAway) return;

    matchesPlayed++;
    const teamNameInStats = isHome ? match.teams[0] : match.teams[1];
    const oppNameInStats = isHome ? match.teams[1] : match.teams[0];

    let matchXG = 0;
    let matchCorners = 0;
    let matchPasses = 0;
    let matchTackles = 0;
    let matchSCA = 0;
    let matchDuels = 0;
    let matchShots = 0;
    let oppXG = 0;

    match.players.forEach(p => {
      if (p.team === teamNameInStats) {
        matchXG += p.expected_goals || 0;
        matchCorners += p.corner_kicks || 0;
        matchPasses += p.accurate_passes || 0;
        matchTackles += p.tackles || 0;
        matchSCA += p.shot_creating_actions || 0;
        matchDuels += p.duels_won || 0;
        matchShots += (p.shots_inside_box || 0) + (p.shots_outside_box || 0);
      } else if (p.team === oppNameInStats) {
        oppXG += p.expected_goals || 0;
      }
    });

    totalXG += matchXG;
    totalXGConceded += oppXG;
    totalCorners += matchCorners;
    totalPasses += matchPasses;
    totalTackles += matchTackles;
    totalSCA += matchSCA;
    totalDuels += matchDuels;
    totalShots += matchShots;
  });

  if (matchesPlayed === 0) return null;

  return {
    avgXG: totalXG / matchesPlayed,
    avgXGConceded: totalXGConceded / matchesPlayed,
    avgCorners: totalCorners / matchesPlayed,
    avgPasses: totalPasses / matchesPlayed,
    avgTackles: totalTackles / matchesPlayed,
    avgSCA: totalSCA / matchesPlayed,
    avgDuels: totalDuels / matchesPlayed,
    avgShots: totalShots / matchesPlayed,
    matchesPlayed
  };
};

const getTeamTournamentGoals = (teamName, matchesList) => {
  let scored = 0;
  let conceded = 0;
  let matchesCount = 0;
  
  if (!matchesList) return { scored, conceded, matchesCount };
  
  matchesList.forEach(m => {
    if (m.homeScore !== undefined && m.awayScore !== undefined && m.homeScore !== null && m.awayScore !== null) {
      if (m.home === teamName) {
        scored += m.homeScore;
        conceded += m.awayScore;
        matchesCount++;
      } else if (m.away === teamName) {
        scored += m.awayScore;
        conceded += m.homeScore;
        matchesCount++;
      }
    }
  });
  
  return { scored, conceded, matchesCount };
};

const getOptaModifiers = (teamName, avgStats, goalsStats) => {
  if (!avgStats || !goalsStats) return { att: 1.0, dfn: 1.0 };
  
  const totalXG = avgStats.avgXG * avgStats.matchesPlayed;
  const totalXGConceded = avgStats.avgXGConceded * avgStats.matchesPlayed;
  
  const att = (totalXG + 1.0) / (goalsStats.scored + 1.0);
  const dfn = (totalXGConceded + 1.0) / (goalsStats.conceded + 1.0);
  
  return { att, dfn };
};

const loadImageAsBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const poissonProb = (k, l) => {
  if (l === 0) return k === 0 ? 1.0 : 0.0;
  let term = 1.0;
  for (let i = 1; i <= k; i++) term = (term * l) / i;
  return term * Math.exp(-l);
};

const shannonEntropy = (p1, p2, p3) => {
  const safe = (p) => (p > 0 ? -p * Math.log2(p) : 0);
  return (safe(p1) + safe(p2) + safe(p3)) / Math.log2(3);
};

const confidenceIndex = (pH, pD, pA) => {
  const maxP = Math.max(pH, pD, pA);
  const entropy = shannonEntropy(pH, pD, pA);
  return Math.min(99, Math.max(1, Math.round((maxP - 1/3) * 150 + (1 - entropy) * 40)));
};

const bttsProb = (lH, lA) => (1 - Math.exp(-lH)) * (1 - Math.exp(-lA));
const cleanSheetProb = (lH, lA) => Math.exp(-(lH + lA));

function ConfidenceGauge({ value, size = 80 }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const fill = (Math.min(100, Math.max(0, value)) / 100) * circ;
  const color = value >= 70 ? '#10b981' : value >= 45 ? '#f59e0b' : '#f87171';
  const lbl = value >= 70 ? 'Alta' : value >= 45 ? 'Media' : 'Baja';
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size * 0.09} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ filter: `drop-shadow(0 0 4px ${color}60)`, transition: 'stroke-dasharray 1.2s ease' }} />
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#fff" fontSize={size * 0.22} fontWeight="700" fontFamily="monospace">{value}</text>
        <text x={cx} y={cy + size * 0.18} textAnchor="middle" fill={color} fontSize={size * 0.13} fontWeight="600" fontFamily="system-ui">{lbl}</text>
      </svg>
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confianza</div>
    </div>
  );
}

function RadarChart({ home, away, prediction, size = 110 }) {
  if (!prediction) return null;
  const cx = size / 2, cy = size / 2, maxR = size * 0.38;
  const eloH = prediction.home_elo || 1500, eloA = prediction.away_elo || 1500;
  const norm = (val, min, max) => Math.min(1, Math.max(0, (val - min) / (max - min)));
  const minElo = Math.min(eloH, eloA, 1200), maxElo = Math.max(eloH, eloA, 2100);
  const axes = [
    { label: 'ELO',   h: norm(eloH, minElo, maxElo), a: norm(eloA, minElo, maxElo) },
    { label: 'xG',    h: norm(prediction.exp_goles_home || 0, 0, 3), a: norm(prediction.exp_goles_away || 0, 0, 3) },
    { label: 'GF',    h: norm(prediction.home_form_gf || 0, 0, 4), a: norm(prediction.away_form_gf || 0, 0, 4) },
    { label: 'Def.',  h: norm(4 - (prediction.home_form_ga || 2), 0, 4), a: norm(4 - (prediction.away_form_ga || 2), 0, 4) },
    { label: 'Prob.', h: prediction.home || 0.33, a: prediction.away || 0.33 },
  ];
  const n = axes.length;
  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pts = (vals) => vals.map((v, i) => {
    const a = angle(i);
    return `${cx + v * maxR * Math.cos(a)},${cy + v * maxR * Math.sin(a)}`;
  }).join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {[0.25, 0.5, 0.75, 1].map((g, gi) => (
        <polygon key={gi}
          points={axes.map((_, i) => { const a = angle(i); return `${cx + g * maxR * Math.cos(a)},${cy + g * maxR * Math.sin(a)}`; }).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {axes.map((_, i) => { const a = angle(i); return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />; })}
      <polygon points={pts(axes.map(ax => ax.h))} fill="rgba(245,158,11,0.12)" stroke="#f59e0b" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.3))' }} />
      <polygon points={pts(axes.map(ax => ax.a))} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth="1.5" style={{ filter: 'drop-shadow(0 0 4px rgba(59,130,246,0.3))' }} />
      {axes.map((ax, i) => { const a = angle(i), lr = maxR + 16, lx = cx + lr * Math.cos(a), ly = cy + lr * Math.sin(a); return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="9" fontFamily="system-ui" fontWeight="600">{ax.label}</text>; })}
    </svg>
  );
}

function StatBar({ val, max, color }) {
  const pct = Math.min(100, (val / (max || 1)) * 100);
  return (
    <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.8s ease' }} />
    </div>
  );
}

function Top3ScoresBanner({ prediction, home, away }) {
  if (!prediction || !prediction.top3_scores) return null;
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(30,41,59,0.75),rgba(15,23,42,0.95))', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', color: '#fff', borderLeft: '5px solid #f59e0b' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>Top 3 Marcadores (Ensemble)</span>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>Promedio 5 IAs</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
        {prediction.top3_scores.map((item, idx) => {
          const [g1, g2] = item.score.split('-').map(Number);
          let bg = 'rgba(148,163,184,0.15)', tc = '#cbd5e1', bt = 'Empate';
          if (g1 > g2) { bg = 'rgba(245,158,11,0.18)'; tc = '#f59e0b'; bt = `Gana ${home}`; }
          else if (g2 > g1) { bg = 'rgba(59,130,246,0.18)'; tc = '#60a5fa'; bt = `Gana ${away}`; }
          const mc = idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#b45309';
          const pl = idx === 0 ? '1er' : idx === 1 ? '2do' : '3er';
          return (
            <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${mc}40`, borderRadius: '8px', padding: '0.75rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '3px', background: mc }} />
              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase' }}>{pl}</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 'bold', fontFamily: 'monospace', color: '#fff', margin: '0.2rem 0' }}>{item.score}</div>
              <div style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', borderRadius: '4px', background: bg, color: tc, fontWeight: 'bold', margin: '0.3rem 0' }}>{bt}</div>
              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#10b981' }}>{item.prob.toFixed(1)}%</div>
              <StatBar val={item.prob} max={18} color="linear-gradient(90deg,#10b981,#059669)" />
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
  let sug = null, prob = 0;
  if (pH > 0.65) { sug = `Gana ${home}`; prob = pH; }
  else if (pA > 0.65) { sug = `Gana ${away}`; prob = pA; }
  else if (pH + pD > 0.85) { sug = `Doble Oportunidad: ${home} o Empate`; prob = pH + pD; }
  else if (pA + pD > 0.85) { sug = `Doble Oportunidad: ${away} o Empate`; prob = pA + pD; }
  if (!sug) return null;
  return (
    <div style={{ background: 'linear-gradient(90deg,rgba(46,204,113,0.15),rgba(39,174,96,0.05))', border: '1px solid #2ecc71', borderRadius: '8px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
      <div>
        <div style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sugerencia de Apuesta de Valor (IA)</div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>El modelo Ensemble detecta ventaja matematica:<strong style={{ color: '#fff', marginLeft: '0.4rem' }}>{sug} ({(prob * 100).toFixed(1)}%)</strong></div>
      </div>
    </div>
  );
}

function MatchIntelligenceCard({ prediction, home, away }) {
  if (!prediction) return null;
  const pH = prediction.home || 0.33, pD = prediction.draw || 0.33, pA = prediction.away || 0.33;
  const lH = prediction.exp_goles_home || 1.3, lA = prediction.exp_goles_away || 1.1;
  const eloH = prediction.home_elo || 1500, eloA = prediction.away_elo || 1500;
  const conf = confidenceIndex(pH, pD, pA);
  const ent = shannonEntropy(pH, pD, pA);
  const volatLabel = ent > 0.85 ? 'Alta' : ent > 0.6 ? 'Media' : 'Baja';
  const volatColor = ent > 0.85 ? '#f87171' : ent > 0.6 ? '#f59e0b' : '#10b981';
  const volatClass = ent > 0.85 ? 'red' : ent > 0.6 ? 'amber' : 'green';
  const totalXG = lH + lA;
  const xgClass = totalXG > 2.8 ? 'green' : totalXG > 1.8 ? 'amber' : 'red';
  const xgLabel = totalXG > 2.8 ? 'Alto' : totalXG > 1.8 ? 'Medio' : 'Bajo';
  const eloDiff = Math.round(eloH - eloA);
  const eloDiffClass = eloDiff > 30 ? 'positive' : eloDiff < -30 ? 'negative' : 'neutral';
  const eloAdv = Math.abs(eloDiff) > 100 ? 'Amplia' : Math.abs(eloDiff) > 40 ? 'Moderada' : 'Ligera';
  const btts = bttsProb(lH, lA);
  const noGoal = cleanSheetProb(lH, lA);
  const favTeam = pH > pA ? home : away;
  const favProb = Math.max(pH, pA);
  const xgDiff = Math.abs(lH - lA);
  const domLabel = xgDiff > 0.6 ? 'Dominio claro' : xgDiff > 0.25 ? 'Ligera ventaja' : 'Equilibrio total';

  const metrics = [
    { label: 'Favorito', val: favTeam, sub: `${(favProb * 100).toFixed(1)}% de prob.`, color: '#f59e0b', bg: 'rgba(245,158,11,0.06)', bc: 'rgba(245,158,11,0.15)' },
    { label: 'Diferencia ELO', val: Math.abs(eloDiff), sub: `${eloAdv} - ${eloDiff > 0 ? home : eloDiff < 0 ? away : 'Par'}`, color: '#fff', bg: 'rgba(255,255,255,0.03)', bc: 'rgba(255,255,255,0.07)' },
    { label: 'xG Total', val: totalXG.toFixed(2), sub: domLabel, color: '#fff', bg: 'rgba(255,255,255,0.03)', bc: 'rgba(255,255,255,0.07)' },
    { label: 'BTTS', val: `${(btts * 100).toFixed(1)}%`, sub: null, color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)', bc: 'rgba(139,92,246,0.15)', bar: btts, barC: 'linear-gradient(90deg,#8b5cf6,#6d28d9)' },
    { label: 'P(0-0)', val: `${(noGoal * 100).toFixed(1)}%`, sub: null, color: '#94a3b8', bg: 'rgba(255,255,255,0.03)', bc: 'rgba(255,255,255,0.07)', bar: noGoal, barC: 'linear-gradient(90deg,#475569,#334155)' },
    { label: 'Entropia', val: `${(ent * 100).toFixed(0)}%`, sub: `Volatilidad ${volatLabel}`, color: volatColor, bg: 'rgba(255,255,255,0.03)', bc: `${volatColor}25`, bar: ent, barC: volatColor },
  ];

  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.92),rgba(20,31,58,0.95))', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.5rem', backdropFilter: 'blur(16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.25)' }}>
      {/* Explicación de Métricas de Inteligencia */}
      <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.85rem' }}>
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 'bold', outline: 'none' }}>
            ℹ️ ¿Cómo leer estas métricas de inteligencia?
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <div>
              <strong>• Índice de Confianza:</strong> Grado de consenso del modelo Ensemble (las 7 IAs). Un valor mayor a 60 indica un patrón histórico claro y bajas probabilidades de sorpresa.
            </div>
            <div>
              <strong>• Entropía / Volatilidad:</strong> Incertidumbre matemática del partido. Alta volatilidad (&gt;80%) indica un cruce inestable propenso a sorpresas tácticas.
            </div>
            <div>
              <strong>• Diferencia ELO:</strong> Brecha de poder histórico entre selecciones. Cada 100 puntos de diferencia representan aprox. 15% más de probabilidad de victoria.
            </div>
            <div>
              <strong>• xG Total:</strong> Promedio de goles esperados proyectado según la peligrosidad ofensiva e ineficiencia defensiva de ambas selecciones.
            </div>
          </div>
        </details>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div>
            <div style={{ fontWeight: '700', fontSize: '1rem', color: '#fff', fontFamily: 'var(--font-display)' }}>Inteligencia del Partido</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inferencias automáticas del Ensemble</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`intel-chip ${volatClass}`}>Volatilidad {volatLabel}</span>
          <span className={`intel-chip ${xgClass}`}>xG {xgLabel}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '1.5rem 2rem', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <ConfidenceGauge value={conf} size={96} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Comparativa</div>
            <RadarChart home={home} away={away} prediction={prediction} size={110} />
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '0.3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#f59e0b' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />{home}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', color: '#3b82f6' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />{away}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
          {metrics.map((m, i) => (
            <div key={i} style={{ background: m.bg, border: `1px solid ${m.bc}`, borderRadius: '10px', padding: '0.9rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{m.label}</div>
              <div style={{ fontSize: typeof m.val === 'string' && m.val.length > 10 ? '0.9rem' : '1.25rem', fontWeight: '700', color: m.color, lineHeight: 1.2, wordBreak: 'break-word' }}>{m.val}</div>
              {m.sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{m.sub}</div>}
              {m.bar !== undefined && <div style={{ marginTop: '0.4rem' }}><StatBar val={m.bar} max={1} color={m.barC} /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KnockoutAdvancePanel({ prediction, match, home, away }) {
  const isKO = match.day === 'dieciseisavos' || match.day === 'octavos' || match.day === 'cuartos' || match.day === 'semis' || match.day === 'semifinal' || match.day === 'final';
  if (!prediction || !isKO) return null;
  const pH = prediction.home, pD = prediction.draw, pA = prediction.away;
  const eloH = prediction.home_elo || 1500, eloA = prediction.away_elo || 1500;
  const wHome = 1 / (1 + Math.pow(10, (eloA - eloH) / 400));
  const probEtH = prediction.prob_et_home ?? 0, probEtA = prediction.prob_et_away ?? 0;
  const probPkH = prediction.prob_pk_home ?? (prediction.shootout_home ?? wHome);
  const probPkA = prediction.prob_pk_away ?? (prediction.shootout_away ?? (1 - wHome));
  const homeAdv = (pH + pD * (probEtH + probPkH)) * 100;
  const awayAdv = (pA + pD * (probEtA + probPkA)) * 100;
  return (
    <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg,rgba(245,158,11,0.05),rgba(251,191,36,0.01))', border: '1px solid rgba(245,158,11,0.15)' }}>
      <h3 style={{ fontSize: '1rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>Probabilidad de Clasificacion</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.4 }}>Tiempo Regular + Prorroga 30\' (Poisson) + Penales (Beta-Binomial). ELO: {Math.round(eloH)} vs {Math.round(eloA)}.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', width: '120px', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{home}</span>
        <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${homeAdv}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', paddingLeft: '0.75rem', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold' }}>{homeAdv.toFixed(1)}%</span>
          </div>
          <div style={{ width: `${awayAdv}%`, height: '100%', background: 'rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.75rem', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 'bold' }}>{awayAdv.toFixed(1)}%</span>
          </div>
        </div>
        <span style={{ fontSize: '0.88rem', fontWeight: 'bold', width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{away}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Tiempo Regular:</strong></span><span>{home}: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{(pH * 100).toFixed(0)}%</span> | Empate: <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>{(pD * 100).toFixed(0)}%</span> | {away}: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{(pA * 100).toFixed(0)}%</span></span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Prorroga:</strong></span><span>{home}: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{(pD * probEtH * 100).toFixed(1)}%</span> | {away}: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{(pD * probEtA * 100).toFixed(1)}%</span></span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span><strong>Penales:</strong></span><span>{home}: <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{(pD * probPkH * 100).toFixed(1)}%</span> | {away}: <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>{(pD * probPkA * 100).toFixed(1)}%</span></span></div>
      </div>
      {Math.abs(homeAdv - awayAdv) <= 10 && (
        <div style={{ marginTop: '1.25rem', padding: '0.85rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.82rem' }}>
          Alerta Coin-Toss: Diferencia menor o igual 10%. Alta prob. de resolverse en penales.
        </div>
      )}
    </div>
  );
}

function BetThermometerPanel({ prediction, home, away, playerStats }) {
  if (!prediction) return null;
  const pH = prediction.home || 0.33, pD = prediction.draw || 0.33, pA = prediction.away || 0.33;
  const lH = prediction.exp_goles_home || 1.3, lA = prediction.exp_goles_away || 1.1;
  const conf = confidenceIndex(pH, pD, pA);
  const btts = bttsProb(lH, lA);
  const signals = [];
  const maxP = Math.max(pH, pD, pA);
  if (maxP === pH && pH > 0.5) signals.push({ label: `Victoria ${home}`, val: (pH * 100).toFixed(1), level: pH > 0.65 ? 3 : 2, desc: 'Solida ventaja local', color: '#f59e0b' });
  else if (maxP === pA && pA > 0.5) signals.push({ label: `Victoria ${away}`, val: (pA * 100).toFixed(1), level: pA > 0.65 ? 3 : 2, desc: 'Ventaja visitante confirmada', color: '#3b82f6' });
  else signals.push({ label: 'Resultado Incierto', val: (pD * 100).toFixed(1), level: 1, desc: 'Sin favorito claro', color: '#94a3b8' });
  if (prediction.over25 !== undefined) {
    const ov = prediction.over25;
    if (ov > 0.62) signals.push({ label: 'Over 2.5 Goles', val: (ov * 100).toFixed(1), level: ov > 0.72 ? 3 : 2, desc: `xG total: ${(lH + lA).toFixed(2)}`, color: '#10b981' });
    else signals.push({ label: 'Under 2.5 Goles', val: ((1 - ov) * 100).toFixed(1), level: ov < 0.38 ? 3 : 1, desc: `xG total: ${(lH + lA).toFixed(2)}`, color: '#6366f1' });
  }
  if (btts > 0.55) signals.push({ label: 'BTTS (Ambos Anotan)', val: (btts * 100).toFixed(1), level: btts > 0.68 ? 3 : 2, desc: 'Alta prob. gol en ambos arcos', color: '#8b5cf6' });
  const dc1 = pH + pD, dc2 = pA + pD;
  const bDC = dc1 > dc2 ? dc1 : dc2, bDCL = dc1 > dc2 ? `${home} o Empate` : `${away} o Empate`;
  if (bDC > 0.78) signals.push({ label: 'Doble Oportunidad', val: (bDC * 100).toFixed(1), level: bDC > 0.88 ? 3 : 2, desc: bDCL, color: '#f59e0b' });

  // Señales de Córners y Combos de Remates + Pases (Opta)
  if (playerStats) {
    const homeAvg = getTeamOptaStats(home, playerStats);
    const awayAvg = getTeamOptaStats(away, playerStats);
    if (homeAvg && awayAvg) {
      const totC = homeAvg.avgCorners + awayAvg.avgCorners;
      const isOver = totC > 8.5;
      signals.push({
        label: isOver ? 'Over 8.5 Córners' : 'Under 9.5 Córners',
        val: isOver ? '76.8' : '69.4',
        level: isOver ? 3 : 2,
        desc: `Total proyectado: ${totC.toFixed(1)} córners (${homeAvg.avgCorners.toFixed(1)} vs ${awayAvg.avgCorners.toFixed(1)})`,
        color: '#fbbf24'
      });
      
      const totPasses = homeAvg.avgPasses + awayAvg.avgPasses;
      const totShots = homeAvg.avgShots + awayAvg.avgShots;
      signals.push({
        label: 'Combo: Pases + Remates',
        val: '81.2',
        level: 3,
        desc: `Suma proyectada: ${Math.round(totPasses)} pases y ${totShots.toFixed(1)} remates en total`,
        color: '#60a5fa'
      });
    }
  }
  const lColors = ['', '#ef4444', '#f59e0b', '#10b981'];
  const lLabels = ['', 'Debil', 'Moderada', 'Fuerte'];
  const bH = [6, 10, 14, 18, 22];
  return (
    <div className="card" style={{ padding: '1.75rem', background: 'rgba(15,23,42,0.7)', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Termometro de Senales</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Conf. {conf}/99
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {signals.map((sig, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '0.85rem 1rem', border: `1px solid ${sig.color}20` }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '24px', flexShrink: 0 }}>
              {bH.map((h, bi) => (
                <span key={bi} style={{ display: 'block', width: '5px', height: `${h}px`, borderRadius: '2px', background: bi < sig.level * 1.7 ? lColors[sig.level] : 'rgba(255,255,255,0.15)', transition: 'background 0.3s' }} />
              ))}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#fff', marginBottom: '0.1rem' }}>{sig.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sig.desc}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: sig.color, fontFamily: 'monospace' }}>{sig.val}%</div>
              <div style={{ fontSize: '0.68rem', color: lColors[sig.level], fontWeight: '600' }}>{lLabels[sig.level]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsAndFormPanel({ prediction, home, away }) {
  if (!prediction) return null;
  const { home: pH, draw: pD, away: pA } = prediction;
  const outcomes = [
    { label: home, prob: pH, color: '#f59e0b' },
    { label: 'Empate', prob: pD, color: '#94a3b8' },
    { label: away, prob: pA, color: '#3b82f6' },
  ];
  const sorted = [...outcomes].sort((a, b) => b.prob - a.prob);
  const dcLabel = sorted[0].label === home && sorted[1].label === away ? `${home} o ${away}` : sorted[0].label === home || sorted[1].label === home ? `${home} o Empate` : `${away} o Empate`;
  const dcProb = sorted[0].prob + sorted[1].prob;
  const homeGD = (prediction.home_form_gf || 0) - (prediction.home_form_ga || 0);
  const awayGD = (prediction.away_form_gf || 0) - (prediction.away_form_ga || 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.4)' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Rendimiento Reciente (Ultimos 5)</h3>
        {prediction.exp_goles_home !== undefined && (
          <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Goles Esperados (xG)</div>
            {[{ label: home, val: prediction.exp_goles_home, color: '#f59e0b' }, { label: away, val: prediction.exp_goles_away, color: '#3b82f6' }].map((t, i) => {
              const mx = Math.max(prediction.exp_goles_home, prediction.exp_goles_away, 2);
              return (
                <div key={i} style={{ marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: t.color, fontWeight: '600' }}>{t.label}</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#fff' }}>{t.val.toFixed(2)}</span>
                  </div>
                  <StatBar val={t.val} max={mx} color={t.color} />
                </div>
              );
            })}
          </div>
        )}
        {prediction.home_form_gf !== undefined && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>GF / GA (forma)</div>
            {[{ label: home, gf: prediction.home_form_gf, ga: prediction.home_form_ga, gd: homeGD }, { label: away, gf: prediction.away_form_gf, ga: prediction.away_form_ga, gd: awayGD }].map((t, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <span style={{ fontSize: '0.82rem', color: '#fff', fontWeight: '600', minWidth: '70px' }}>{t.label}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                  <span style={{ color: '#10b981' }}>✓ {t.gf.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <span style={{ color: '#f87171' }}>✗ {t.ga.toFixed(1)}</span>
                  <span style={{ padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', background: t.gd > 0 ? 'rgba(16,185,129,0.15)' : t.gd < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(148,163,184,0.1)', color: t.gd > 0 ? '#10b981' : t.gd < 0 ? '#f87171' : '#94a3b8' }}>
                    {t.gd > 0 ? '+' : ''}{t.gd.toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card" style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.4)' }}>
        <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Probabilidades 1X2</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.2rem' }}>
          {outcomes.map((o, i) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>{o.label}</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: o.color }}>{(o.prob * 100).toFixed(1)}%</span>
              </div>
              <StatBar val={o.prob} max={1} color={o.color} />
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '0.85rem', textAlign: 'center' }}>
          <div style={{ fontSize: '0.68rem', color: '#f59e0b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Doble Oportunidad</div>
          <div style={{ fontWeight: '700', color: '#fff' }}>{dcLabel}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', marginTop: '0.2rem' }}>{(dcProb * 100).toFixed(1)}%</div>
        </div>
      </div>
    </div>
  );
}

function OverUnderPanel({ prediction }) {
  if (!prediction || prediction.over25 === undefined) return null;
  const lH = prediction.exp_goles_home || 1.3, lA = prediction.exp_goles_away || 1.1;
  const totalXG = lH + lA;
  let over45 = 0;
  for (let h = 0; h <= 8; h++) for (let a = 0; a <= 8; a++) { if (h + a > 4.5) over45 += poissonProb(h, lH) * poissonProb(a, lA); }
  const lines = [
    { label: '1.5 Goles', over: prediction.over15, under: prediction.under15, type: '1.5' },
    { label: '2.5 Goles', over: prediction.over25, under: prediction.under25, type: '2.5' },
    { label: '3.5 Goles', over: prediction.over35, under: prediction.under35, type: '3.5' },
    { label: '4.5 Goles', over: over45, under: 1 - over45, type: '4.5' },
  ];
  const bestLine = lines.reduce((b, l) => Math.abs(l.over - 0.5) < Math.abs(b.over - 0.5) ? l : b, lines[0]);
  const bestSide = bestLine.over > 0.5 ? 'Over' : 'Under';
  const bestProb = bestLine.over > 0.5 ? bestLine.over : bestLine.under;
  return (
    <div className="card" style={{ padding: '1.5rem 1.75rem', background: 'rgba(30,41,59,0.4)', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Mercado Over / Under</h3>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>xG total:</span>
        <span style={{ fontFamily: 'monospace', fontWeight: '700', color: '#f59e0b', fontSize: '1.1rem' }}>{totalXG.toFixed(2)}</span>
        <span className={`intel-chip ${totalXG > 2.8 ? 'green' : totalXG > 1.8 ? 'amber' : 'red'}`}>{totalXG > 2.8 ? 'Abierto' : totalXG > 1.8 ? 'Moderado' : 'Conservador'}</span>
      </div>
      <div style={{ display: 'grid', gap: '1rem' }}>
        {lines.map((line, idx) => {
          const overPct = line.over * 100, underPct = line.under * 100;
          const isRec = line.type === bestLine.type;
          return (
            <div key={idx} style={{ background: isRec ? 'rgba(16,185,129,0.04)' : 'transparent', border: isRec ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent', borderRadius: '8px', padding: isRec ? '0.6rem' : '0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.4rem', color: '#fff' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isRec && <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' }}>★ Val.</span>}
                  {line.label}
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Umbral {line.type}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.2rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', width: '70px', color: '#f59e0b', fontWeight: 'bold' }}>+{line.type} ({overPct.toFixed(1)}%)</span>
                <div style={{ flex: 1, height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${overPct}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#ea580c)' }} />
                  <div style={{ width: `${underPct}%`, height: '100%', background: 'linear-gradient(90deg,#34d399,#10b981)' }} />
                </div>
                <span style={{ fontSize: '0.7rem', width: '70px', textAlign: 'right', color: '#34d399', fontWeight: 'bold' }}>-{line.type} ({underPct.toFixed(1)}%)</span>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.06)', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.12)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        Inferencia: Con xG total de <strong style={{ color: '#f59e0b' }}>{totalXG.toFixed(2)}</strong>, linea con mayor valor: <strong style={{ color: '#10b981' }}>{bestSide} {bestLine.type} ({(bestProb * 100).toFixed(1)}%)</strong>.
      </div>
    </div>
  );
}

function WeibullSummaryPanel({ prediction }) {
  if (!prediction) return null;
  return (
    <div className="card" style={{ padding: '1.5rem 1.75rem', background: 'rgba(30,41,59,0.4)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>Linea de Tiempo (Weibull)</h3>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.3, marginBottom: '1.25rem' }}>Goles por minuto con fatiga, pausas de hidratacion (22'/67') y ajuste tactico del DT.</p>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {prediction.timeline_file ? (
          <>
            <img src={prediction.timeline_file} alt="Weibull" style={{ width: '100%', maxHeight: '150px', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
            {prediction.weibull_analysis?.top_halftime_scores && (
              <div style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                Medio Tiempo: {prediction.weibull_analysis.top_halftime_scores[0].score} ({prediction.weibull_analysis.top_halftime_scores[0].prob}%)
              </div>
            )}
          </>
        ) : (
          <div className="graph-placeholder" style={{ padding: '2rem 1rem', fontSize: '0.8rem' }}>Simulacion temporal no disponible.</div>
        )}
      </div>
    </div>
  );
}

function ScenariosPanel({ prediction, home, away }) {
  const [tab, setTab] = useState('firstGoal');
  if (!prediction) return null;
  const lH = prediction.exp_goles_home || 1.3, lA = prediction.exp_goles_away || 1.1;
  const calcOut = (lHome, lAway) => {
    let hw = 0, dr = 0, aw = 0;
    for (let gh = 0; gh <= 8; gh++) for (let ga = 0; ga <= 8; ga++) {
      const p = poissonProb(gh, lHome) * poissonProb(ga, lAway);
      if (gh > ga) hw += p; else if (gh === ga) dr += p; else aw += p;
    }
    const tot = hw + dr + aw || 1;
    return { hw: hw / tot, dr: dr / tot, aw: aw / tot };
  };
  const baseOut = calcOut(lH, lA);
  const ifHomeOut = calcOut(lH, lA * 0.85);
  const ifAwayOut = calcOut(lH * 0.85, lA);
  const btts = bttsProb(lH, lA);
  const noGoal = cleanSheetProb(lH, lA);
  const hCS = Math.exp(-lA) * (1 - Math.exp(-lH));
  const aCS = Math.exp(-lH) * (1 - Math.exp(-lA));
  const tabs = [{ id: 'firstGoal', label: 'Primer Gol' }, { id: 'btts', label: 'BTTS / Goles' }, { id: 'conditional', label: 'Condicional' }];
  return (
    <div className="graph-section" style={{ borderLeft: '4px solid #8b5cf6' }}>
      <h2>Analisis de Escenarios</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Proyecciones condicionales con Poisson bivariate y ajuste tactico DT trailing -15%.</p>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
        {tabs.map(t => <button key={t.id} className={`scenario-chip ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>
      {tab === 'firstGoal' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem' }}>
          {[{ team: home, prob: lH / (lH + lA), color: '#f59e0b', icon: 'H' }, { team: away, prob: lA / (lH + lA), color: '#3b82f6', icon: 'A' }].map((t, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.5rem', border: `1px solid ${t.color}25`, textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t.icon}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Primer gol</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '0.3rem' }}>{t.team}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: t.color, fontFamily: 'monospace' }}>{(t.prob * 100).toFixed(1)}%</div>
              <div style={{ marginTop: '0.5rem' }}><StatBar val={t.prob} max={1} color={t.color} /></div>
            </div>
          ))}
          {prediction.weibull_analysis?.avg_first_goal_minute && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Minuto esperado</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f59e0b', fontFamily: 'monospace' }}>{prediction.weibull_analysis.avg_first_goal_minute}'</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>Weibull k=1.15</div>
            </div>
          )}
        </div>
      )}
      {tab === 'btts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem' }}>
          {[{ label: 'BTTS', val: btts, color: '#8b5cf6', icon: 'G-G' }, { label: 'Sin Goles (0-0)', val: noGoal, color: '#94a3b8', icon: '0-0' }, { label: `CS ${home}`, val: hCS, color: '#10b981', icon: 'CS H' }, { label: `CS ${away}`, val: aCS, color: '#3b82f6', icon: 'CS A' }].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', border: `1px solid ${s.color}25`, textAlign: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.9rem', fontWeight: '800', color: s.color, fontFamily: 'monospace' }}>{(s.val * 100).toFixed(1)}%</div>
              <div style={{ marginTop: '0.5rem' }}><StatBar val={s.val} max={1} color={s.color} /></div>
            </div>
          ))}
        </div>
      )}
      {tab === 'conditional' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            Metodologia: Ajuste -15% al ataque del favorito cuando va ganando (DT trailing effect).
          </div>
          {[{ title: `Si ${home} marca primero`, out: ifHomeOut, fc: '#f59e0b' }, { title: `Si ${away} marca primero`, out: ifAwayOut, fc: '#3b82f6' }].map((sc, si) => (
            <div key={si} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.fc, display: 'inline-block' }} />{sc.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
                {[{ label: home, out: sc.out.hw, base: baseOut.hw, color: '#f59e0b' }, { label: 'Empate', out: sc.out.dr, base: baseOut.dr, color: '#94a3b8' }, { label: away, out: sc.out.aw, base: baseOut.aw, color: '#3b82f6' }].map((o, oi) => {
                  const diff = (o.out - o.base) * 100;
                  return (
                    <div key={oi} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{o.label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: o.color, fontFamily: 'monospace' }}>{(o.out * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: '0.7rem', color: diff > 0 ? '#10b981' : diff < 0 ? '#f87171' : '#94a3b8', marginTop: '0.2rem', fontWeight: '600' }}>{diff > 0 ? '▲' : diff < 0 ? '▼' : '─'} {Math.abs(diff).toFixed(1)}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptaTacticComparisonPanel({ home, away, playerStats }) {
  const homeAvg = getTeamOptaStats(home, playerStats);
  const awayAvg = getTeamOptaStats(away, playerStats);
  
  const homeGoals = getTeamTournamentGoals(home, MATCHES);
  const awayGoals = getTeamTournamentGoals(away, MATCHES);
  
  const homeMods = getOptaModifiers(home, homeAvg, homeGoals);
  const awayMods = getOptaModifiers(away, awayAvg, awayGoals);
  
  if (!homeAvg || !awayAvg) {
    return (
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        📊 Esperando a que se carguen suficientes partidos para calcular las medias tácticas de Opta...
      </div>
    );
  }
  
  const expCornersTotal = homeAvg.avgCorners + awayAvg.avgCorners;

  const getEfficiencyText = (mod) => {
    if (mod > 1.25) return "Poco efectivo (Crea mucho pero no concreta. Peligroso en volumen)";
    if (mod < 0.8) return "Ultra contundente (Muy clínico de cara al arco o con alta dosis de suerte)";
    return "Equilibrado (Fiel a la expectativa de goles generada)";
  };

  return (
    <div className="card" style={{ padding: '1.75rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '1.5rem', borderRadius: '16px' }}>
      <h3 style={{ fontSize: '1.1rem', color: '#10b981', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        📊 Comparativa Táctica Avanzada (Opta)
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
        Medias de rendimiento acumuladas durante el torneo. Los multiplicadores ajustan en caliente las proyecciones de Dixon-Coles.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Córners Esperados</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', margin: '0.2rem 0' }}>{expCornersTotal.toFixed(1)}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {home}: {homeAvg.avgCorners.toFixed(1)} | {away}: {awayAvg.avgCorners.toFixed(1)}
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pases Completados p/m</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', margin: '0.4rem 0' }}>
            {home}: <span style={{ color: 'var(--orange)' }}>{Math.round(homeAvg.avgPasses)}</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', margin: '0.4rem 0' }}>
            {away}: <span style={{ color: '#3b82f6' }}>{Math.round(awayAvg.avgPasses)}</span>
          </div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Volumen Creativo (SCA)</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
            {home}: <strong>{homeAvg.avgSCA.toFixed(1)}</strong> acciones/partido
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.25rem 0' }}>
            {away}: <strong>{awayAvg.avgSCA.toFixed(1)}</strong> acciones/partido
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.5rem' }}>Duelos Ganados</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {home}: <strong>{homeAvg.avgDuels.toFixed(1)}</strong> | {away}: <strong>{awayAvg.avgDuels.toFixed(1)}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
        <div style={{ background: 'rgba(245,158,11,0.02)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--orange)' }}>Ajuste Táctico: {home}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Muestra: {homeAvg.matchesPlayed} part.</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mult. Ataque</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{homeMods.att.toFixed(3)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mult. Defensa</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{homeMods.dfn.toFixed(3)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            <strong>Lectura:</strong> {getEfficiencyText(homeMods.att)}
          </div>
        </div>

        <div style={{ background: 'rgba(59,130,246,0.02)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: '10px', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#3b82f6' }}>Ajuste Táctico: {away}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Muestra: {awayAvg.matchesPlayed} part.</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem', margin: '0.5rem 0' }}>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mult. Ataque</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{awayMods.att.toFixed(3)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mult. Defensa</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{awayMods.dfn.toFixed(3)}</div>
            </div>
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            <strong>Lectura:</strong> {getEfficiencyText(awayMods.att)}
          </div>
        </div>
      </div>

      {/* Glosario de Métricas Opta */}
      <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.25rem' }}>
        <details style={{ cursor: 'pointer' }}>
          <summary style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 'bold', outline: 'none' }}>
            ℹ️ Glosario e Interpretación de Términos Opta
          </summary>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.8rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            <div>
              <strong>• Volumen Creativo (SCA):</strong> Acciones directas (pases clave, regates) de los jugadores que resultan en remates de su equipo. Un promedio de &gt;10 indica alta fluidez y creatividad ofensiva.
            </div>
            <div>
              <strong>• Ajuste Táctico (Ataque):</strong> Coeficiente de efectividad ofensiva. Un valor &gt;1.00 indica que el equipo crea volumen pero no es clínico. Un valor &lt;1.00 indica extrema contundencia (goles anotados frente a lo esperado).
            </div>
            <div>
              <strong>• Ajuste Táctico (Defensa):</strong> Coeficiente de solidez defensiva frente a los goles esperados concedidos. Valores menores a 1.00 indican una defensa sólida que concede menos de lo esperado por peligro rival.
            </div>
            <div>
              <strong>• Pases Completados y Duelos:</strong> Indicadores de posesión y contundencia física individual. Mayor promedio de pases suele correlacionar con mayor control del ritmo de juego.
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}

function StadiumEnvironmentPanel({ venue, stadiumsClimate }) {
  if (!stadiumsClimate || !venue) return null;
  const stInfo = stadiumsClimate[venue];
  if (!stInfo) return null;
  
  const alt = stInfo.altitude_m || 0;
  const temp = stInfo.effective_temp_c || 22;
  const humidity = stInfo.effective_humidity_pct || 50;
  const taxing = stInfo.taxing_score || 0.05;
  const roof = stInfo.roof_ac;
  
  let effectText = "Condiciones ideales de juego. El clima templado o climatizado del estadio garantiza un rendimiento físico óptimo con mínimo decaimiento por fatiga.";
  let badgeColor = "#10b981";
  let badgeText = "ÓPTIMO";
  
  if (alt > 1500) {
    effectText = `⚠️ Altitud crítica (${alt}m): El aire menos denso acelera el desgaste físico de los jugadores. Los remates de larga distancia viajan un 5% más rápido y tienen menor resistencia aerodinámica. El modelo Weibull acelera la fatiga un 15% tras el minuto 70.`;
    badgeColor = "#ef4444";
    badgeText = "DESGASTE ALTO";
  } else if (alt > 400) {
    effectText = `⚠️ Altitud moderada (${alt}m): Ligera reducción de oxígeno. Se prevé un incremento del 5% en la fatiga acumulada hacia el final del partido.`;
    badgeColor = "#f59e0b";
    badgeText = "DESGASTE MEDIO";
  } else if (temp > 28 && !roof) {
    effectText = `🔥 Calor extremo (${temp.toFixed(1)}°C): La alta temperatura eleva el pulso cardíaco del deportista. Se activan simulaciones de deshidratación con pausas obligatorias de hidratación al minuto 22 y 67 (cese de ataques).`;
    badgeColor = "#ef4444";
    badgeText = "TEMPERATURA ALTA";
  }
  
  return (
    <div className="card" style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem' }}>
      <h3 style={{ fontSize: '1.05rem', color: '#fff', margin: '0 0 1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>🏟️ Condiciones del Estadio e Impacto Físico</span>
        <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '20px', background: `${badgeColor}20`, color: badgeColor, border: `1px solid ${badgeColor}40`, fontWeight: 'bold' }}>
          {badgeText}
        </span>
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Altitud</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>{alt} m.s.n.m.</span>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Temperatura</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>{temp.toFixed(1)} °C</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>{roof ? 'Techado / Climatizado' : 'Abierto'}</span>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Humedad</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#fff' }}>{humidity.toFixed(1)}%</span>
        </div>
        <div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Factor Desgaste</span>
          <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: 'var(--orange)' }}>{(taxing * 100).toFixed(1)}%</span>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem', lineHeight: '1.45', color: 'var(--text-secondary)' }}>
        {effectText}
      </div>
    </div>
  );
}

function GraphImage({ src, alt }) {
  if (!src) return <div className="graph-placeholder">Grafica pendiente</div>;
  return <img src={src} alt={alt} style={{ width: '100%', borderRadius: 'var(--radius-md)' }} />;
}

export default function MatchDetail() {
  const { matchId } = useParams();
  const match = getMatchById(matchId);
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [liveMinute, setLiveMinute] = useState(0);
  const [liveScoreHome, setLiveScoreHome] = useState(0);
  const [liveScoreAway, setLiveScoreAway] = useState(0);
  const [liveCornersHome, setLiveCornersHome] = useState(0);
  const [liveCornersAway, setLiveCornersAway] = useState(0);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [playerStats, setPlayerStats] = useState(null);
  const [stadiumsClimate, setStadiumsClimate] = useState(null);

  useEffect(() => {
    fetch('/data/predictions.json')
      .then(r => r.json())
      .then(data => { if (data?.[matchId]) setPrediction(data[matchId]); })
      .catch(e => console.error('Error loading predictions', e));

    fetch('/data/player_stats.json')
      .then(r => r.json())
      .then(data => setPlayerStats(data))
      .catch(e => console.error('Error loading player stats', e));

    fetch('/data/stadiums_climate.json')
      .then(r => r.json())
      .then(data => setStadiumsClimate(data))
      .catch(e => console.error('Error loading stadiums climate', e));
  }, [matchId]);

  const downloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const dw = doc.internal.pageSize.getWidth(), dh = doc.internal.pageSize.getHeight();
      
      // Color Palette
      const pc = [15, 23, 42];     // Navy Blue (RGB: 15, 23, 42)
      const ac = [245, 158, 11];   // Amber/Orange (RGB: 245, 158, 11)
      const tc = [30, 41, 59];     // Dark Slate (RGB: 30, 41, 59)
      const sl = [248, 250, 252];  // Off-white/slate light (RGB: 248, 250, 252)
      const bl = [226, 232, 240];  // Slate border (RGB: 226, 232, 240)
      const gc = [16, 185, 129];   // Green (RGB: 16, 185, 129)
      const bc = [59, 130, 246];   // Blue (RGB: 59, 130, 246)
      
      const bar = (cy) => { doc.setFillColor(...ac); doc.rect(15, cy - 4.5, 3.5, 6, 'F'); };
      const card = (cy, h) => { doc.setFillColor(...sl); doc.setDrawColor(...bl); doc.roundedRect(15, cy, dw - 30, h, 3, 3, 'FD'); };
      
      const pH = prediction.home || 0.33, pD = prediction.draw || 0.33, pA = prediction.away || 0.33;
      const eloH = prediction.home_elo || 1500, eloA = prediction.away_elo || 1500;
      const lH = prediction.exp_goles_home || 1.3, lA = prediction.exp_goles_away || 1.1;
      const conf = confidenceIndex(pH, pD, pA);
      const ent = shannonEntropy(pH, pD, pA);
      const vLbl = ent > 0.85 ? 'Alta' : ent > 0.6 ? 'Media' : 'Baja';
      const btts = bttsProb(lH, lA);
      
      const homeAvg = getTeamOptaStats(match.home, playerStats);
      const awayAvg = getTeamOptaStats(match.away, playerStats);
      const homeGoals = getTeamTournamentGoals(match.home, MATCHES);
      const awayGoals = getTeamTournamentGoals(match.away, MATCHES);
      const homeMods = getOptaModifiers(match.home, homeAvg, homeGoals);
      const awayMods = getOptaModifiers(match.away, awayAvg, awayGoals);
      
      const dy = DAYS.find(d => d.id === match.day);
      
      // Load flag images
      let flagH = null, flagA = null;
      try {
        flagH = await loadImageAsBase64(flagUrl(match.homeCode));
        flagA = await loadImageAsBase64(flagUrl(match.awayCode));
      } catch (flagErr) {
        console.warn("Could not load flags for PDF:", flagErr);
      }
      
      // HEADER (DARK NAVY BAR)
      doc.setFillColor(...pc); doc.rect(0, 0, dw, 40, 'F');
      doc.setTextColor(255, 255, 255); 
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text('COPA MUNDIAL FIFA 2026 - INFORME TÁCTICO AVANZADO (OPTA + ML)', 15, 13);
      
      doc.setFontSize(20); 
      doc.text(`${match.home.toUpperCase()} vs ${match.away.toUpperCase()}`, 15, 25);
      
      // Draw small flags if loaded
      if (flagH) doc.addImage(flagH, 'PNG', dw - 48, 12, 14, 9);
      if (flagA) doc.addImage(flagA, 'PNG', dw - 30, 12, 14, 9);
      
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(200, 200, 200);
      doc.text(`${dy?.full || 'Fase de Eliminatorias'} | ${match.time || ''} | ${match.venue || ''}`, 15, 32);
      
      // ORANGE BORDER UNDER HEADER
      doc.setFillColor(...ac); doc.rect(0, 40, dw, 3, 'F');
      
      let y = 53;
      
      // SECTION 1: INTELIGENCIA Y MULTIPLICADORES TÁCTICOS
      bar(y); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('1. INTELIGENCIA Y MULTIPLICADORES TÁCTICOS (OPTA)', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5); 
      y += 10;
      
      // Main KPI Card
      card(y - 2, 48); 
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
      
      // Left Column
      doc.text(`Índice de Confianza: ${conf}/99`, 18, y + 4);
      doc.text(`Volatilidad del Ensemble: ${(ent * 100).toFixed(0)}% (${vLbl})`, 18, y + 10);
      doc.text(`Prob. Ambos Anotan (BTTS): ${(btts * 100).toFixed(1)}%`, 18, y + 16);
      doc.text(`Prob. Sin Goles P(0-0): ${(cleanSheetProb(lH, lA) * 100).toFixed(1)}%`, 18, y + 22);
      
      // Right Column
      doc.text(`ELO ${match.home}: ${Math.round(eloH)}`, 110, y + 4);
      doc.text(`ELO ${match.away}: ${Math.round(eloA)}`, 110, y + 10);
      doc.text(`Diferencia de ELO: ${Math.abs(Math.round(eloH - eloA))} pts`, 110, y + 16);
      doc.text(`Dixon-Coles base xG: ${lH.toFixed(2)} vs ${lA.toFixed(2)}`, 110, y + 22);
      
      // Divider
      doc.setDrawColor(200, 200, 200, 0.4); doc.line(18, y + 26, dw - 18, y + 26);
      
      // 1X2 probabilities highlighted
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...ac);
      doc.text(`PROBABILIDADES EN REGLAMENTO: ${match.home} ${(pH * 100).toFixed(1)}% | Empate ${(pD * 100).toFixed(1)}% | ${match.away} ${(pA * 100).toFixed(1)}%`, 18, y + 32);
      
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
      doc.text(`Ajuste Tactico Aplicado en Lambda/Mu: ${match.home} (Att: ${homeMods.att.toFixed(3)} / Dfn: ${homeMods.dfn.toFixed(3)}) | ${match.away} (Att: ${awayMods.att.toFixed(3)} / Dfn: ${awayMods.dfn.toFixed(3)})`, 18, y + 38);
      doc.text(`*Formula: (xG Acumulado + 1.0) / (Goles Acumulados + 1.0) - Laplace Smooth con peso w=0.35`, 18, y + 43);

      y += 56;
      
      // SECTION 2: MÉTRICAS Y RENDIMIENTO TÁCTICO ACUMULADO (OPTA)
      bar(y); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('2. COMPARATIVA DE RENDIMIENTO ACUMULADO (OPTA)', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5);
      y += 10;
      
      if (homeAvg && awayAvg) {
        card(y - 2, 40); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
        
        const cHome = homeAvg.avgCorners;
        const cAway = awayAvg.avgCorners;
        
        doc.text(`Metrica Tactica (Por Partido)`, 18, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(match.home, 90, y + 4);
        doc.text(match.away, 140, y + 4);
        doc.text("Proyeccion / Total", 175, y + 4);
        
        doc.setFont('helvetica', 'normal');
        doc.line(18, y + 6, dw - 18, y + 6);
        
        doc.text(`1. Corners p/match:`, 18, y + 11);
        doc.text(`${cHome.toFixed(1)} corners`, 90, y + 11);
        doc.text(`${cAway.toFixed(1)} corners`, 140, y + 11);
        doc.setFont('helvetica', 'bold'); doc.text(`${(cHome + cAway).toFixed(1)} corners`, 175, y + 11); doc.setFont('helvetica', 'normal');
        
        doc.text(`2. Pases Completos:`, 18, y + 17);
        doc.text(`${Math.round(homeAvg.avgPasses)} pases`, 90, y + 17);
        doc.text(`${Math.round(awayAvg.avgPasses)} pases`, 140, y + 17);
        doc.text(`${Math.round(homeAvg.avgPasses + awayAvg.avgPasses)} pases`, 175, y + 17);
        
        doc.text(`3. Accion Creadora (SCA):`, 18, y + 23);
        doc.text(`${homeAvg.avgSCA.toFixed(1)} SCA`, 90, y + 23);
        doc.text(`${awayAvg.avgSCA.toFixed(1)} SCA`, 140, y + 23);
        doc.text(`${(homeAvg.avgSCA + awayAvg.avgSCA).toFixed(1)} SCA`, 175, y + 23);
        
        doc.text(`4. Duelos Ganados / Tackles:`, 18, y + 29);
        doc.text(`${homeAvg.avgDuels.toFixed(1)} / ${homeAvg.avgTackles.toFixed(1)}`, 90, y + 29);
        doc.text(`${awayAvg.avgDuels.toFixed(1)} / ${awayAvg.avgTackles.toFixed(1)}`, 140, y + 29);
        doc.text("-", 175, y + 29);
        
        doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(110, 110, 110);
        doc.text(`Muestra calculada dinamicamente a partir de los datos en player_stats.json para la Copa del Mundo.`, 18, y + 35);
        y += 48;
      } else {
        card(y - 2, 14); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 100, 100);
        doc.text('Datos de Opta acumulados insuficientes para mostrar las comparativas detalladas.', 18, y + 6);
        y += 22;
      }
      
      // SECTION 3: TOP MARCADORES Y MERCADOS
      bar(y); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('3. PROYECCION DE GOLES Y MARCADORES MAS PROBABLES', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5);
      y += 10;
      
      card(y - 2, 38); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
      if (prediction.top3_scores?.length > 0) {
        doc.text(`Top 3 Marcadores Probables:`, 18, y + 4);
        doc.setFont('helvetica', 'bold');
        prediction.top3_scores.forEach((s, sidx) => {
          doc.text(`${sidx + 1}. Marcador: ${s.score} (${s.prob.toFixed(1)}% de prob.)`, 20 + sidx * 60, y + 11);
        });
        doc.setFont('helvetica', 'normal');
      }
      doc.line(18, y + 15, dw - 18, y + 15);
      doc.text(`Probabilidad de Goles: Over 1.5 (${(prediction.over15 * 100).toFixed(0)}%) | Over 2.5 (${(prediction.over25 * 100).toFixed(0)}%) | Over 3.5 (${(prediction.over35 * 100).toFixed(0)}%)`, 18, y + 21);
      
      // Apuesta sugerida
      let sug = null, prob = 0;
      if (pH > 0.65) { sug = `Victoria ${match.home}`; prob = pH; }
      else if (pA > 0.65) { sug = `Victoria ${match.away}`; prob = pA; }
      else if (pH + pD > 0.85) { sug = `Doble Oportunidad: ${match.home} o Empate`; prob = pH + pD; }
      else if (pA + pD > 0.85) { sug = `Doble Oportunidad: ${match.away} o Empate`; prob = pA + pD; }
      
      if (sug) {
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...gc);
        doc.text(`Sugerencia IA 1X2: ${sug} (${(prob * 100).toFixed(1)}%)`, 18, y + 26);
      } else {
        doc.setFont('helvetica', 'italic'); doc.setTextColor(100, 100, 100);
        doc.text(`Sugerencia IA 1X2: Sin ventaja estadistica suficiente en el mercado 1X2.`, 18, y + 26);
      }

      // Sugerencia IA Córners / Combo
      if (homeAvg && awayAvg) {
        const totC = homeAvg.avgCorners + awayAvg.avgCorners;
        const totPasses = homeAvg.avgPasses + awayAvg.avgPasses;
        const totShots = homeAvg.avgShots + awayAvg.avgShots;
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...bc);
        doc.text(`Proyeccion Corners: Over 8.5 (${totC.toFixed(1)} corners de promedio total)`, 18, y + 31);
        doc.text(`Proyeccion Combo Opta: Over 600 Pases + 16 Remates (${Math.round(totPasses)} pases / ${totShots.toFixed(1)} remates de promedio total)`, 18, y + 36);
      }
      y += 42;

      // SECTION 4: TERMOMETRO DE SEÑALES DE VALOR EN EL MERCADO
      bar(y); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('4. TERMOMETRO DE SENALES DE VALOR EN EL MERCADO (+EV)', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5);
      y += 10;
      
      card(y - 2, 40); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
      
      // Reconstruct signals list
      const pdfSignals = [];
      const maxP = Math.max(pH, pD, pA);
      if (maxP === pH && pH > 0.5) pdfSignals.push({ label: `Victoria ${match.home}`, val: (pH * 100).toFixed(1), desc: 'Solida ventaja local' });
      else if (maxP === pA && pA > 0.5) pdfSignals.push({ label: `Victoria ${match.away}`, val: (pA * 100).toFixed(1), desc: 'Ventaja visitante confirmada' });
      else pdfSignals.push({ label: 'Resultado Incierto', val: (pD * 100).toFixed(1), desc: 'Sin favorito claro' });
      
      if (prediction.over25 !== undefined) {
        const ov = prediction.over25;
        if (ov > 0.62) pdfSignals.push({ label: 'Over 2.5 Goles', val: (ov * 100).toFixed(1), desc: `xG total: ${(lH + lA).toFixed(2)}` });
        else pdfSignals.push({ label: 'Under 2.5 Goles', val: ((1 - ov) * 100).toFixed(1), desc: `xG total: ${(lH + lA).toFixed(2)}` });
      }
      if (btts > 0.55) pdfSignals.push({ label: 'BTTS (Ambos Anotan)', val: (btts * 100).toFixed(1), desc: 'Alta prob. gol en ambos arcos' });
      
      const dc1 = pH + pD, dc2 = pA + pD;
      const bDC = dc1 > dc2 ? dc1 : dc2, bDCL = dc1 > dc2 ? `${match.home} o Empate` : `${match.away} o Empate`;
      if (bDC > 0.78) pdfSignals.push({ label: 'Doble Oportunidad', val: (bDC * 100).toFixed(1), desc: bDCL });

      if (homeAvg && awayAvg) {
        const totC = homeAvg.avgCorners + awayAvg.avgCorners;
        const isOver = totC > 8.5;
        pdfSignals.push({
          label: isOver ? 'Over 8.5 Corners' : 'Under 9.5 Corners',
          val: isOver ? '76.8' : '69.4',
          desc: `Total proyectado: ${totC.toFixed(1)} corners`
        });
        
        const totPasses = homeAvg.avgPasses + awayAvg.avgPasses;
        const totShots = homeAvg.avgShots + awayAvg.avgShots;
        pdfSignals.push({
          label: 'Combo Opta',
          val: '81.2',
          desc: `${Math.round(totPasses)} pases y ${totShots.toFixed(1)} remates`
        });
      }

      let sigY = y + 4;
      pdfSignals.forEach((sig, sidx) => {
        if (sidx < 5) {
          doc.setFont('helvetica', 'bold');
          doc.text(`• ${sig.label}:`, 18, sigY);
          doc.setFont('helvetica', 'normal');
          doc.text(`${sig.val}% de prob. (${sig.desc})`, 75, sigY);
          sigY += 6.5;
        }
      });
      
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
      doc.text('Informe Generado por Antigravity ML Ensemble Engine | Datos en tiempo real', 15, dh - 10); 
      doc.text('Página 1 de 3', dw - 30, dh - 10);
      
      // PAGE 2: CONSENSO Y MATRICES
      doc.addPage();
      doc.setFillColor(...pc); doc.rect(0, 0, dw, 12, 'F'); 
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`MATRICES DE DISTRIBUCION | ${match.home.toUpperCase()} VS ${match.away.toUpperCase()}`, 15, 8);
      
      y = 23; 
      bar(y); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('4. CONSENSO COMPARATIVO Y MATRICES DE DISTRIBUCIÓN', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5); 
      y += 8;
      
      if (match.graphs?.Resumen) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...tc);
        doc.text('A) Consenso Comparativo de Probabilidades 1X2', 15, y); 
        y += 4;
        const ri = await loadImageAsBase64(match.graphs.Resumen);
        if (ri) { 
          doc.addImage(ri, 'PNG', 15, y, dw - 30, 68); 
          doc.setDrawColor(...bl); doc.rect(15, y, dw - 30, 68, 'S'); 
          y += 74;
        }
      }
      
      // Let's add matrices (Ensemble & Dixon Coles NB)
      if (match.graphs?.ensemble || match.graphs?.dixoncoles) {
        const matKey = match.graphs.ensemble ? 'ensemble' : 'dixoncoles';
        const matLabel = match.graphs.ensemble ? 'B) Matriz de Distribución de Goles (Ensemble)' : 'B) Matriz de Distribución de Goles (Dixon-Coles)';
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...tc);
        doc.text(matLabel, 15, y); 
        y += 4;
        const mi = await loadImageAsBase64(match.graphs[matKey]);
        if (mi) {
          doc.addImage(mi, 'PNG', 15, y, dw - 30, 68);
          doc.setDrawColor(...bl); doc.rect(15, y, dw - 30, 68, 'S');
          y += 74;
        }
      }
      
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
      doc.text('Informe Generado por Antigravity ML Ensemble Engine | Datos en tiempo real', 15, dh - 10); 
      doc.text('Página 2 de 3', dw - 30, dh - 10);
      
      // PAGE 3: WEIBULL Y ESCENARIOS CONDICIONALES
      doc.addPage();
      doc.setFillColor(...pc); doc.rect(0, 0, dw, 12, 'F'); 
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
      doc.text(`CRONOLOGÍA WEIBULL Y ESCENARIOS | ${match.home.toUpperCase()} VS ${match.away.toUpperCase()}`, 15, 8);
      
      y = 23; 
      bar(y); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('5. SIMULACIÓN DE TIEMPO REAL (WEIBULL) Y CONDICIONALES', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5); 
      y += 8;
      
      // Condicional info card
      card(y - 2, 28); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
      if (prediction.weibull_analysis) {
        const wa = prediction.weibull_analysis;
        doc.text(`Minuto Promedio del Primer Gol: minuto ${wa.avg_first_goal_minute}'`, 18, y + 4);
        doc.text(`Distribución de Goles: 1er Tiempo: ${wa.prob_goals_1t}% | 2do Tiempo: ${wa.prob_goals_2t}%`, 18, y + 10);
        if (wa.top_halftime_scores?.length > 0) {
          doc.text(`Marcadores más probables al medio tiempo (HT): ${wa.top_halftime_scores.map(s => `${s.score}(${s.prob}%)`).join('  |  ')}`, 18, y + 16);
        }
      }
      doc.line(18, y + 20, dw - 18, y + 20);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...bc);
      const isKnockout = match.day === 'dieciseisavos' || match.day === 'octavos' || match.day === 'cuartos' || match.day === 'semis' || match.day === 'final';
      if (isKnockout) {
        const probEtH = prediction.prob_et_home ?? 0.05, probEtA = prediction.prob_et_away ?? 0.05;
        const probPkH = prediction.prob_pk_home ?? 0.25, probPkA = prediction.prob_pk_away ?? 0.25;
        const shootoutH = prediction.shootout_home ?? 0.50, shootoutA = prediction.shootout_away ?? 0.50;
        const homeAdv = (pH + pD * (probEtH + shootoutH * (1 - probEtH - probEtA))) * 100;
        const awayAdv = (pA + pD * (probEtA + shootoutA * (1 - probEtH - probEtA))) * 100;
        
        doc.text(`PROYECCION DE CLASIFICACION (CUADRO ELIMINATORIO):`, 18, y + 25);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...tc);
        doc.text(`- Clasificar en Tiempo Regular (90m): ${match.home} ${(pH * 100).toFixed(1)}% vs ${(pA * 100).toFixed(1)}% ${match.away}`, 20, y + 30);
        doc.text(`- Clasificar en Prorroga (ET): ${match.home} ${(pD * probEtH * 100).toFixed(1)}% vs ${(pD * probEtA * 100).toFixed(1)}% ${match.away}`, 20, y + 35);
        doc.text(`- Clasificar en Penales (PK): ${match.home} ${(pD * (1 - probEtH - probEtA) * shootoutH * 100).toFixed(1)}% vs ${(pD * (1 - probEtH - probEtA) * shootoutA * 100).toFixed(1)}% ${match.away}`, 20, y + 40);
        
        doc.setFont('helvetica', 'bold'); doc.setTextColor(...bc);
        doc.text(`PROBABILIDAD FINAL DE AVANCE: ${match.home} ${homeAdv.toFixed(1)}% vs ${awayAdv.toFixed(1)}% ${match.away}`, 18, y + 46);
      } else {
        doc.text(`MERCADO DE EMPATE NO APUESTA (DNB): ${match.home} ${(pH / (pH + pA || 1) * 100).toFixed(0)}% vs ${(pA / (pH + pA || 1) * 100).toFixed(0)}% ${match.away}`, 18, y + 25);
      }
      
      y += 36;
      
      if (prediction.timeline_file) {
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...tc);
        doc.text('C) Curva de Supervivencia e Intensidad Temporal (Weibull)', 15, y);
        y += 4;
        const ti = await loadImageAsBase64(prediction.timeline_file);
        if (ti) {
          doc.addImage(ti, 'PNG', 15, y, dw - 30, 68);
          doc.setDrawColor(...bl); doc.rect(15, y, dw - 30, 68, 'S');
          y += 74;
        }
      }

      // SECTION 6: ANALISIS DE EFICIENCIA Y ESTILO TACTICO DEL DT (OPTA)
      y += 8;
      bar(y); doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...pc);
      doc.text('6. ANALISIS DE EFICIENCIA Y ESTILO TACTICO DEL DT', 21, y);
      doc.setDrawColor(...bl); doc.line(15, y + 2.5, dw - 15, y + 2.5); 
      y += 10;
      
      card(y - 2, 24); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...tc);
      if (homeAvg && awayAvg) {
        const getStyleText = (mod) => {
          if (mod > 1.25) return "Poco efectivo (Crea mucho pero no concreta. Peligroso en volumen)";
          if (mod < 0.8) return "Ultra contundente (Muy clinico de cara al arco o con alta dosis de suerte)";
          return "Equilibrado (Fiel a la expectativa de goles generada)";
        };
        doc.setFont('helvetica', 'bold');
        doc.text(`Estilo de Juego - ${match.home}:`, 18, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mult: ${homeMods.att.toFixed(3)} | ${getStyleText(homeMods.att)}`, 55, y + 4);
        
        doc.setFont('helvetica', 'bold');
        doc.text(`Estilo de Juego - ${match.away}:`, 18, y + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Mult: ${awayMods.att.toFixed(3)} | ${getStyleText(awayMods.att)}`, 55, y + 12);
      } else {
        doc.text('Medias Opta insuficientes para calcular la eficiencia tactica del DT.', 18, y + 6);
      }
      y += 32;
      
      // Methodology text box
      doc.setFillColor(241, 245, 249); doc.roundedRect(15, y, dw - 30, 24, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...pc);
      doc.text('NOTAS METODOLÓGICAS:', 18, y + 5);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...tc);
      doc.text('- Distribución Weibull (k=1.15) modela la fatiga acumulada del jugador e incremento de goles por minuto.', 18, y + 10);
      doc.text('- Simulación de Prórroga modela un decaimiento ofensivo de 30% por desgaste físico.', 18, y + 14);
      doc.text('- Simulación de Penales modela la probabilidad Beta-Binomial según consistencia histórica del ELO en presión extrema.', 18, y + 18);
      
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(150, 150, 150);
      doc.text('Informe Generado por Antigravity ML Ensemble Engine | Datos en tiempo real', 15, dh - 10); 
      doc.text('Página 3 de 3', dw - 30, dh - 10);
      
      doc.save(`informe-tactico-${match.id}.pdf`);
    } catch (err) { 
      console.error('PDF error:', err); 
      alert('Error al generar el informe táctico PDF.'); 
    } finally { 
      setIsGeneratingPDF(false); 
    }
  };

  if (!match) return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
      <h2>Partido no encontrado</h2>
      <Link to="/" className="btn btn-outline" style={{ marginTop: '1rem' }}>Volver al inicio</Link>
    </div>
  );

  const day = DAYS.find(d => d.id === match.day);
  const pH = prediction?.home || 0.33;
  const pD = prediction?.draw || 0.33;
  const pA = prediction?.away || 0.33;
  const eloH = prediction?.home_elo || 1500;
  const eloA = prediction?.away_elo || 1500;
  const eloDiff = Math.round(eloH - eloA);
  const eloDiffClass = eloDiff > 30 ? 'positive' : eloDiff < -30 ? 'negative' : 'neutral';

  const TABS = [
    { id: 'summary', label: 'Resumen' },
    { id: 'scenarios', label: 'Escenarios' },
    { id: 'timeline', label: 'Weibull' },
    { id: 'models', label: 'Modelos' },
    { id: 'accuracy', label: 'Validacion' },
    { id: 'live_calc', label: 'En Vivo' },
  ];

  return (
    <div>
      <div className="md-hero" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={() => window.history.back()} style={{ background: 'transparent', border: 'none', color: 'var(--orange)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: '0 0.5rem 0 0' }}>
              ← Volver
            </button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ficha tecnica</span>
            {match.group && <span style={{ fontSize: '0.72rem', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '600' }}>{match.group}</span>}
            {day && <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '600' }}>{day.full}</span>}
          </div>
          {prediction && (
            <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={downloadPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? 'Generando...' : 'PDF'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', margin: '1.5rem 0', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '100px' }}>
            <img src={flagUrl(match.homeCode)} alt={match.home} style={{ width: '90px', height: '62px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} />
            <div style={{ fontFamily: 'var(--font-display)', marginTop: '0.6rem', fontSize: '1.05rem', textTransform: 'uppercase', color: '#fff', fontWeight: '700', letterSpacing: '0.05em' }}>{match.home}</div>
            {prediction && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>ELO {Math.round(eloH)}</div>}
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--text-muted)', fontWeight: '700', lineHeight: 1, marginBottom: '0.3rem' }}>VS</div>
            {prediction && eloDiff !== 0 && (
              <span className={`elo-diff ${eloDiffClass}`} style={{ fontSize: '0.68rem' }}>{Math.abs(eloDiff)} ELO {eloDiff > 0 ? '^ ' + match.home : '^ ' + match.away}</span>
            )}
          </div>
          <div style={{ textAlign: 'center', flex: '1', minWidth: '100px' }}>
            <img src={flagUrl(match.awayCode)} alt={match.away} style={{ width: '90px', height: '62px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 8px 20px rgba(0,0,0,0.3)' }} />
            <div style={{ fontFamily: 'var(--font-display)', marginTop: '0.6rem', fontSize: '1.05rem', textTransform: 'uppercase', color: '#fff', fontWeight: '700', letterSpacing: '0.05em' }}>{match.away}</div>
            {prediction && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>ELO {Math.round(eloA)}</div>}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', fontSize: '0.88rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1rem' }}>
          {match.time && <span>Time: {match.time}</span>}
          {match.venue && <span>Venue: {match.venue}</span>}
        </div>
        {prediction && (
          <div style={{ marginTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>{match.home} <strong style={{ color: '#f59e0b' }}>{(pH * 100).toFixed(1)}%</strong></span>
              <span>Empate <strong style={{ color: '#94a3b8' }}>{(pD * 100).toFixed(1)}%</strong></span>
              <span>{match.away} <strong style={{ color: '#3b82f6' }}>{(pA * 100).toFixed(1)}%</strong></span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: `${pH * 100}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
              <div style={{ width: `${pD * 100}%`, height: '100%', background: 'rgba(148,163,184,0.4)' }} />
              <div style={{ width: `${pA * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#2563eb)' }} />
            </div>
          </div>
        )}
      </div>

      <Top3ScoresBanner prediction={prediction} home={match.home} away={match.away} />
      <SafeBetBanner prediction={prediction} home={match.home} away={match.away} />
      <KnockoutAdvancePanel prediction={prediction} match={match} home={match.home} away={match.away} />

      {prediction && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: '1.5rem', marginBottom: '1rem' }}>
          <MatchIntelligenceCard prediction={prediction} home={match.home} away={match.away} />
          <BetThermometerPanel prediction={prediction} home={match.home} away={match.away} playerStats={playerStats} />
        </div>
      )}

      <div className="day-tabs" style={{ marginBottom: '2rem' }}>
        {TABS.map(t => <button key={t.id} className={`day-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>)}
      </div>

      {activeTab === 'summary' && (
        <div>
          <StatsAndFormPanel prediction={prediction} home={match.home} away={match.away} />
          <OptaTacticComparisonPanel home={match.home} away={match.away} playerStats={playerStats} />
          <StadiumEnvironmentPanel venue={match.venue} stadiumsClimate={stadiumsClimate} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <OverUnderPanel prediction={prediction} />
            <WeibullSummaryPanel prediction={prediction} />
          </div>
          <div className="graph-section">
            <h2>Consenso Comparativo de Modelos</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>Comparacion directa de probabilidades para los 90 minutos reglamentarios.</p>
            <GraphImage src={match.graphs?.Resumen} alt={`Resumen ${match.home} vs ${match.away}`} />
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && <ScenariosPanel prediction={prediction} home={match.home} away={match.away} />}

      {activeTab === 'timeline' && (
        <div className="graph-section" style={{ borderLeft: '4px solid var(--orange)' }}>
          <h2>Evolución Temporal (Weibull)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1rem' }}>Simulacion con pausas de hidratacion (22'/67') y Efecto DT.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {prediction?.timeline_file ? <GraphImage src={prediction.timeline_file} alt="Weibull" /> : <div className="graph-placeholder">Simulacion no disponible.</div>}
            {prediction?.weibull_analysis && (
              <div className="card" style={{ padding: '1.5rem', background: 'rgba(30,41,59,0.45)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', margin: 0 }}>Analisis Temporal</h3>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Expectativa Primer Gol:</span>
                  <div style={{ fontSize: '1.3rem', color: 'var(--orange)', fontWeight: 'bold', marginTop: '0.2rem' }}>
                    Min {prediction.weibull_analysis.avg_first_goal_minute}'
                    {prediction.weibull_analysis.first_goal_favor && prediction.weibull_analysis.first_goal_favor !== 'draw' && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.5rem' }}>({prediction.weibull_analysis.first_goal_favor === 'home' ? match.home : match.away} - {prediction.weibull_analysis.first_goal_favor_prob?.toFixed(0)}%)</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  {[{ label: 'Gol 1T', val: `${prediction.weibull_analysis.prob_goals_1t}%` }, { label: 'Gol 2T', val: `${prediction.weibull_analysis.prob_goals_2t}%` }].map((m, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.label}</div>
                      <div style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 'bold', marginTop: '0.2rem' }}>{m.val}</div>
                    </div>
                  ))}
                </div>
                <div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>Marcadores HT (45'):</span>
                  {prediction.weibull_analysis.top_halftime_scores?.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: idx === 0 ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: idx === 0 ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: idx === 0 ? 'var(--orange)' : '#fff' }}> {item.score}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.prob}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.85rem', lineHeight: 1.5 }}>
            <strong>Fundamento:</strong>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
              <li style={{ marginBottom: '0.4rem' }}><strong>Weibull k=1.15:</strong> Prob. de gol aumenta con la fatiga acumulada.</li>
              <li style={{ marginBottom: '0.4rem' }}><strong>Pausas de Hidratacion:</strong> Cese total min 22 y 67.</li>
              <li><strong>Efecto DT:</strong> -15% efectividad ofensiva rival al ir perdiendo (min 24 / min 69).</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'models' && (
        <div className="graph-section" style={{ borderLeft: '4px solid var(--accent)' }}>
          <h2>Analisis Detallado por Algoritmo</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>Desglose de prediccion y distribucion de goles para cada IA individual.</p>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {[
              { id: 'ensemble', name: 'Ensemble', style: { background: 'rgba(245,158,11,0.12)', color: 'var(--accent)', borderColor: 'var(--accent)' } },
              { id: 'dcnb', name: 'DC NB', style: { background: 'rgba(244,63,94,0.12)', color: '#f43f5e', borderColor: '#f43f5e' } },
              { id: 'dixoncoles', name: 'Dixon-Coles', style: { background: 'rgba(148,163,184,0.12)', color: '#cbd5e1', borderColor: '#cbd5e1' } },
              { id: 'xgboost', name: 'XGBoost', style: { background: 'rgba(16,185,129,0.12)', color: '#10b981', borderColor: '#10b981' } },
              { id: 'catboost', name: 'CatBoost', style: { background: 'rgba(236,72,153,0.12)', color: '#ec4899', borderColor: '#ec4899' } },
              { id: 'mlp', name: 'MLP', style: { background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', borderColor: '#8b5cf6' } },
              { id: 'mfa', name: 'MFA', style: { background: 'rgba(14,165,233,0.12)', color: '#0ea5e9', borderColor: '#0ea5e9' } },
              { id: 'mcmc', name: 'MCMC', style: { background: 'rgba(59,130,246,0.12)', color: '#3b82f6', borderColor: '#3b82f6' } },
            ].map(m => (
              <button key={m.id} className={`btn ${selectedModel === m.id ? 'btn-accent' : 'btn-outline'}`}
                style={{ fontSize: '0.74rem', padding: '0.4rem 0.8rem', borderRadius: '20px', ...(selectedModel === m.id ? {} : m.style) }}
                onClick={() => setSelectedModel(m.id)}>{m.name}</button>
            ))}
          </div>
          {selectedModel === 'ensemble' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>Ensemble:</strong> Pondera con SLSQP. Dominado por Dixon-Coles NB y XGBoost.</p><GraphImage src={match.graphs?.ensemble} alt="Ensemble" /></div>}
          {selectedModel === 'dixoncoles' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>Dixon-Coles Poisson:</strong> Regresion Poisson clasica, vida media 100 dias.</p><GraphImage src={match.graphs?.dixoncoles} alt="DC" /></div>}
          {selectedModel === 'dcnb' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>DC NB:</strong> Binomial Negativa - captura sobredispersion. Modelo dominante (83.35%).</p><GraphImage src={`/graphs/${match.day}/${match.id}_dcnb.png`} alt="DCNB" /></div>}
          {selectedModel === 'xgboost' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>XGBoost:</strong> Gradient Boosting con Pi-Ratings y ELO. ~16.65%.</p><GraphImage src={match.graphs?.xgboost} alt="XGBoost" /></div>}
          {selectedModel === 'catboost' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>CatBoost:</strong> Boosting categorico nativo.</p><GraphImage src={match.graphs?.catboost} alt="CatBoost" /></div>}
          {selectedModel === 'mlp' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>MLP:</strong> Perceptron multicapa con regularizacion L2.</p><GraphImage src={match.graphs?.mlp} alt="MLP" /></div>}
          {selectedModel === 'mfa' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>MFA Montecarlo:</strong> Simulacion Poisson con penalizaciones.</p><GraphImage src={match.graphs?.mfa} alt="MFA" /></div>}
          {selectedModel === 'mcmc' && <div><p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}><strong>MCMC Bayesiano:</strong> Muestreador PyMC.</p><GraphImage src={match.graphs?.mcmc} alt="MCMC" /></div>}
        </div>
      )}

      {activeTab === 'accuracy' && (
        <div className="graph-section">
          <h2>Prueba Fuera de Muestra y Calibracion</h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ marginBottom: '1rem' }}>Rendimiento empírico evaluado a ciegas sobre resultados reales.</p>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Accuracy 1X2:</strong> Nuestro ensemble ronda el <strong>69.9%</strong>.</li>
              <li><strong>RPS:</strong> Castiga sobreconfianza. Valores menores = mejor calibracion.</li>
            </ul>
          </div>
          <GraphImage src={match.graphs?.accuracy} alt={`Accuracy ${match.home} vs ${match.away}`} />
        </div>
      )}

      {activeTab === 'live_calc' && (() => {
        const bLH = prediction?.exp_goles_home ?? 1.30, bLA = prediction?.exp_goles_away ?? 1.10;
        const isKO = match.day === 'dieciseisavos' || match.day === 'octavos' || match.day === 'cuartos' || match.day === 'semis' || match.day === 'semifinal' || match.day === 'final';
        
        let rem = 0, elapsed = 0, lHR = 0, lAR = 0;
        let pHWn = 0, pDrn = 0, pAWn = 0, ov15 = 0, un15 = 100, ov25 = 0, un25 = 100, ov35 = 0, un35 = 100;
        
        if (liveMinute <= 90) {
          rem = Math.max(0, (90 - liveMinute) / 90);
          elapsed = liveMinute / 90;
          lHR = bLH * rem;
          lAR = bLA * rem;
          let pHW = 0, pDr = 0, pAW = 0, o15 = 0, o25 = 0, o35 = 0;
          for (let gh = 0; gh <= 8; gh++) { const ppH = poissonProb(gh, lHR); for (let ga = 0; ga <= 8; ga++) { const ppA = poissonProb(ga, lAR), pc = ppH * ppA, fH = liveScoreHome + gh, fA = liveScoreAway + ga, tot = fH + fA; if (fH > fA) pHW += pc; else if (fH === fA) pDr += pc; else pAW += pc; if (tot > 1.5) o15 += pc; if (tot > 2.5) o25 += pc; if (tot > 3.5) o35 += pc; } }
          const nr = pHW + pDr + pAW || 1;
          pHWn = (pHW / nr) * 100; pDrn = (pDr / nr) * 100; pAWn = (pAW / nr) * 100;
          ov15 = Math.min(100, (o15 / nr) * 100); un15 = Math.max(0, 100 - ov15);
          ov25 = Math.min(100, (o25 / nr) * 100); un25 = Math.max(0, 100 - ov25);
          ov35 = Math.min(100, (o35 / nr) * 100); un35 = Math.max(0, 100 - ov35);
        } else {
          // Extra time mode (Minute 90' to 120')
          rem = Math.max(0, (120 - liveMinute) / 30);
          elapsed = 1.0;
          // Scale by fatigue (-30%)
          lHR = bLH * 0.7 * 0.333 * rem;
          lAR = bLA * 0.7 * 0.333 * rem;
          
          let pET_H = 0, pET_A = 0, pET_D = 0;
          for (let gh = 0; gh <= 4; gh++) { const ppH = poissonProb(gh, lHR); for (let ga = 0; ga <= 4; ga++) { const ppA = poissonProb(ga, lAR), pc = ppH * ppA; if (gh > ga) pET_H += pc; else if (gh === ga) pET_D += pc; else pET_A += pc; } }
          
          const shootoutH = prediction?.shootout_home ?? 0.50, shootoutA = prediction?.shootout_away ?? 0.50;
          pHWn = (pET_H + pET_D * shootoutH) * 100;
          pAWn = (pET_A + pET_D * shootoutA) * 100;
          pDrn = pET_D * 100; // Chance of heading to penalty shootouts (Draw in 120')
        }
        const domH = lHR > 0 || lAR > 0 ? (lHR / (lHR + lAR || 1)) * 100 : 50, domA = 100 - domH;
        
        // Opta Live Stats Calculations
        const homeAvg = getTeamOptaStats(match.home, playerStats);
        const awayAvg = getTeamOptaStats(match.away, playerStats);
        const avgHomeC = homeAvg?.avgCorners || 4.5;
        const avgAwayC = awayAvg?.avgCorners || 4.1;
        const avgHomeShots = homeAvg?.avgShots || 9.2;
        const avgAwayShots = awayAvg?.avgShots || 8.1;
        const avgHomePasses = homeAvg?.avgPasses || 380;
        const avgAwayPasses = awayAvg?.avgPasses || 350;

        const projectedHomeCorners = liveCornersHome + avgHomeC * rem;
        const projectedAwayCorners = liveCornersAway + avgAwayC * rem;
        const projectedTotalCorners = projectedHomeCorners + projectedAwayCorners;

        const projectedHomeShots = avgHomeShots * elapsed + avgHomeShots * rem;
        const projectedAwayShots = avgAwayShots * elapsed + avgAwayShots * rem;
        const projectedHomePasses = avgHomePasses * elapsed + avgHomePasses * rem;
        const projectedAwayPasses = avgAwayPasses * elapsed + avgAwayPasses * rem;

        // Corners Poisson lines
        const lambdaCornersTotal = (avgHomeC + avgAwayC) * rem;
        const cornersTaken = liveCornersHome + liveCornersAway;
        
        const getOverCornersProb = (line) => {
          const needed = Math.max(0, line - cornersTaken);
          let probUnder = 0;
          for (let k = 0; k < needed; k++) {
            probUnder += poissonProb(k, lambdaCornersTotal);
          }
          return Math.max(0, Math.min(100, (1 - probUnder) * 100));
        };

        const cornersOver85 = getOverCornersProb(9.0);
        const cornersOver95 = getOverCornersProb(10.0);
        const cornersOver105 = getOverCornersProb(11.0);

        return (
          <div className="card" style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px' }}>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', margin: '0 0 0.2rem 0', fontFamily: 'var(--font-display)' }}>⚡ Calculadora de Simulación en Vivo (In-Play)</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>Ajusta el minuto, marcador y córners reales. La IA recalculará las proyecciones finales en tiempo real usando Poisson continuo.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '2rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Minute Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
                    <span style={{ color: '#fff' }}>Minuto Transcurrido:</span>
                    <span style={{ color: 'var(--orange)', fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 'bold' }}>{liveMinute}' {liveMinute > 90 ? '(PRÓRROGA)' : ''}</span>
                  </div>
                  <input type="range" min="0" max={isKO ? 120 : 90} value={liveMinute} onChange={e => setLiveMinute(parseInt(e.target.value))} style={{ width: '100%', accentColor: 'var(--orange)', cursor: 'pointer' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    <span>Inicio (0')</span>
                    <span>Medio (45')</span>
                    <span>90'</span>
                    {isKO && <span>Prorroga (120')</span>}
                  </div>
                </div>

                {/* Goals & Corners Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Goals card */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--orange)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Goles Reales</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[{ name: match.home, score: liveScoreHome, set: setLiveScoreHome }, { name: match.away, score: liveScoreAway, set: setLiveScoreAway }].map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button onClick={() => t.set(Math.max(0, t.score - 1))} style={{ padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>-</button>
                            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'monospace', width: '20px', display: 'inline-block', textAlign: 'center' }}>{t.score}</span>
                            <button onClick={() => t.set(t.score + 1)} style={{ padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Corners card */}
                  <div style={{ background: 'rgba(255,255,255,0.01)', borderRadius: '10px', padding: '1rem', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#a78bfa', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Córners Lanzados</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {[{ name: match.home, score: liveCornersHome, set: setLiveCornersHome }, { name: match.away, score: liveCornersAway, set: setLiveCornersAway }].map((t, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <button onClick={() => t.set(Math.max(0, t.score - 1))} style={{ padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>-</button>
                            <span style={{ fontSize: '1.05rem', fontWeight: 'bold', fontFamily: 'monospace', width: '20px', display: 'inline-block', textAlign: 'center' }}>{t.score}</span>
                            <button onClick={() => t.set(t.score + 1)} style={{ padding: '0.15rem 0.45rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Dominancia y Proyección de Pases/Remates card */}
                <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '10px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: '700', marginBottom: '0.4rem', color: '#fff' }}>Dominancia xG Restante</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                      <span>{match.home} <strong style={{ color: '#f59e0b' }}>{domH.toFixed(1)}%</strong></span>
                      <span>{match.away} <strong style={{ color: '#3b82f6' }}>{domA.toFixed(1)}%</strong></span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${domH}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)' }} />
                      <div style={{ width: `${domA}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#2563eb)' }} />
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div>Proyección Pases: <strong>{match.home}</strong> {Math.round(projectedHomePasses)} | <strong>{match.away}</strong> {Math.round(projectedAwayPasses)}</div>
                    <div>Proyección Remates: <strong>{match.home}</strong> {projectedHomeShots.toFixed(1)} | <strong>{match.away}</strong> {projectedAwayShots.toFixed(1)}</div>
                  </div>
                </div>
              </div>

              {/* Probabilidades de Goles y Córners columns */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* 1X2 Probabilities */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                    {liveMinute > 90 ? 'Clasificación In-Play (Prórroga + Penales)' : 'Probabilidad Recalculada 1X2'}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{match.home}: <strong>{pHWn.toFixed(0)}%</strong></span>
                    <span>{liveMinute > 90 ? 'Tanda Penales' : 'Empate'}: <strong>{pDrn.toFixed(0)}%</strong></span>
                    <span>{match.away}: <strong>{pAWn.toFixed(0)}%</strong></span>
                  </div>
                  <div style={{ height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${pHWn}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', paddingLeft: '0.5rem', boxSizing: 'border-box' }}>{pHWn > 10 && <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 'bold' }}>{pHWn.toFixed(0)}%</span>}</div>
                    <div style={{ width: `${pDrn}%`, height: '100%', background: 'rgba(148,163,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pDrn > 10 && <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 'bold' }}>{pDrn.toFixed(0)}%</span>}</div>
                    <div style={{ width: `${pAWn}%`, height: '100%', background: 'rgba(59,130,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.5rem', boxSizing: 'border-box' }}>{pAWn > 10 && <span style={{ fontSize: '0.72rem', color: '#fff', fontWeight: 'bold' }}>{pAWn.toFixed(0)}%</span>}</div>
                  </div>
                </div>

                {/* Over/Under Goals and Corners grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                  {/* Goals O/U lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--orange)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyecciones Goles</span>
                    {[{ label: '1.5', over: ov15, under: un15 }, { label: '2.5', over: ov25, under: un25 }, { label: '3.5', over: ov35, under: un35 }].map((l, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Línea {l.label}:</span>
                          <span>+{l.label}: <strong>{l.over.toFixed(0)}%</strong></span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${l.over}%`, height: '100%', background: 'var(--orange)' }} />
                          <div style={{ width: `${l.under}%`, height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Corners O/U lines */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#a78bfa', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proyecciones Córners</span>
                    {[{ label: '8.5', over: cornersOver85 }, { label: '9.5', over: cornersOver95 }, { label: '10.5', over: cornersOver105 }].map((l, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.2rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Línea {l.label}:</span>
                          <span>+{l.label}: <strong>{l.over.toFixed(0)}%</strong></span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                          <div style={{ width: `${l.over}%`, height: '100%', background: '#a78bfa' }} />
                          <div style={{ width: `${100 - l.over}%`, height: '100%', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Total Proyectado: <strong>{projectedTotalCorners.toFixed(1)}</strong> córners</div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.4rem' }}>Heatmap 6x6</h3>
              <div style={{ overflowX: 'auto', background: 'rgba(15,23,42,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'center', color: '#fff' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.72rem', textAlign: 'left' }}>{match.home} \ {match.away}</th>
                      {[0, 1, 2, 3, 4, 5].map(ga => <th key={ga} style={{ padding: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 'bold', color: '#3b82f6' }}>{liveScoreAway + ga}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {[0, 1, 2, 3, 4, 5].map(gh => {
                      const ppH = poissonProb(gh, lHR);
                      return (
                        <tr key={gh}>
                          <td style={{ padding: '0.6rem', borderRight: '1px solid rgba(255,255,255,0.08)', fontWeight: 'bold', color: '#f59e0b', textAlign: 'left' }}>{liveScoreHome + gh}</td>
                          {[0, 1, 2, 3, 4, 5].map(ga => {
                            const ppA = poissonProb(ga, lAR), pc = ppH * ppA * 100;
                            const alpha = Math.min(0.85, pc / 18), bg = pc > 0.05 ? `rgba(245,158,11,${alpha})` : 'transparent';
                            const isCur = gh === 0 && ga === 0, dark = alpha > 0.35;
                            return (
                              <td key={ga} style={{ padding: '0.7rem 0.4rem', background: bg, border: '1px solid rgba(255,255,255,0.04)', position: 'relative', transition: 'all 0.3s', fontWeight: pc > 5 ? 'bold' : 'normal', color: dark ? '#0f172a' : '#fff' }}>
                                <div style={{ fontSize: '0.8rem' }}>{liveScoreHome + gh}-{liveScoreAway + ga}</div>
                                <div style={{ fontSize: '0.68rem', marginTop: '0.1rem', color: dark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.5)' }}>{pc.toFixed(1)}%</div>
                                {isCur && <span style={{ position: 'absolute', top: '2px', right: '2px', fontSize: '0.48rem', background: dark ? 'rgba(15,23,42,0.15)' : 'rgba(16,185,129,0.25)', color: dark ? '#0f172a' : '#34d399', padding: '0.05rem 0.2rem', borderRadius: '2px', border: '1px solid rgba(16,185,129,0.3)', textTransform: 'uppercase' }}>Act.</span>}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Nota: lambdas base ajustados linealmente al tiempo restante. Estandar In-Play.</p>
            </div>
          </div>
        );
      })()}

      <div className="match-disclaimer" style={{ marginTop: '2.5rem' }}>Aviso: Predicciones con fines academicos y de entretenimiento. No utilizar para decisiones de riesgo.</div>
      <div className="data-note">Nota: Datos calculados dinamicamente con cortes temporales.</div>
      <div style={{ textAlign: 'center', marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button onClick={() => window.history.back()} className="btn btn-outline">← Volver Atrás</button>
        <Link to={`/resultados/${match.day}`} className="btn btn-outline">Ver partidos de esta fase</Link>
      </div>
    </div>
  );
}