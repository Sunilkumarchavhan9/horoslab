import json

log_path = 'C:/Users/sunil kumar/.gemini/antigravity-ide/brain/a9b57bc8-5504-4610-91ca-69c9180998d8/.system_generated/logs/transcript_full.jsonl'

writes = []
with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        # looking for ACTUAL tsx code that uses framer-motion!
        if 'framer-motion' in line and 'account-home-dashboard.tsx' in line and 'export function AccountHomeDashboard' in line:
            data = json.loads(line)
            if 'tool_calls' in data:
                for t in data['tool_calls']:
                    if t.get('name') in ['write_to_file', 'replace_file_content', 'multi_replace_file_content']:
                        args = t.get('arguments', t.get('args', {}))
                        if 'account-home-dashboard.tsx' in str(args):
                            content = ''
                            if 'CodeContent' in args:
                                content = args['CodeContent']
                            elif 'ReplacementContent' in args:
                                content = args['ReplacementContent']
                            elif 'ReplacementChunks' in args:
                                content = args['ReplacementChunks'][0]['ReplacementContent']
                            
                            # MUST HAVE THE ACTUAL IMPORT AND NOT BE A PYTHON SCRIPT
                            if ('import { motion } from "framer-motion"' in content or 'import { motion' in content or '<motion.' in content) and 'log_path =' not in content:
                                writes.append(content)

print(f"Found {len(writes)} writes")
if writes:
    with open('c:/projects/MemoryOS/memoryos-frontend/draggable_ui_real.tsx', 'w', encoding='utf-8') as f:
        f.write(writes[-1]) # get the latest one!
