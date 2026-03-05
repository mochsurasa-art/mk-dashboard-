import { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell
} from "recharts";

// ─── DATA REAL DARI EXCEL RAB CIKEUSIK ───────────────────────
const PROJECT = {
  nama: "KAWASAN INDUSTRI PT. TOHODO BONAR TUTU",
  lokasi: "Cikeusik, Kabupaten Kuningan",
  luasLahan: 301200,      // m2 (54 hektar)
  luasBangunan: 100000,   // m2 (~10 hektar)
  budget: 650000000000,   // Rp 650 Miliar
  totalRAB: 649861467760, // Rp 649.8 Miliar
  totalPPN: 721346229213.6,
  realBiaya: 706919304629.328,
  tanggal: "03 Maret 2026",
};

// Komponen RAB dari sheet PRA RAB 10H3KTAR
const RAB_ITEMS = [
  {
    no: "I", label: "Pembebasan Lahan",
    jumlah: 0, pct: 0,
    color: "#64748b", items: [
      { name: "Pembebasan Lahan", sat: "m2", jumlah: 0, ket: "By Owner" },
    ]
  },
  {
    no: "II", label: "Pekerjaan Konsultan",
    jumlah: 25195900000, pct: 3.87,
    color: "#8b5cf6", items: [
      { name: "Perencanaan Arsitektur", sat: "%", jumlah: 5600000000 },
      { name: "Perencanaan Struktur/Sipil", sat: "%", jumlah: 0 },
      { name: "Perencanaan MEP", sat: "%", jumlah: 5200000000 },
      { name: "Survey Topografi & Tanah", sat: "%", qty: 301200, harsat: 7000, jumlah: 2108400000 },
      { name: "Amdal", sat: "ls", qty: 1, harsat: 2000000000, jumlah: 2000000000 },
      { name: "Manajemen Konstruksi", sat: "%", qty: 1, harsat: 8500000000, jumlah: 8500000000 },
      { name: "Quantity Surveyor", sat: "%", qty: 0.1, harsat: 650000000000, jumlah: 650000000 },
      { name: "SLF", sat: "%", qty: 0.175, harsat: 650000000000, jumlah: 1137500000 },
    ]
  },
  {
    no: "III", label: "Proses Perijinan PBG",
    jumlah: 10000000000, pct: 1.54,
    color: "#06b6d4", items: [
      { name: "Perijinan dan PBG", sat: "m2", qty: 100000, harsat: 100000, jumlah: 10000000000 },
    ]
  },
  {
    no: "IV", label: "Pekerjaan Pematangan Lahan",
    jumlah: 200902567760, pct: 30.93,
    color: "#f59e0b", items: [
      { name: "Cut n Fill, Vibro & Investigasi Tanah", sat: "m3", qty: 1600000, jumlah: 0, ket: "By Owner" },
      { name: "DPT Sheetpile W-500 & Capping Beam", sat: "m1", qty: 7000, harsat: 1685000, jumlah: 11795000000 },
      { name: "Pagar Pembatas Beton Precast", sat: "m1", qty: 4803, harsat: 1583920, jumlah: 7607567760 },
      { name: "Kolam IPAL & Peresapan", sat: "unit", qty: 2, harsat: 5000000000, jumlah: 10000000000 },
      { name: "Penghijauan & Landscape", sat: "m2", qty: 10000, harsat: 350000, jumlah: 3500000000 },
      { name: "Perkerasan Jalan Kawasan", sat: "m2", qty: 64000, harsat: 2000000, jumlah: 128000000000 },
      { name: "Drainage U-dict 1000x1000", sat: "m1", qty: 8000, harsat: 5000000, jumlah: 40000000000 },
      { name: "Drainage U-dict 400x400", sat: "m1", qty: 6000, harsat: 1500000, jumlah: 9000000000 },
    ]
  },
  {
    no: "V", label: "Pekerjaan Konstruksi Baja",
    jumlah: 405250000000, pct: 62.36,
    color: "#00f3ff", items: [
      { name: "Pekerjaan Persiapan (Preliminary)", sat: "%", qty: 0.035, harsat: 405250000000, jumlah: 14183750000 },
      { name: "Pondasi Spun 400 (Tiang Pancang)", sat: "%", qty: 0.06, harsat: 405250000000, jumlah: 24315000000 },
      { name: "Pekerjaan Arsitektur", sat: "%", qty: 0.175, harsat: 405250000000, jumlah: 70918750000 },
      { name: "Sipil (Erection Baja, Atap, Sloof, Lantai)", sat: "%", qty: 0.27, harsat: 405250000000, jumlah: 109417500000 },
      { name: "MEP Terintegrasi (HVAC, Elektrikal, FF, Plumbing)", sat: "%", qty: 0.46, harsat: 405250000000, jumlah: 186415000000 },
    ]
  },
  {
    no: "VI", label: "Infrastruktur Luar Kawasan",
    jumlah: 0, pct: 0,
    color: "#10b981", items: [
      { name: "Jalan Lingkungan Luar Kawasan", sat: "m2", jumlah: 0 },
      { name: "Jembatan", sat: "ttk", jumlah: 0 },
      { name: "Drainage U-dict 2000x2000", sat: "m1", jumlah: 0 },
    ]
  },
  {
    no: "VII", label: "Addendum & Kontingensi",
    jumlah: 8113000000, pct: 1.25,
    color: "#ec4899", items: [
      { name: "Addendum / Kontingensi", sat: "%", qty: 0.012, harsat: 405250000000, jumlah: 4863000000 },
      { name: "CSR", sat: "%", qty: 0.005, harsat: 650000000000, jumlah: 3250000000 },
    ]
  },
];

