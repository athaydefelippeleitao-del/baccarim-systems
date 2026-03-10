
/**
 * Utilitários de Geoprocessamento para Baccarim Systems
 */

/**
 * Converte coordenadas UTM para Decimal (Latitude/Longitude)
 * Calibrado para o elipsoide GRS80 / SIRGAS 2000 (padrão brasileiro)
 * @param e UTM Easting (Leste)
 * @param n UTM Northing (Norte)
 * @param zone UTM Zone (Padrão 22 para Sul do Brasil)
 * @param south Hemisfério Sul (Padrão true)
 */
export function utmToDecimal(e: number, n: number, zone: number = 22, south: boolean = true): { lat: number, lng: number } {
  const a = 6378137.0; // WGS84 / GRS80 semi-major axis
  const f = 1 / 298.257222101; // GRS80 flattening
  const k0 = 0.9996; // UTM scale factor
  const fe = 500000.0; // False Easting
  const fn = south ? 10000000.0 : 0.0; // False Northing
  
  // Meridiano Central da Zona
  const lon0 = ((zone * 6) - 183) * (Math.PI / 180);
  
  const b = a * (1 - f);
  const e2 = (Math.pow(a, 2) - Math.pow(b, 2)) / Math.pow(a, 2);
  const e1sq = e2 / (1 - e2);
  
  const x = e - fe;
  const y = n - fn;
  
  const M = y / k0;
  const mu = M / (a * (1 - e2 / 4 - 3 * Math.pow(e2, 2) / 64 - 5 * Math.pow(e2, 3) / 256));
  const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));
  
  const phi1 = mu + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu) + 
               (21 * Math.pow(e1, 2) / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu) +
               (151 * Math.pow(e1, 3) / 96) * Math.sin(6 * mu);
               
  const C1 = e1sq * Math.pow(Math.cos(phi1), 2);
  const T1 = Math.pow(Math.tan(phi1), 2);
  const N1 = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(phi1), 2));
  const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.pow(Math.sin(phi1), 2), 1.5);
  const D = x / (N1 * k0);
  
  const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (Math.pow(D, 2) / 2 - (5 + 3 * T1 + 10 * C1 - 4 * Math.pow(C1, 2) - 9 * e1sq) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 298 * C1 + 45 * Math.pow(T1, 2) - 252 * e1sq - 3 * Math.pow(C1, 2)) * Math.pow(D, 6) / 720);
  const lng = lon0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * Math.pow(C1, 2) + 8 * e1sq + 24 * Math.pow(T1, 2)) * Math.pow(D, 5) / 120) / Math.cos(phi1);
  
  return { 
    lat: lat * (180 / Math.PI), 
    lng: lng * (180 / Math.PI) 
  };
}
