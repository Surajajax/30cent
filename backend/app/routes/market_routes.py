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


def get_stock_data(symbol: str, name: str | None = None):
    ticker = yf.Ticker(symbol)

    history = ticker.history(
        period="5d",
        interval="1d",
        auto_adjust=False,
    )

    if history.empty:
        return None

    latest = history.iloc[-1]

    price = float(latest["Close"])

    if len(history) >= 2:
        previous_close = float(history.iloc[-2]["Close"])
    else:
        previous_close = price

    change = price - previous_close

    change_percent = (
        (change / previous_close) * 100
        if previous_close
        else 0
    )

    return {
        "symbol": symbol,
        "name": name or symbol,
        "currency": "USD",
        "price": price,
        "previous_close": previous_close,
        "change": change,
        "change_percent": change_percent,
        "open": float(latest["Open"]),
        "high": float(latest["High"]),
        "low": float(latest["Low"]),
        "volume": int(latest["Volume"]),
        "latest_trading_day": str(history.index[-1].date()),
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

            if data:
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

            if data:
                stocks.append(data)

        return {
            "data": stocks
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e),
        )