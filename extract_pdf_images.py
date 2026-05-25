import fitz
import os

pdf_path = r"C:\Users\Usuario\Downloads\RAP Hiraiwa.pdf"
output_dir = r"C:\Users\Usuario\Downloads\baccarim-systems (1)\public\extracted_images"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

doc = fitz.open(pdf_path)

img_count = 0
for page_num in range(len(doc)):
    page = doc.load_page(page_num)
    images = page.get_images(full=True)
    
    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        image_bytes = base_image["image"]
        image_ext = base_image["ext"]
        
        # Avoid tiny images (often logos or UI artifacts)
        if len(image_bytes) < 20000:
            continue
            
        img_name = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
        img_path = os.path.join(output_dir, img_name)
        
        with open(img_path, "wb") as f:
            f.write(image_bytes)
            
        img_count += 1
        print(f"Extracted {img_name} ({len(image_bytes)} bytes)")

print(f"Total extracted: {img_count} images.")
