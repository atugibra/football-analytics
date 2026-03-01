from fastapi import APIRouter
from typing import Optional
from database import get_connection

router = APIRouter()


@router.get("/seasons")
def get_standings_seasons(league_id: Optional[int] = None):
    """
    Return all seasons that have standings data, optionally filtered by league.
    The most recent season per league is flagged as is_current=True.
    """
    conn = get_connection()
    cur = conn.cursor()
    query = """
        SELECT DISTINCT
            l.id   AS league_id,
            l.name AS league,
            s.id   AS season_id,
            s.name AS season
        FROM league_standings ls
        JOIN leagues l ON l.id = ls.league_id
        JOIN seasons  s ON s.id = ls.season_id
        WHERE 1=1
    """
    params = []
    if league_id:
        query += " AND ls.league_id = %s"; params.append(league_id)
    query += " ORDER BY l.name, s.name DESC"
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()

    # Mark the most recent season per league as current
    latest_per_league = {}
    for r in rows:
        lid = r["league_id"]
        if lid not in latest_per_league:
            latest_per_league[lid] = r["season_id"]

    result = []
    for r in rows:
        result.append({
            "league_id":  r["league_id"],
            "league":     r["league"],
            "season_id":  r["season_id"],
            "season":     r["season"],
            "is_current": r["season_id"] == latest_per_league.get(r["league_id"]),
        })
    return result


@router.get("")
def get_standings(league_id: Optional[int] = None, season_id: Optional[int] = None):
    conn = get_connection()
    cur = conn.cursor()

    # Subquery: find the latest season_id per league (used to mark is_current)
    query = """
        SELECT ls.rank,
               t.name  AS team,
               l.name  AS league,
               l.id    AS league_id,
               s.name  AS season,
               s.id    AS season_id,
               ls.games, ls.wins, ls.ties, ls.losses,
               ls.goals_for, ls.goals_against, ls.goal_diff,
               ls.points, ls.points_avg, ls.home_away_split,
               -- is_current: true when this is the latest season for this league
               (ls.season_id = (
                   SELECT MAX(ls2.season_id)
                   FROM league_standings ls2
                   WHERE ls2.league_id = ls.league_id
               )) AS is_current
        FROM league_standings ls
        JOIN teams   t ON t.id = ls.team_id
        JOIN leagues l ON l.id = ls.league_id
        JOIN seasons s ON s.id = ls.season_id
        WHERE 1=1
    """
    params = []
    if league_id:
        query += " AND ls.league_id = %s"; params.append(league_id)
    if season_id:
        query += " AND ls.season_id = %s"; params.append(season_id)
    query += " ORDER BY ls.league_id, ls.season_id DESC, ls.rank"
    cur.execute(query, params)
    rows = cur.fetchall()
    conn.close()
    return rows
