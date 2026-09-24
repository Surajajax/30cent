import json
import os

from mcp.server.fastmcp import FastMCP

from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest

from app.plaid_client import plaid_client
from app.database import get_db
from app.models import PlaidItem


mcp = FastMCP("30cent Finance")


# =========================================================
# USER CONTEXT
# =========================================================

def _get_user_id() -> str | None:
    """
    Get the authenticated user ID passed to this MCP process.

    The user ID is supplied by the AI agent process through
    the THIRTYCENT_USER_ID environment variable.

    It is NOT exposed as an argument to the LLM tools.
    """

    user_id = os.getenv("THIRTYCENT_USER_ID")

    if not user_id:
        return None

    return user_id


# =========================================================
# HELPERS
# =========================================================

def _enum_value(value):
    return getattr(value, "value", str(value))


def _get_latest_plaid_item(db, user_id: str):
    """
    Get the latest Plaid connection belonging ONLY
    to the authenticated user.
    """

    return (
        db.query(PlaidItem)
        .filter(
            PlaidItem.user_id == user_id
        )
        .order_by(PlaidItem.id.desc())
        .first()
    )


def _get_checking_account(response):
    for account in response.accounts:
        if (
            _enum_value(account.type) == "depository"
            and _enum_value(account.subtype) == "checking"
        ):
            return account

    return None


def _get_all_transactions(
    plaid_item,
    checking_account,
):
    """
    Get all available transactions for the checking account.

    Handles Plaid pagination.
    """

    cursor = None
    transactions = []

    while True:

        if cursor:
            request = TransactionsSyncRequest(
                access_token=plaid_item.access_token,
                cursor=cursor,
            )
        else:
            request = TransactionsSyncRequest(
                access_token=plaid_item.access_token,
            )

        response = plaid_client.transactions_sync(
            request
        )

        for transaction in response.added:

            if (
                transaction.account_id
                != checking_account.account_id
            ):
                continue

            category = None

            if transaction.personal_finance_category:
                category = (
                    transaction
                    .personal_finance_category
                    .primary
                )

            transactions.append(
                {
                    "transaction_id":
                        transaction.transaction_id,

                    "account_id":
                        transaction.account_id,

                    "name":
                        transaction.name,

                    "merchant_name":
                        transaction.merchant_name,

                    "amount":
                        float(transaction.amount),

                    "date":
                        str(transaction.date),

                    "category":
                        category,

                    "currency":
                        transaction.iso_currency_code,
                }
            )

        if not response.has_more:
            break

        cursor = response.next_cursor

    transactions.sort(
        key=lambda transaction:
            transaction["date"],
        reverse=True,
    )

    return transactions


# =========================================================
# GET ACCOUNTS
# =========================================================

