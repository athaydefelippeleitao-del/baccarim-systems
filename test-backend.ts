import { analyzeLicensePortfolio } from './services/geminiService.js';

async function test() {
    try {
        const res = await analyzeLicensePortfolio([], []);
        console.log("Result:", res);
    } catch (e: any) {
        console.error("Caught error:", e.message || e);
    }
}

test();
