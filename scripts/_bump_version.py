#!/usr/bin/env python3
"""Bump version strings in server.ts and http.ts."""
import sys

OLD = b"version: '2.9.0'"
NEW = b"version: '3.1.0'"

for fname in ['src/server.ts', 'src/http.ts']:
    with open(fname, 'rb') as f:
        content = f.read()
    if OLD not in content:
        print(f'WARNING: {OLD} not found in {fname}')
        continue
    content = content.replace(OLD, NEW)
    with open(fname, 'wb') as f:
        f.write(content)
    print(f'Updated {fname}')