@mcp.tool()
def get_accounts() -> str:
    """
    Get the authenticated user's connected bank accounts
    from Plaid.
    """

    user_id = _get_user_id()

    if not user_id:
        return json.dumps(
            {
                "success": False,
                "error": "Authenticated user context is missing.",
            }
        )

    db = next(get_db())

    try:

        plaid_item = _get_latest_plaid_item(
            db,
            user_id,
        )

        if not plaid_item:
            return json.dumps(
                {
                    "success": False,
                    "error": "No bank account connected.",
                }
            )

        request = AccountsGetRequest(
            access_token=plaid_item.access_token,
        )

        response = plaid_client.accounts_get(
            request
        )

        accounts = []

        for account in response.accounts:

            accounts.append(
                {
                    "account_id":
                        account.account_id,

                    "name":
                        account.name,

                    "official_name":
                        account.official_name,

                    "type":
                        _enum_value(account.type),

                    "subtype":
                        _enum_value(account.subtype),

                    "mask":
                        account.mask,

                    "available_balance":
                        account.balances.available,

                    "current_balance":
                        account.balances.current,

                    "currency":
                        account.balances.iso_currency_code,
                }
            )

        return json.dumps(
            {
                "success": True,
                "accounts": accounts,
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )

    finally:
        db.close()


# =========================================================
# GET BALANCE
# =========================================================

@mcp.tool()
def get_balance() -> str:
    """
    Get the current balance of the authenticated user's
    connected checking account from Plaid.
    """

    user_id = _get_user_id()

    if not user_id:
        return json.dumps(
            {
                "success": False,
                "error": "Authenticated user context is missing.",
            }
        )

    db = next(get_db())

    try:

        plaid_item = _get_latest_plaid_item(
            db,
            user_id,
        )

        if not plaid_item:
            return json.dumps(
                {
                    "success": False,
                    "error": "No bank account connected.",
                }
            )

        request = AccountsGetRequest(
            access_token=plaid_item.access_token,
        )

        response = plaid_client.accounts_get(
            request
        )

        checking_account = _get_checking_account(
            response
        )

        if checking_account is None:
            return json.dumps(
                {
                    "success": False,
                    "error": "No checking account found.",
                }
            )

        return json.dumps(
            {
                "success": True,
                "account": {
                    "name":
                        checking_account.name,

                    "mask":
                        checking_account.mask,

                    "available_balance":
                        checking_account
                        .balances
                        .available,

                    "current_balance":
                        checking_account
                        .balances
                        .current,

                    "currency":
                        checking_account
                        .balances
                        .iso_currency_code,
                },
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )

    finally:
        db.close()


# =========================================================
# GET TRANSACTIONS
# =========================================================

@mcp.tool()
def get_transactions() -> str:
    """
    Get transactions from the authenticated user's
    connected checking account.

    Transactions are returned newest first.
    """

    user_id = _get_user_id()

    if not user_id:
        return json.dumps(
            {
                "success": False,
                "error": "Authenticated user context is missing.",
            }
        )

    db = next(get_db())

    try:

        plaid_item = _get_latest_plaid_item(
            db,
            user_id,
        )

        if not plaid_item:
            return json.dumps(
                {
                    "success": False,
                    "error": "No bank account connected.",
                }
            )

        accounts_response = (
            plaid_client.accounts_get(
                AccountsGetRequest(
                    access_token=
                        plaid_item.access_token,
                )
            )
        )

        checking_account = _get_checking_account(
            accounts_response
        )

        if checking_account is None:
            return json.dumps(
                {
                    "success": False,
                    "error": "No checking account found.",
                }
            )

        transactions = _get_all_transactions(
            plaid_item,
            checking_account,
        )

        return json.dumps(
            {
                "success": True,

                "account": {
                    "name":
                        checking_account.name,

                    "mask":
                        checking_account.mask,
                },

                "transactions":
                    transactions,

                "count":
                    len(transactions),
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )

    finally:
        db.close()


# =========================================================
# GET CASHFLOW
# =========================================================

@mcp.tool()
def get_cashflow() -> str:
    """
    Calculate cash flow from the authenticated user's
    checking account transactions.

    Returns:

    - total inflow
    - total outflow
    - net cash flow
    - transaction count
    - category spending breakdown
    """

    user_id = _get_user_id()

    if not user_id:
        return json.dumps(
            {
                "success": False,
                "error": "Authenticated user context is missing.",
            }
        )

    db = next(get_db())

    try:

        plaid_item = _get_latest_plaid_item(
            db,
            user_id,
        )

        if not plaid_item:
            return json.dumps(
                {
                    "success": False,
                    "error": "No bank account connected.",
                }
            )

        # -------------------------------------------------
        # Get checking account
        # -------------------------------------------------

        accounts_response = (
            plaid_client.accounts_get(
                AccountsGetRequest(
                    access_token=
                        plaid_item.access_token,
                )
            )
        )

        checking_account = _get_checking_account(
            accounts_response
        )

        if checking_account is None:
            return json.dumps(
                {
                    "success": False,
                    "error": "No checking account found.",
                }
            )

        # -------------------------------------------------
        # Get transactions
        # -------------------------------------------------

        transactions = _get_all_transactions(
            plaid_item,
            checking_account,
        )

        # -------------------------------------------------
        # Calculate cash flow
        # -------------------------------------------------

        total_inflow = 0.0
        total_outflow = 0.0

        category_spending = {}

        for transaction in transactions:

            amount = transaction["amount"]

            # Plaid convention:
            #
            # Positive amount = money leaving account
            # Negative amount = money entering account

            if amount > 0:

                total_outflow += amount

                category = (
                    transaction["category"]
                    or "OTHER"
                )

                category_spending[category] = (
                    category_spending.get(
                        category,
                        0.0,
                    )
                    + amount
                )

            elif amount < 0:

                total_inflow += abs(amount)

        # -------------------------------------------------
        # Net cash flow
        # -------------------------------------------------

        net_cash_flow = (
            total_inflow -
            total_outflow
        )

        # -------------------------------------------------
        # Sort categories by spending
        # -------------------------------------------------

        category_spending = dict(
            sorted(
                category_spending.items(),
                key=lambda item:
                    item[1],
                reverse=True,
            )
        )

        # -------------------------------------------------
        # Return result
        # -------------------------------------------------

        return json.dumps(
            {
                "success": True,

                "account": {
                    "name":
                        checking_account.name,

                    "mask":
                        checking_account.mask,

                    "currency":
                        checking_account
                        .balances
                        .iso_currency_code,
                },

                "summary": {
                    "total_inflow":
                        round(
                            total_inflow,
                            2,
                        ),

                    "total_outflow":
                        round(
                            total_outflow,
                            2,
                        ),

                    "net_cash_flow":
                        round(
                            net_cash_flow,
                            2,
                        ),

                    "transaction_count":
                        len(transactions),
                },

                "spending_by_category": {
                    category:
                        round(
                            amount,
                            2,
                        )
                    for category, amount
                    in category_spending.items()
                },

                "period": {
                    "start_date": (
                        transactions[-1]["date"]
                        if transactions
                        else None
                    ),

                    "end_date": (
                        transactions[0]["date"]
                        if transactions
                        else None
                    ),
                },
            }
        )

    except Exception as e:

        return json.dumps(
            {
                "success": False,
                "error": str(e),
            }
        )

    finally:
        db.close()


# =========================================================
# START MCP SERVER
# =========================================================

if __name__ == "__main__":
    mcp.run()