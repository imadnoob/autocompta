import fitz

def extract_and_search():
    pdf_path = r"C:\Users\User\Desktop\Projet PFE\sage\pedacpta.pdf"
    output_path = r"C:\Users\User\Desktop\Projet PFE\temp_pedacpta_balance.txt"
    try:
        doc = fitz.open(pdf_path)
        with open(output_path, "w", encoding="utf-8") as out:
            for page in doc:
                text = page.get_text()
                for line in text.split("\n"):
                    if "balance" in line.lower():
                        out.write(line.strip() + "\n")
        print(f"Extraction complete. Results saved to {output_path}")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    extract_and_search()
