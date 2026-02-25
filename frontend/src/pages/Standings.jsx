import { useEffect, useState } from 'react';
import { getStandings, getLeagues } from '../api';
import { useSearchParams } from 'react-router-dom';

export default function Standings() {
    const [standings, setStandings] = useState([]);
    const [leagues, setLeagues] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const leagueId = searchParams.get('league_id') || '';
    const seasonId = searchParams.get('season_id') || '';

    useEffect(() => { getLeagues().then(setLeagues); }, []);
    useEffect(() => {
        const p = {};
        if (leagueId) p.league_id = leagueId;
        if (seasonId) p.season_id = seasonId;
        getStandings(p).then(setStandings);
    }, [leagueId, seasonId]);

    // Group by league
    const byLeague = standings.reduce((acc, row) => {
        const key = `${row.league} — ${row.season}`;
        acc[key] = acc[key] || [];
        acc[key].push(row);
        return acc;
    }, {});

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">📊 League Standings</h1>
                <p className="page-sub">Current and historical standings</p>
            </div>
            <div className="filters">
                <select value={leagueId} onChange={e => setSearchParams({ league_id: e.target.value, season_id: seasonId })}>
                    <option value="">All Leagues</option>
                    {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
            </div>
            {Object.entries(byLeague).map(([key, rows]) => (
                <div key={key} style={{ marginBottom: 36 }}>
                    <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>{key}</h2>
                    <div className="tbl-wrap">
                        <table>
                            <thead><tr>
                                <th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
                                <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                            </tr></thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.team}>
                                        <td style={{ color: 'var(--muted)' }}>{r.rank}</td>
                                        <td style={{ fontWeight: 600 }}>{r.team}</td>
                                        <td>{r.games}</td>
                                        <td style={{ color: '#22c55e' }}>{r.wins}</td>
                                        <td style={{ color: '#f59e0b' }}>{r.ties}</td>
                                        <td style={{ color: '#ef4444' }}>{r.losses}</td>
                                        <td>{r.goals_for}</td>
                                        <td>{r.goals_against}</td>
                                        <td style={{ fontWeight: 600, color: r.goal_diff > 0 ? '#22c55e' : r.goal_diff < 0 ? '#ef4444' : 'var(--muted)' }}>
                                            {r.goal_diff > 0 ? '+' : ''}{r.goal_diff}
                                        </td>
                                        <td style={{ fontWeight: 800, fontSize: 15 }}>{r.points}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            {!Object.keys(byLeague).length && <div className="empty">No standings data. Sync data from the extension first.</div>}
        </div>
    );
}
