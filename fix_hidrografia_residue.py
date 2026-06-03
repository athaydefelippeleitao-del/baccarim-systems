"""
Remove remaining pink/red residue from old circle, then push clean map.
"""
from PIL import Image, ImageDraw

img = Image.open("public/unidades_hidrograficas_parana.png").convert("RGB")
pixels = img.load()
w, h = img.size

# Find any remaining reddish pixels in the old circle area
# Old circle was around (481, 522) ± 110 pixels
old_cx, old_cy, search_r = 481, 522, 115

residue_pixels = set()
for y in range(max(0, old_cy - search_r), min(h, old_cy + search_r)):
    for x in range(max(0, old_cx - search_r), min(w, old_cx + search_r)):
        r, g, b = pixels[x, y]
        # Detect any pinkish or red residue (r > g + 60 and r > b + 60)
        if r > g + 60 and r > b + 60 and r > 140:
            residue_pixels.add((x, y))

print(f"Found {len(residue_pixels)} residue pixels to clean")

# Inpaint residue with expanded neighbor search
for px, py in residue_pixels:
    neighbor_colors = []
    for dx in range(-5, 6):
        for dy in range(-5, 6):
            nx, ny = px + dx, py + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in residue_pixels:
                nr, ng, nb = pixels[nx, ny]
                # Skip neighbors that are also reddish
                if not (nr > ng + 60 and nr > nb + 60 and nr > 140):
                    neighbor_colors.append((nr, ng, nb))
    if neighbor_colors:
        avg_r = int(sum(c[0] for c in neighbor_colors) / len(neighbor_colors))
        avg_g = int(sum(c[1] for c in neighbor_colors) / len(neighbor_colors))
        avg_b = int(sum(c[2] for c in neighbor_colors) / len(neighbor_colors))
        pixels[px, py] = (avg_r, avg_g, avg_b)

img.save("public/unidades_hidrograficas_parana.png")
print("Cleaned and saved!")
