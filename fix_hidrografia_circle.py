"""
Proper fix for the hydrographic units map circle.
Uses inpainting approach: detect red circle pixels and replace with neighbor average.
Then draws new circle at Londrina position.
"""
from PIL import Image, ImageDraw
import io, math

# Work from the original (from git)
img = Image.open("public/hidrografia_original.png").convert("RGB")
pixels = img.load()
w, h = img.size
print(f"Image size: {w}x{h}")

# ── 1. Detect and remove old red circle pixels ────────────────────────────────
# Old circle is in the area around center (47%, 51%) = (481, 522)
# We search for "red" pixels: R > 180, G < 100, B < 100 in an area
old_cx, old_cy, old_r = 481, 522, 100  # generous search radius

red_pixels = set()
for y in range(max(0, old_cy - old_r - 10), min(h, old_cy + old_r + 10)):
    for x in range(max(0, old_cx - old_r - 10), min(w, old_cx + old_r + 10)):
        r, g, b = pixels[x, y]
        if r > 160 and g < 80 and b < 80:
            red_pixels.add((x, y))

print(f"Found {len(red_pixels)} red pixels to remove")

# Inpaint: replace each red pixel with average of non-red neighbors
for px, py in red_pixels:
    neighbor_colors = []
    for dx in range(-3, 4):
        for dy in range(-3, 4):
            nx, ny = px + dx, py + dy
            if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in red_pixels:
                nr, ng, nb = pixels[nx, ny]
                # Make sure neighbor is not also red
                if not (nr > 160 and ng < 80 and nb < 80):
                    neighbor_colors.append((nr, ng, nb))
    if neighbor_colors:
        avg_r = int(sum(c[0] for c in neighbor_colors) / len(neighbor_colors))
        avg_g = int(sum(c[1] for c in neighbor_colors) / len(neighbor_colors))
        avg_b = int(sum(c[2] for c in neighbor_colors) / len(neighbor_colors))
        pixels[px, py] = (avg_r, avg_g, avg_b)

print("Old circle removed.")

# ── 2. Draw NEW circle around Londrina (region 7 / Baixo Tibagi) ──────────────
# From the debug grid: "Londrina" text is at ~(54%, 37%) = (553, 379)
# Region 7 near Londrina is the area just around/below Londrina
# New circle center: between "7" label and "Londrina" = ~(52%, 40%) = (532, 410)
# This should cover the Tibagi/Baixo Tibagi unit where Londrina sits
draw = ImageDraw.Draw(img)

new_cx = int(w * 0.525)   # 53.7% from left
new_cy = int(h * 0.395)   # 39.5% from top  
new_r = 78

print(f"Drawing new circle at ({new_cx}, {new_cy}) r={new_r} = ({new_cx/w*100:.1f}%, {new_cy/h*100:.1f}%)")

# Draw thick red circle
draw.ellipse(
    [new_cx - new_r, new_cy - new_r, new_cx + new_r, new_cy + new_r],
    outline=(220, 0, 0),
    width=5
)

img.save("public/unidades_hidrograficas_parana.png")
print("Saved fixed map!")
