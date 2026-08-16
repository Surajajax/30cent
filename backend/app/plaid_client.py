import os

from dotenv import load_dotenv
from plaid.api import plaid_api
from plaid.configuration import Configuration
from plaid.api_client import ApiClient


load_dotenv()


PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox")


if PLAID_ENV == "sandbox":
    PLAID_HOST = "https://sandbox.plaid.com"
else:
    PLAID_HOST = "https://production.plaid.com"


configuration = Configuration(
    host=PLAID_HOST,
    api_key={
        "clientId": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
    },
)


api_client = ApiClient(configuration)

plaid_client = plaid_api.PlaidApi(api_client)