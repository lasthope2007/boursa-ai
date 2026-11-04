import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function inspect(name: string, url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "Mozilla/5.0 (compatible; BoursaAI/1.0)",
        "Referer": "https://www.tsetmc.com/",
        "Origin": "https://www.tsetmc.com"
      },
      cache: "no-store",
      signal: AbortSignal.timeout(9000)
    });
    const body = await response.text();
    let parsed: unknown = null;
    try { parsed = JSON.parse(body); } catch {}
    const root = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : null;
    const firstArray = root ? Object.entries(root).find(([, value]) => Array.isArray(value)) : null;
    const items = firstArray?.[1] as unknown[] | undefined;
    const first = items?.[0] && typeof items[0] === "object" ? items[0] as Record<string, unknown> : null;
    return {
      name, status: response.status, contentType: response.headers.get("content-type"),
      bytes: body.length, json: parsed !== null, rootKeys: root ? Object.keys(root) : [],
      arrayKey: firstArray?.[0] ?? null, count: items?.length ?? null,
      firstItemKeys: first ? Object.keys(first) : [],
      sample: first ? Object.fromEntries(Object.entries(first).slice(0, 10)) : null,
      preview: parsed === null ? body.slice(0, 140) : null
    };
  } catch (error) {
    const e = error as Error & { cause?: { code?: string; message?: string } };
    return { name, error: e.message, causeCode: e.cause?.code ?? null, cause: e.cause?.message ?? null };
  }
}

export async function GET() {
  const tests = [
    ["cdn-time", "https://cdn.tsetmc.com/api/StaticData/GetTime"],
    ["cdn-search", `https://cdn.tsetmc.com/api/Instrument/GetInstrumentSearch/${encodeURIComponent("فولاد")}`],
    ["official-docs", "https://api.tsetmc.com/docs/"],
    ["old-marketwatch-https", "https://old.tsetmc.com/tsev2/data/MarketWatchInit.aspx?h=0&r=0"],
    ["old-marketwatch-http", "http://old.tsetmc.com/tsev2/data/MarketWatchInit.aspx?h=0&r=0"],
    ["members-chart", "https://members.tsetmc.com/tsev2/chart/data/Financial.aspx?i=46348559193224090&t=ph&a=0"]
  ] as const;
  const results = await Promise.all(tests.map(([name, url]) => inspect(name, url)));
  return NextResponse.json({
    provider: "TSETMC",
    testedAt: new Date().toISOString(),
    results
  }, { headers: { "Cache-Control": "no-store" } });
}
