
import re
import sys

def check_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    tags = re.findall(r'<[a-zA-Z0-9]+[^>]*>', content, re.DOTALL)

    found_duplicates = False
    for tag in tags:
        # Improved attribute finding to handle spaces and newlines better
        # Find everything before = or just the attribute name
        attrs = re.findall(r'\s+([a-zA-Z0-9-]+)(?:\s*=\s*|\s+|/|>|$)', tag)
        seen = {}
        for attr in attrs:
            if attr in seen:
                print(f"ERROR: Duplicate attribute '{attr}' in tag:")
                print(tag)
                print("-" * 20)
                found_duplicates = True
            seen[attr] = True

    if not found_duplicates:
        print("No duplicate attributes found.")
    else:
        sys.exit(1)

if __name__ == "__main__":
    check_file('src/components/AddAlarmModal.tsx')
