import re

with open(r'c:\\projects\\MemoryOS\\memoryos-frontend\\components\\mission-control\\observe-dashboard-detail.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = re.sub(r'\"(.*?)\"', '\"\"', text)
text = re.sub(r'\'(.*?)\'', '\'\'', text)
text = re.sub(r'\/\*.*?\*\/', '', text, flags=re.DOTALL)
text = re.sub(r'\/\/.*', '', text)

lines = text.split('\n')
count = 0
for i, line in enumerate(lines):
    for char in line:
        if char == '{': count += 1
        elif char == '}': count -= 1
    
    s = line.strip()
    if s.startswith('}') or s.startswith('];') or s.startswith('};'):
        print(f'Line {i+1} [{count}]: {s}')
