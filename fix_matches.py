import re

with open('src/config/matches.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the duplicated catboost string with mfa string
content = re.sub(
    r", catboost:'(/graphs/[^/]+/[^/]+)_catboost.png'}",
    r", mfa:'\g<1>_mfa.png'}",
    content
)

with open('src/config/matches.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated matches.js successfully!")
