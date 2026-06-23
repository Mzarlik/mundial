import React from 'react';
import { useNavigate } from 'react-router-dom';
import { flagUrl } from '../config/matches';

export default function MatchCard({ match }) {
  const nav = useNavigate();
  return (
    <div className="card match-card" onClick={() => nav(`/partido/${match.id}`)}>
      <div className="flags">
        <img src={flagUrl(match.homeCode)} alt={match.home} />
        <span className="vs">VS</span>
        <img src={flagUrl(match.awayCode)} alt={match.away} />
      </div>
      <div className="teams">{match.home} — {match.away}</div>
      <div className="meta">{match.group} · {match.time}</div>
      <div className="meta">{match.venue}</div>
    </div>
  );
}
