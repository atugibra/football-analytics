import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from database import get_connection

router = APIRouter()

# ─── Pydantic models for the bulk sync payloads ──────────────────────────────
class SyncFixturesPayload(BaseModel):
    league: str
    season: str
    fixtures: List[dict]

class SyncStatsPayload(BaseModel):
    league: str
    season: str
    stats: List[dict]

class SyncPlayerStatsPayload(BaseModel):
    league: str
    season: str
    player_stats: List[dict]

class SyncAllPayload(BaseModel):
    league: str
    season: str
    fixtures: Optional[List[dict]] = []
    stats: Optional[List[dict]] = []
    playerStats: Optional[List[dict]] = []

# ─── Helpers ─────────────────────────────────────────────────────────────────
def get_or_create(cur, table, unique_cols: dict, extra_cols: dict = {}):
    """Return the ID of an existing row or insert and return the new ID."""
    where = " AND ".join(f"{k}=%s" for k in unique_cols)
    cur.execute(f"SELECT id FROM {table} WHERE {where}", list(unique_cols.values()))
    row = cur.fetchone()
    if row:
        return row["id"]
    all_cols = {**unique_cols, **extra_cols}
    cols = ", ".join(all_cols.keys())
    placeholders = ", ".join(["%s"] * len(all_cols))
    cur.execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders}) RETURNING id", list(all_cols.values()))
    return cur.fetchone()["id"]

def parse_score(score_raw: str):
    """Parse '2–1' → (2, 1). Returns (None, None) for future matches."""
    if not score_raw or str(score_raw).strip() in ("", "nan", "None"):
        return None, None
    cleaned = re.sub(r"\s*\(.*?\)", "", str(score_raw)).strip()
    for sep in ["–", "-", "—"]:
        if sep in cleaned:
            parts = cleaned.split(sep)
            try:
                return int(parts[0].strip()), int(parts[1].strip())
            except (ValueError, IndexError):
                return None, None
    return None, None

def parse_date(raw):
    if not raw or str(raw).strip() in ("", "nan", "None"):
        return None
    s = str(raw).strip()
    if len(s) == 8 and s.isdigit():
        return f"{s[:4]}-{s[4:6]}-{s[6:]}"
    return s[:10]

