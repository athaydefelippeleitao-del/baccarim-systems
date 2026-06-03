import math

E = 480359
N = 7419410
# Zone 22S - southern hemisphere
k0 = 0.9996
a = 6378137.0
e2 = 0.00669438
n0 = 10000000.0  # southern hemisphere
lon0 = math.radians(-51)  # zone 22 central meridian
E0 = 500000.0

x = E - E0
y = N - n0

M = y / k0
mu = M / (a * (1 - e2/4 - 3*e2**2/64 - 5*e2**3/256))
e1 = (1 - math.sqrt(1-e2)) / (1 + math.sqrt(1-e2))

lat = (mu 
    + (3*e1/2 - 27*e1**3/32) * math.sin(2*mu)
    + (21*e1**2/16 - 55*e1**4/32) * math.sin(4*mu)
    + (151*e1**3/96) * math.sin(6*mu))

Nu = a / math.sqrt(1 - e2*math.sin(lat)**2)
T = math.tan(lat)**2
C = e2 * math.cos(lat)**2 / (1 - e2)
D = x / (Nu * k0)

lat2 = lat - (Nu * math.tan(lat) / (a**2 / (1 - e2*math.sin(lat)**2))) * (
    D**2/2 - (5 + 3*T + 10*C - 4*C**2 - 9*e2) * D**4/24)

lon = lon0 + (D - (1+2*T+C)*D**3/6) / math.cos(lat)

lat_deg = math.degrees(lat2)
lon_deg = math.degrees(lon)

print(f"Latitude: {lat_deg:.6f}")
print(f"Longitude: {lon_deg:.6f}")
print(f"Google Maps: {lat_deg:.6f},{lon_deg:.6f}")
