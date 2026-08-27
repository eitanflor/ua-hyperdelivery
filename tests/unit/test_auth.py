import time
from collections.abc import Callable

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

import api.auth as auth_module
from api.auth import CurrentUser, clear_auth_cache, get_current_user
from config.settings import Settings

TENANT = "tenant-123"
CLIENT_ID = "client-456"
ISSUER = f"https://login.microsoftonline.com/{TENANT}/v2.0"


def _private_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


class _FakeSigningKey:
    def __init__(self, key: rsa.RSAPublicKey) -> None:
        self.key = key


class _FakeJwkClient:
    def __init__(self, private_key: rsa.RSAPrivateKey) -> None:
        self._public_key = private_key.public_key()

    def get_signing_key_from_jwt(self, token: str) -> _FakeSigningKey:
        return _FakeSigningKey(self._public_key)


def _token(
    private_key: rsa.RSAPrivateKey,
    *,
    aud: str = CLIENT_ID,
    iss: str = ISSUER,
    exp_delta: int = 3600,
    **claims: object,
) -> str:
    now = int(time.time())
    payload = {"aud": aud, "iss": iss, "iat": now, "exp": now + exp_delta, **claims}
    return jwt.encode(payload, private_key, algorithm="RS256")


def _creds(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def _stub_jwk_client(private_key: rsa.RSAPrivateKey) -> Callable[[str], _FakeJwkClient]:
    def _get(tenant_id: str) -> _FakeJwkClient:
        return _FakeJwkClient(private_key)

    return _get


@pytest.fixture(autouse=True)
def _isolate_jwk_cache() -> None:
    clear_auth_cache()


def test_valid_token_returns_current_user(monkeypatch: pytest.MonkeyPatch) -> None:
    private_key = _private_key()
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(private_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    token = _token(private_key, oid="abc-123", preferred_username="user@ua.com", name="A User")

    user = get_current_user(credentials=_creds(token), settings=settings)

    assert user == CurrentUser(oid="abc-123", email="user@ua.com", name="A User")


def test_missing_credentials_raises_401() -> None:
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=None, settings=settings)
    assert exc_info.value.status_code == 401


def test_unconfigured_tenant_raises_401() -> None:
    settings = Settings(entra_tenant_id=None, entra_client_id=None)
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(credentials=_creds("whatever"), settings=settings)
    assert exc_info.value.status_code == 401


def test_wrong_audience_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    private_key = _private_key()
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(private_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    token = _token(private_key, aud="someone-else", oid="abc-123")

    with pytest.raises(HTTPException):
        get_current_user(credentials=_creds(token), settings=settings)


def test_wrong_issuer_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    private_key = _private_key()
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(private_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    other_issuer = "https://login.microsoftonline.com/other-tenant/v2.0"
    token = _token(private_key, iss=other_issuer, oid="abc-123")

    with pytest.raises(HTTPException):
        get_current_user(credentials=_creds(token), settings=settings)


def test_expired_token_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    private_key = _private_key()
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(private_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    token = _token(private_key, exp_delta=-3600, oid="abc-123")

    with pytest.raises(HTTPException):
        get_current_user(credentials=_creds(token), settings=settings)


def test_tampered_signature_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    signing_key = _private_key()
    other_key = _private_key()
    # token signed by a different key than the one the server trusts for this tenant
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(other_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    token = _token(signing_key, oid="abc-123")

    with pytest.raises(HTTPException):
        get_current_user(credentials=_creds(token), settings=settings)


def test_missing_oid_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    private_key = _private_key()
    monkeypatch.setattr(auth_module, "_get_jwk_client", _stub_jwk_client(private_key))
    settings = Settings(entra_tenant_id=TENANT, entra_client_id=CLIENT_ID)
    token = _token(private_key)  # no oid claim

    with pytest.raises(HTTPException):
        get_current_user(credentials=_creds(token), settings=settings)
