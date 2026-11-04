import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db.query(`
      SELECT i.symbol, i.company_name, i.market, i.sector,
        c.close_price, c.volume, c.candle_time, c.source AS candle_source,
        c.is_synthetic AS candle_is_synthetic,
        s.signal, s.score, s.reasons, s.indicators, s.generated_at,
        s.data_source AS signal_source, s.is_synthetic AS signal_is_synthetic
      FROM instruments i
      LEFT JOIN LATERAL (
        SELECT close_price, volume, candle_time, source, is_synthetic
        FROM market_candles
        WHERE instrument_id = i.id AND interval = '1d'
        ORDER BY candle_time DESC LIMIT 1
      ) c ON TRUE
      LEFT JOIN LATERAL (
        SELECT signal, score, reasons, indicators, generated_at, data_source, is_synthetic
        FROM signal_snapshots
        WHERE instrument_id = i.id
        ORDER BY generated_at DESC LIMIT 1
      ) s ON TRUE
      WHERE i.is_active = TRUE
      ORDER BY i.symbol ASC
      LIMIT 500
    `);
    return NextResponse.json({
      mode: "DATABASE",
      count: result.rowCount ?? 0,
      data: result.rows,
      warning: "اطلاعات بازار فقط در صورت اتصال منبع مجاز و معتبر قابل استفاده معاملاتی است."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Market overview query failed", error);
    return NextResponse.json({ error: "MARKET_DATA_UNAVAILABLE", message: "اتصال یا واکشی داده بازار در دسترس نیست." }, { status: 503 });
  }
}
