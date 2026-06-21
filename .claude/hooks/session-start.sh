#!/bin/bash
set -euo pipefail

# Install dependencies so lint / test / build work in Claude Code on the web.
# Web (remote) sessions only — local sessions manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"
# npm install (not ci) so a cached container can reuse an existing node_modules.
npm install --no-audit --no-fund
