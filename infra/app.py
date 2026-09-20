#!/usr/bin/env python3
"""CDK entrypoint: synthesizes the storage, orchestration and console API stacks.

Environment name (dev/prod, suffixes every resource - see stacks/naming.py) comes from
`-c env=<name>` context, defaulting to "dev" so a plain `cdk synth`/`cdk deploy` never
accidentally targets prod.
"""

import os

import aws_cdk as cdk

from stacks.console_api_stack import ConsoleApiStack
from stacks.console_ui_stack import ConsoleUiStack
from stacks.naming import REGION
from stacks.orchestration_stack import OrchestrationStack
from stacks.storage_stack import StorageStack

app = cdk.App()
env_name = app.node.try_get_context("env") or "dev"
env = cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region=REGION)

# Same values as the console UI's VITE_ENTRA_TENANT_ID/VITE_ENTRA_CLIENT_ID (see root
# .env.example) - exported into the shell before `cdk deploy`, not read from
# ui/console/.env directly (a different app's local-dev-only file).
if "ENTRA_TENANT_ID" not in os.environ or "ENTRA_CLIENT_ID" not in os.environ:
    missing_entra_env_message = (
        "ENTRA_TENANT_ID and ENTRA_CLIENT_ID must be set (see .env.example) - "
        "the console API can't validate sign-in tokens without them (api/auth.py)."
    )
    raise RuntimeError(missing_entra_env_message)
entra_tenant_id = os.environ["ENTRA_TENANT_ID"]
entra_client_id = os.environ["ENTRA_CLIENT_ID"]

storage = StorageStack(app, f"Hyperdelivery{env_name.title()}StorageStack", env_name, env=env)

orchestration = OrchestrationStack(
    app,
    f"Hyperdelivery{env_name.title()}OrchestrationStack",
    project_table=storage.project_table,
    env=env,
)

console_ui = ConsoleUiStack(
    app,
    f"Hyperdelivery{env_name.title()}ConsoleUiStack",
    env_name=env_name,
    env=env,
)

ConsoleApiStack(
    app,
    f"Hyperdelivery{env_name.title()}ConsoleApiStack",
    env_name=env_name,
    project_table=storage.project_table,
    connections_table=orchestration.connections_table,
    state_machine=orchestration.state_machine,
    console_ui_url=f"https://{console_ui.distribution.domain_name}",
    entra_tenant_id=entra_tenant_id,
    entra_client_id=entra_client_id,
    env=env,
)

app.synth()
