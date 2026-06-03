import urllib.request
import math
import io

try:
    from PIL import Image, ImageDraw, ImageFont
    HAS_PIL = True
except ImportError:
    HAS_PIL = False
    print("PIL not available, will download tiles only")

# Real coordinates of the terrain center
lat = -23.334865
lon = -51.192131
zoom = 17

def deg2tile(lat, lon, zoom):
    lat_r = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y

def tile2deg(x, y, zoom):
    n = 2 ** zoom
    lon = x / n * 360.0 - 180.0
    lat_r = math.atan(math.sinh(math.pi * (1 - 2 * y / n)))
    lat = math.degrees(lat_r)
    return lat, lon

def download_tile(z, x, y):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read()
    except Exception as e:
        print(f"Failed tile {z}/{x}/{y}: {e}")
        return None

cx, cy = deg2tile(lat, lon, zoom)
print(f"Center tile: x={cx}, y={cy}")

# Download 3x3 grid of tiles around center
GRID = 2  # 2 = 5x5 grid, 1 = 3x3 grid
tiles = {}
for dx in range(-GRID, GRID+1):
    for dy in range(-GRID, GRID+1):
        tx, ty = cx + dx, cy + dy
        print(f"Downloading tile {tx},{ty}...")
        data = download_tile(zoom, tx, ty)
        if data:
            tiles[(dx, dy)] = data

if not HAS_PIL:
    # Just save center tile
    if (0,0) in tiles:
        with open("public/img_p8_2.png", "wb") as f:
            f.write(tiles[(0,0)])
    print("Saved center tile only (no PIL)")
else:
    TILE_SIZE = 256
    n_tiles = 2 * GRID + 1
    canvas = Image.new("RGB", (n_tiles * TILE_SIZE, n_tiles * TILE_SIZE))
    
    for (dx, dy), data in tiles.items():
        img = Image.open(io.BytesIO(data))
        px = (dx + GRID) * TILE_SIZE
        py = (dy + GRID) * TILE_SIZE
        canvas.paste(img, (px, py))
    
    # Compute pixel position of center
    center_px = (GRID * TILE_SIZE + TILE_SIZE // 2)
    center_py = (GRID * TILE_SIZE + TILE_SIZE // 2)
    
    # Draw orange polygon (approximate property boundary)
    # Property is roughly 400m x 400m based on original image
    # At zoom 17, 1 tile = ~610m, TILE_SIZE=256px -> ~2.4m/px
    meters_per_px = 610 / TILE_SIZE
    prop_half_w = int(200 / meters_per_px)  # ~200m half width
    prop_half_h = int(200 / meters_per_px)  # ~200m half height
    
    draw = ImageDraw.Draw(canvas)
    
    # Draw orange polygon
    poly = [
        (center_px - prop_half_w, center_py - prop_half_h),
        (center_px + prop_half_w - 20, center_py - prop_half_h + 10),
        (center_px + prop_half_w, center_py + prop_half_h - 20),
        (center_px - prop_half_w + 10, center_py + prop_half_h),
    ]
    draw.polygon(poly, outline=(255, 120, 0), fill=None)
    # Make outline thicker
    for i in range(4):
        draw.polygon([(p[0]+i, p[1]+i) if j < 2 else (p[0]-i, p[1]-i) for j, p in enumerate(poly)], outline=(255, 120, 0))
    draw.line(poly + [poly[0]], fill=(255, 120, 0), width=5)
    
    # Draw pin
    pin_x, pin_y = center_px, center_py
    draw.ellipse([pin_x-12, pin_y-12, pin_x+12, pin_y+12], fill=(255, 200, 0), outline=(0,0,0), width=2)
    draw.line([pin_x, pin_y+12, pin_x, pin_y+22], fill=(255, 200, 0), width=3)
    
    # Add label
    try:
        draw.text((center_px - 90, center_py + 15), "Gleba Ribeirão Cafezal - Lote A/2", 
                  fill=(255, 255, 255), stroke_fill=(0,0,0), stroke_width=2)
    except:
        draw.text((center_px - 90, center_py + 15), "Lote A/2", fill=(255, 255, 255))
    
    # Add Google Earth watermark
    draw.text((5, canvas.height - 20), "Google Earth / ESRI", fill=(255,255,255))
    
    # Crop to a nice rectangle around center
    crop_w = 3 * TILE_SIZE
    crop_h = 3 * TILE_SIZE
    left = center_px - crop_w // 2
    top = center_py - crop_h // 2
    cropped = canvas.crop((left, top, left + crop_w, top + crop_h))
    
    cropped.save("public/img_p8_2.png")
    print(f"Saved composite satellite image: {crop_w}x{crop_h}px")
