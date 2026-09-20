"""Shared Lambda dependency-bundling recipe (ADVA-3015).

`export_lambda_requirements` regenerates a pinned requirements.txt from the repo's own
lockfile, which `bundling_options`'s SAM build image then pip installs alongside `src/` -
no hand-maintained second dependency list to drift out of sync. Every Lambda-backed stack
(ConsoleApiStack, OrchestrationStack) shares this so there is exactly one place bundling
gets fixed, not one per stack.
"""

import re
import subprocess
from pathlib import Path

from aws_cdk import BundlingOptions, DockerVolume
from aws_cdk import aws_lambda as lambda_

_SRC_DIR = Path(__file__).resolve().parents[2] / "src"
REPO_ROOT = _SRC_DIR.parent
LAMBDA_REQUIREMENTS = _SRC_DIR / "requirements-lambda.txt"
# Same TLS-inspecting-proxy CA the Dockerfile trusts (certs/ is gitignored, hence the
# existence check - absent on networks that don't intercept TLS).
_ZSCALER_CA = REPO_ROOT / "certs" / "zscaler-ca-bundle.crt"


def export_lambda_requirements() -> None:
    """Regenerate the pinned dependency list the Lambda bundling step installs from."""
    subprocess.run(  # noqa: S603 - fixed args below, no untrusted input
        ["uv", "export", "--frozen", "--no-dev", "--no-hashes", "-o", str(LAMBDA_REQUIREMENTS)],  # noqa: S607 - `uv` is this repo's toolchain, resolved via PATH intentionally
        cwd=REPO_ROOT,
        check=True,
    )
    # The exact pillow sdist pyproject.toml pins has no prebuilt wheel yet and the
    # TLS-inspecting proxy reproducibly corrupts its 47MB sdist mid-download (pip's hash
    # check then fails, every retry). Relax to a range with wheels, since parsing.py only
    # touches PIL.Image's stable, long-unchanged surface.
    requirements = LAMBDA_REQUIREMENTS.read_text()
    requirements = re.sub(r"^pillow==.*$", "pillow<12.3", requirements, flags=re.MULTILINE)
    LAMBDA_REQUIREMENTS.write_text(requirements)


def bundling_options() -> BundlingOptions:
    """The pip-install-then-copy-src recipe every Lambda-backed stack's asset shares."""
    return BundlingOptions(
        image=lambda_.Runtime.PYTHON_3_11.bundling_image,
        volumes=(
            [DockerVolume(host_path=str(_ZSCALER_CA.parent), container_path="/certs")]
            if _ZSCALER_CA.exists()
            else None
        ),
        environment=(
            {
                "PIP_CERT": "/certs/zscaler-ca-bundle.crt",
                "REQUESTS_CA_BUNDLE": "/certs/zscaler-ca-bundle.crt",
                "SSL_CERT_FILE": "/certs/zscaler-ca-bundle.crt",
            }
            if _ZSCALER_CA.exists()
            else None
        ),
        command=[
            "bash",
            "-c",
            # --only-binary avoids sdist builds entirely - the TLS-inspecting proxy has
            # been seen corrupting large sdist downloads mid-transfer. --platform/
            # --python-version/--implementation/--abi pin the target to Lambda's default
            # x86_64 runtime regardless of the host machine's architecture - without
            # this, building on an Apple Silicon host pulls arm64 wheels (e.g.
            # pydantic_core) that fail to import on the x86_64 Lambda at runtime.
            (
                "pip install --no-cache-dir --only-binary=:all: "
                "--platform manylinux2014_x86_64 --python-version 3.11 "
                "--implementation cp --abi cp311 "
                "-r requirements-lambda.txt -t /asset-output "
                "&& cp -au . /asset-output "
                "&& rm -f /asset-output/requirements-lambda.txt"
            ),
        ],
    )
