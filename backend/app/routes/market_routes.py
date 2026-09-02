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


# ============================================================
# GET STOCK QUOTE
# ============================================================

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

        "open": float(
            quote.get("02. open", 0)
        ),

        "high": float(
            quote.get("03. high", 0)
        ),

        "low": float(
            quote.get("04. low", 0)
        ),

        "price": float(
            quote.get("05. price", 0)
        ),

        "volume": int(
            float(
                quote.get("06. volume", 0)
            )
        ),

        "latest_trading_day": quote.get(
            "07. latest trading day"
        ),

        "previous_close": float(
            quote.get("08. previous close", 0)
        ),

        "change": float(
            quote.get("09. change", 0)
        ),

        "change_percent": quote.get(
            "10. change percent"
        ),
    }


# ============================================================
# GET STOCK HISTORY
# ============================================================

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

    time_series = data.get(
        "Time Series (Daily)"
    )

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

            "open": float(
                values["1. open"]
            ),

            "high": float(
                values["2. high"]
            ),

            "low": float(
                values["3. low"]
            ),

            "close": float(
                values["4. close"]
            ),

            "volume": int(
                values["5. volume"]
            ),
        })

    history.sort(
        key=lambda item: item["date"],
        reverse=False
    )

    return {
        "symbol": symbol,
        "data": history
    }


# ============================================================
# GET WATCHLIST
# ============================================================

@router.get("/watchlist")
async def get_watchlist():

    if not ALPHA_VANTAGE_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ALPHA_VANTAGE_API_KEY is not configured"
        )

    symbols = [
        "AAPL",
        "MSFT",
        "NVDA",
        "AMZN",
        "TSLA",
    ]

    results = []

    async with httpx.AsyncClient(timeout=10.0) as client:

        for symbol in symbols:

            params = {
                "function": "GLOBAL_QUOTE",
                "symbol": symbol,
                "apikey": ALPHA_VANTAGE_API_KEY,
            }

            try:

                response = await client.get(
                    ALPHA_VANTAGE_URL,
                    params=params
                )

                if response.status_code != 200:

                    print(
                        f"{symbol}: Provider returned "
                        f"{response.status_code}"
                    )

                    continue

                data = response.json()

                # Alpha Vantage rate limit
                if "Note" in data:

                    print(
                        f"{symbol}: Alpha Vantage "
                        f"rate limit reached"
                    )

                    continue

                # Alpha Vantage error
                if "Information" in data:

                    print(
                        f"{symbol}: "
                        f"{data['Information']}"
                    )

                    continue

                quote = data.get(
                    "Global Quote"
                )

                if not quote:

                    print(
                        f"{symbol}: No quote data"
                    )

                    continue

                results.append({
                    "symbol": quote.get(
                        "01. symbol"
                    ),

                    "price": float(
                        quote.get(
                            "05. price",
                            0
                        )
                    ),

                    "change": float(
                        quote.get(
                            "09. change",
                            0
                        )
                    ),

                    "change_percent": quote.get(
                        "10. change percent",
                        "0%"
                    ),
                })

            except httpx.RequestError as error:

                print(
                    f"{symbol}: Request failed - "
                    f"{error}"
                )

            except (
                ValueError,
                TypeError
            ) as error:

                print(
                    f"{symbol}: Invalid response - "
                    f"{error}"
                )

    return {
        "data": results
    }