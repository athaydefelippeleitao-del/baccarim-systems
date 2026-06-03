"""
Complete fix: start from original git image, remove old red circle, draw new one at Londrina.
All in one pass to avoid double cleanup issues.
"""
from PIL import Image, ImageDraw
import math

# Start from the original (from git) - has original wrong red circle, no modifications
img = Image.open("public/hidrografia_original.png").convert("RGB")
pixels = img.load()
w, h = img.size
print(f"Image size: {w}x{h}")

# ── STEP 1: Find ALL red pixels in the entire image (these are from the old circle) ──
red_pixels = set()
for y in range(h):
    for x in range(w):
        r, g, b = pixels[x, y]
        # Red circle pixels: R high, G and B low
        if r > 150 and g < 90 and b < 90:
            red_pixels.add((x, y))

print(f"Found {len(red_pixels)} red pixels total (all from old wrong circle)")

# ── STEP 2: Inpaint all red pixels using neighbor average ──
# Multiple passes to handle adjacent red pixels better
for _pass in range(3):
    changed = 0
    for px, py in list(red_pixels):
        neighbor_colors = []
        for dx in range(-4, 5):
            for dy in range(-4, 5):
                nx, ny = px + dx, py + dy
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in red_pixels:
                    nr, ng, nb = pixels[nx, ny]
                    if not (nr > 150 and ng < 90 and nb < 90):
                        neighbor_colors.append((nr, ng, nb))
        if neighbor_colors:
            avg_r = int(sum(c[0] for c in neighbor_colors) / len(neighbor_colors))
            avg_g = int(sum(c[1] for c in neighbor_colors) / len(neighbor_colors))
            avg_b = int(sum(c[2] for c in neighbor_colors) / len(neighbor_colors))
            pixels[px, py] = (avg_r, avg_g, avg_b)
            changed += 1
    print(f"  Pass {_pass+1}: updated {changed} pixels")

# ── STEP 3: Draw NEW circle around Londrina / Region 7 (Baixo Tibagi) ──
# From the grid analysis:
#   "Londrina" text: ~(54%, 37%) = pixel (553, 379)
#   Region 7 label (near Londrina): ~(49%, 41%) = pixel (502, 420)
# New circle: centered between "Londrina" and the "7" region number
# Center: x=53%, y=40% = (543, 410) with radius=82px
draw = ImageDraw.Draw(img)

new_cx = int(w * 0.530)   # 53.0% from left  
new_cy = int(h * 0.400)   # 40.0% from top  
new_r = 82

print(f"\nDrawing new circle:")
print(f"  Center: ({new_cx}, {new_cy}) = ({new_cx/w*100:.1f}%, {new_cy/h*100:.1f}%)")
print(f"  Radius: {new_r}px")

# Draw thick red circle (5px width)
draw.ellipse(
    [new_cx - new_r, new_cy - new_r, new_cx + new_r, new_cy + new_r],
    outline=(210, 0, 0),
    width=6
)

img.save("public/unidades_hidrograficas_parana.png")
print("\nSaved! ✓")
