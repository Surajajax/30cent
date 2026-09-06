import os
from datetime import date, timedelta

import httpx
from fastapi import APIRouter, HTTPException, Query
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(
    prefix="/api/news",
    tags=["News"],
)

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY")
FINNHUB_URL = "https://finnhub.io/api/v1"


# =========================================================
# FINANCE NEWS FILTER
# =========================================================

FINANCE_KEYWORDS = [
    # Stocks / markets
    "stock",
    "stocks",
    "share",
    "shares",
    "equity",
    "equities",
    "market",
    "markets",
    "nasdaq",
    "s&p 500",
    "sp 500",
    "dow jones",
    "wall street",
    "rally",
    "selloff",
    "sell-off",
    "trading",
    "trader",
    "investor",
    "investors",
    "investing",
    "investment",
    "valuation",
    "dividend",

    # Companies / earnings
    "earnings",
    "revenue",
    "profit",
    "profits",
    "loss",
    "eps",
    "quarter",
    "quarterly",
    "guidance",
    "forecast",
    "outlook",
    "ipo",
    "merger",
    "acquisition",
    "buyback",
    "layoff",
    "layoffs",

    # Economy
    "economy",
    "economic",
    "gdp",
    "recession",
    "inflation",
    "deflation",
    "consumer prices",
    "jobs report",
    "employment",
    "unemployment",

    # Federal Reserve / rates
    "federal reserve",
    "fed",
    "interest rate",
    "interest rates",
    "rate cut",
    "rate cuts",
    "rate hike",
    "rate hikes",
    "monetary policy",

    # Bonds / fixed income
    "bond",
    "bonds",
    "treasury",
    "treasuries",
    "yield",
    "yields",
    "credit",

    # Commodities
    "oil",
    "crude",
    "gasoline",
    "natural gas",
    "gold",
    "silver",
    "commodity",
    "commodities",
    "opec",

    # ETFs / funds
    "etf",
    "etfs",
    "fund",
    "funds",
    "asset management",

    # Currency / crypto
    "dollar",
    "currency",
    "forex",
    "bitcoin",
    "crypto",
    "cryptocurrency",

    # Banking / finance
    "bank",
    "banks",
    "banking",
    "loan",
    "mortgage",
    "financial",
    "finance",
]


FINANCE_SOURCES = [
    "reuters",
    "cnbc",
    "bloomberg",
    "marketwatch",
    "financial times",
    "the wall street journal",
    "wsj",
    "yahoo finance",
    "benzinga",
    "barron's",
    "fortune",
    "forbes",
    "investing.com",
]


# Words that often indicate general news rather than
# financial/market news.
EXCLUDED_KEYWORDS = [
    # Politics / conflict
    "war",
    "warfare",
    "military",
    "missile",
    "missiles",
    "strike",
    "strikes",
    "killed",
    "kill",
    "killing",
    "violence",
    "attack",
    "attacks",
    "terrorist",
    "terrorism",
    "nato",
    "election",
    "elections",
    "president",
    "presidential",
    "parliament",
    "politician",
    "politics",

    # Accidents / crime
    "crash",
    "crashes",
    "accident",
    "explosion",
    "explosions",
    "murder",
    "arrest",
    "arrests",
    "court",
    "lawsuit",

    # Lifestyle
    "nutritionist",
    "nutrition",
    "food",
    "foods",
    "recipe",
    "recipes",
    "health",
    "fitness",
    "travel",
    "vacation",
    "restaurant",
    "restaurants",
    "celebrity",
    "movie",
    "movies",
    "music",
    "sports",
    "football",
    "soccer",
    "basketball",
    "baseball",
    "tennis",
]


