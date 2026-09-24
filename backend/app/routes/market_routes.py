import math

import yfinance as yf
from fastapi import APIRouter, HTTPException


router = APIRouter(
    prefix="/api/market",
    tags=["Market"],
)


WATCHLIST_SYMBOLS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "TSLA",
]


MARKET_INDICES = [
    {
        "symbol": "^GSPC",
        "name": "S&P 500",
    },
    {
        "symbol": "^IXIC",
        "name": "NASDAQ",
    },
    {
        "symbol": "^DJI",
        "name": "Dow Jones",
    },
]


def safe_float(value):
    try:
        number = float(value)

        if not math.isfinite(number):
            return None

        return number

    except (TypeError, ValueError):
        return None


def safe_int(value):
    try:
        number = float(value)

        if not math.isfinite(number):
            return None

        return int(number)

    except (TypeError, ValueError):
        return None


def get_stock_data(
    symbol: str,
    name: str | None = None,
):
    ticker = yf.Ticker(symbol)

    history = ticker.history(
        period="5d",
        interval="1d",
        auto_adjust=False,
    )

    if history.empty:
        return None

    # Remove rows where Close is missing
    history = history.dropna(subset=["Close"])

    if history.empty:
        return None

    latest = history.iloc[-1]

    price = safe_float(latest["Close"])

    if price is None:
        return None

    if len(history) >= 2:
        previous_close = safe_float(
            history.iloc[-2]["Close"]
        )
    else:
        previous_close = price

    if previous_close is None:
        previous_close = price

    change = price - previous_close

    if previous_close != 0:
        change_percent = (
            change / previous_close
        ) * 100
    else:
        change_percent = 0.0

    open_price = safe_float(latest["Open"])
    high_price = safe_float(latest["High"])
    low_price = safe_float(latest["Low"])
    volume = safe_int(latest["Volume"])

    # Skip invalid Yahoo Finance data
    if (
        open_price is None
        or high_price is None
        or low_price is None
        or volume is None
    ):
        return None

    return {
        "symbol": symbol,
        "name": name or symbol,
        "currency": "USD",
        "price": price,
        "previous_close": previous_close,
        "change": change,
        "change_percent": change_percent,
        "open": open_price,
        "high": high_price,
        "low": low_price,
        "volume": volume,
        "latest_trading_day": str(
            history.index[-1].date()
        ),
    }


@router.get("/overview")
async def market_overview():
    try:
        indices = []

        for index in MARKET_INDICES:
            data = get_stock_data(
                index["symbol"],
                index["name"],
            )

            if data is not None:
                indices.append(data)

        return {
            "data": indices
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


@router.get("/watchlist")
async def market_watchlist():
    try:
        stocks = []

        for symbol in WATCHLIST_SYMBOLS:
            data = get_stock_data(symbol)

            if data is not None:
                stocks.append(data)

        return {
            "data": stocks
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )