#!/usr/bin/env bash
# Screenshots only match inside this image, so the legacy-blocks suite runs here.
set -euo pipefail
cd "$(dirname "$0")/.."

# The tag follows the exact @playwright/test pin, or the image has no matching browser.
PW=$(node -p "require('./package.json').devDependencies['@playwright/test']")
IMAGE="mcr.microsoft.com/playwright:v${PW}-noble"

# Host node_modules holds darwin binaries, so Linux gets its own volume.
exec docker run --rm --init --ipc=host \
	-v "$PWD":/code-block-pro -w /code-block-pro \
	-v cbp-e2e-node-modules:/code-block-pro/node_modules \
	-v cbp-e2e-npm-cache:/root/.npm \
	-v cbp-e2e-playground:/root/.wordpress-playground \
	-e PW_IMAGE="$IMAGE" -e BASE_PORT=9600 -e PLAYWRIGHT_HTML_OPEN=never \
	-e WP_VERSION="${WP_VERSION:-7.1.3}" \
	-e CI -e CAPTURE_BASELINE -e SKIP_BUILD \
	"$IMAGE" bash -euo pipefail -c '
		lock=$(sha256sum package-lock.json | cut -d" " -f1)
		if [ "$(cat node_modules/.lock-sha 2>/dev/null)" != "$lock" ]; then
			npm ci --no-audit --no-fund --loglevel=error
			echo "$lock" > node_modules/.lock-sha
		fi
		[ -n "${SKIP_BUILD:-}" ] || npm run build
		RUN_PROJECT=legacy-blocks npx playwright test --project=legacy-blocks "$@"
	' -- "$@"
