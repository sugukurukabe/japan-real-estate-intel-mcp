"""Bump version to 5.1.0 in package.json, server.ts, http.ts"""

files = [
    ('package.json', b'"version": "5.0.0"', b'"version": "5.1.0"'),
    ('src/server.ts', b"version: '5.0.0'", b"version: '5.1.0'"),
    ('src/http.ts', b"version: '5.0.0'", b"version: '5.1.0'"),
]

for path, old, new in files:
    with open(path, 'rb') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(path, 'wb') as f:
            f.write(content)
        print(f'Bumped {path}')
    elif new in content:
        print(f'Already 5.1.0: {path}')
    else:
        print(f'WARNING: version string not found in {path}')
