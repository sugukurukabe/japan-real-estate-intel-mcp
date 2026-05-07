import re

with open('src/server.ts', 'rb') as f:
    c = f.read()

matches = [m.start() for m in re.finditer(b'server\\.tool\\(', c)]
print(f'server.tool() count: {len(matches)}')
for m in matches:
    name_start = c.find(b"'", m) + 1
    name_end = c.find(b"'", name_start)
    print(f'  - {c[name_start:name_end].decode("utf-8", errors="replace")}')

prompts = [m.start() for m in re.finditer(b'server\\.prompt\\(', c)]
print(f'\nserver.prompt() count: {len(prompts)}')
for m in prompts:
    name_start = c.find(b"'", m) + 1
    name_end = c.find(b"'", name_start)
    print(f'  - {c[name_start:name_end].decode("utf-8", errors="replace")}')

print('\nLast 400 bytes:')
print(repr(c[-400:]))
