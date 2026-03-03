/**
 * Utility functions for interacting with the live Railway API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://football-analytics-production-5b3d.up.railway.app';

// Helper for standardized fetch calls
async function fetchWrapper(path: string, options: RequestInit = {}) {
    try {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Fetch failed for ${path}:`, error);
        return null;
    }
}

// Matches API
export const matchesApi = {
    getMatches: (params?: Record<string, string>) => {
        const query = new URLSearchParams(params).toString();
        return fetchWrapper(`/api/matches${query ? `?${query}` : ''}`);
    },
    getMatchById: (id: string) => fetchWrapper(`/api/matches/${id}`),
};

// Standings API (New from V1)
export const getStandings = (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return fetchWrapper(`/api/standings${query ? `?${query}` : ''}`);
}

// Data Sync API
export const syncApi = {
    triggerSync: () => fetchWrapper('/api/sync/all', { method: 'POST' }),
    getHealth: () => fetchWrapper('/api/health'),
};

// Predictions API
export const predictionsApi = {
    getPredictions: (leagueId?: string) => {
        const path = leagueId ? `/api/predictions?league_id=${leagueId}` : '/api/predictions';
        return fetchWrapper(path);
    },
};

// Teams/H2H API
export const getH2H = (teamId: string, oppId: string) => fetchWrapper(`/api/teams/${teamId}/head-to-head/${oppId}`)

// Leagues API
export const getLeagues = () => fetchWrapper('/api/leagues');

// Teams API
export const getTeams = (leagueId?: number) => {
    const path = leagueId ? `/api/teams?league_id=${leagueId}` : '/api/teams';
    return fetchWrapper(path);
};

// Prediction Generator
export interface PredictionTeamStats {
    goals_per_game: number | null;
    win_rate: number | null;
    possession: number | null;
    avg_age: number | null;
    goals_for: number | null;
    goals_against: number | null;
    rank: number | null;
    points: number | null;
}

export interface PredictionActualResult {
    home_score: number;
    away_score: number;
    score_raw: string | null;
    match_date: string | null;
    prediction_correct: boolean;
}

export interface PredictionResponse {
    success: boolean;
    home_team: string;
    away_team: string;
    home_win_prob: number;
    draw_prob: number;
    away_win_prob: number;
    predicted_score: { home: number; away: number };
    confidence: 'high' | 'medium' | 'low';
    home_stats: PredictionTeamStats | null;
    away_stats: PredictionTeamStats | null;
    actual_result: PredictionActualResult | null;
    error?: string;
}

export const generatePrediction = (homeTeam: string, awayTeam: string): Promise<PredictionResponse | null> =>
    fetchWrapper('/api/predictions/generate', {
        method: 'POST',
        body: JSON.stringify({ home_team: homeTeam, away_team: awayTeam }),
    });
