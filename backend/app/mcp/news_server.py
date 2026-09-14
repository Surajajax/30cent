import json
import os
from datetime import datetime, timedelta, timezone

import httpx
from dotenv import load_dotenv
from mcp.server.fastmcp import FastMCP

load_dotenv()

mcp = FastMCP("30cent News")

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"


# =========================================================
# FINNHUB API KEY
# =========================================================

def get_api_key():
    if not FINNHUB_API_KEY:
        raise RuntimeError(
            "FINNHUB_API_KEY is not configured in .env"
        )

    return FINNHUB_API_KEY


# =========================================================
# FORMAT NEWS
# =========================================================

def format_news_item(item):
    return {
        "id": item.get("id"),
        "headline": item.get("headline"),
        "summary": item.get("summary"),
        "source": item.get("source"),
        "url": item.get("url"),
        "image": item.get("image"),
        "category": item.get("category"),
        "related": item.get("related"),
        "datetime": item.get("datetime"),
    }


# =========================================================
# FINNHUB REQUEST
# =========================================================

async def fetch_news(endpoint: str, params: dict):

    api_key = get_api_key()

    request_params = {
        **params,
        "token": api_key,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:

        response = await client.get(
            f"{FINNHUB_BASE_URL}/{endpoint}",
            params=request_params,
        )

        response.raise_for_status()

        return response.json()


# =========================================================
# DATE RANGE
# =========================================================

def get_date_range(days: int = 7):

    today = datetime.now(timezone.utc).date()

    start_date = today - timedelta(days=days)

    return (
        start_date.isoformat(),
        today.isoformat(),
    )


# =========================================================
# MARKET NEWS
# =========================================================

@mcp.tool()
async def get_market_news(limit: int = 10) -> str:

    """
    Get the latest general market and financial news.
    """

    try:

        # Keep the limit within a safe range
        if limit < 1:
            limit = 1

        if limit > 20:
            limit = 20

        news = await fetch_news(
            "news",
            {
                "category": "general",
            },
        )

        news = news[:limit]

        articles = [
            format_news_item(item)
            for item in news
        ]

        return json.dumps(
            {
                "success": True,
                "category": "general",
                "count": len(articles),
                "articles": articles,
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )


# =========================================================
# COMPANY NEWS
# =========================================================

@mcp.tool()
async def get_company_news(
    symbol: str,
    limit: int = 10,
) -> str:

    """
    Get recent news for a specific company or stock.
    """

    try:

        symbol = symbol.strip().upper()

        if not symbol:

            return json.dumps(
                {
                    "success": False,
                    "error": "Stock symbol is required.",
                }
            )

        # Keep the limit within a safe range
        if limit < 1:
            limit = 1

        if limit > 20:
            limit = 20

        from_date, to_date = get_date_range(
            days=7
        )

        news = await fetch_news(
            "company-news",
            {
                "symbol": symbol,
                "from": from_date,
                "to": to_date,
            },
        )

        news = news[:limit]

        articles = [
            format_news_item(item)
            for item in news
        ]

        return json.dumps(
            {
                "success": True,
                "symbol": symbol,
                "from": from_date,
                "to": to_date,
                "count": len(articles),
                "articles": articles,
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )


# =========================================================
# RUN MCP SERVER
# =========================================================

if __name__ == "__main__":

    mcp.run()