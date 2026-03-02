/**
 * API Utility for Football Analytics V2
 * Connects the V2 Frontend to the live Railway PostgreSQL database via the FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://football-analytics-production-5b3d.up.railway.app";

// Helper function to handle standard fetch responses
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
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
        console.error(`Fetch failed for ${endpoint}:`, error);
        throw error;
    }
}

// ---------------------------------------------------------------------------
// 1. Matches & Fixtures
// ---------------------------------------------------------------------------

export interface MatchFilterParams {
    league?: string;
    season?: string;
    limit?: number;
    offset?: number;
}

export const matchesApi = {
    // Get upcoming and recent fixtures
    getMatches: (params?: MatchFilterParams) => {
        const query = new URLSearchParams();
        if (params?.league) query.append('league', params.league);
        if (params?.season) query.append('season', params.season);
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());

        return fetchAPI(`/api/matches?${query.toString()}`);
    },

    // Get head-to-head history between two specific teams
    getHeadToHead: (homeTeam: string, awayTeam: string) => {
        return fetchAPI(`/api/h2h?home=${encodeURIComponent(homeTeam)}&away=${encodeURIComponent(awayTeam)}`);
    }
};

// ---------------------------------------------------------------------------
// 2. Data Synchronization (Admin Only)
// ---------------------------------------------------------------------------

export const syncApi = {
    // Get the current sync status of the database
    getStatus: () => {
        return fetchAPI('/api/sync/status');
    },

    // Trigger a full manual sync (Admin required)
    triggerSync: (token: string) => {
        return fetchAPI('/api/sync/trigger', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
};

// ---------------------------------------------------------------------------
// 3. Predictions & Modeling (Premium Only)
// ---------------------------------------------------------------------------

export const predictionsApi = {
    // Generate predictive model for upcoming matches
    getPredictions: (league: string, token: string) => {
        return fetchAPI(`/api/predictions/generate?league=${encodeURIComponent(league)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }
};
