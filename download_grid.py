import urllib.request
import math
from PIL import Image

lat = -23.33693
lon = -51.19272
zoom = 17

def deg2tile(lat, lon, zoom):
    lat_r = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y

cx, cy = deg2tile(lat, lon, zoom)

def download_tile(z, x, y):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read()
    except Exception as e:
        print(f"Failed {z}/{x}/{y}: {e}")
        return None

# Let's download a 7x7 grid
GRID = 3
TILE_SIZE = 256
n_tiles = 2 * GRID + 1
canvas = Image.new("RGB", (n_tiles * TILE_SIZE, n_tiles * TILE_SIZE))

import io
for dx in range(-GRID, GRID+1):
    for dy in range(-GRID, GRID+1):
        tx, ty = cx + dx, cy + dy
        data = download_tile(zoom, tx, ty)
        if data:
            img = Image.open(io.BytesIO(data))
            px = (dx + GRID) * TILE_SIZE
            py = (dy + GRID) * TILE_SIZE
            canvas.paste(img, (px, py))

canvas.save("public/search_grid.png")
print("Saved 7x7 search grid to public/search_grid.png")
