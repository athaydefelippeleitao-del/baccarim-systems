import os
import shutil

extracted_dir = r"public\extracted_images"
target_dir = r"public"

# Mapping from original extracted name to a simpler name for public folder
mapping = {
    "page_1_img_2.png": "img_p1.png",
    "page_2_img_2.png": "img_p2_1.png",
    "g_d0_img_p2_1.png": "img_p2_2.png",
    "page_8_img_2.png": "img_p8_1.png",
    "img_p8_1.png": "img_p8_2.png",
    "img_p11_1.png": "img_p11.png",
    "page_13_img_2.png": "img_p13_1.png",
    "img_p13_1.png": "img_p13_2.png",
    "img_p15_1.png": "img_p15_1.png",
    "img_p15_2.png": "img_p15_2.png",
    "img_p15_3.png": "img_p15_3.png",
    "img_p16_1.png": "img_p16_1.png",
    "page_16_img_3.jpeg": "img_p16_3.jpg",
    "page_16_img_4.jpeg": "img_p16_4.jpg",
    "page_17_img_3.jpeg": "img_p17_2.jpg",
    "img_p18_1.png": "img_p18_1.png",
    "img_p20_1.png": "img_p20.png",
    "img_p42_1.png": "img_p42_1.png",
    "img_p42_2.png": "img_p42_2.png",
}

for src, dst in mapping.items():
    src_path = os.path.join(extracted_dir, src)
    dst_path = os.path.join(target_dir, dst)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"Copied {src} to {dst}")
    else:
        print(f"Warning: {src} not found!")
