from fastapi import APIRouter
from typing import Optional
from database import get_connection

router = APIRouter()

@router.get("/")
def get_standings(league_id: Optional[int] = None, season_id: Optional[int] = None):
    conn = get_connection()
    cur = conn.cursor()
    query = """
        SELECT ls.rank, t.name AS team, l.name AS league, s.name AS season,
               ls.games, ls.wins, ls.ties, ls.losses,
               ls.goals_for, ls.goals_against, ls.goal_diff,
               ls.points, ls.points_avg, ls.home_away_split
        FROM league_standings ls
        JOIN teams t ON t.id = ls.team_id
        JOIN leagues l ON l.id = ls.league_id
        JOIN seasons s ON s.id = ls.season_id
        WHERE 1=1
    """
    params = []
    if league_id:
        query += " AND ls.league_id = %s"; params.append(league_id)
    if season_id:
        query += " AND ls.season_id = %s"; params.append(season_id)
    query += " ORDER BY ls.league_id, ls.rank"
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    return rows
