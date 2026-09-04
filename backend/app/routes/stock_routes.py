import math

import yfinance as yf
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(
    prefix="/api/stocks",
    tags=["Stocks"]
)


def clean_value(value):
    """
    Convert NaN / None values into None.
    """
    if value is None:
        return None

    try:
        if math.isnan(float(value)):
            return None
    except (TypeError, ValueError):
        pass

    return value


# ============================================================
# STOCK DETAILS
# ============================================================

@router.get("/details")
def get_stock_details(
    symbol: str = Query(
        ...,
        min_length=1,
        max_length=10
    )
):
    symbol = symbol.upper().strip()

    try:
        ticker = yf.Ticker(symbol)

        history = ticker.history(
            period="1d",
            interval="1d"
        )

        if history.empty:
            raise HTTPException(
                status_code=404,
                detail=f"Stock not found: {symbol}"
            )

        info = ticker.info

        fast_info = ticker.fast_info

        current_price = clean_value(
            fast_info.get("last_price")
        )

        previous_close = clean_value(
            fast_info.get("previous_close")
        )

        if (
            current_price is not None
            and previous_close is not None
        ):
            change = current_price - previous_close

            change_percent = (
                change / previous_close
            ) * 100
        else:
            change = None
            change_percent = None

        return {
            "symbol": symbol,

            "name": info.get(
                "longName",
                symbol
            ),

            "price": current_price,

            "previous_close": previous_close,

            "change": clean_value(change),

            "change_percent": clean_value(
                change_percent
            ),

            "currency": info.get(
                "currency",
                "USD"
            ),

            "market_cap": clean_value(
                info.get("marketCap")
            ),

            "pe_ratio": clean_value(
                info.get("trailingPE")
            ),

            "volume": clean_value(
                info.get("volume")
            ),

            "average_volume": clean_value(
                info.get("averageVolume")
            ),

            "day_high": clean_value(
                info.get("dayHigh")
            ),

            "day_low": clean_value(
                info.get("dayLow")
            ),

            "fifty_two_week_high": clean_value(
                info.get("fiftyTwoWeekHigh")
            ),

            "fifty_two_week_low": clean_value(
                info.get("fiftyTwoWeekLow")
            ),

            "sector": info.get(
                "sector"
            ),

            "industry": info.get(
                "industry"
            ),

            "website": info.get(
                "website"
            ),

            "description": info.get(
                "longBusinessSummary"
            ),
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Stock details error for {symbol}: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to get stock details for {symbol}"
        )


# ============================================================
# STOCK HISTORY
# ============================================================

@router.get("/history")
def get_stock_history(
    symbol: str = Query(
        ...,
        min_length=1,
        max_length=10
    ),

    period: str = Query(
        "6mo"
    )
):
    symbol = symbol.upper().strip()

    allowed_periods = [
        "1mo",
        "3mo",
        "6mo",
        "1y",
        "2y",
        "5y",
        "max",
    ]

    if period not in allowed_periods:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid period. "
                "Use: 1mo, 3mo, 6mo, 1y, "
                "2y, 5y, or max"
            )
        )

    try:
        ticker = yf.Ticker(symbol)

        history = ticker.history(
            period=period,
            interval="1d",
            auto_adjust=True
        )

        if history.empty:
            raise HTTPException(
                status_code=404,
                detail=f"No history found for {symbol}"
            )

        data = []

        for date, row in history.iterrows():

            data.append({
                "date": date.strftime(
                    "%Y-%m-%d"
                ),

                "open": clean_value(
                    row["Open"]
                ),

                "high": clean_value(
                    row["High"]
                ),

                "low": clean_value(
                    row["Low"]
                ),

                "close": clean_value(
                    row["Close"]
                ),

                "volume": clean_value(
                    row["Volume"]
                ),
            })

        return {
            "symbol": symbol,
            "period": period,
            "data": data
        }

    except HTTPException:
        raise

    except Exception as error:
        print(
            f"Stock history error for {symbol}: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail=f"Unable to get history for {symbol}"
        )


# ============================================================
# STOCK SEARCH
# ============================================================

@router.get("/search")
def search_stocks(
    query: str = Query(
        ...,
        min_length=1,
        max_length=50
    )
):
    query = query.strip()

    try:
        search = yf.Search(query)

        quotes = search.quotes

        results = []

        for item in quotes[:10]:

            symbol = item.get(
                "symbol"
            )

            if not symbol:
                continue

            results.append({
                "symbol": symbol,

                "name": item.get(
                    "longname"
                ) or item.get(
                    "shortname"
                ),

                "exchange": item.get(
                    "exchange"
                ),

                "type": item.get(
                    "quoteType"
                ),

                "currency": item.get(
                    "currency",
                    "USD"
                ),
            })

        return {
            "query": query,
            "data": results
        }

    except Exception as error:
        print(
            f"Stock search error: {error}"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to search stocks"
        )