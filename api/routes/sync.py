import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from database import get_connection

def safe_num(val):
    """Safely convert FBref values to a number, returning None for non-numeric."""
    if val is None:
        return None
    s = str(val).strip().replace(",", "").replace("%", "").replace("N/A", "").replace("nan", "")
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        try:
            return float(s)
        except ValueError:
            return None


def safe_text(val):
    """Extract plain text from a value that may be a dict/link object or plain string.
    FBref cells often come as {"link": "...", "text": "Team Name"} — extract text.
    """
    if val is None:
        return ""
    if isinstance(val, dict):
        return str(val.get("text", val.get("name", ""))).strip()
    s = str(val).strip()
    # Handle Python-stringified dicts like "{'link': '...', 'text': 'Team'}"
    if s.startswith("{") and ("'text'" in s or '"text"' in s):
        try:
            import ast
            d = ast.literal_eval(s)
            if isinstance(d, dict):
                return str(d.get("text", d.get("name", ""))).strip()
        except Exception:
            pass
    return s


router = APIRouter()

# ─── Pydantic models ─────────────────────────────────────────────────────────
class TableData(BaseModel):
    headers: List[str] = []
    rows: List[List[Any]] = []
    rowCount: Optional[int] = None

class SyncPayload(BaseModel):
    """Flexible payload - accepts raw tables (from extension) OR pre-processed lists"""
    league: str
    season: str
    # Raw table format (from Chrome extension)
    tables: Optional[List[TableData]] = None
    # Pre-processed format (from Excel importer)
    fixtures: Optional[List[dict]] = None
    stats: Optional[List[dict]] = None
    player_stats: Optional[List[dict]] = None
    playerStats: Optional[List[dict]] = None

# ─── Raw table → dict converters ─────────────────────────────────────────────
def tables_to_fixtures(tables: List[TableData]) -> List[dict]:
    """Convert raw scraped fixture tables into fixture dicts."""
    result = []
    for table in tables:
        headers = [h.strip().lower() for h in table.headers]
        for row in table.rows:
            if len(row) < 3:
                continue
            r = dict(zip(headers, row))
            # Map FBref column names to our schema
            home = str(r.get("home", r.get("home team", ""))).strip()
            away = str(r.get("away", r.get("away team", ""))).strip()
            if not home or not away or home.lower() in ("home", ""):
                continue
            result.append({
                "home_team": home,
                "away_team": away,
                "date": r.get("date", r.get("dates", "")),
                "start_time": r.get("time", ""),
                "score": r.get("score", ""),
                "gameweek": r.get("wk", r.get("round", r.get("gameweek", ""))),
                "dayofweek": r.get("day", ""),
                "venue": r.get("venue", ""),
                "attendance": r.get("attendance", ""),
                "referee": r.get("referee", ""),
                "round": r.get("round", ""),
            })
    return result


def tables_to_squad_stats(tables: List[TableData]) -> List[dict]:
    """Convert raw scraped squad stats tables into stat dicts."""
    result = []
    for table in tables:
        headers = [h.strip().lower() for h in table.headers]
        for row in table.rows:
            if len(row) < 2:
                continue
            r = dict(zip(headers, row))
            team = safe_text(r.get("squad", r.get("team", "")))
            if not team or team.lower() in ("squad", "team", ""):
                continue
            # Put everything else into standard_stats JSONB
            extra = {k: v for k, v in r.items() if k not in ("squad", "team")}
            result.append({
                "team": team,
                "players_used": r.get("# pl", r.get("players used", r.get("players_used", None))),
                "avg_age": r.get("age", r.get("avg age", None)),
                "possession": r.get("poss", r.get("possession", None)),
                "games": r.get("mp", r.get("games", None)),
                "games_starts": r.get("starts", r.get("games_starts", None)),
                "minutes": r.get("min", r.get("minutes", None)),
                "minutes_90s": r.get("90s", r.get("minutes_90s", None)),
                "goals": r.get("gls", r.get("goals", None)),
                "assists": r.get("ast", r.get("assists", None)),
                "standard_stats": extra,
            })
    return result


