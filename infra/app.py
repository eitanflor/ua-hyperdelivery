#!/usr/bin/env python3
"""CDK entrypoint: synthesizes the storage, orchestration and console API stacks.

Environment name (dev/prod, suffixes every resource - see stacks/naming.py) comes from
`-c env=<name>` context, defaulting to "dev" so a plain `cdk synth`/`cdk deploy` never
accidentally targets prod.
"""

import os

import aws_cdk as cdk

from stacks.console_api_stack import ConsoleApiStack
from stacks.naming import REGION
from stacks.orchestration_stack import OrchestrationStack
from stacks.storage_stack import StorageStack

app = cdk.App()
env_name = app.node.try_get_context("env") or "dev"
env = cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region=REGION)

storage = StorageStack(app, f"Hyperdelivery{env_name.title()}StorageStack", env_name, env=env)

OrchestrationStack(
    app,
    f"Hyperdelivery{env_name.title()}OrchestrationStack",
    project_table=storage.project_table,
    env=env,
)

ConsoleApiStack(
    app,
    f"Hyperdelivery{env_name.title()}ConsoleApiStack",
    env_name=env_name,
    project_table=storage.project_table,
    env=env,
)

app.synth()
