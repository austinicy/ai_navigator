#!/bin/sh
# infra/mcp/start.sh
# Defaults to HTTP transport on $PORT (App Runner injects PORT) for remote hosting.
export MCP_TRANSPORT="${MCP_TRANSPORT:-http}"
export MCP_PORT="${MCP_PORT:-${PORT:-8080}}"
node dist/mcp/cli.js
