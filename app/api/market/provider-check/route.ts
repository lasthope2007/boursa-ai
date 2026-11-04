import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function inspect(url: string) {
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json, text/plain, */*",
      "User-Agent": "Mozilla/5.0 (compatible; BoursaAI/1.0)",
      "Referer": "https://www.tsetmc.com/",
      "Origin": "https://www.tsetmc.com"
    },
    cache: "no-store",
    signal: AbortSignal.timeout(12000)
  });
  const text = await response.text();
  let parsed: unknown = null;
  try { parsed = JSON.parse(text); } catch {}
  const root = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
  const firstArray = root ? Object.entries(root).find(([, value]) => Array.isArray(value)) : null;
  const firstItem = firstArray?.[1] as unknown[] | undefined;
  const firstObject = firstItem?.[0] && typeof firstItem[0] === "object"
    ? firstItem[0] as Record<string, unknown>
    : null;
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    bytes: text.length,
    json: parsed !== null,
    rootKeys: root ? Object.keys(root) : [],
    arrayKey: firstArray?.[0] ?? null,
    arrayCount: firstItem?.length ?? null,
    firstItemKeys: firstObject ? Object.keys(firstObject) : [],
    sample: firstObject ? Object.fromEntries(Object.entries(firstObject).slice(0, 8)) : null,
    textPreview: parsed === null ? text.slice(0, 180) : null
  };
}

export async function GET() {
  try {
    const symbol = "فولاد";
    const searchUrl = `https://cdn.tsetmc.com/api/Instrument/GetInstrumentSearch/${encodeURIComponent(symbol)}`;
    const search = await inspect(searchUrl);
    const code = (search.sample as Record<string, unknown> | null)?.insCode;
    let history = null;
    if (typeof code === "string" || typeof code === "number") {
      history = await inspect(`https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceDailyList/${code}/0`);
    }
    return NextResponse.json({
      provider: "TSETMC",
      testedAt: new Date().toISOString(),
      symbol,
      search,
      instrumentCode: code ?? null,
      dailyHistory: history
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      provider: "TSETMC",
      ok: false,
      error: error instanceof Error ? error.message : "PROVIDER_CHECK_FAILED"
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
