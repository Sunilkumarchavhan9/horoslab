import os
import re
from collections import Counter

base_dir = r"c:\projects\MemoryOS\research\PROBE-1\arxiv_submission"
sections_dir = os.path.join(base_dir, "sections")
tex_files = [os.path.join(base_dir, "main.tex")] + [
    os.path.join(sections_dir, f) for f in os.listdir(sections_dir) if f.endswith(".tex")
]

env_errors = 0
for tf in tex_files:
    with open(tf, "r", encoding="utf-8") as f:
        content = f.read()
    lines = [line.split("%")[0] for line in content.splitlines()]
    clean = "\n".join(lines)
    
    begins = re.findall(r"\\begin\{([^}]+)\}", clean)
    ends = re.findall(r"\\end\{([^}]+)\}", clean)
    
    b_cnt = Counter(begins)
    e_cnt = Counter(ends)
    all_envs = set(b_cnt.keys()) | set(e_cnt.keys())
    for e in all_envs:
        if b_cnt[e] != e_cnt[e]:
            print(f"MISMATCH in {os.path.basename(tf)}: environment '{e}' has {b_cnt[e]} begins and {e_cnt[e]} ends")
            env_errors += 1

if env_errors == 0:
    print("SUCCESS: All LaTeX environments are perfectly matched across all files!")
else:
    print(f"FAILURE: Found {env_errors} environment mismatches.")
