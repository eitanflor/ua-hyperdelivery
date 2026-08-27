#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.console_api_stack import ConsoleApiStack
from stacks.orchestration_stack import OrchestrationStack

app = cdk.App()

OrchestrationStack(
    app,
    "HyperdeliveryOrchestrationStack",
    env=cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region="ap-southeast-2"),
)

ConsoleApiStack(
    app,
    "HyperdeliveryConsoleApiStack",
    env=cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region="ap-southeast-2"),
)

app.synth()
