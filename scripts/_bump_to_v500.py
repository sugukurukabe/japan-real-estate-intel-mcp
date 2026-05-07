"""Bump version strings to 5.0.0 in package.json, server.ts, http.ts"""
import re

FILES = [
    ('package.json', b'"version": "4.0.0"', b'"version": "5.0.0"'),
]

for path, old, new in FILES:
    with open(path, 'rb') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'wb') as f:
            f.write(content)
        print(f'Bumped {path}')
    else:
        print(f'WARNING: pattern not found in {path}')

# server.ts: version string
with open('src/server.ts', 'rb') as f:
    s = f.read()
s = s.replace(b"version: '4.0.0'", b"version: '5.0.0'")
with open('src/server.ts', 'wb') as f:
    f.write(s)
print('Bumped src/server.ts')

# http.ts
with open('src/http.ts', 'rb') as f:
    h = f.read()
h = h.replace(b"version: '4.0.0'", b"version: '5.0.0'")
with open('src/http.ts', 'wb') as f:
    f.write(h)
print('Bumped src/http.ts')

print('All done.')
