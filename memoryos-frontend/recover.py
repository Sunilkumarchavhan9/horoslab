import json

log_path = 'C:/Users/sunil kumar/.gemini/antigravity-ide/brain/a9b57bc8-5504-4610-91ca-69c9180998d8/.system_generated/logs/transcript_full.jsonl'
output_path = 'c:/projects/MemoryOS/memoryos-frontend/recovered_old.txt'
output2_path = 'c:/projects/MemoryOS/memoryos-frontend/recovered_new.txt'

with open(log_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

blocks = []
for line in lines:
    if 'account-home-dashboard.tsx' in line:
        try:
            blocks.append(json.loads(line))
        except:
            pass

found = False
for block in reversed(blocks):
    if 'tool_calls' in block:
        for t in block['tool_calls']:
            if t['name'] == 'replace_file_content':
                args = t['arguments']
                if 'account-home-dashboard.tsx' in args.get('TargetFile', ''):
                    if 'TargetContent' in args:
                        with open(output_path, 'w', encoding='utf-8') as out:
                            out.write(args['TargetContent'])
                        with open(output2_path, 'w', encoding='utf-8') as out2:
                            out2.write(args['ReplacementContent'])
                        print("Found replace_file_content")
                        found = True
                        break
    if found:
        break

if not found:
    print("Could not find replace, trying write_to_file")
    for block in reversed(blocks):
        if 'tool_calls' in block:
            for t in block['tool_calls']:
                if t['name'] == 'write_to_file':
                    args = t['arguments']
                    if 'account-home-dashboard.tsx' in args.get('TargetFile', ''):
                        with open(output_path, 'w', encoding='utf-8') as out:
                            out.write(args['CodeContent'])
                        print("Found write_to_file!")
                        found = True
                        break
        if found:
            break
