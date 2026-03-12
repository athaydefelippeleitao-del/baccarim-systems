
import { utmToDecimal } from './utils/geoUtils';

function testRegex(input: string) {
    const cleaned = input.replace(/[^\d.]/g, '');
    console.log(`Input: "${input}" -> Cleaned: "${cleaned}"`);
    return cleaned;
}

const testCases = [
    "E: 512345.67m",
    "N: 7412345.89 m",
    "512345.67",
    "Coord E 512.345",
    "123456",
];

console.log("--- Testing Regex ---");
testCases.forEach(testRegex);

console.log("\n--- Testing UTM to Decimal ---");
const e = 512345.67;
const n = 7412345.89;
const converted = utmToDecimal(e, n);
console.log(`UTM E:${e}, N:${n} -> Lat:${converted.lat}, Lng:${converted.lng}`);

// Expected roughly around Ibiporã/Londrina area if zone 22S
