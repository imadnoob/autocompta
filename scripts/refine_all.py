import os
import re

directories = [
    r"c:\Users\User\Desktop\Projet PFE\app",
    r"c:\Users\User\Desktop\Projet PFE\components"
]

replacements = {
    # Fix redundant bold/semibold classes that were introduced by substituting font-display
    r'\bfont-semibold font-semibold\b': 'font-semibold',
    r'\bfont-bold font-semibold\b': 'font-bold',
    r'\bfont-semibold font-bold\b': 'font-bold',
    r'\bfont-bold font-bold\b': 'font-bold',
    
    # Add rounded corners to main container cards that were just 'shadow-md'
    r'\bbg-white border border-slate-200 shadow-md([^"]*)"': r'bg-white border border-slate-200 shadow-sm rounded-2xl\1"',
    
    # Add rounded corners to standard border items
    r'\bborder border-slate-200([^"]*)"': r'border border-slate-200 rounded-xl\1"',
    
    # Prevent double rounding if already present from previous regex or existing code
    r'\brounded-xl rounded-xl\b': 'rounded-xl',
    r'\brounded-2xl rounded-xl\b': 'rounded-2xl',
    r'\brounded-xl rounded-2xl\b': 'rounded-2xl',
    r'\brounded-lg rounded-xl\b': 'rounded-xl',
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
                    for pattern, replacement in replacements.items():
                        content = re.sub(pattern, replacement, content)
                        
                    if content != original_content:
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(content)
                        files_modified += 1
                        print(f"Refined {file_path}")
                except Exception as e:
                    pass

print(f"Total refined: {files_modified}")
