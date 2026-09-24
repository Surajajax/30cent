import os

import jwt
from fastapi import Header, HTTPException


SUPABASE_URL = os.getenv("SUPABASE_URL")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is not configured")


JWKS_URL = (
    f"{SUPABASE_URL.rstrip('/')}"
    "/auth/v1/.well-known/jwks.json"
)


def get_current_user_id(
    authorization: str | None = Header(default=None),
) -> str:
    """
    Verify a Supabase access token and return
    the authenticated user's UUID.
    """

    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Missing authorization header",
        )

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid authorization header",
        )

    token = authorization[len("Bearer "):].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Missing access token",
        )

    try:
        # Read the token header first so we know which
        # signing key / algorithm Supabase used.
        unverified_header = jwt.get_unverified_header(token)

        kid = unverified_header.get("kid")
        algorithm = unverified_header.get("alg")

        if not kid:
            raise HTTPException(
                status_code=401,
                detail="Token is missing key ID",
            )

        if not algorithm:
            raise HTTPException(
                status_code=401,
                detail="Token is missing signing algorithm",
            )

        # Fetch Supabase's public signing keys.
        import requests

        response = requests.get(
            JWKS_URL,
            timeout=10,
        )

        response.raise_for_status()

        jwks = response.json()

        signing_key = None

        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                signing_key = key
                break

        if signing_key is None:
            raise HTTPException(
                status_code=401,
                detail="Signing key not found",
            )

        public_key = jwt.algorithms.get_default_algorithms()[
            algorithm
        ].from_jwk(signing_key)

        payload = jwt.decode(
            token,
            public_key,
            algorithms=[algorithm],
            options={
                "verify_aud": False,
            },
        )

    except HTTPException:
        raise

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Access token has expired",
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid access token",
        )

    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail="Unable to reach Supabase authentication service",
        )

    except Exception as e:
        print(f"JWT verification error: {e}")

        raise HTTPException(
            status_code=401,
            detail="Unable to verify access token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="User ID missing from access token",
        )

    return user_id