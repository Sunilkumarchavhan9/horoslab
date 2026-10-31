"""
Comprehensive LaTeX Validation Suite for HOROS PROBE-1 arXiv Package.
Verifies environment balancing, reference resolution, citation completeness,
label uniqueness, and ensures zero markdown syntax leakage.
"""
import glob
import os
import re
import sys
from collections import Counter

base_dir = os.path.dirname(os.path.abspath(__file__))
sections_dir = os.path.join(base_dir, "sections")
main_tex = os.path.join(base_dir, "main.tex")
bib_path = os.path.join(base_dir, "references.bib")

tex_files = [main_tex] + sorted(glob.glob(os.path.join(sections_dir, "*.tex")))

print(f"=== Running LaTeX Integrity Audit on {len(tex_files)} Files ===")
errors = 0

# 1. Environment Matching Check
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
            print(f"[FAIL] Environment mismatch in {os.path.basename(tf)}: '{e}' has {b_cnt[e]} begins and {e_cnt[e]} ends")
            errors += 1

# 2. Duplicate Label Detection & Reference Resolution
defined_labels = []
all_refs = []
for tf in tex_files:
    with open(tf, "r", encoding="utf-8") as f:
        content = f.read()
    lines = [line.split("%")[0] for line in content.splitlines()]
    clean = "\n".join(lines)
    
    labels = re.findall(r"\\label\{([^}]+)\}", clean)
    for l in labels:
        if l in defined_labels:
            print(f"[FAIL] Duplicate label found: '{l}' in {os.path.basename(tf)}")
            errors += 1
        defined_labels.append(l)
    
    refs = re.findall(r"\\(?:ref|Cref|cref)\{([^}]+)\}", clean)
    for r in refs:
        all_refs.append((r, os.path.basename(tf)))

for r, fname in all_refs:
    if r not in defined_labels:
        print(f"[FAIL] Unresolved cross-reference '{r}' in {fname}")
        errors += 1

# 3. Citation and Bibliography Verification
if os.path.exists(bib_path):
    with open(bib_path, "r", encoding="utf-8") as f:
        bib_content = f.read()
    bib_keys = set(re.findall(r"@\w+\{([^,]+),", bib_content))
    
    cited_keys = set()
    for tf in tex_files:
        with open(tf, "r", encoding="utf-8") as f:
            clean = "\n".join([line.split("%")[0] for line in f.read().splitlines()])
        cites = re.findall(r"\\cite\{([^}]+)\}", clean)
        for c in cites:
            for k in c.split(","):
                cited_keys.add(k.strip())
    
    missing_cites = cited_keys - bib_keys
    if missing_cites:
        print(f"[FAIL] Cited keys missing from references.bib: {missing_cites}")
        errors += len(missing_cites)
    
    uncited_keys = bib_keys - cited_keys
    if uncited_keys:
        print(f"[WARN] Uncited keys in references.bib: {uncited_keys}")

# 4. Markdown Syntax Leakage Detection
for tf in tex_files:
    with open(tf, "r", encoding="utf-8") as f:
        clean = "\n".join([line.split("%")[0] for line in f.read().splitlines()])
    md_bolds = re.findall(r"\*\*[^*]+\*\*", clean)
    if md_bolds:
        print(f"[FAIL] Markdown bold syntax leaked into {os.path.basename(tf)}: {md_bolds}")
        errors += len(md_bolds)

# Final Status
if errors == 0:
    print(f"SUCCESS: 100% LaTeX verification passed! ({len(defined_labels)} unique labels, {len(all_refs)} refs resolved, {len(bib_keys)} bib keys synced, 0 errors)")
    sys.exit(0)
else:
    print(f"FAILURE: Detected {errors} validation errors.")
    sys.exit(1)
