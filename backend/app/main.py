from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.market_routes import router as market_router

from app.plaid_routes import router as plaid_router


app = FastAPI(
    title="30cent API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plaid_router)

app.include_router(market_router)

@app.get("/")
def root():

    return {
        "message": "30cent backend is running"
    }