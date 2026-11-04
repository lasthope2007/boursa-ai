import { NextResponse } from "next/server";
import { evaluateSignal } from "@/lib/indicators";

// Demonstration endpoint only. Replace this fixture with a licensed market-data adapter
// before presenting any output as current market information.
const demoCloses = Array.from({ length: 80 }, (_, i) => 1000 + i * 2.4 + Math.sin(i / 3) * 24 + Math.cos(i / 7) * 11);
export async function GET() {
  const result = evaluateSignal(demoCloses);
  return NextResponse.json({
    mode: "DEMO",
    asOf: null,
    source: "synthetic-fixture",
    warning: "این خروجی با داده ساختگی تولید شده و سیگنال بازار زنده نیست.",
    result
  }, { headers: { "Cache-Control": "no-store" } });
}
