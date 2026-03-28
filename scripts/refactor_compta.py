import os
import re

file_path = r"c:\Users\User\Desktop\Projet PFE\components\modules\ComptabiliteModule.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replacements Dictionary
replacements = {
    r'\bcard-neo\b': 'bg-white border border-slate-200 rounded-2xl shadow-sm',
    r'\bbtn-neo\b': 'font-medium rounded-xl transition-all shadow-sm',
    r'\binput-neo\b': 'border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all shadow-sm',
    r'\bbg-neo-white\b': 'bg-white',
    r'\bbg-neo-cream\b': 'bg-slate-50',
    r'\bborder-neo-black\b': 'border-slate-200',
    r'\bborder-neo-white\b': 'border-slate-100',
    r'\bborder-2\b': 'border',
    r'\bborder-3\b': 'border',
    r'\bborder-4\b': 'border-2',
    r'\bshadow-neo\b': 'shadow-md',
    r'\bshadow-neo-sm\b': 'shadow-sm',
    r'\btext-neo-black\b': 'text-slate-800',
    r'\bbg-neo-black\b': 'bg-slate-900',
    
    r'\bbg-neo-purple\b': 'bg-emerald-600',
    r'\btext-neo-purple\b': 'text-emerald-600',
    
    r'\bbg-neo-yellow\b': 'bg-teal-50',
    r'\btext-neo-yellow\b': 'text-teal-600',
    
    r'\bbg-neo-lime\b': 'bg-sky-50',
    r'\btext-neo-lime\b': 'text-sky-600',
    
    r'\bbg-neo-red\b': 'bg-rose-50',
    r'\btext-neo-red\b': 'text-rose-600',
    
    r'\bbg-neo-blue\b': 'bg-indigo-50',
    r'\btext-neo-blue\b': 'text-indigo-600',
    
    r'\bfont-display\b': 'font-semibold',
}

for pattern, replacement in replacements.items():
    content = re.sub(pattern, replacement, content)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Updated {file_path}")
