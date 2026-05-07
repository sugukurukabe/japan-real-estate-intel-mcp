# -*- coding: utf-8 -*-
"""Bump version from 3.1.0 to 4.0.0 in server.ts and http.ts."""
files = ['src/server.ts', 'src/http.ts']
for path in files:
    with open(path, 'rb') as f:
        content = f.read()
    updated = content.replace(b"version: '3.1.0'", b"version: '4.0.0'")
    if updated == content:
        print(f"WARNING: no replacement made in {path}")
    else:
        with open(path, 'wb') as f:
            f.write(updated)
        print(f"OK: bumped version in {path}")
