"use client";
import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Bell, ChartNoAxesCombined, Search, ShieldCheck, Sparkles, Star, Wallet } from "lucide-react";

type Stock = {symbol:string;name:string;price:number;change:number;volume:string;sector:string;signal:"خرید"|"نگهداری"|"فروش";score:number;reason:string};
const stocks:Stock[]=[
 {symbol:"فملی",name:"ملی صنایع مس ایران",price:8420,change:1.82,volume:"۲۸.۴M",sector:"فلزات اساسی",signal:"خرید",score:82,reason:"میانگین کوتاه‌مدت بالاتر از بلندمدت؛ مومنتوم مثبت در داده نمونه"},
 {symbol:"فولاد",name:"فولاد مبارکه اصفهان",price:5120,change:-.64,volume:"۱۹.۱M",sector:"فلزات اساسی",signal:"نگهداری",score:56,reason:"روند خنثی؛ شواهد کافی برای تغییر وضعیت وجود ندارد"},
 {symbol:"شپنا",name:"پالایش نفت اصفهان",price:3260,change:2.31,volume:"۳۵.۷M",sector:"فرآورده نفتی",signal:"خرید",score:76,reason:"شتاب مثبت و شکست فرضی محدوده کوتاه‌مدت"},
 {symbol:"وبملت",name:"بانک ملت",price:2780,change:.95,volume:"۴۱.۲M",sector:"بانک‌ها",signal:"نگهداری",score:61,reason:"روند ملایم مثبت؛ تأیید حجم در داده نمونه ناقص است"},
 {symbol:"خودرو",name:"ایران خودرو",price:304,change:-1.25,volume:"۶۸.۹M",sector:"خودرو",signal:"فروش",score:79,reason:"مومنتوم منفی و قرارگیری زیر میانگین کوتاه‌مدت در داده نمونه"},
 {symbol:"شستا",name:"سرمایه‌گذاری تأمین اجتماعی",price:1260,change:.42,volume:"۱۲.۸M",sector:"سرمایه‌گذاری",signal:"نگهداری",score:52,reason:"قدرت روند پایین؛ بهتر است تا داده بیشتر در وضعیت خنثی بماند"}
];
const fmt=(n:number)=>new Intl.NumberFormat("fa-IR").format(n);
const signalClass=(s:Stock["signal"])=>s==="خرید"?"buy":s==="فروش"?"sell":"hold";
const series=[32,35,31,39,37,42,40,45,42,49,47,53,50,57,54,61,58,64,62,69,65,73,70,76,72,80,77,84,81,89,86,92];
function Chart(){const pts=series.map((v,i)=>`${i/(series.length-1)*1000},${190-v*1.7}`).join(" ");return <div className="chart"><svg viewBox="0 0 1000 190" preserveAspectRatio="none" role="img" aria-label="نمودار نمونه قیمت"><defs><linearGradient id="fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#35d3a5" stopOpacity=".28"/><stop offset="100%" stopColor="#35d3a5" stopOpacity="0"/></linearGradient></defs><polygon points={`0,190 ${pts} 1000,190`} fill="url(#fill)"/><polyline points={pts} fill="none" stroke="#35d3a5" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>}
export default function Home(){
 const [selected,setSelected]=useState("فملی");const [query,setQuery]=useState("");const [filter,setFilter]=useState("همه");const [watch,setWatch]=useState(["فملی","فولاد","شپنا","وبملت"]);const [tab,setTab]=useState("signals");
 const active=stocks.find(s=>s.symbol===selected)??stocks[0];
 const visible=useMemo(()=>stocks.filter(s=>(filter==="همه"||s.signal===filter)&&(s.symbol.includes(query.trim())||s.name.includes(query.trim()))),[filter,query]);
 const toggle=(sym:string)=>setWatch(old=>old.includes(sym)?old.filter(x=>x!==sym):[...old,sym]);
 return <main className="shell">
  <header className="topbar"><div className="brand"><div className="mark">ب</div><div><strong>BOURSA <span className="green">AI</span></strong><div className="sub">هوشمندی بازار سرمایه ایران</div></div></div><div className="toolbar"><span className="pill"><i className="dot"/>محیط آزمایشی · داده نمونه</span><button className="pill" aria-label="اعلان‌ها"><Bell size={15}/></button></div></header>
  <section className="hero"><div><div className="eyebrow">MARKET INTELLIGENCE / WORKSPACE</div><h1>مرکز تحلیل بازار</h1><p>پایش نمادها، ارزیابی استراتژی‌ها و بررسی سیگنال‌های الگوریتمی</p></div><span className="pill">چهارشنبه · ۱۳ آبان ۱۴۰۵</span></section>
  <div className="notice"><ShieldCheck size={16} style={{display:"inline",verticalAlign:"middle",marginLeft:7}}/><b>شفافیت داده:</b> تمام قیمت‌ها، نمودارها و سیگنال‌های فعلی ساختگی و صرفاً برای نمایش عملکرد محصول هستند؛ به بازار زنده متصل نیستند و مبنای تصمیم سرمایه‌گذاری نیستند. امتیاز سیگنال، احتمال موفقیت نیست.</div>
  <section className="stats">
   <div className="card"><div className="card-label">شاخص کل · داده نمونه</div><div className="card-value">۲,۴۸۶,۳۲۰</div><div className="tiny green">+۱.۲۴٪ · نمایشی</div></div>
   <div className="card"><div className="card-label">ارزش معاملات · نمونه</div><div className="card-value">۱۲.۸ همت</div><div className="tiny">مقدار فرضی</div></div>
   <div className="card"><div className="card-label">سیگنال‌های خرید · نمونه</div><div className="card-value green">{fmt(stocks.filter(s=>s.signal==="خرید").length)}</div><div className="tiny">بر اساس قواعد نمایشی</div></div>
   <div className="card"><div className="card-label">سیگنال‌های فروش · نمونه</div><div className="card-value red">{fmt(stocks.filter(s=>s.signal==="فروش").length)}</div><div className="tiny">بر اساس قواعد نمایشی</div></div>
  </section>
  <section className="layout">
   <div className="panel">
    <div className="panel-head"><div><div className="panel-title">تحلیل نماد {active.symbol}</div><div className="panel-sub">{active.name} · {active.sector}</div></div><span className={"badge "+signalClass(active.signal)}>{active.signal} · نمونه</span></div>
    <div style={{display:"flex",alignItems:"baseline",gap:12,marginTop:15}}><strong style={{fontSize:25}}>{fmt(active.price)}</strong><span className={active.change>=0?"green":"red"} style={{fontSize:12,direction:"ltr"}}>{active.change>0?"+":""}{active.change.toLocaleString("fa-IR")}٪</span><span className="tiny">قیمت فرضی · ریال</span></div>
    <Chart/><div className="chart-labels"><span>۰۹:۰۰</span><span>۱۰:۰۰</span><span>۱۱:۰۰</span><span>۱۲:۰۰</span><span>۱۳:۰۰</span></div>
    <div className="tabs"><button className={tab==="signals"?"active":""} onClick={()=>setTab("signals")}>اسکنر سیگنال</button><button className={tab==="watch"?"active":""} onClick={()=>setTab("watch")}>دیده‌بان من</button><button className={tab==="method"?"active":""} onClick={()=>setTab("method")}>روش‌شناسی</button></div>
    {tab==="method"?<div className="muted" style={{lineHeight:2.2,padding:"12px 5px"}}>در نسخه نمایشی، وضعیت‌ها از داده ساختگی و قواعد نمونه ساخته شده‌اند. نسخه تحلیلی باید اندیکاتورها را از سری زمانی معتبر محاسبه کند، هزینه معاملات و محدودیت‌های دامنه نوسان را لحاظ کند و سپس با داده خارج از نمونه ارزیابی شود. امتیاز نمایش‌داده‌شده رتبه‌بندی قواعد است و احتمال برد نیست.</div>:<>
      <div className="panel-head" style={{marginTop:12,flexWrap:"wrap"}}><div className="toolbar"><Search size={15}/><input className="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="جستجوی نماد یا شرکت"/></div><div className="toolbar">{["همه","خرید","نگهداری","فروش"].map(x=><button key={x} className={"badge "+(filter===x?"neutral":"")} onClick={()=>setFilter(x)}>{x}</button>)}</div></div>
      <div className="table-wrap"><table className="table"><thead><tr><th>نماد</th><th>قیمت نمونه</th><th>تغییر</th><th>وضعیت الگوریتم</th><th>امتیاز قواعد</th><th>دیده‌بان</th></tr></thead><tbody>{visible.map(s=><tr key={s.symbol} onClick={()=>setSelected(s.symbol)} style={{cursor:"pointer",background:selected===s.symbol?"#17283a":"transparent"}}><td><div className="symbol">{s.symbol}</div><div className="tiny">{s.name}</div></td><td>{fmt(s.price)}</td><td className={s.change>=0?"green":"red"}>{s.change>0?"+":""}{s.change.toLocaleString("fa-IR")}٪</td><td><span className={"badge "+signalClass(s.signal)}>{s.signal}</span></td><td><span className="signal-score">{s.score}/100</span></td><td><button aria-label="افزودن به دیده‌بان" onClick={e=>{e.stopPropagation();toggle(s.symbol)}} style={{background:"none",border:0,color:watch.includes(s.symbol)?"#e8bd65":"#74849b"}}><Star size={15} fill={watch.includes(s.symbol)?"currentColor":"none"}/></button></td></tr>)}</tbody></table></div>
    </>}
   </div>
   <aside className="panel"><div className="panel-head"><div><div className="panel-title">سیگنال‌های منتخب</div><div className="panel-sub">خروجی الگوریتم نمایشی · نه داده زنده</div></div><Sparkles size={17} className="green"/></div>
    <div className="list">{stocks.filter(s=>s.signal!=="نگهداری").map(s=><div className="row" key={s.symbol}><button onClick={()=>setSelected(s.symbol)}><b>{s.symbol}</b><div className="tiny">{s.name}</div></button><span className={"badge "+signalClass(s.signal)}>{s.signal}</span><b className="signal-score">{s.score}</b></div>)}</div>
    <div style={{borderTop:"1px solid var(--line)",marginTop:15,paddingTop:14}}><div className="panel-title">وضعیت سامانه</div>{[["منبع داده","نمونه داخلی"],["به‌روزرسانی","غیرفعال"],["اتصال کارگزاری","غیرفعال"],["موتور سفارش","غیرفعال"],["محیط معاملات","شبیه‌سازی آتی"]].map(([a,b])=><div key={a} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #1d2a3b",fontSize:10,color:"var(--muted)"}}><span>{a}</span><b style={{color:"#dce6f4"}}>{b}</b></div>)}</div>
    <div className="side-note"><b><Wallet size={14} style={{display:"inline",verticalAlign:"middle",marginLeft:5}}/> گام بعدی محصول</b><br/>اتصال منبع داده مجاز، ساخت موتور اندیکاتورها، ثبت دلیل سیگنال و افزودن بک‌تست با کارمزد و محدودیت‌های واقعی بازار.</div>
   </aside>
  </section>
  <footer className="footer"><span>BOURSA AI · نسخه توسعه اولیه</span><span>داده و سیگنال نمایشی · بدون اجرای سفارش · بدون توصیه سرمایه‌گذاری</span></footer>
 </main>;
}