// Data Cash Flow per bulan dari sheet cash flow
// Kolom: Feb'26, Mar, Apr, Mei, Jun, Jul, Agu, Sep, Okt, Nov, Des, Jan'27, Feb'27, Mar'27
const CASHFLOW_MONTHS = ["Feb'26","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des","Jan'27","Feb'27","Mar'27"];

// Bobot rencana per bulan (dari row 78 cash flow - kumulatif)
const BOBOT_KUMULATIF = [
  0.393, 2.102, 8.515, 14.193, 18.187, 20.371,
  27.675, 35.098, 42.136, 48.953, 56.131, 63.045, 70.012, 76.897
].map(v => +v.toFixed(3));

// Bobot per bulan (bukan kumulatif)
const BOBOT_PERIODIK = BOBOT_KUMULATIF.map((v, i) =>
  i === 0 ? v : +(v - BOBOT_KUMULATIF[i-1]).toFixed(3)
);

// Simulasi aktual (s/d bulan ke-2 = Apr 2026, sisanya null)
const BULAN_SEKARANG = 2;
const AKTUAL_KUMULATIF = BOBOT_KUMULATIF.map((v, i) =>
  i < BULAN_SEKARANG ? +(v * (0.85 + Math.random()*0.1)).toFixed(3) : null
);

// ─── UTILS ────────────────────────────────────────────────────
const fmt = (n) => {
  if (!n && n!==0) return "—";
  if (Math.abs(n) >= 1e12) return `Rp ${(n/1e12).toFixed(2)} T`;
  if (Math.abs(n) >= 1e9)  return `Rp ${(n/1e9).toFixed(1)} M`;
  if (Math.abs(n) >= 1e6)  return `Rp ${(n/1e6).toFixed(1)} Jt`;
  return `Rp ${n.toLocaleString("id-ID")}`;
};
const fmtShort = (n) => {
  if (Math.abs(n) >= 1e12) return `${(n/1e12).toFixed(1)}T`;
  if (Math.abs(n) >= 1e9)  return `${(n/1e9).toFixed(0)}M`;
  return `${(n/1e6).toFixed(0)}Jt`;
};

// ─── COLORS ───────────────────────────────────────────────────
const C = {
  bg:"#070b12", card:"#0f1825", surface:"#111d2e",
  border:"rgba(255,255,255,0.07)", text:"#e2e8f0",
  muted:"#64748b", dim:"#1e2d3d",
  cyan:"#00f3ff", amber:"#f59e0b", green:"#10b981",
  red:"#ef4444", purple:"#8b5cf6", pink:"#ec4899",
};

const PIE_COLORS = RAB_ITEMS.filter(r=>r.jumlah>0).map(r=>r.color);

// ─── COMPONENTS ───────────────────────────────────────────────
function Card({ children, style={} }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:14, ...style }}>
      {children}
    </div>
  );
}

