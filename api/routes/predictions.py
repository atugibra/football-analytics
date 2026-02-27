"""
Predictions API - Rule-based match outcome predictor.
Uses squad stats and standings from the DB to compute probabilities.
No ML model required - pure data-driven heuristics.

Endpoint: POST /api/predictions/generate
  Body: { "home_team": "Arsenal", "away_team": "Chelsea", "league": "Premier League" }
  Returns: { home_win_prob, draw_prob, away_win_prob, predicted_score, confidence,
             home_stats, away_stats }
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import get_connection

router = APIRouter()


class PredictionRequest(BaseModel):
    home_team: str
    away_team: str
    league:    Optional[str] = None


def get_team_stats(cur, team_name: str) -> dict:
    """Fetch the most recent squad stats for a team (split='for')."""
    cur.execute("""
        SELECT ts.goals, ts.assists, ts.games, ts.possession, ts.avg_age,
               t.name as team_name, l.name as league_name,
               ts.standard_stats
        FROM   team_squad_stats ts
        JOIN   teams   t ON t.id  = ts.team_id
        JOIN   leagues l ON l.id  = ts.league_id
        WHERE  LOWER(t.name) LIKE LOWER(%s)
          AND  ts.split = 'for'
        ORDER  BY ts.scraped_at DESC
        LIMIT  1
    """, (f"%{team_name}%",))
    return cur.fetchone()


def get_team_standings(cur, team_name: str) -> dict:
    """Fetch the most recent standings row for a team."""
    cur.execute("""
        SELECT ls.wins, ls.ties, ls.losses, ls.games,
               ls.goals_for, ls.goals_against, ls.points, ls.rank
        FROM   league_standings ls
        JOIN   teams t ON t.id = ls.team_id
        WHERE  LOWER(t.name) LIKE LOWER(%s)
          AND  ls.is_current = TRUE
        ORDER  BY ls.updated_at DESC
        LIMIT  1
    """, (f"%{team_name}%",))
    return cur.fetchone()


def safe_div(a, b, default=0.0):
    try: return float(a) / float(b) if b else default
    except: return default


def compute_prediction(home_stats, away_stats, home_stand, away_stand) -> dict:
    home_gpg = safe_div(home_stats["goals"] if home_stats else 0,
                        home_stats["games"] if home_stats else 1, 1.2)
    away_gpg = safe_div(away_stats["goals"] if away_stats else 0,
                        away_stats["games"] if away_stats else 1, 1.0)
    home_wr = safe_div(home_stand["wins"]  if home_stand else 0,
                       home_stand["games"] if home_stand else 1, 0.4)
    away_wr = safe_div(away_stand["wins"]  if away_stand else 0,
                       away_stand["games"] if away_stand else 1, 0.35)
    h_strength = 0.6 * home_gpg + 0.4 * home_wr
    a_strength = 0.6 * away_gpg + 0.4 * away_wr
    HOME_ADV = 0.06
    total = h_strength + a_strength + 0.001
    raw_home = (h_strength / total) + HOME_ADV
    raw_away = (a_strength / total) - HOME_ADV * 0.5
    raw_draw = 1 - raw_home - raw_away
    raw_home = max(0.1, raw_home)
    raw_away = max(0.1, raw_away)
    raw_draw = max(0.1, raw_draw)
    s = raw_home + raw_away + raw_draw
    home_p = round(raw_home / s, 3)
    away_p = round(raw_away / s, 3)
    draw_p = round(1 - home_p - away_p, 3)
    pred_home_goals = max(0, round(home_gpg * 0.85))
    pred_away_goals = max(0, round(away_gpg * 0.75))
    has_data = bool(home_stats and away_stats and home_stand and away_stand)
    confidence = "high" if has_data else ("medium" if (home_stats or away_stats) else "low")
    return {
        "home_win_prob": home_p,
        "draw_prob":     draw_p,
        "away_win_prob": away_p,
        "predicted_score": {"home": pred_home_goals, "away": pred_away_goals},
        "confidence": confidence,
    }


@router.post("/generate")
async def generate_prediction(req: PredictionRequest):
    conn = get_connection()
    cur  = conn.cursor()
    try:
        home_stats  = get_team_stats(cur,     req.home_team)
        away_stats  = get_team_stats(cur,     req.away_team)
        home_stand  = get_team_standings(cur, req.home_team)
        away_stand  = get_team_standings(cur, req.away_team)
        prediction = compute_prediction(home_stats, away_stats, home_stand, away_stand)

        def fmt_stats(sq, st):
            if not sq and not st:
                return None
            return {
                "goals_per_game": round(safe_div(sq["goals"] if sq else 0, sq["games"] if sq else 1, 0), 2) if sq else None,
                "win_rate": round(safe_div(st["wins"] if st else 0, st["games"] if st else 1, 0), 2) if st else None,
                "possession": float(sq["possession"]) if sq and sq.get("possession") else None,
                "avg_age":    float(sq["avg_age"])    if sq and sq.get("avg_age")    else None,
                "goals_for":  int(st["goals_for"])    if st and st.get("goals_for")  else None,
                "goals_against": int(st["goals_against"]) if st and st.get("goals_against") else None,
                "rank":       int(st["rank"])         if st and st.get("rank")       else None,
                "points":     int(st["points"])       if st and st.get("points")     else None,
            }

        return {
            "success": True,
            "home_team":  req.home_team,
            "away_team":  req.away_team,
            **prediction,
            "home_stats": fmt_stats(home_stats, home_stand),
            "away_stats": fmt_stats(away_stats, away_stand),
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        conn.close()

