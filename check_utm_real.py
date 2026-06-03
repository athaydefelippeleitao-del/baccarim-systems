import math

# Try different Northing values to see where they land relative to Rua Eunilson Bezerra da Silva (-23.33693, -51.19272)
target_lat = -23.33693
target_lon = -51.19272

# Convert target to UTM
def latlon_to_utm(lat, lon):
    a = 6378137.0
    f = 1 / 298.257223563
    e2 = 2*f - f**2
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    zone = int((lon + 180) / 6) + 1
    lon0 = math.radians((zone - 1) * 6 - 180 + 3)
    k0 = 0.9996
    E0 = 500000.0
    N0 = 10000000.0
    n = f / (2 - f)
    A = a / (1 + n) * (1 + n**2/4 + n**4/64)
    alpha = [0, 1/2*n - 2/3*n**2 + 5/16*n**3, 13/48*n**2 - 3/5*n**3, 61/240*n**3]
    t = math.sinh(math.atanh(math.sin(lat_rad)) - 2*math.sqrt(e2)/(1+math.sqrt(e2)) * math.atanh(math.sqrt(e2)*math.sin(lat_rad)))
    xi_prime = math.atan(t / math.cos(lon_rad - lon0))
    eta_prime = math.atanh(math.sin(lon_rad - lon0) / math.sqrt(1 + t**2))
    xi = xi_prime
    eta = eta_prime
    E = E0 + k0 * A * (eta + sum(alpha[j]*math.cos(2*j*xi)*math.sinh(2*j*eta) for j in range(1, 4)))
    N = N0 + k0 * A * (xi + sum(alpha[j]*math.sin(2*j*xi)*math.cosh(2*j*eta) for j in range(1, 4)))
    return E, N

E_target, N_target = latlon_to_utm(target_lat, target_lon)
print(f"Target UTM: E={E_target:.2f}, N={N_target:.2f}")

# The table in PDF has:
# E = 480359
# N = 7419410
# Note that E_target is around 479... Wait!
# Let's check the output of convert_latlon:
# Recanto do Salto (-23.3670, -51.2220) had E: 477290.79, N: 7429041.63
# But for Rua Eunilson Bezerra da Silva (-23.33693, -51.19272):
E_real, N_real = latlon_to_utm(-23.33693, -51.19272)
print(f"Rua Eunilson: E={E_real:.2f}, N={N_real:.2f}")
