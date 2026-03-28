import os
import re

directories = [
    r"c:\Users\User\Desktop\Projet PFE\app",
    r"c:\Users\User\Desktop\Projet PFE\components"
]

replacements = {
    # Fix the button class that had its padding/flex stripped
    r'\bfont-medium rounded-xl transition-all shadow-sm\b': 'inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm',
    
    # Avoid duplicate px-4 py-2
    r'\bpx-4 py-2 [^"]*px-\w.*?\b': lambda m: m.group(0).replace('px-4 py-2 ', ''), # simplistic deduplication, better to just let Tailwind handle last-class-wins or use a negative lookahead
}

files_modified = 0

for d in directories:
    for root, dirs, files in os.walk(d):
        if 'node_modules' in root or '.next' in root:
            continue
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    
                    original_content = content
                    content = re.sub(r'(?<!px-\d\s)(?<!py-\d\s)\bfont-medium rounded-xl transition-all shadow-sm\b', 'inline-flex items-center justify-center gap-2 px-4 py-2 font-medium rounded-xl transition-all shadow-sm', content)
                        
                    if content != original_content:
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        files_modified += 1
                        print(f"Fixed {file_path}")
                except Exception as e:
                    pass

print(f"Total fixed: {files_modified}")
