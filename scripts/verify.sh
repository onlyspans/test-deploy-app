#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "verify: node --check ${ROOT}/app.js"
node --check "${ROOT}/app.js"
echo "verify: OK"
