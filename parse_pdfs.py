import PyPDF2
import sys
import os

pdf_paths = [
    r"c:\Users\User\Desktop\Projet PFE\comptes\Plan Comptable marocain.pdf",
    r"c:\Users\User\Desktop\Projet PFE\comptes\Plan-comptable-hotelier.pdf"
]

for path in pdf_paths:
    print(f"\n--- Analyzing: {os.path.basename(path)} ---")
    try:
        reader = PyPDF2.PdfReader(path)
        print(f"Total Pages: {len(reader.pages)}")
        # Print a sample from page 5 to get a feel of the structure (bypassing title pages)
        sample_page = min(5, len(reader.pages) - 1)
        text = reader.pages[sample_page].extract_text()
        print(f"Sample from page {sample_page+1}:")
        print("-" * 40)
        print(text[:1000])
        print("-" * 40)
    except Exception as e:
        print(f"Error reading {path}: {e}")
