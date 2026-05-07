"""Add transactions: true to all loader capabilities"""
import os

loaders = ['aichi', 'tokyo', 'osaka', 'kanagawa', 'fukuoka', 'hokkaido', 'kyoto', 'hyogo', 'saitama', 'chiba']

for name in loaders:
    path = f'src/data-loaders/{name}-loader.ts'
    with open(path, 'rb') as f:
        content = f.read()

    # Try different patterns for the capabilities object
    patterns = [
        (
            b'readonly capabilities: LoaderCapabilities = {\r\n    humanFlow:',
            b'readonly capabilities: LoaderCapabilities = {\r\n    transactions: true, humanFlow:'
        ),
        (
            b'readonly capabilities: LoaderCapabilities = {\r\n    humanFlow:',
            b'readonly capabilities: LoaderCapabilities = {\r\n    transactions: true, humanFlow:'
        ),
        (
            b'readonly capabilities: LoaderCapabilities = {\n    humanFlow:',
            b'readonly capabilities: LoaderCapabilities = {\n    transactions: true, humanFlow:'
        ),
    ]

    updated = False
    for old, new in patterns:
        if old in content:
            content = content.replace(old, new)
            updated = True
            print(f'Updated {name}')
            break

    if not updated:
        # Try one-liner style
        import re
        # Match single-line capabilities
        for m in re.finditer(rb'capabilities: LoaderCapabilities = \{([^}]+)\}', content):
            cap_str = m.group(1)
            if b'transactions' not in cap_str:
                new_cap = b'transactions: true, ' + cap_str.lstrip()
                content = content[:m.start(1)] + new_cap + content[m.end(1):]
                updated = True
                print(f'Updated {name} (single-line)')
                break

    if not updated:
        print(f'WARNING: could not update {name}')
    else:
        with open(path, 'wb') as f:
            f.write(content)

print('Done')
