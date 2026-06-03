import urllib.request

# Real coordinates of the terrain
lat = -23.334865
lon = -51.192131
zoom = 17

# Use a tile-based approach - download OSM satellite tiles (Esri WorldImagery)
# Tile calculation
import math

def deg2tile(lat, lon, zoom):
    lat_r = math.radians(lat)
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(lat_r)) / math.pi) / 2.0 * n)
    return x, y

x, y = deg2tile(lat, lon, zoom)
print(f"Tile: z={zoom}, x={x}, y={y}")

# Esri World Imagery satellite tiles (free, no key needed)
url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{y}/{x}"
print(f"URL: {url}")

output_path = "public/tile_center.png"
urllib.request.urlretrieve(url, output_path)
print(f"Downloaded tile to {output_path}")
