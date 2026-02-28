import { useState } from 'react';
import { TrendingUp, Zap } from 'lucide-react';
import { getTeams } from '../api';
import { useEffect } from 'react';
let API = import.meta.env.VITE_API_URL || 'https://football-analytics-production-5b3d.up.railway.app';
if (API.startsWith('http://') && !API.includes('localhost')) {
        API = API.replace('http://', 'https://');
}
export default function Predictions() {
    const [teams, setTeams] = useState([]);
    const [home, setHome] = useState('');
    const [away, setAway] = useState('');
    const [league, setLeague] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => { getTeams().then(setTeams); }, []);

    const predict = async () => {
        if (!home || !away) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/predictions/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ home_team: home, away_team: away, league })
            });
            const data = await res.json();
            setResult(data);
        } catch {
            setResult({ error: 'Backend predictions unavailable. Start the FastAPI server first.' });
        }
        setLoading(false);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">🔮 Predictions</h1>
                <p className="page-sub">ML-powered match outcome predictions</p>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Generate a Prediction</h3>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Home Team</div>
                        <input className="input" list="teams-list" value={home} onChange={e => setHome(e.target.value)} placeholder="e.g. Arsenal" style={{ minWidth: 200 }} />
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--muted)', paddingBottom: 4 }}>vs</div>
                    <div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Away Team</div>
                        <input className="input" list="teams-list" value={away} onChange={e => setAway(e.target.value)} placeholder="e.g. Chelsea" style={{ minWidth: 200 }} />
                    </div>
                    <button className="btn btn-primary" onClick={predict} disabled={loading}>
                        <Zap size={15} /> {loading ? 'Predicting...' : 'Predict'}
                    </button>
                </div>
                <datalist id="teams-list">
                    {teams.map(t => <option key={t.id} value={t.name} />)}
                </datalist>
            </div>

            {result && (
                <div className="card">
                    {result.error
                        ? <div style={{ color: '#fca5a5', display: 'flex', gap: 8, alignItems: 'center' }}><TrendingUp size={16} />{result.error}</div>
                        : (
                            <div>
                                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Prediction Result</h3>
                                <pre style={{ background: 'var(--surface2)', padding: 16, borderRadius: 8, fontSize: 13, color: '#93c5fd', overflow: 'auto' }}>
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            </div>
                        )}
                </div>
            )}

            <div className="card" style={{ marginTop: 24, borderColor: 'rgba(245,158,11,.3)' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20 }}>⚠️</span>
                    <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Predictions require the ML backend</div>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>
                            Start your FastAPI server (<code>python main.py</code>) and ensure your ML model is connected. The predictions endpoint proxies to your prediction logic at <code>/api/predictions/generate</code>.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
