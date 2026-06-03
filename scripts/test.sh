#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Backend tests ==="
cd "$ROOT/backend"
export BUDDY_WEB_DISABLE_ROS=1
.venv/bin/python manage.py migrate --noinput
.venv/bin/python manage.py seed_buddy_users
.venv/bin/pip install -q -r requirements.txt
.venv/bin/python manage.py test api ros_bridge accounts -v 2

echo ""
echo "=== Frontend tests ==="
cd "$ROOT/frontend"
npm run test -- --run

echo ""
echo "=== Frontend build ==="
npm run build

echo ""
echo "All tests passed."
