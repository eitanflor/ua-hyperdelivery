#!/usr/bin/env python3
import os

import aws_cdk as cdk

from stacks.orchestration_stack import OrchestrationStack

app = cdk.App()

OrchestrationStack(
    app,
    "HyperdeliveryOrchestrationStack",
    env=cdk.Environment(account=os.getenv("CDK_DEFAULT_ACCOUNT"), region="ap-southeast-2"),
)

app.synth()
