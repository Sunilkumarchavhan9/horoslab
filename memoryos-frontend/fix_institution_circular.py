import os
import re

files_to_fix = [
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\identity\InstitutionIdentityView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\templates\InstitutionTemplatesView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\versions\InstitutionVersionsView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\governance\InstitutionGovernanceView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\genome\InstitutionGenomeView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\proposals\InstitutionProposalsView.tsx',
    r'c:\projects\MemoryOS\memoryos-frontend\runtime\institution\perspectives\evolution\InstitutionEvolutionView.tsx',
]

for file_path in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove the GlobalInstitutionRegistry import
        content = re.sub(r'import\s+\{\s*GlobalInstitutionRegistry\s*\}\s+from\s+[\'"]\.\./\.\./InstitutionRegistry[\'"];?\n*', '', content)

        # Remove the registration block at the end
        content = re.sub(r'GlobalInstitutionRegistry\.register\(\{[\s\S]*?\}\);\s*', '', content)

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content.strip() + '\n')
        
        print(f"Fixed {os.path.basename(file_path)}")
    else:
        print(f"File not found: {file_path}")
