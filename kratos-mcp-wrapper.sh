#!/bin/bash
# Wrapper script for kratos-mcp to ensure clean stdio for MCP protocol

# Disable all debug output
unset KRATOS_DEBUG

# Run the actual MCP server
exec node "$(dirname "$0")/dist/index.js" "$@"