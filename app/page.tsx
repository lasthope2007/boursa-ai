"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Clock3, Database, Search, ShieldCheck, Sparkles, Star, TrendingDown, TrendingUp, Minus } from "lucide-react";

type ApiSignal = {
  symbol: string;
  company_name: string;
  sector: string | null;
  signal: "BULLISH" | "NEUTRAL" | "BEARISH";
  score: number;
  reasons: string[];
  data_source: string;
  generated_at: string;
  close_price: string | null;
  volume: string | null;
  candle_time: string | null;
  change_pct: string | null;
};
type MarketStatus = {
  ok: boolean;
  mode: string;
  data?: {
    activeInstruments: number;
    realDailyCandles: number;
    realSignalSnapshots: number;
    latestCandleAt: string | null;
    latestSignalAt: string | null;
    candleAgeHours: number | null;
    dataSources: string[];
    dataFreshness: "RECENT" | "STALE" | "NO_DATA";
  };
};
const fmt = (n: number) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 }).format(n);
const dateFmt = (value: string | null) => value ? new Date(value).toLocaleString("fa-IR", { dateStyle: "medium", timeStyle: "short" }) : "ثبت نشده";
const signalLabel = (s: ApiSignal["signal"]) => s === "BULLISH" ? "تمایل مثبت" : s === "BEARISH" ? "تمایل منفی" : "خنثی";
const signalClass = (s: ApiSignal["signal"]) => s === "BULLISH" ? "buy" : s === "BEARISH" ? "sell" : "hold";
const SignalIcon = ({ signal }: { signal: ApiSignal["signal"] }) => signal === "BULLISH" ? <TrendingUp size={15}/> : signal === "BEARISH" ? <TrendingDown size={15}/> : <Minus size={15}/>;

