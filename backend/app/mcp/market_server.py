import json

import yfinance as yf
from mcp.server.fastmcp import FastMCP


mcp = FastMCP("30cent Market")


# ---------------------------------------------------------
# MARKET INDICES
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# WATCHLIST
# ---------------------------------------------------------

WATCHLIST_SYMBOLS = [
    "AAPL",
    "MSFT",
    "NVDA",
    "AMZN",
    "TSLA",
]


# ---------------------------------------------------------
# HELPER
# ---------------------------------------------------------

def get_stock_data(symbol: str, name: str | None = None):
    """
    Get the latest market data for a stock or index.
    """

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
        previous_close = float(
            history.iloc[-2]["Close"]
        )
    else:
        previous_close = price

    change = price - previous_close

    if previous_close:
        change_percent = (
            change / previous_close
        ) * 100
    else:
        change_percent = 0.0

    return {
        "symbol": symbol,
        "name": name or symbol,
        "currency": "USD",
        "price": round(price, 4),
        "previous_close": round(
            previous_close,
            4,
        ),
        "change": round(change, 4),
        "change_percent": round(
            change_percent,
            4,
        ),
        "open": round(
            float(latest["Open"]),
            4,
        ),
        "high": round(
            float(latest["High"]),
            4,
        ),
        "low": round(
            float(latest["Low"]),
            4,
        ),
        "volume": int(
            latest["Volume"]
        ),
        "latest_trading_day": str(
            history.index[-1].date()
        ),
    }


# ---------------------------------------------------------
# MARKET OVERVIEW
# ---------------------------------------------------------

@mcp.tool()
def get_market_overview() -> str:
    """
    Get the current market overview including
    S&P 500, NASDAQ, and Dow Jones.
    """

    try:

        indices = []

        for index in MARKET_INDICES:

            data = get_stock_data(
                index["symbol"],
                index["name"],
            )

            if data:
                indices.append(data)

        return json.dumps({
            "success": True,
            "indices": indices,
        })

    except Exception as e:

        return json.dumps({
            "success": False,
            "error": str(e),
        })


# ---------------------------------------------------------
# STOCK PRICE
# ---------------------------------------------------------

@mcp.tool()
def get_stock_price(symbol: str) -> str:
    """
    Get the latest price and market information
    for a stock symbol such as AAPL, MSFT, or NVDA.
    """

    try:

        symbol = symbol.strip().upper()

        if not symbol:
            return json.dumps({
                "success": False,
                "error": "Stock symbol is required.",
            })

        data = get_stock_data(symbol)

        if data is None:
            return json.dumps({
                "success": False,
                "error": (
                    f"No market data found for {symbol}."
                ),
            })

        return json.dumps({
            "success": True,
            "stock": data,
        })

    except Exception as e:

        return json.dumps({
            "success": False,
            "error": str(e),
        })


# ---------------------------------------------------------
# SEARCH STOCK
# ---------------------------------------------------------

@mcp.tool()
def search_stock(query: str) -> str:
    """
    Search for stocks by company name or ticker symbol.
    """

    try:

        query = query.strip()

        if not query:
            return json.dumps({
                "success": False,
                "error": "Search query is required.",
            })

        search = yf.Search(query)

        quotes = search.quotes

        results = []

        for item in quotes[:10]:

            symbol = item.get("symbol")

            if not symbol:
                continue

            results.append({
                "symbol": symbol,
                "name": (
                    item.get("longname")
                    or item.get("shortname")
                    or symbol
                ),
                "exchange": item.get(
                    "exchange"
                ),
                "type": item.get(
                    "quoteType"
                ),
                "currency": item.get(
                    "currency",
                    "USD",
                ),
            })

        return json.dumps({
            "success": True,
            "query": query,
            "results": results,
            "count": len(results),
        })

    except Exception as e:

        return json.dumps({
            "success": False,
            "error": str(e),
        })


# ---------------------------------------------------------
# STOCK HISTORY
# ---------------------------------------------------------

@mcp.tool()
def get_stock_history(
    symbol: str,
) -> str:
    """
    Get recent historical price data for a stock.
    """

    try:

        symbol = symbol.strip().upper()

        if not symbol:
            return json.dumps({
                "success": False,
                "error": "Stock symbol is required.",
            })

        ticker = yf.Ticker(symbol)

        history = ticker.history(
            period="1mo",
            interval="1d",
            auto_adjust=False,
        )

        if history.empty:
            return json.dumps({
                "success": False,
                "error": (
                    f"No historical data found "
                    f"for {symbol}."
                ),
            })

        prices = []

        for index, row in history.iterrows():

            prices.append({
                "date": str(index.date()),
                "open": round(
                    float(row["Open"]),
                    4,
                ),
                "high": round(
                    float(row["High"]),
                    4,
                ),
                "low": round(
                    float(row["Low"]),
                    4,
                ),
                "close": round(
                    float(row["Close"]),
                    4,
                ),
                "volume": int(
                    row["Volume"]
                ),
            })

        return json.dumps({
            "success": True,
            "symbol": symbol,
            "currency": "USD",
            "period": "1mo",
            "prices": prices,
            "count": len(prices),
        })

    except Exception as e:

        return json.dumps({
            "success": False,
            "error": str(e),
        })


# ---------------------------------------------------------
# WATCHLIST
# ---------------------------------------------------------

@mcp.tool()
def get_watchlist() -> str:
    """
    Get market data for the 30cent default watchlist.
    """

    try:

        stocks = []

        for symbol in WATCHLIST_SYMBOLS:

            data = get_stock_data(symbol)

            if data:
                stocks.append(data)

        return json.dumps({
            "success": True,
            "stocks": stocks,
        })

    except Exception as e:

        return json.dumps({
            "success": False,
            "error": str(e),
        })


# ---------------------------------------------------------
# START MCP SERVER
# ---------------------------------------------------------

if __name__ == "__main__":
    mcp.run()