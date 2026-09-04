import math

import yfinance as yf
from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/api/market",
    tags=["Market"]
)


WATCHLIST_SYMBOLS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "TSLA",
]


def clean_value(value):
    if value is None:
        return None

    try:
        if math.isnan(float(value)):
            return None
    except (TypeError, ValueError):
        pass

    return value


def get_stock_quote(symbol: str):
    ticker = yf.Ticker(symbol)

    # Get recent price data
    history = ticker.history(
        period="5d",
        interval="1d",
        auto_adjust=False
    )

    if history.empty:
        return None

    # Latest available trading day
    latest = history.iloc[-1]

    close = clean_value(latest["Close"])
    open_price = clean_value(latest["Open"])
    high = clean_value(latest["High"])
    low = clean_value(latest["Low"])
    volume = clean_value(latest["Volume"])

    # Previous trading day's close
    previous_close = None

    if len(history) >= 2:
        previous_close = clean_value(
            history.iloc[-2]["Close"]
        )

    if close is not None and previous_close is not None:
        change = close - previous_close

        change_percent = (
            change / previous_close
        ) * 100
    else:
        change = None
        change_percent = None

    return {
        "symbol": symbol,
        "name": symbol,
        "currency": "USD",
        "price": close,
        "previous_close": previous_close,
        "change": clean_value(change),
        "change_percent": clean_value(change_percent),
        "open": open_price,
        "high": high,
        "low": low,
        "volume": volume,
        "latest_trading_day": (
            history.index[-1].strftime("%Y-%m-%d")
        ),
    }


# ============================================================
# MARKET OVERVIEW
# ============================================================

@router.get("/overview")
def get_market_overview():
    results = []

    for symbol in WATCHLIST_SYMBOLS:
        try:
            quote = get_stock_quote(symbol)

            if quote:
                results.append(quote)

        except Exception as error:
            print(
                f"Market overview error for {symbol}: {error}"
            )

    if not results:
        raise HTTPException(
            status_code=500,
            detail="Unable to load market data"
        )

    return {
        "data": results
    }


# ============================================================
# WATCHLIST
# ============================================================

@router.get("/watchlist")
def get_watchlist():
    results = []

    for symbol in WATCHLIST_SYMBOLS:
        try:
            quote = get_stock_quote(symbol)

            if quote:
                results.append(quote)

        except Exception as error:
            print(
                f"Watchlist error for {symbol}: {error}"
            )

    if not results:
        raise HTTPException(
            status_code=500,
            detail="Unable to load watchlist"
        )

    return {
        "data": results
    }