export type Signal = "BUY" | "HOLD" | "SELL";
export function sma(values: number[], period: number): number[] {
  return values.map((_, i) => i + 1 < period ? NaN : values.slice(i + 1 - period, i + 1).reduce((a, b) => a + b, 0) / period);
}
export function rsi(values: number[], period = 14): number[] {
  return values.map((_, i) => {
    if (i < period) return NaN;
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const delta = values[j] - values[j - 1];
      if (delta > 0) gains += delta; else losses -= delta;
    }
    if (losses === 0) return 100;
    const rs = (gains / period) / (losses / period);
    return 100 - 100 / (1 + rs);
  });
}
export function evaluateSignal(closes: number[]): { signal: Signal; score: number; reasons: string[]; indicators: { sma20: number | null; sma50: number | null; rsi14: number | null } } {
  if (closes.length < 51 || closes.some(v => !Number.isFinite(v) || v <= 0)) {
    return { signal: "HOLD", score: 0, reasons: ["برای تحلیل معتبر حداقل ۵۱ قیمت پایانی معتبر لازم است."], indicators: { sma20: null, sma50: null, rsi14: null } };
  }
  const short = sma(closes, 20).at(-1)!;
  const long = sma(closes, 50).at(-1)!;
  const momentum = rsi(closes, 14).at(-1)!;
  let score = 50;
  const reasons: string[] = [];
  if (short > long) { score += 20; reasons.push("میانگین ۲۰روزه بالاتر از میانگین ۵۰روزه است."); }
  else { score -= 20; reasons.push("میانگین ۲۰روزه پایین‌تر از میانگین ۵۰روزه است."); }
  if (closes.at(-1)! > short) { score += 15; reasons.push("قیمت پایانی بالاتر از میانگین ۲۰روزه است."); }
  else { score -= 15; reasons.push("قیمت پایانی پایین‌تر از میانگین ۲۰روزه است."); }
  if (momentum >= 55 && momentum < 70) { score += 15; reasons.push("RSI در محدوده مومنتوم مثبت قرار دارد."); }
  else if (momentum < 45) { score -= 15; reasons.push("RSI ضعف مومنتوم را نشان می‌دهد."); }
  else if (momentum >= 70) { reasons.push("RSI بالاست؛ احتمال اشباع خرید باید بررسی شود."); }
  const bounded = Math.max(0, Math.min(100, score));
  const signal: Signal = bounded >= 70 ? "BUY" : bounded <= 30 ? "SELL" : "HOLD";
  return { signal, score: bounded, reasons, indicators: { sma20: Number(short.toFixed(2)), sma50: Number(long.toFixed(2)), rsi14: Number(momentum.toFixed(2)) } };
}