def tables_to_player_stats(tables: List[TableData]) -> List[dict]:
    """Convert raw scraped player tables into player stat dicts."""
    result = []
    for table in tables:
        headers = [h.strip().lower() for h in table.headers]
        for row in table.rows:
            if len(row) < 2:
                continue
            r = dict(zip(headers, row))
            name = safe_text(r.get("player", ""))
            if not name or name.lower() in ("player", ""):
                continue
            extra = {k: v for k, v in r.items() if k not in ("player",)}
            result.append({
                "player": name,
                "nationality": r.get("nation", r.get("nationality", "")),
                "position": r.get("pos", r.get("position", "")),
                "team": r.get("squad", r.get("team", "")),
                "age": r.get("age", None),
                "birth_year": r.get("born", r.get("birth_year", None)),
                "games": r.get("mp", r.get("games", None)),
                "games_starts": r.get("starts", None),
                "minutes": r.get("min", r.get("minutes", None)),
                "minutes_90s": r.get("90s", None),
                "goals": r.get("gls", r.get("goals", None)),
                "assists": r.get("ast", r.get("assists", None)),
                "standard_stats": extra,
            })
    return result


def detect_table_type(table: TableData) -> str:
    """Detect if a table contains fixtures, player stats, or squad stats."""
    headers_lower = [h.strip().lower() for h in table.headers]
    if "home" in headers_lower or ("date" in headers_lower and "score" in headers_lower):
        return "fixtures"
    if "player" in headers_lower:
        return "player_stats"
    return "squad_stats"


# ─── Helpers ─────────────────────────────────────────────────────────────────
def get_or_create(cur, table, unique_cols: dict, extra_cols: dict = {}):
    """Generic exact-match get-or-create (kept for backward compat)."""
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


def get_or_create_league(cur, name: str) -> int:
    """Case-insensitive league lookup. Normalises to title-case on insert.
    Raises ValueError if name is a bare year (e.g. '2025').
    """
    clean = name.strip()
    if clean.isdigit():
        raise ValueError(f"Invalid league name '{clean}' — looks like a year, not a league.")
    cur.execute("SELECT id FROM leagues WHERE name ILIKE %s LIMIT 1", (clean,))
    row = cur.fetchone()
    if row:
        return row["id"]
    normalized = clean.title()
    cur.execute("INSERT INTO leagues (name) VALUES (%s) RETURNING id", (normalized,))
    return cur.fetchone()["id"]


def get_or_create_season(cur, name: str) -> int:
    """Case-insensitive season lookup."""
    clean = name.strip()
    cur.execute("SELECT id FROM seasons WHERE name ILIKE %s LIMIT 1", (clean,))
    row = cur.fetchone()
    if row:
        return row["id"]
    cur.execute("INSERT INTO seasons (name) VALUES (%s) RETURNING id", (clean,))
    return cur.fetchone()["id"]


def get_or_create_team(cur, name: str, league_id: int) -> int:
    """Case-insensitive team lookup within a league."""
    clean = safe_text(name) or name.strip()
    cur.execute(
        "SELECT id FROM teams WHERE name ILIKE %s AND league_id = %s LIMIT 1",
        (clean, league_id)
    )
    row = cur.fetchone()
    if row:
        return row["id"]
    cur.execute(
        "INSERT INTO teams (name, league_id) VALUES (%s, %s) RETURNING id",
        (clean, league_id)
    )
    return cur.fetchone()["id"]


def parse_score(score_raw: str):
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


