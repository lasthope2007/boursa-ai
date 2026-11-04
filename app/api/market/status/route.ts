import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*)::int FROM instruments WHERE is_active = TRUE) AS active_instruments,
        (SELECT COUNT(*)::int FROM market_candles WHERE interval = '1d' AND is_synthetic = FALSE) AS real_daily_candles,
        (SELECT COUNT(*)::int FROM signal_snapshots WHERE is_synthetic = FALSE) AS real_signal_snapshots,
        (SELECT MAX(candle_time) FROM market_candles WHERE interval = '1d' AND is_synthetic = FALSE) AS latest_candle_at,
        (SELECT MAX(generated_at) FROM signal_snapshots WHERE is_synthetic = FALSE) AS latest_signal_at,
        (SELECT COALESCE(array_agg(DISTINCT source ORDER BY source), ARRAY[]::text[])
          FROM market_candles WHERE interval = '1d' AND is_synthetic = FALSE) AS data_sources
    `);

    const row = result.rows[0];
    const latestCandleAt = row.latest_candle_at ? new Date(row.latest_candle_at).toISOString() : null;
    const latestSignalAt = row.latest_signal_at ? new Date(row.latest_signal_at).toISOString() : null;
    const ageHours = latestCandleAt
      ? Math.max(0, (Date.now() - Date.parse(latestCandleAt)) / 3_600_000)
      : null;

    return NextResponse.json({
      ok: true,
      mode: Number(row.real_daily_candles) > 0 ? "DATABASE" : "DEMO",
      data: {
        activeInstruments: Number(row.active_instruments),
        realDailyCandles: Number(row.real_daily_candles),
        realSignalSnapshots: Number(row.real_signal_snapshots),
        latestCandleAt,
        latestSignalAt,
        candleAgeHours: ageHours === null ? null : Number(ageHours.toFixed(2)),
        dataSources: row.data_sources,
        dataFreshness: ageHours === null ? "NO_DATA" : ageHours <= 36 ? "RECENT" : "STALE"
      },
      message: "این endpoint فقط وضعیت داده و تازگی آن را گزارش می‌کند؛ سیگنال‌ها توصیه سرمایه‌گذاری نیستند."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Market status query failed", error);
    return NextResponse.json(
      { ok: false, error: "MARKET_STATUS_UNAVAILABLE", message: "وضعیت داده بازار در دسترس نیست." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
