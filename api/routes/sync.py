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
    """Extract plain text from a value that may be a dict/link object or plain string."""
    if val is None:
        return ""
    if isinstance(val, dict):
        return str(val.get("text", val.get("name", ""))).strip()
    s = str(val).strip()
    if s.startswith("{") and ("'text'" in s or '"text"' in s):
        try:
            import ast
            d = ast.literal_eval(s)
            if isinstance(d, dict):
                return str(d.get("text", d.get("name", ""))).strip()
        except Exception:
            pass
    return s




def trunc(val, max_len: int):
    """Cap a string to max_len to respect VARCHAR column limits."""
    if val is None:
        return None
    s = str(val).strip()
    return s[:max_len] if s else None




def safe_age_int(val):
    """Convert FBref age/birth_year to an integer."""
    if val is None:
        return None
    s = safe_text(val) if isinstance(val, dict) else str(val).strip()
    s = s.replace(",", "").strip()
    s = s.split("-")[0].split(".")[0].strip()
    try:
        return int(s) if s else None
    except (ValueError, TypeError):
        return None