# ─── Sync endpoint (used by Chrome extension AND importer) ───────────────────
@router.post("/all")
def sync_all(payload: SyncPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create_league(cur, payload.league)
        season_id = get_or_create_season(cur, payload.season)

        # If extension sent raw tables, classify and convert them
        fixtures_list = payload.fixtures or []
        stats_list = payload.stats or []
        players_list = payload.playerStats or payload.player_stats or []

        if payload.tables:
            for t in payload.tables:
                ttype = detect_table_type(t)
                if ttype == "fixtures":
                    fixtures_list.extend(tables_to_fixtures([t]))
                elif ttype == "player_stats":
                    players_list.extend(tables_to_player_stats([t]))
                else:
                    stats_list.extend(tables_to_squad_stats([t]))

        fx  = _insert_fixtures(cur, league_id, season_id, payload.league, fixtures_list)
        st  = _insert_squad_stats(cur, league_id, season_id, stats_list)
        pl  = _insert_player_stats(cur, season_id, payload.league, players_list)

        conn.commit()
        log_scrape(cur, league_id, season_id, "sync_all", fx + st + pl, 0)
        conn.commit()
        return {"success": True, "fixtures_inserted": fx, "stats_inserted": st, "players_inserted": pl}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/fixtures")
def sync_fixtures(payload: SyncPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create_league(cur, payload.league)
        season_id = get_or_create_season(cur, payload.season)
        rows = payload.fixtures or []
        if payload.tables:
            rows.extend(tables_to_fixtures(payload.tables))
        inserted = _insert_fixtures(cur, league_id, season_id, payload.league, rows)
        conn.commit()
        return {"success": True, "matches_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/stats")
def sync_stats(payload: SyncPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        league_id = get_or_create_league(cur, payload.league)
        season_id = get_or_create_season(cur, payload.season)
        rows = payload.stats or []
        if payload.tables:
            rows.extend(tables_to_squad_stats(payload.tables))
        inserted = _insert_squad_stats(cur, league_id, season_id, rows)
        conn.commit()
        return {"success": True, "stats_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@router.post("/player-stats")
def sync_player_stats(payload: SyncPayload):
    conn = get_connection()
    cur = conn.cursor()
    try:
        season_id = get_or_create_season(cur, payload.season)
        rows = payload.player_stats or payload.playerStats or []
        if payload.tables:
            rows.extend(tables_to_player_stats(payload.tables))
        inserted = _insert_player_stats(cur, season_id, payload.league, rows)
        conn.commit()
        return {"success": True, "players_inserted": inserted}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


# ─── Internal insert helpers ─────────────────────────────────────────────────
def _insert_fixtures(cur, league_id, season_id, league_name, fixtures):
    count = 0
    for f in fixtures:
        home = str(f.get("home_team", "")).strip()
        away = str(f.get("away_team", "")).strip()
        if not home or not away:
            continue
        home_id = get_or_create_team(cur, home, league_id)
        away_id = get_or_create_team(cur, away, league_id)
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
        team_raw = safe_text(row.get("team", ""))
        if not team_raw:
            continue
        split = "against" if team_raw.startswith("vs ") else "for"
        team_name = team_raw[3:].strip() if split == "against" else team_raw
        team_id = get_or_create_team(cur, team_name, league_id)
        cur.execute("""
            INSERT INTO team_squad_stats
                (team_id, league_id, season_id, split, players_used, avg_age, possession,
                 games, games_starts, minutes, minutes_90s, goals, assists,
                 standard_stats, goalkeeping, shooting, playing_time, misc_stats)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (team_id, season_id, split) DO UPDATE SET
                goals=EXCLUDED.goals, assists=EXCLUDED.assists,
                standard_stats=EXCLUDED.standard_stats,
                scraped_at=NOW()
        """, (
            team_id, league_id, season_id, split,
            safe_num(row.get("players_used")), safe_num(row.get("avg_age")), safe_num(row.get("possession")),
            safe_num(row.get("games")), safe_num(row.get("games_starts")), safe_num(row.get("minutes")), safe_num(row.get("minutes_90s")),
            safe_num(row.get("goals")), safe_num(row.get("assists")),
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
                team_id = get_or_create_team(cur, team_name, lg["id"])
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