function KPI({ label, value, sub, color=C.cyan, icon }) {
  return (
    <div style={{ background:C.card, border:`1px solid ${color}22`, borderRadius:12, padding:"16px 18px", borderTop:`3px solid ${color}` }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:.8 }}>{label}</div>
        <span style={{ fontSize:20 }}>{icon}</span>
      </div>
      <div style={{ fontSize:20, fontWeight:700, color, fontFamily:"monospace", lineHeight:1.2 }}>{value}</div>
      {sub && <div style={{ fontSize:10, color:C.muted, marginTop:5 }}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, color="#fff" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, paddingBottom:12, borderBottom:`1px solid ${C.border}` }}>
      <div style={{ height:16, width:3, background:color, borderRadius:2 }}/>
      <div style={{ fontSize:13, fontWeight:700, color }}>{title}</div>
    </div>
  );
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0f1825", border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:11 }}>
      <div style={{ color:C.muted, fontWeight:700, marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, marginBottom:2 }}>
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(2)+"%" : p.value}</b>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function RABDashboard() {
  const [tab, setTab]         = useState("overview");
  const [expandedItem, setExpandedItem] = useState(null);

  // S-Curve data
  const sCurveData = CASHFLOW_MONTHS.map((m, i) => ({
    bulan: m,
    rencana: BOBOT_KUMULATIF[i],
    aktual:  AKTUAL_KUMULATIF[i],
  }));

  // Bar chart data per bulan
  const cashflowData = CASHFLOW_MONTHS.map((m, i) => ({
    bulan: m,
    rencana: +(BOBOT_PERIODIK[i] * PROJECT.totalRAB / 100 / 1e9).toFixed(1),
    aktual:  AKTUAL_KUMULATIF[i] != null
      ? +(BOBOT_PERIODIK[i] * PROJECT.totalRAB / 100 * 0.9 / 1e9).toFixed(1)
      : null,
  }));

  // Pie data
  const pieData = RAB_ITEMS.filter(r=>r.jumlah>0).map(r=>({
    name: r.label, value: r.jumlah, pct: r.pct, color: r.color,
  }));

  const deviasiTerakhir = (() => {
    const lastA = AKTUAL_KUMULATIF.filter(v=>v!==null).at(-1) || 0;
    const lastP = BOBOT_KUMULATIF[AKTUAL_KUMULATIF.filter(v=>v!==null).length-1] || 0;
    return +(lastA-lastP).toFixed(2);
  })();

  const TABS = [
    { id:"overview",   label:"📊 Overview RAB"       },
    { id:"scurve",     label:"📈 Kurva S Cash Flow"   },
    { id:"detail",     label:"📋 Detail RAB"          },
    { id:"breakdown",  label:"🥧 Breakdown Biaya"     },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"'Segoe UI',system-ui,sans-serif" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:${C.bg}}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
      `}</style>

      {/* Header */}
      <header style={{ background:"rgba(7,11,18,0.97)", backdropFilter:"blur(12px)", padding:"14px 28px", borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:50 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"monospace", fontWeight:700, fontSize:15, color:C.cyan, letterSpacing:1 }}>RAB DASHBOARD — MK PORTAL CDE</div>
            <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{PROJECT.nama} · {PROJECT.lokasi}</div>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ fontSize:10, color:C.green, background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:6, padding:"4px 12px" }}>
              📄 RAB_cikeusik_Final_10_hektar_030326.xlsx
            </div>
            <div style={{ fontSize:10, color:C.muted }}>{PROJECT.tanggal}</div>
          </div>
        </div>
      </header>

      <div style={{ padding:24 }}>

        {/* KPI Row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:22, animation:"fadeIn .4s ease" }}>
          <KPI icon="💰" label="Total RAB (excl. PPN)" value={fmt(PROJECT.totalRAB)}     color={C.cyan}   sub="Rp 649.86 Miliar" />
          <KPI icon="🧾" label="Total + PPN 11%"       value={fmt(PROJECT.totalPPN)}     color={C.amber}  sub="Rp 721.35 Miliar" />
          <KPI icon="✂️"  label="Biaya Real (after cut)" value={fmt(PROJECT.realBiaya)}  color={C.green}  sub="Potong 2% biaya awal" />
          <KPI icon="🏭" label="Luas Bangunan"          value="±100.000 m²"              color={C.purple} sub="~10 Hektar Pabrik" />
          <KPI icon="📐" label="Luas Lahan Total"       value="301.200 m²"               color={C.pink}   sub="54 Hektar" />
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              padding:"8px 18px", borderRadius:8,
              border:`1px solid ${tab===t.id?C.cyan:C.border}`,
              background:tab===t.id?`${C.cyan}12`:"transparent",
              color:tab===t.id?C.cyan:C.muted,
              fontSize:12, fontWeight:tab===t.id?700:400,
              cursor:"pointer", transition:"all .18s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── OVERVIEW ── */}
        {tab==="overview" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

              {/* Komponen biaya bar */}
              <Card style={{ padding:22 }}>
                <SectionHeader title="Komponen RAB per Bagian" color={C.cyan}/>
                {RAB_ITEMS.map((item,i)=>(
                  <div key={i} style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <div style={{ fontSize:12, color:C.text }}>
                        <span style={{ color:item.color, fontFamily:"monospace", fontWeight:700 }}>{item.no}.</span> {item.label}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontSize:12, color:item.color, fontWeight:700 }}>{item.pct.toFixed(2)}%</div>
                        <div style={{ fontSize:10, color:C.muted }}>{fmt(item.jumlah)}</div>
                      </div>
                    </div>
                    <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${Math.min(item.pct,100)}%`, background:item.color, borderRadius:3, transition:"width .6s" }}/>
                    </div>
                  </div>
                ))}
              </Card>

              {/* Info proyek */}
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <Card style={{ padding:22 }}>
                  <SectionHeader title="Info Proyek" color={C.amber}/>
                  {[
                    ["Proyek",        PROJECT.nama],
                    ["Lokasi",        PROJECT.lokasi],
                    ["Luas Lahan",    "301.200 m² (54 Ha)"],
                    ["KDB 60%:40%",   "324.000 m²"],
                    ["Luas Bangunan", "±100.000 m² (10 Ha)"],
                    ["Harga/m²",      "Rp 4.052.500,-"],
                    ["Budget Owner",  "Rp 650 Miliar"],
                    ["Material Baja", "By Owner"],
                    ["Solar Panel",   "By Owner"],
                  ].map(([k,v])=>(
                    <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                      <span style={{ color:C.muted }}>{k}</span>
                      <span style={{ color:C.text, textAlign:"right", maxWidth:200 }}>{v}</span>
                    </div>
                  ))}
                </Card>

                {/* Summary biaya */}
                <Card style={{ padding:22 }}>
                  <SectionHeader title="Rekapitulasi Biaya" color={C.green}/>
                  {[
                    { label:"Subtotal RAB",     value:PROJECT.totalRAB,   color:C.text  },
                    { label:"PPN 11%",           value:71484761453.6,      color:C.amber },
                    { label:"Total + PPN",        value:PROJECT.totalPPN,  color:C.cyan  },
                    { label:"Potongan 2% (awal)", value:-14426924584.272,  color:C.red   },
                    { label:"Biaya Real",         value:PROJECT.realBiaya, color:C.green },
                  ].map((r,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:12 }}>
                      <span style={{ color:C.muted }}>{r.label}</span>
                      <span style={{ color:r.color, fontWeight:700, fontFamily:"monospace" }}>{fmt(Math.abs(r.value))}{r.value<0?" (-)":""}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            {/* Timeline ringkas */}
            <Card style={{ padding:22 }}>
              <SectionHeader title="Timeline Cash Flow — Ringkasan (% Bobot per Bulan)" color={C.purple}/>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={cashflowData} margin={{ top:5, right:10, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="bulan" tick={{ fill:C.muted, fontSize:10 }}/>
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} tickFormatter={v=>`${v}M`}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Legend wrapperStyle={{ fontSize:11 }}/>
                  <Bar dataKey="rencana" name="Rencana (Miliar)" fill={C.amber} fillOpacity={.7} radius={[3,3,0,0]}/>
                  <Bar dataKey="aktual"  name="Aktual (Miliar)"  fill={C.cyan}  fillOpacity={.9} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── KURVA S ── */}
        {tab==="scurve" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            {/* Mini KPI */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
              {[
                { label:"Progress Rencana",  value:`${BOBOT_KUMULATIF[BULAN_SEKARANG-1]}%`, color:C.amber },
                { label:"Progress Aktual",   value:`${AKTUAL_KUMULATIF[BULAN_SEKARANG-1]?.toFixed(2)}%`, color:C.cyan },
                { label:"Deviasi",           value:`${deviasiTerakhir>=0?"+":""}${deviasiTerakhir}%`, color:deviasiTerakhir>=0?C.green:C.red },
                { label:"Bulan Berjalan",    value:`Bln ${BULAN_SEKARANG} dari 14`, color:C.purple },
              ].map((k,i)=>(
                <div key={i} style={{ background:C.card, border:`1px solid ${k.color}22`, borderRadius:10, padding:"14px 18px", textAlign:"center" }}>
                  <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:.8, marginBottom:5 }}>{k.label}</div>
                  <div style={{ fontSize:22, fontWeight:700, color:k.color, fontFamily:"monospace" }}>{k.value}</div>
                </div>
              ))}
            </div>

            {/* S-Curve */}
            <Card style={{ padding:24, marginBottom:20 }}>
              <SectionHeader title="Kurva S — Kumulatif Progress Bobot (%) | Feb 2026 — Mar 2027" color={C.cyan}/>
              <ResponsiveContainer width="100%" height={360}>
                <AreaChart data={sCurveData} margin={{ top:10, right:20, left:0, bottom:0 }}>
                  <defs>
                    <linearGradient id="rencanaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.amber} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={C.amber} stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="aktualGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={C.cyan} stopOpacity={0.35}/>
                      <stop offset="95%" stopColor={C.cyan} stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="bulan" tick={{ fill:C.muted, fontSize:11 }}/>
                  <YAxis domain={[0,100]} tick={{ fill:C.muted, fontSize:11 }} tickFormatter={v=>`${v}%`}/>
                  <Tooltip content={({ active, payload, label })=>{
                    if (!active||!payload?.length) return null;
                    const r = payload.find(p=>p.dataKey==="rencana");
                    const a = payload.find(p=>p.dataKey==="aktual");
                    const dev = a&&r ? (a.value-r.value).toFixed(2) : null;
                    return (
                      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:11 }}>
                        <div style={{ color:C.muted, fontWeight:700, marginBottom:6 }}>{label}</div>
                        {r && <div style={{ color:C.amber }}>Rencana: <b>{r.value}%</b> ({fmt(r.value/100*PROJECT.totalRAB)})</div>}
                        {a && <div style={{ color:C.cyan  }}>Aktual : <b>{a.value}%</b></div>}
                        {dev!=null && <div style={{ color:+dev>=0?C.green:C.red, marginTop:4, fontWeight:700 }}>Deviasi: {+dev>=0?"+":""}{dev}%</div>}
                      </div>
                    );
                  }}/>
                  <Legend formatter={v=>v==="rencana"?"Rencana":"Aktual"} wrapperStyle={{ fontSize:12, paddingTop:12 }}/>
                  <ReferenceLine x={`Apr`} stroke={C.cyan} strokeDasharray="4 4" label={{ value:"Saat ini", fill:C.cyan, fontSize:10 }}/>
                  <Area type="monotone" dataKey="rencana" stroke={C.amber} strokeWidth={2}   fill="url(#rencanaGrad)" dot={false} connectNulls name="rencana"/>
                  <Area type="monotone" dataKey="aktual"  stroke={C.cyan}  strokeWidth={2.5} fill="url(#aktualGrad)"  dot={{ r:4, fill:C.cyan }} connectNulls name="aktual"/>
                </AreaChart>
              </ResponsiveContainer>
            </Card>

            {/* Cash flow per bulan */}
            <Card style={{ padding:24 }}>
              <SectionHeader title="Cash Flow Periodik per Bulan (Miliar Rupiah)" color={C.amber}/>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={cashflowData} margin={{ top:5, right:10, left:10, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="bulan" tick={{ fill:C.muted, fontSize:10 }}/>
                  <YAxis tick={{ fill:C.muted, fontSize:10 }} tickFormatter={v=>`${v}M`}/>
                  <Tooltip content={({ active, payload, label })=>{
                    if (!active||!payload?.length) return null;
                    return (
                      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", fontSize:11 }}>
                        <div style={{ color:C.muted, fontWeight:700, marginBottom:4 }}>{label}</div>
                        {payload.map((p,i)=><div key={i} style={{ color:p.color }}>
                          {p.name}: <b>Rp {p.value} Miliar</b>
                        </div>)}
                      </div>
                    );
                  }}/>
                  <Legend wrapperStyle={{ fontSize:11 }}/>
                  <Bar dataKey="rencana" name="Rencana" fill={C.amber} fillOpacity={.7} radius={[3,3,0,0]}/>
                  <Bar dataKey="aktual"  name="Aktual"  fill={C.cyan}  fillOpacity={.9} radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ── DETAIL RAB ── */}
        {tab==="detail" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            {RAB_ITEMS.map((section,si)=>(
              <Card key={si} style={{ marginBottom:14, overflow:"hidden" }}>
                {/* Header seksi */}
                <div onClick={()=>setExpandedItem(expandedItem===si?null:si)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 20px", cursor:"pointer", background:expandedItem===si?`${section.color}0a`:"transparent", transition:"background .2s" }}>
                  <div style={{ width:36,height:36,borderRadius:8,background:`${section.color}20`,border:`1px solid ${section.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,color:section.color,flexShrink:0 }}>{section.no}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:expandedItem===si?section.color:C.text }}>{section.label}</div>
                    <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{section.items.length} item pekerjaan</div>
                  </div>
                  <div style={{ textAlign:"right", marginRight:16 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:section.color, fontFamily:"monospace" }}>{fmt(section.jumlah)}</div>
                    <div style={{ fontSize:11, color:C.muted }}>{section.pct.toFixed(2)}%</div>
                  </div>
                  <div style={{ color:C.muted, fontSize:14, transition:"transform .2s", transform:expandedItem===si?"rotate(180deg)":"none" }}>▼</div>
                </div>

                {/* Progress bar */}
                <div style={{ height:3, background:C.dim }}>
                  <div style={{ height:"100%", width:`${section.pct}%`, background:section.color, transition:"width .5s" }}/>
                </div>

                {/* Detail items */}
                {expandedItem===si && (
                  <div style={{ padding:"0 20px 16px" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse", marginTop:12 }}>
                      <thead>
                        <tr style={{ background:"rgba(0,0,0,0.3)" }}>
                          {["No","Uraian Pekerjaan","Sat","Volume","Harga Satuan","Jumlah","Keterangan"].map(h=>(
                            <th key={h} style={{ padding:"8px 10px", textAlign:"left", fontSize:9, color:C.muted, textTransform:"uppercase", letterSpacing:.8, borderBottom:`1px solid ${C.border}` }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item,ii)=>(
                          <tr key={ii} style={{ borderBottom:`1px solid ${C.border}`, background:ii%2===0?"rgba(255,255,255,0.01)":"transparent" }}>
                            <td style={{ padding:"8px 10px", fontSize:11, color:section.color, fontFamily:"monospace" }}>{ii+1}</td>
                            <td style={{ padding:"8px 10px", fontSize:12, color:C.text }}>{item.name}</td>
                            <td style={{ padding:"8px 10px", fontSize:11, color:C.muted }}>{item.sat||"—"}</td>
                            <td style={{ padding:"8px 10px", fontSize:11, color:C.muted, fontFamily:"monospace" }}>
                              {item.qty!=null?item.qty.toLocaleString("id-ID"):"—"}
                            </td>
                            <td style={{ padding:"8px 10px", fontSize:11, color:C.muted, fontFamily:"monospace" }}>
                              {item.harsat?fmt(item.harsat):"—"}
                            </td>
                            <td style={{ padding:"8px 10px", fontSize:12, color:item.jumlah>0?section.color:C.muted, fontWeight:700, fontFamily:"monospace" }}>
                              {item.jumlah>0?fmt(item.jumlah):"By Owner"}
                            </td>
                            <td style={{ padding:"8px 10px", fontSize:10, color:C.muted }}>{item.ket||""}</td>
                          </tr>
                        ))}
                        {/* Subtotal */}
                        <tr style={{ background:`${section.color}08`, borderTop:`1px solid ${section.color}33` }}>
                          <td colSpan={5} style={{ padding:"10px", fontSize:12, fontWeight:700, color:section.color }}>JUMLAH {section.no}</td>
                          <td style={{ padding:"10px", fontSize:13, fontWeight:700, color:section.color, fontFamily:"monospace" }}>{fmt(section.jumlah)}</td>
                          <td style={{ padding:"10px", fontSize:11, color:section.color }}>{section.pct.toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ))}

            {/* Grand total */}
            <Card style={{ padding:20, border:`1px solid ${C.cyan}44` }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16 }}>
                {[
                  { label:"JUMLAH RAB",      value:PROJECT.totalRAB,  color:C.text  },
                  { label:"PPN 11%",          value:71484761453.6,     color:C.amber },
                  { label:"TOTAL + PPN",      value:PROJECT.totalPPN,  color:C.cyan  },
                ].map((r,i)=>(
                  <div key={i} style={{ textAlign:"center", padding:"12px", background:"rgba(0,0,0,0.3)", borderRadius:8 }}>
                    <div style={{ fontSize:10, color:C.muted, textTransform:"uppercase", letterSpacing:.8, marginBottom:6 }}>{r.label}</div>
                    <div style={{ fontSize:18, fontWeight:700, color:r.color, fontFamily:"monospace" }}>{fmt(r.value)}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── BREAKDOWN ── */}
        {tab==="breakdown" && (
          <div style={{ animation:"fadeIn .3s ease" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
              {/* Pie chart */}
              <Card style={{ padding:24 }}>
                <SectionHeader title="Distribusi Anggaran per Komponen" color={C.cyan}/>
                <ResponsiveContainer width="100%" height={320}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={130}
                      paddingAngle={3} dataKey="value"
                      label={({ name, pct }) => `${pct.toFixed(1)}%`}
                      labelLine={{ stroke:"#334155" }}>
                      {pieData.map((entry,i)=>(
                        <Cell key={i} fill={entry.color} fillOpacity={.85}/>
                      ))}
                    </Pie>
                    <Tooltip formatter={(v)=>[fmt(v), "Nilai"]}/>
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {pieData.map((d,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
                      <div style={{ width:10,height:10,borderRadius:2,background:d.color,flexShrink:0 }}/>
                      <span style={{ flex:1, color:C.muted }}>{d.name}</span>
                      <span style={{ color:d.color, fontWeight:700, fontFamily:"monospace" }}>{d.pct.toFixed(2)}%</span>
                      <span style={{ color:C.muted, fontFamily:"monospace" }}>{fmt(d.value)}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Breakdown konstruksi */}
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <Card style={{ padding:22 }}>
                  <SectionHeader title="Breakdown Konstruksi (Bag. V)" color={C.cyan}/>
                  {[
                    { name:"MEP Terintegrasi",  pct:46.0, color:C.purple, val:186415000000 },
                    { name:"Pekerjaan Sipil",   pct:27.0, color:C.cyan,   val:109417500000 },
                    { name:"Pekerjaan Arsitektur",pct:17.5, color:C.amber, val:70918750000 },
                    { name:"Pondasi Spun 400",  pct:6.0,  color:C.green,  val:24315000000 },
                    { name:"Pekerjaan Persiapan",pct:3.5,  color:C.muted, val:14183750000 },
                  ].map((item,i)=>(
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:11 }}>
                        <span style={{ color:C.text }}>{item.name}</span>
                        <div style={{ textAlign:"right" }}>
                          <span style={{ color:item.color, fontWeight:700 }}>{item.pct}%</span>
                          <span style={{ color:C.muted, marginLeft:8 }}>{fmt(item.val)}</span>
                        </div>
                      </div>
                      <div style={{ height:5, background:"rgba(255,255,255,0.06)", borderRadius:3, overflow:"hidden" }}>
                        <div style={{ height:"100%", width:`${item.pct}%`, background:item.color, borderRadius:3 }}/>
                      </div>
                    </div>
                  ))}
                </Card>

                <Card style={{ padding:22 }}>
                  <SectionHeader title="Harga Satuan Acuan" color={C.amber}/>
                  {[
                    { label:"Harga/m² Bangunan",  value:"Rp 4.052.500,-",   note:"Konstruksi Baja" },
                    { label:"Harga DPT Sheetpile", value:"Rp 1.685.000/m1",  note:"W-500 + Capping" },
                    { label:"Harga Pagar Precast",  value:"Rp 1.583.920/m1",  note:"Beton Precast" },
                    { label:"Perkerasan Jalan",     value:"Rp 2.000.000/m2",  note:"Dalam Kawasan" },
                    { label:"Survey Topografi",     value:"Rp 7.000/m2",      note:"301.200 m²" },
                    { label:"Drainage U-dict 1000", value:"Rp 5.000.000/m1",  note:"1000x1000x1200" },
                  ].map((r,i)=>(
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:`1px solid ${C.border}`, fontSize:11 }}>
                      <div>
                        <div style={{ color:C.text }}>{r.label}</div>
                        <div style={{ fontSize:9, color:C.muted }}>{r.note}</div>
                      </div>
                      <span style={{ color:C.amber, fontWeight:700, fontFamily:"monospace" }}>{r.value}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
