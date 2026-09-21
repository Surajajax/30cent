from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware

from app.routes.market_routes import router as market_router
from app.plaid_routes import router as plaid_router
from app.routes.stock_routes import router as stock_router
from app.routes.news_routes import router as news_router
from app.routes.agent_routes import router as agent_router
from app.routes.goal_routes import router as goal_router

# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="30cent API"
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# =========================================================
# ROUTES
# =========================================================

app.include_router(
    plaid_router
)

app.include_router(
    market_router
)

app.include_router(
    stock_router
)

app.include_router(
    news_router
)

app.include_router(
    agent_router
)

app.include_router(
    goal_router
)

# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "30cent backend is running"
    }