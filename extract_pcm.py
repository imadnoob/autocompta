import PyPDF2
import re
import json
import os

pdf_paths = [
    r"c:\Users\User\Desktop\Projet PFE\comptes\Plan Comptable marocain.pdf",
    r"c:\Users\User\Desktop\Projet PFE\comptes\Plan-comptable-hotelier.pdf"
]

account_pattern = re.compile(r'^\s*([1-8]\d{3,4})\s+(.+)$')
accounts = {}

for path in pdf_paths:
    print(f"Extracting from {os.path.basename(path)}...")
    try:
        reader = PyPDF2.PdfReader(path)
        for page in reader.pages:
            text = page.extract_text()
            if not text: continue
            for line in text.split('\n'):
                line = line.strip()
                match = account_pattern.match(line)
                if match:
                    code = match.group(1).strip()
                    name = match.group(2).strip()
                    # Keep the hotelier version if it overrides a general one, or just add it
                    accounts[code] = name
    except Exception as e:
        print(f"Error {e}")

# Format into a clean list
out_data = []
for code in sorted(accounts.keys()):
    out_data.append({
        "code": code,
        "name": accounts[code]
    })

out_path = r"c:\Users\User\Desktop\Projet PFE\comptes\pcm_data.json"
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, indent=2, ensure_ascii=False)

print(f"Successfully extracted {len(out_data)} accounts to {out_path}")
