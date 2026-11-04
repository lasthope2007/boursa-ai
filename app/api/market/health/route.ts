import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM instruments WHERE is_active = TRUE) AS instruments,
        (SELECT COUNT(*)::int FROM market_candles WHERE is_synthetic = FALSE) AS candles,
        (SELECT COUNT(*)::int FROM signal_snapshots WHERE is_synthetic = FALSE) AS signals,
        (SELECT MAX(candle_time) FROM market_candles WHERE is_synthetic = FALSE) AS latest_market_data
    `);
    return NextResponse.json({ ok: true, database: "connected", ...result.rows[0] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health check failed", error);
    return NextResponse.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
