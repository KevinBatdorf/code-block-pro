#!/usr/bin/env bash
set -euo pipefail

out="${1:-./build}"
mkdir -p "$out"

for f in *.txt; do
	[ -e "$f" ] || continue
	name="$(basename "$f" .txt)"
	printf 'packing %s\n' "$name"
	gzip -9 -c "$f" > "$out/${name}.txt.gz"
done

echo "wrote $(ls -1 "$out" | wc -l) files"
