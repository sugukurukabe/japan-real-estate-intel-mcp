"""Remove the broken quick_start_examples injection and restore 'return server' marker"""
import re

with open('src/server.ts', 'rb') as f:
    content = f.read()

# The broken injection ends the file without a proper 'return server;\r\n}\r\n'
# Find the last occurrence of 'return server;\r\n}\r\n' or 'return server;\n}\n'
# and ensure only ONE exists

text = content.decode('utf-8', errors='replace')

# Count occurrences
count = text.count("  return server;\r\n}\r\n")
print(f"'return server' marker count: {count}")

# Find where 'quick_start_examples' starts and remove it
qs_marker = "  server.prompt(\r\n    'quick_start_examples'"
if qs_marker in text:
    idx = text.find(qs_marker)
    # Truncate at that point and add back the marker
    truncated = text[:idx] + "  return server;\r\n}\r\n"
    with open('src/server.ts', 'wb') as f:
        f.write(truncated.encode('utf-8'))
    print('Removed broken injection, restored marker')
elif "  server.prompt(\n    'quick_start_examples'" in text:
    idx = text.find("  server.prompt(\n    'quick_start_examples'")
    truncated = text[:idx] + "  return server;\r\n}\r\n"
    with open('src/server.ts', 'wb') as f:
        f.write(truncated.encode('utf-8'))
    print('Removed broken injection (LF version), restored marker')
else:
    print('No quick_start_examples found to remove')
    print('Last 300 chars:', repr(text[-300:]))
