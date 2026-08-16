from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode

from plaid.model.item_public_token_exchange_request import (
    ItemPublicTokenExchangeRequest
)

from app.plaid_client import plaid_client


router = APIRouter(
    prefix="/api/plaid",
    tags=["Plaid"]
)


# Temporary storage for demo purposes
access_token = None


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
    data: PublicTokenRequest
):

    global access_token

    try:

        request = ItemPublicTokenExchangeRequest(
            public_token=data.public_token
        )

        response = plaid_client.item_public_token_exchange(
            request
        )

        access_token = response.access_token

        return {
            "success": True,
            "item_id": response.item_id
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )