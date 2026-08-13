
/**
 * Utilitários de Geoprocessamento para Baccarim Systems
 */

/**
 * Converte string formatada de coordenada para número, tratando formatos brasileiros
 * Ex: "7.322.678,45" -> 7322678.45
 * Ex: "506.360" -> 506360
 */
export function parseUTMCoord(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return NaN;
  
  let cleaned = val.toString().replace(/[^\d.,-]/g, '');
  if (!cleaned) return NaN;

  const commaCount = (cleaned.match(/,/g) || []).length;
  const dotCount = (cleaned.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Formato brasileiro: 7.322.678,45
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // Formato US: 7,322,678.45
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (commaCount > 0) {
    // Apenas vírgulas
    const parts = cleaned.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[0].length <= 3 && parts[1].length === 3)) {
      // milhar (ex: 7,322,678)
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // decimal (ex: 7322678,45)
      cleaned = cleaned.replace(',', '.');
    }
  } else if (dotCount > 0) {
    // Apenas pontos
    const parts = cleaned.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[0].length <= 3 && parts[1].length === 3)) {
      // milhar (ex: 7.322.678 ou 506.360)
      cleaned = cleaned.replace(/\./g, '');
    } else {
      // decimal (ex: 7322678.45)
      // mantém como está
    }
  }
  
  return parseFloat(cleaned);
}

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

/**
 * Converte Latitude/Longitude decimais para coordenadas UTM
 * Calibrado para o elipsoide GRS80 / SIRGAS 2000 (padrão brasileiro)
 * @param lat Latitude decimal (negativo para sul)
 * @param lng Longitude decimal (negativo para oeste)
 * @returns { coordE, coordN, zone }
 */
export function decimalToUTM(lat: number, lng: number): { coordE: string; coordN: string; zone: number } {
  const a = 6378137.0;
  const f = 1 / 298.257222101;
  const k0 = 0.9996;
  const fe = 500000.0;

  const zone = Math.floor((lng + 180) / 6) + 1;
  const lon0 = ((zone * 6) - 183) * (Math.PI / 180);
  const south = lat < 0;
  const fn = south ? 10000000.0 : 0.0;

  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);

  const b = a * (1 - f);
  const e2 = (Math.pow(a, 2) - Math.pow(b, 2)) / Math.pow(a, 2);

  const N = a / Math.sqrt(1 - e2 * Math.pow(Math.sin(latRad), 2));
  const T = Math.pow(Math.tan(latRad), 2);
  const C = (e2 / (1 - e2)) * Math.pow(Math.cos(latRad), 2);
  const A = Math.cos(latRad) * (lngRad - lon0);

  const M = a * (
    (1 - e2 / 4 - 3 * Math.pow(e2, 2) / 64 - 5 * Math.pow(e2, 3) / 256) * latRad
    - (3 * e2 / 8 + 3 * Math.pow(e2, 2) / 32 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(2 * latRad)
    + (15 * Math.pow(e2, 2) / 256 + 45 * Math.pow(e2, 3) / 1024) * Math.sin(4 * latRad)
    - (35 * Math.pow(e2, 3) / 3072) * Math.sin(6 * latRad)
  );

  const easting = fe + k0 * N * (
    A + (1 - T + C) * Math.pow(A, 3) / 6
    + (5 - 18 * T + Math.pow(T, 2) + 72 * C - 58 * (e2 / (1 - e2))) * Math.pow(A, 5) / 120
  );

  const northing = fn + k0 * (
    M + N * Math.tan(latRad) * (
      Math.pow(A, 2) / 2
      + (5 - T + 9 * C + 4 * Math.pow(C, 2)) * Math.pow(A, 4) / 24
      + (61 - 58 * T + Math.pow(T, 2) + 600 * C - 330 * (e2 / (1 - e2))) * Math.pow(A, 6) / 720
    )
  );

  return {
    coordE: Math.round(easting).toString(),
    coordN: Math.round(northing).toString(),
    zone
  };
}

/**
 * Faz o parse de um arquivo KML e extrai as coordenadas do primeiro Polygon encontrado.
 * Retorna um array de [lat, lng] compatível com Leaflet.
 * @param kmlString Conteúdo textual do arquivo KML
 */
export function parseKML(kmlString: string): [number, number][] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(kmlString, 'application/xml');

    // Tenta obter as coordenadas do primeiro Polygon
    const coordsEl = doc.querySelector('Polygon coordinates, Polygon outerBoundaryIs coordinates, coordinates');
    if (!coordsEl || !coordsEl.textContent) return [];

    const raw = coordsEl.textContent.trim();
    const points = raw.split(/\s+/).filter(Boolean);

    const result: [number, number][] = [];
    for (const point of points) {
      const parts = point.split(',');
      if (parts.length >= 2) {
        const lng = parseFloat(parts[0]);
        const lat = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          result.push([lat, lng]);
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}
