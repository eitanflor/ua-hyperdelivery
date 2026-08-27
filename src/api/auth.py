"""Validates Entra ID (Azure AD) ID tokens issued to the console UI's MSAL sign-in.

No custom "Expose an API" scope is configured - the frontend sends its ID token (not a scoped
access token) as the bearer credential. That's sufficient here: the token is still signed by
Entra ID for this exact app registration (`aud` == our client id), so validating its signature
+ claims proves who signed in without needing a separate API scope. Same pattern as
Material_Libraray_AI_Assistant's `mai.core.auth` - see that repo's docs/decisions.md for why.
"""

import logging
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel

from config.settings import Settings, get_settings

logger = logging.getLogger(__name__)

_bearer_scheme = HTTPBearer(auto_error=False)


class CurrentUser(BaseModel):
    """Identity extracted from a validated Entra ID token.

    `oid` (the object id) is the stable per-user key - unlike email, it doesn't change if the
    user's UPN is renamed.
    """

    oid: str
    email: str | None = None
    name: str | None = None


@lru_cache
def _get_jwk_client(tenant_id: str) -> PyJWKClient:
    jwks_uri = f"https://login.microsoftonline.com/{tenant_id}/discovery/v2.0/keys"
    return PyJWKClient(jwks_uri)


def clear_auth_cache() -> None:
    """Reset the cached JWKS client (used by tests to keep state isolated)."""
    _get_jwk_client.cache_clear()


def _decode(token: str, settings: Settings) -> dict[str, Any]:
    if not settings.entra_tenant_id or not settings.entra_client_id:
        logger.error("Entra ID auth is not configured (ENTRA_TENANT_ID/ENTRA_CLIENT_ID).")
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Sign-in is not configured on this server."
        )
    jwk_client = _get_jwk_client(settings.entra_tenant_id)
    try:
        signing_key = jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.entra_client_id,
            issuer=f"https://login.microsoftonline.com/{settings.entra_tenant_id}/v2.0",
        )
    except jwt.PyJWTError as error:
        logger.warning("Rejected an Entra ID token: %s", error)
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired sign-in token."
        ) from error


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    """FastAPI dependency: validate the bearer ID token and return who signed in."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Missing sign-in token.")
    claims = _decode(credentials.credentials, settings)
    oid = claims.get("oid")
    if not oid:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, detail="Sign-in token is missing a subject identifier."
        )
    return CurrentUser(oid=oid, email=claims.get("preferred_username"), name=claims.get("name"))
