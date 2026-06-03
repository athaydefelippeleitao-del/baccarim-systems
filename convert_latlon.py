import math

def latlon_to_utm(lat, lon):
    # WGS84
    a = 6378137.0
    f = 1 / 298.257223563
    e2 = 2*f - f**2
    
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    
    zone = int((lon + 180) / 6) + 1
    lon0 = math.radians((zone - 1) * 6 - 180 + 3)
    
    k0 = 0.9996
    E0 = 500000.0
    N0 = 10000000.0 # southern hemisphere
    
    n = f / (2 - f)
    A = a / (1 + n) * (1 + n**2/4 + n**4/64)
    alpha = [
        0,
        1/2*n - 2/3*n**2 + 5/16*n**3,
        13/48*n**2 - 3/5*n**3,
        61/240*n**3
    ]
    
    t = math.sinh(math.atanh(math.sin(lat_rad)) - 2*math.sqrt(e2)/(1+math.sqrt(e2)) * math.atanh(math.sqrt(e2)*math.sin(lat_rad)))
    xi_prime = math.atan(t / math.cos(lon_rad - lon0))
    eta_prime = math.atanh(math.sin(lon_rad - lon0) / math.sqrt(1 + t**2))
    
    xi = xi_prime
    eta = eta_prime
    
    E = E0 + k0 * A * (eta + sum(alpha[j]*math.cos(2*j*xi)*math.sinh(2*j*eta) for j in range(1, 4)))
    N = N0 + k0 * A * (xi + sum(alpha[j]*math.sin(2*j*xi)*math.cosh(2*j*eta) for j in range(1, 4)))
    
    return E, N, zone

# Let's convert the approximate address coordinates
# Let's test the coordinates around Recanto do Salto (Rua Alcides Turini)
print("Recanto do Salto (-23.3670, -51.2220):")
E, N, z = latlon_to_utm(-23.3670, -51.2220)
print(f"E: {E:.2f}, N: {N:.2f}, Zone: {z}S")