# ─── Full sync endpoint (used by the Chrome extension) ───────────────────────
@router.post("/all")
def sync_all(payload: SyncAllPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create(cur, "leagues", {"name": payload.league})
        season_id = get_or_create(cur, "seasons", {"name": payload.season})

        fixtures_inserted = _insert_fixtures(cur, league_id, season_id, payload.league, payload.fixtures or [])
        stats_inserted    = _insert_squad_stats(cur, league_id, season_id, payload.stats or [])
        players_inserted  = _insert_player_stats(cur, season_id, payload.league, payload.playerStats or [])

        conn.commit()
        log_scrape(cur, league_id, season_id, "sync_all", fixtures_inserted + stats_inserted + players_inserted, 0)
        conn.commit()
        return {
            "success": True,
            "fixtures_inserted": fixtures_inserted,
            "stats_inserted": stats_inserted,
            "players_inserted": players_inserted,
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/fixtures")
def sync_fixtures(payload: SyncFixturesPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create(cur, "leagues", {"name": payload.league})
        season_id = get_or_create(cur, "seasons", {"name": payload.season})
        inserted = _insert_fixtures(cur, league_id, season_id, payload.league, payload.fixtures)
        conn.commit()
        return {"success": True, "matches_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/stats")
def sync_stats(payload: SyncStatsPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create(cur, "leagues", {"name": payload.league})
        season_id = get_or_create(cur, "seasons", {"name": payload.season})
        inserted = _insert_squad_stats(cur, league_id, season_id, payload.stats)
        conn.commit()
        return {"success": True, "stats_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/player-stats")
def sync_player_stats(payload: SyncPlayerStatsPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        season_id = get_or_create(cur, "seasons", {"name": payload.season})
        inserted = _insert_player_stats(cur, season_id, payload.league, payload.player_stats)
        conn.commit()
        return {"success": True, "players_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ─── Internal helpers ────────────────────────────────────────────────────────
def _insert_fixtures(cur, league_id, season_id, league_name, fixtures):
    count = 0
    for f in fixtures:
        home = str(f.get("home_team", "")).strip()
        away = str(f.get("away_team", "")).strip()
        if not home or not away:
            continue
        home_id = get_or_create(cur, "teams", {"name": home, "league_id": league_id})
        away_id = get_or_create(cur, "teams", {"name": away, "league_id": league_id})
        home_score, away_score = parse_score(f.get("score"))
        match_date = parse_date(f.get("date"))
        cur.execute("""
            INSERT INTO matches (league_id, season_id, home_team_id, away_team_id,
                gameweek, dayofweek, match_date, start_time, home_score, away_score, score_raw,
                attendance, venue, referee, round)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (home_team_id, away_team_id, match_date) DO UPDATE SET
                home_score=EXCLUDED.home_score,
                away_score=EXCLUDED.away_score,
                score_raw=EXCLUDED.score_raw,
                attendance=EXCLUDED.attendance,
                updated_at=NOW()
        """, (
            league_id, season_id, home_id, away_id,
            f.get("gameweek"), f.get("dayofweek"),
            match_date, f.get("start_time"),
            home_score, away_score, f.get("score"),
            f.get("attendance"), f.get("venue"), f.get("referee"), f.get("round")
        ))
        count += 1
    return count


def _insert_squad_stats(cur, league_id, season_id, stats_rows):
    count = 0
    for row in stats_rows:
        team_raw = str(row.get("team", "")).strip()
        if not team_raw:
            continue
        split = "against" if team_raw.startswith("vs ") else "for"
        team_name = team_raw[3:] if split == "against" else team_raw
        team_id = get_or_create(cur, "teams", {"name": team_name, "league_id": league_id})
        cur.execute("""
            INSERT INTO team_squad_stats
                (team_id, league_id, season_id, split, players_used, avg_age, possession,
                 games, games_starts, minutes, minutes_90s, goals, assists,
                 standard_stats, goalkeeping, shooting, playing_time, misc_stats)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (team_id, season_id, split) DO UPDATE SET
                goals=EXCLUDED.goals, assists=EXCLUDED.assists,
                standard_stats=EXCLUDED.standard_stats,
                goalkeeping=EXCLUDED.goalkeeping,
                shooting=EXCLUDED.shooting,
                playing_time=EXCLUDED.playing_time,
                misc_stats=EXCLUDED.misc_stats,
                scraped_at=NOW()
        """, (
            team_id, league_id, season_id, split,
            row.get("players_used"), row.get("avg_age"), row.get("possession"),
            row.get("games"), row.get("games_starts"), row.get("minutes"), row.get("minutes_90s"),
            row.get("goals"), row.get("assists"),
            json.dumps(row.get("standard_stats") or {}),
            json.dumps(row.get("goalkeeping") or {}),
            json.dumps(row.get("shooting") or {}),
            json.dumps(row.get("playing_time") or {}),
            json.dumps(row.get("misc_stats") or {}),
        ))
        count += 1
    return count


def _insert_player_stats(cur, season_id, league_name, players):
    count = 0
    for p in players:
        name = str(p.get("player", "")).strip()
        if not name or name.lower() in ("player", ""):
            continue
        team_name = str(p.get("team", "")).strip()
        team_id = None
        if team_name:
            cur.execute("SELECT id FROM leagues WHERE name ILIKE %s LIMIT 1", (f"%{league_name}%",))
            lg = cur.fetchone()
            if lg:
                team_id = get_or_create(cur, "teams", {"name": team_name, "league_id": lg["id"]})
        cur.execute("""
            INSERT INTO player_stats
                (player_name, nationality, position, team_id, season_id,
                 age, birth_year, games, games_starts, minutes, minutes_90s,
                 goals, assists, standard_stats)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (player_name, team_id, season_id) DO UPDATE SET
                goals=EXCLUDED.goals, assists=EXCLUDED.assists,
                standard_stats=EXCLUDED.standard_stats,
                scraped_at=NOW()
        """, (
            name, p.get("nationality"), p.get("position"),
            team_id, season_id,
            p.get("age"), p.get("birth_year"),
            p.get("games"), p.get("games_starts"),
            p.get("minutes"), p.get("minutes_90s"),
            p.get("goals"), p.get("assists"),
            json.dumps(p.get("standard_stats") or {})
        ))
        count += 1
    return count


def log_scrape(cur, league_id, season_id, page_type, inserted, updated):
    cur.execute("""
        INSERT INTO scrape_log (league_id, season_id, page_type, rows_inserted, rows_updated)
        VALUES (%s, %s, %s, %s, %s)
    """, (league_id, season_id, page_type, inserted, updated))
