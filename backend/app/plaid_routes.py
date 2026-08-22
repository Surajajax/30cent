from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest
)
from plaid.model.accounts_get_request import AccountsGetRequest
from plaid.model.transactions_sync_request import TransactionsSyncRequest
from plaid.model.item_remove_request import ItemRemoveRequest

from app.plaid_client import plaid_client
from app.database import get_db
from app.models import PlaidItem


router = APIRouter(
    prefix="/api/plaid",
    tags=["Plaid"]
)


class PublicTokenRequest(BaseModel):
    public_token: str


@router.post("/create-link-token")
async def create_link_token():

    try:
        request = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id="30cent-demo-user"
            ),
            client_name="30cent",
            products=[
                Products("transactions")
            ],
            country_codes=[
                CountryCode("US")
            ],
            language="en"
        )

        response = plaid_client.link_token_create(request)

        return {
            "link_token": response.link_token
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/exchange-public-token")
async def exchange_public_token(
    data: PublicTokenRequest,
    db: Session = Depends(get_db)
):

    try:

        # Exchange public token with Plaid
        request = ItemPublicTokenExchangeRequest(
            public_token=data.public_token
        )

        response = plaid_client.item_public_token_exchange(
            request
        )

        access_token = response.access_token
        item_id = response.item_id

        # Check if this Plaid Item already exists
        existing_item = (
            db.query(PlaidItem)
            .filter(PlaidItem.item_id == item_id)
            .first()
        )

        if existing_item:

            # Update existing access token
            existing_item.access_token = access_token

        else:

            # Save new Plaid connection
            plaid_item = PlaidItem(
                item_id=item_id,
                access_token=access_token
            )

            db.add(plaid_item)

        db.commit()

        return {
            "success": True,
            "item_id": item_id
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/accounts")
async def get_accounts(
    db: Session = Depends(get_db)
):

    # Get the latest connected Plaid item
    plaid_item = (
        db.query(PlaidItem)
        .order_by(PlaidItem.id.desc())
        .first()
    )

    if not plaid_item:

        raise HTTPException(
            status_code=400,
            detail="No bank account connected"
        )

    try:

        request = AccountsGetRequest(
            access_token=plaid_item.access_token
        )

        response = plaid_client.accounts_get(request)

        accounts = []

        for account in response.accounts:

            accounts.append({
                "account_id": account.account_id,
                "name": account.name,
                "official_name": account.official_name,
                "type": str(account.type),
                "subtype": str(account.subtype),
                "mask": account.mask,

                "balances": {
                    "available": account.balances.available,
                    "current": account.balances.current,
                    "iso_currency_code": (
                        account.balances.iso_currency_code
                    )
                }
            })

        return {
            "accounts": accounts
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.delete("/disconnect")
async def disconnect_account(
    db: Session = Depends(get_db)
):

    plaid_item = (
        db.query(PlaidItem)
        .order_by(PlaidItem.id.desc())
        .first()
    )

    if not plaid_item:

        raise HTTPException(
            status_code=400,
            detail="No bank account connected"
        )

    try:

        request = ItemRemoveRequest(
            access_token=plaid_item.access_token
        )

        plaid_client.item_remove(request)
        db.delete(plaid_item)
        db.commit()

        return {
            "success": True
        }

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/transactions")
async def get_transactions(
    db: Session = Depends(get_db)
):

    # Get the latest connected Plaid item
    plaid_item = (
        db.query(PlaidItem)
        .order_by(PlaidItem.id.desc())
        .first()
    )

    if not plaid_item:

        raise HTTPException(
            status_code=400,
            detail="No bank account connected"
        )

    try:

        request = TransactionsSyncRequest(
            access_token=plaid_item.access_token
        )

        response = plaid_client.transactions_sync(request)

        transactions = []

        for transaction in response.added:

            transactions.append({
                "transaction_id": transaction.transaction_id,
                "name": transaction.name,
                "merchant_name": transaction.merchant_name,
                "amount": transaction.amount,
                "date": str(transaction.date),

                "category": (
                    transaction.personal_finance_category.primary
                    if transaction.personal_finance_category
                    else None
                ),

                "iso_currency_code": transaction.iso_currency_code
            })

        return {
            "transactions": transactions
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )