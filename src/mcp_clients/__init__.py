"""Generic MCP client builders - transport and auth only, no per-agent policy.

The least-privilege tool filtering that decides what a given agent may call lives in
`tools/`, so the same client can be reused with a different policy.
"""