export default function Home() {
  const [signals, setSignals] = useState<ApiSignal[]>([]);
  const [status, setStatus] = useState<MarketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("همه");
  const [watch, setWatch] = useState<string[]>([]);
  const [tab, setTab] = useState("signals");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [signalResponse, statusResponse] = await Promise.all([
          fetch("/api/signals", { cache: "no-store" }),
          fetch("/api/market/status", { cache: "no-store" })
        ]);
        if (!signalResponse.ok || !statusResponse.ok) throw new Error("API unavailable");
        const signalPayload = await signalResponse.json();
        const statusPayload = await statusResponse.json();
        if (!alive) return;
        const rows = Array.isArray(signalPayload.signals) ? signalPayload.signals : [];
        setSignals(rows);
        setStatus(statusPayload);
        setSelected(current => current && rows.some((r: ApiSignal) => r.symbol === current) ? current : (rows[0]?.symbol ?? ""));
        setError(false);
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const interval = window.setInterval(load, 60_000);
    return () => { alive = false; window.clearInterval(interval); };
  }, []);

  const filtered = useMemo(() => signals.filter(s => {
    const matchesQuery = !query.trim() || s.symbol.includes(query.trim()) || s.company_name.includes(query.trim());
    const matchesFilter = filter === "همه" || signalLabel(s.signal) === filter;
    const matchesWatch = tab !== "watch" || watch.includes(s.symbol);
    return matchesQuery && matchesFilter && matchesWatch;
  }), [signals, query, filter, tab, watch]);
  const active = signals.find(s => s.symbol === selected) ?? signals[0];
  const freshness = status?.data?.dataFreshness ?? "NO_DATA";
  const freshnessLabel = freshness === "RECENT" ? "داده تازه ثبت‌شده" : freshness === "STALE" ? "داده قدیمی" : "بدون داده بازار";
  const toggleWatch = (symbol: string) => setWatch(old => old.includes(symbol) ? old.filter(x => x !== symbol) : [...old, symbol]);

  return <main className="shell">
    <header className="topbar">
      <div className="brand"><div className="mark">ب</div><div><strong>BOURSA <span className="green">AI</span></strong><div className="sub">سامانه تحلیل و پایش بازار سرمایه</div></div></div>
      <div className="toolbar">
        <span className="pill"><i className="dot" style={{background:freshness === "RECENT" ? "#35d3a5" : "#e7b45d"}}/>{loading ? "در حال اتصال..." : freshnessLabel}</span>
        <span className="pill"><Database size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:6}}/>{status?.data?.realDailyCandles ? fmt(status.data.realDailyCandles) + " کندل واقعی" : "داده ثبت‌شده: صفر"}</span>
      </div>
    </header>

    <section className="hero">
      <div><div className="eyebrow">MARKET INTELLIGENCE / ANALYTICS</div><h1>مرکز تحلیل بازار</h1><p>پایش نمادها، تحلیل تکنیکال قابل توضیح و ارزیابی وضعیت داده‌ها</p></div>
      <span className="pill"><Clock3 size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:6}}/>آخرین کندل: {dateFmt(status?.data?.latestCandleAt ?? null)}</span>
    </section>

    <div className="notice">
      <ShieldCheck size={16} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/>
      <b>اطلاعیه ریسک:</b> خروجی‌ها صرفاً تحلیل الگوریتمی و آموزشی‌اند؛ نه توصیه شخصی یا تضمین نتیجه. تصمیم نهایی و بررسی ریسک بر عهده استفاده‌کننده است. امتیاز ۰ تا ۱۰۰ احتمال موفقیت نیست.
    </div>

    {error && <div className="notice"><AlertTriangle size={16} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/>دریافت اطلاعات از سرور ناموفق بود. وضعیت اتصال را بررسی کنید.</div>}

    <section className="stats">
      <div className="card"><div className="card-label">نمادهای فعال در سامانه</div><div className="card-value">{fmt(status?.data?.activeInstruments ?? 0)}</div><div className="tiny">فهرست نمادهای تعریف‌شده</div></div>
      <div className="card"><div className="card-label">کندل‌های واقعی ذخیره‌شده</div><div className="card-value">{fmt(status?.data?.realDailyCandles ?? 0)}</div><div className="tiny">بدون داده ساختگی</div></div>
      <div className="card"><div className="card-label">تحلیل‌های ذخیره‌شده</div><div className="card-value">{fmt(status?.data?.realSignalSnapshots ?? 0)}</div><div className="tiny">خروجی موتور شاخص‌ها</div></div>
      <div className="card"><div className="card-label">وضعیت تازگی داده</div><div className="card-value" style={{fontSize:18}}>{freshnessLabel}</div><div className="tiny">بر اساس زمان آخرین کندل</div></div>
    </section>

    <section className="layout">
      <div className="panel">
        <div className="panel-head"><div><div className="panel-title">اسکنر تحلیلی نمادها</div><div className="panel-sub">برچسب‌ها جهت‌گیری شاخص‌ها را توصیف می‌کنند و فرمان معامله نیستند.</div></div><span className="badge neutral">{fmt(signals.length)} نماد دارای تحلیل</span></div>
        <div className="tabs">
          <button className={tab === "signals" ? "active" : ""} onClick={() => setTab("signals")}>همه تحلیل‌ها</button>
          <button className={tab === "watch" ? "active" : ""} onClick={() => setTab("watch")}>دیده‌بان من ({fmt(watch.length)})</button>
          <button className={tab === "method" ? "active" : ""} onClick={() => setTab("method")}>روش‌شناسی</button>
        </div>
        {tab === "method" ? <div className="muted" style={{lineHeight:2.25,padding:"14px 5px"}}>
          <b>استراتژی فعلی: SMA 20/50 + RSI 14</b><br/>
          موتور تحلیل، میانگین متحرک ۲۰ و ۵۰ روزه و شاخص قدرت نسبی ۱۴ دوره‌ای را از قیمت‌های پایانی ذخیره‌شده محاسبه می‌کند. جهت‌گیری مثبت/منفی از هم‌راستایی این شاخص‌ها به دست می‌آید.<br/>
          <b>محدودیت‌ها:</b> این نسخه هنوز بک‌تست خارج از نمونه، تعدیل کامل افزایش سرمایه و سود نقدی، کنترل توقف نماد، کارمزد و لغزش قیمت را به‌طور کامل اعتبارسنجی نکرده است. امتیاز، امتیاز قواعد است و احتمال سود نیست.
        </div> : <>
          <div className="panel-head" style={{marginTop:12,flexWrap:"wrap"}}>
            <div className="toolbar"><Search size={15}/><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجوی نماد یا شرکت"/></div>
            <div className="toolbar">{["همه","تمایل مثبت","خنثی","تمایل منفی"].map(x=><button key={x} className={"badge "+(filter===x ? "neutral" : "")} onClick={()=>setFilter(x)}>{x}</button>)}</div>
          </div>
          <div className="table-wrap"><table className="table"><thead><tr><th>نماد</th><th>آخرین قیمت پایانی</th><th>جهت‌گیری شاخص‌ها</th><th>امتیاز قواعد</th><th>زمان تحلیل</th><th>دیده‌بان</th></tr></thead>
            <tbody>{filtered.map(s=><tr key={s.symbol} onClick={()=>setSelected(s.symbol)} style={{cursor:"pointer",background:selected===s.symbol ? "#17283a" : "transparent"}}>
              <td><div className="symbol">{s.symbol}</div><div className="tiny">{s.company_name}</div></td>
              <td>{s.close_price ? fmt(Number(s.close_price)) : "—"} <div className="tiny">ریال</div></td>
              <td><span className={"badge "+signalClass(s.signal)}><SignalIcon signal={s.signal}/> {signalLabel(s.signal)}</span></td>
              <td><span className="signal-score">{fmt(s.score)}/100</span></td>
              <td><span className="tiny">{dateFmt(s.generated_at)}</span></td>
              <td><button aria-label="تغییر وضعیت دیده‌بان" onClick={e=>{e.stopPropagation();toggleWatch(s.symbol)}} style={{background:"none",border:0,color:watch.includes(s.symbol)?"#e8bd65":"#74849b"}}><Star size={15} fill={watch.includes(s.symbol)?"currentColor":"none"}/></button></td>
            </tr>)}</tbody></table></div>
          {filtered.length === 0 && <div className="empty-state"><Activity size={28}/><b>{loading ? "در حال بارگذاری تحلیل‌ها..." : tab === "watch" && watch.length === 0 ? "هنوز نمادی به دیده‌بان اضافه نکرده‌اید" : "تحلیل معتبری برای نمایش وجود ندارد"}</b><span>{signals.length === 0 ? "تا زمان اتصال منبع داده و ورود تاریخچه معتبر، هیچ سیگنال ساختگی نمایش داده نمی‌شود." : "فیلتر یا عبارت جستجو را تغییر دهید."}</span></div>}
        </>}
      </div>

      <aside className="panel">
        <div className="panel-head"><div><div className="panel-title">جزئیات تحلیل</div><div className="panel-sub">{active ? active.symbol + " · " + active.company_name : "نمادی انتخاب نشده"}</div></div><Sparkles size={17} className="green"/></div>
        {active ? <>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:18}}>
            <span className={"badge "+signalClass(active.signal)}><SignalIcon signal={active.signal}/> {signalLabel(active.signal)}</span>
            <b className="signal-score">{fmt(active.score)}/100</b>
          </div>
          <div className="side-note"><b>توضیح موتور:</b><br/>{active.reasons?.length ? active.reasons.join(" ") : "دلیل ثبت‌شده‌ای وجود ندارد."}</div>
          <div className="detail-list">
            <div><span>قیمت پایانی</span><b>{active.close_price ? fmt(Number(active.close_price)) + " ریال" : "—"}</b></div>
            <div><span>حجم</span><b>{active.volume ? fmt(Number(active.volume)) : "—"}</b></div>
            <div><span>منبع داده</span><b>{active.data_source || "نامشخص"}</b></div>
            <div><span>زمان کندل</span><b>{dateFmt(active.candle_time)}</b></div>
            <div><span>زمان محاسبه</span><b>{dateFmt(active.generated_at)}</b></div>
          </div>
        </> : <div className="empty-state compact"><Activity size={25}/><b>هنوز تحلیلی موجود نیست</b><span>پس از ورود حداقل ۵۱ کندل روزانه معتبر برای هر نماد، موتور می‌تواند تحلیل اولیه را تولید کند.</span></div>}
        <div className="side-note"><b>وضعیت زیرساخت</b><br/>دیتابیس: {status?.ok ? "متصل" : "در حال بررسی"}<br/>منابع داده: {status?.data?.dataSources?.length ? status.data.dataSources.join("، ") : "هنوز ثبت نشده"}<br/>به‌روزرسانی خودکار رابط: هر ۶۰ ثانیه<br/>اتصال کارگزاری و اجرای سفارش: غیرفعال</div>
      </aside>
    </section>

    <footer className="footer"><span>BOURSA AI · نسخه تحلیلی</span><span>بدون اتصال کارگزاری · بدون اجرای سفارش · داده ساختگی در داشبورد نمایش داده نمی‌شود</span></footer>
  </main>;
}
