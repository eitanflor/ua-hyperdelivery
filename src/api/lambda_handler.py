"""Lambda entrypoint: adapts the ASGI console API to API Gateway's proxy event."""

from mangum import Mangum

from api.main import app

handler = Mangum(app)