def calculate_news_score(article: dict) -> int:
    """
    Calculate how financially relevant an article is.
    """

    headline = str(article.get("headline", "")).lower()
    summary = str(article.get("summary", "")).lower()
    category = str(article.get("category", "")).lower()
    source = str(article.get("source", "")).lower()

    text = f"{headline} {summary}"

    score = 0

    # -----------------------------------------------------
    # Positive signals
    # -----------------------------------------------------

    if category == "business":
        score += 2

    if any(finance_source in source for finance_source in FINANCE_SOURCES):
        score += 2

    # Count unique finance concepts.
    matched_finance_keywords = set()

    for keyword in FINANCE_KEYWORDS:
        if keyword in text:
            matched_finance_keywords.add(keyword)

    score += min(len(matched_finance_keywords) * 2, 8)

    # -----------------------------------------------------
    # Negative signals
    # -----------------------------------------------------

    matched_excluded_keywords = set()

    for keyword in EXCLUDED_KEYWORDS:
        if keyword in text:
            matched_excluded_keywords.add(keyword)

    # Strong penalty for clearly non-financial stories.
    score -= min(len(matched_excluded_keywords) * 3, 9)

    return score


def filter_finance_news(articles: list) -> list:
    """
    Return only strongly finance-related articles.
    """

    scored_articles = []

    for article in articles:

        if not isinstance(article, dict):
            continue

        headline = article.get("headline")

        if not headline:
            continue

        score = calculate_news_score(article)

        # -------------------------------------------------
        # Strict financial relevance threshold
        # -------------------------------------------------

        if score < 5:
            continue

        scored_articles.append(
            {
                "id": article.get("id"),
                "headline": article.get("headline"),
                "summary": article.get("summary"),
                "source": article.get("source"),
                "image": article.get("image"),
                "url": article.get("url"),
                "datetime": article.get("datetime"),
                "related": article.get("related"),
                "category": article.get("category"),
            }
        )

    # -----------------------------------------------------
    # Sort newest first
    # -----------------------------------------------------

    scored_articles.sort(
        key=lambda article: article.get("datetime") or 0,
        reverse=True,
    )

    # -----------------------------------------------------
    # Remove duplicate articles
    # -----------------------------------------------------

    unique_articles = []
    seen_ids = set()

    for article in scored_articles:

        article_id = article.get("id")

        if article_id is not None:

            if article_id in seen_ids:
                continue

            seen_ids.add(article_id)

        unique_articles.append(article)

    # -----------------------------------------------------
    # Return latest 20
    # -----------------------------------------------------

    return unique_articles[:20]


# =========================================================
# MARKET NEWS
# =========================================================

@router.get("/market")
async def get_market_news():

    if not FINNHUB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="FINNHUB_API_KEY is not configured",
        )

    try:

        async with httpx.AsyncClient(timeout=15.0) as client:

            response = await client.get(
                f"{FINNHUB_URL}/news",
                params={
                    "category": "general",
                    "token": FINNHUB_API_KEY,
                },
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Failed to fetch market news",
            )

        data = response.json()

        filtered_news = filter_finance_news(data)

        return {
            "data": filtered_news
        }

    except HTTPException:
        raise

    except Exception as error:

        print(f"Market news error: {error}")

        raise HTTPException(
            status_code=500,
            detail="Unable to fetch market news",
        )


# =========================================================
# STOCK-SPECIFIC NEWS
# =========================================================

@router.get("/stock")
async def get_stock_news(
    symbol: str = Query(
        ...,
        min_length=1,
        max_length=10,
    )
):

    if not FINNHUB_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="FINNHUB_API_KEY is not configured",
        )

    symbol = symbol.upper().strip()

    today = date.today()
    start_date = today - timedelta(days=30)

    try:

        async with httpx.AsyncClient(timeout=15.0) as client:

            response = await client.get(
                f"{FINNHUB_URL}/company-news",
                params={
                    "symbol": symbol,
                    "from": start_date.isoformat(),
                    "to": today.isoformat(),
                    "token": FINNHUB_API_KEY,
                },
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch news for {symbol}",
            )

        data = response.json()

        return {
            "symbol": symbol,
            "data": data,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(f"Stock news error for {symbol}: {error}")

        raise HTTPException(
            status_code=500,
            detail=f"Unable to fetch news for {symbol}",
        )