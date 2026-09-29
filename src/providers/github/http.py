"""What the GitHub REST clients in this package share: where to call and how long to wait."""

API_ROOT = "https://api.github.com"
TIMEOUT_SECONDS = 10.0
# An HTTP status at or above this is an error response (4xx and 5xx).
ERROR_STATUS_THRESHOLD = 400
