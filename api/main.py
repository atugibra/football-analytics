import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routes import leagues, teams, matches, standings, squad_stats, player_stats, sync, health, auth

load_dotenv()

app = FastAPI(
    title="Football Analytics API",
    description="Production API for football data scraped from FBref",
    version="1.0.0"
)

# Allow requests from React dashboard and Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:4000",
        "https://football-analytics-eight.vercel.app",
        "https://*.vercel.app",
        "*",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(health.router,       prefix="/api",             tags=["Health"])
app.include_router(leagues.router,      prefix="/api/leagues",     tags=["Leagues"])
app.include_router(teams.router,        prefix="/api/teams",       tags=["Teams"])
app.include_router(matches.router,      prefix="/api/matches",     tags=["Matches"])
app.include_router(standings.router,    prefix="/api/standings",   tags=["Standings"])
app.include_router(squad_stats.router,  prefix="/api/squad-stats", tags=["Squad Stats"])
app.include_router(player_stats.router, prefix="/api/players",     tags=["Players"])
app.include_router(sync.router,         prefix="/api/sync",        tags=["Sync"])
app.include_router(auth.router,                                    tags=["Auth"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 4000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
