import os

import httpx
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/market",
    tags=["Market"]
)

ALPHA_VANTAGE_API_KEY = os.getenv("ALPHA_VANTAGE_API_KEY")
ALPHA_VANTAGE_URL = "https://www.alphavantage.co/query"


@router.get("/quote")
async def get_quote(
    symbol: str = Query(..., min_length=1, max_length=10)
):
    if not ALPHA_VANTAGE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ALPHA_VANTAGE_API_KEY is not configured"
        )

    symbol = symbol.upper().strip()

    params = {
        "function": "GLOBAL_QUOTE",
        "symbol": symbol,
        "apikey": ALPHA_VANTAGE_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                ALPHA_VANTAGE_URL,
                params=params
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Market data provider error"
            )

        data = response.json()

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to market data provider"
        )

    quote = data.get("Global Quote")

    if not quote:
        if "Note" in data:
            raise HTTPException(
                status_code=429,
                detail="Market API rate limit reached"
            )

        if "Information" in data:
            raise HTTPException(
                status_code=400,
                detail=data["Information"]
            )

        raise HTTPException(
            status_code=404,
            detail=f"No market data found for {symbol}"
        )

    return {
        "symbol": quote.get("01. symbol"),
        "open": float(quote.get("02. open", 0)),
        "high": float(quote.get("03. high", 0)),
        "low": float(quote.get("04. low", 0)),
        "price": float(quote.get("05. price", 0)),
        "volume": int(float(quote.get("06. volume", 0))),
        "latest_trading_day": quote.get("07. latest trading day"),
        "previous_close": float(
            quote.get("08. previous close", 0)
        ),
        "change": float(
            quote.get("09. change", 0)
        ),
        "change_percent": quote.get("10. change percent"),
    }


@router.get("/history")
async def get_history(
    symbol: str = Query(..., min_length=1, max_length=10)
):
    if not ALPHA_VANTAGE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ALPHA_VANTAGE_API_KEY is not configured"
        )

    symbol = symbol.upper().strip()

    params = {
        "function": "TIME_SERIES_DAILY",
        "symbol": symbol,
        "outputsize": "compact",
        "apikey": ALPHA_VANTAGE_API_KEY,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                ALPHA_VANTAGE_URL,
                params=params
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Market data provider error"
            )

        data = response.json()

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to market data provider"
        )

    time_series = data.get("Time Series (Daily)")

    if not time_series:
        if "Note" in data:
            raise HTTPException(
                status_code=429,
                detail="Market API rate limit reached"
            )

        if "Information" in data:
            raise HTTPException(
                status_code=400,
                detail=data["Information"]
            )

        raise HTTPException(
            status_code=404,
            detail=f"No historical data found for {symbol}"
        )

    history = []

    for date, values in time_series.items():
        history.append({
            "date": date,
            "open": float(values["1. open"]),
            "high": float(values["2. high"]),
            "low": float(values["3. low"]),
            "close": float(values["4. close"]),
            "volume": int(values["5. volume"]),
        })

    history.sort(
        key=lambda item: item["date"],
        reverse=False
    )

    return {
        "symbol": symbol,
        "data": history
    }