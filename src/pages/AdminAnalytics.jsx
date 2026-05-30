import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, DollarSign, Calendar, Users, TrendingUp,
  TrendingDown, Home, ShoppingBag, KeyRound, Clock, CheckCircle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';

const fmt = (n) =>
  n >= 1_000_000 ? `€${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `€${(n / 1_000).toFixed(0)}K`
  : `€${Number(n || 0).toLocaleString()}`;

const fmtFull = (n) =>
  `€${Number(n || 0).toLocaleString('en', { minimumFractionDigits: 0 })}`;

// ─── Donut chart (SVG) ────────────────────────────────────────────────────────
function DonutChart({ segments, label, value }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return (
    <div className="flex items-center justify-center h-40 text-white/20 text-xs">No data</div>
  );

  const r = 42, ir = 26, cx = 60, cy = 60;
  let cum = -Math.PI / 2;

  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const s = cum, e = cum + angle;
    cum = e;
    if (angle < 0.001) return null;
    const la = angle > Math.PI ? 1 : 0;
    const cos = (a) => Math.cos(a), sin = (a) => Math.sin(a);
    const d = [
      `M ${cx + r * cos(s)} ${cy + r * sin(s)}`,
      `A ${r} ${r} 0 ${la} 1 ${cx + r * cos(e)} ${cy + r * sin(e)}`,
      `L ${cx + ir * cos(e)} ${cy + ir * sin(e)}`,
      `A ${ir} ${ir} 0 ${la} 0 ${cx + ir * cos(s)} ${cy + ir * sin(s)}`,
      'Z',
    ].join(' ');
    return { d, color: seg.color, label: seg.label, value: seg.value };
  }).filter(Boolean);

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: 120, height: 120 }}>
        <svg viewBox="0 0 120 120" className="w-full h-full">
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color} opacity={0.9} />
          ))}
          <text x={60} y={56} textAnchor="middle" fill="white" fontSize="14" fontWeight="900">{value}</text>
          <text x={60} y={70} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9" fontWeight="700">{label}</text>
        </svg>
      </div>
      <div className="space-y-2.5 flex-1">
        {segments.map(s => (
          <div key={s.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{s.label}</span>
            </div>
            <span className="text-[11px] font-black text-white tabular-nums">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Monthly grouped bar chart (SVG) ─────────────────────────────────────────
function MonthlyChart({ revenueData, expenseData }) {
  const [hovered, setHovered] = useState(null);
  const H = 130, pad = 48;
  const barGrpW = 44, gap = 16;
  const cols = revenueData.length;
  const W = pad + cols * (barGrpW + gap);

  const maxVal = Math.max(
    ...revenueData.map(d => d.value),
    ...expenseData.map(d => d.value),
    1
  );
  const mag  = Math.pow(10, Math.floor(Math.log10(maxVal)));
  const yMax = Math.ceil(maxVal / mag) * mag || 1;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(t => yMax * t);

  return (
    <svg viewBox={`0 0 ${W} ${H + 44}`} className="w-full overflow-visible">
      {/* Grid */}
      {ticks.map((v, i) => {
        const y = H - (v / yMax) * H;
        return (
          <g key={i}>
            <line x1={pad} y1={y} x2={W} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 4" />
            <text x={pad - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.22)" fontSize="9" fontWeight="700">
              {v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`}
            </text>
          </g>
        );
      })}

      {/* Bar groups */}
      {revenueData.map((rd, i) => {
        const ed   = expenseData[i];
        const grpX = pad + i * (barGrpW + gap);
        const bw   = (barGrpW - 4) / 2;
        const rH   = rd.value > 0 ? Math.max(3, (rd.value / yMax) * H) : 0;
        const eH   = ed?.value > 0 ? Math.max(3, (ed.value / yMax) * H) : 0;
        const isHov = hovered === i;

        return (
          <g key={rd.label}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: 'default' }}>

            {/* Revenue bar */}
            <rect x={grpX} y={H - rH} width={bw} height={rH} rx={3}
              fill={isHov ? 'rgba(74,222,128,0.9)' : 'rgba(74,222,128,0.5)'} />

            {/* Expense bar */}
            <rect x={grpX + bw + 2} y={H - eH} width={bw} height={eH} rx={3}
              fill={isHov ? 'rgba(248,113,113,0.9)' : 'rgba(248,113,113,0.4)'} />

            {/* Tooltip */}
            {isHov && (
              <g>
                <rect x={grpX - 6} y={H - Math.max(rH, eH) - 52} width={bw * 2 + 16} height={44} rx={6} fill="#1a1a1a" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x={grpX + bw + 1} y={H - Math.max(rH, eH) - 35} textAnchor="middle" fill="#4ade80" fontSize="9" fontWeight="900">
                  +{fmtFull(rd.value)}
                </text>
                <text x={grpX + bw + 1} y={H - Math.max(rH, eH) - 22} textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="900">
                  -{fmtFull(ed?.value || 0)}
                </text>
              </g>
            )}

            {/* Month label */}
            <text x={grpX + barGrpW / 2 - 2} y={H + 16} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontWeight="700">
              {rd.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ title, value, sub, icon, color }) {
  return (
    <div className="bg-[#111] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[9px] font-black tracking-widest uppercase text-white/30 mb-0.5">{title}</p>
        <p className="text-xl font-black text-white leading-none">{value}</p>
        {sub && <p className="text-[9px] text-white/30 font-bold mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminAnalytics({ onBack }) {
  const [properties, setProperties] = useState([]);
  const [contracts,  setContracts]  = useState([]);
  const [visits,     setVisits]     = useState([]);
  const [users,      setUsers]      = useState([]);
  const [expenses,   setExpenses]   = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/properties').catch(() => []),
      apiFetch('/api/contracts').catch(() => []),
      apiFetch('/api/visits').catch(() => []),
      apiFetch('/api/users').catch(() => []),
      apiFetch('/api/expenses').catch(() => []),
    ]).then(([p, c, v, u, e]) => {
      setProperties(Array.isArray(p) ? p : []);
      setContracts(Array.isArray(c)  ? c : []);
      setVisits(Array.isArray(v)     ? v : []);
      setUsers(Array.isArray(u)      ? u : []);
      setExpenses(Array.isArray(e)   ? e : []);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const getStatus = (s) => {
      const u = (s || '').toUpperCase();
      if (u.includes('SHITUR') || u === 'SOLD')   return 'sold';
      if ((u.includes('QIRA') && u.includes('DHE')) || u === 'RENTED') return 'rented';
      return 'available';
    };
    const isRent = (t) => ['QIRA','RENT'].includes((t||'').toUpperCase());

    const propAvail  = properties.filter(p => getStatus(p.status) === 'available').length;
    const propSold   = properties.filter(p => getStatus(p.status) === 'sold').length;
    const propRented = properties.filter(p => getStatus(p.status) === 'rented').length;
    const propSale   = properties.filter(p => !isRent(p.type)).length;
    const propRent   = properties.filter(p =>  isRent(p.type)).length;

    const totalRevenue = contracts
      .filter(c => ['Active','Finalized'].includes(c.status))
      .reduce((s, c) => s + Number(c.deposit_amount || 0), 0);

    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const cPending   = contracts.filter(c => c.status === 'Pending Signature').length;
    const cActive    = contracts.filter(c => c.status === 'Active').length;
    const cFinalized = contracts.filter(c => c.status === 'Finalized').length;
    const cCancelled = contracts.filter(c => c.status === 'Cancelled').length;

    const vPending  = visits.filter(v => v.status === 'PENDING').length;
    const vApproved = visits.filter(v => v.status === 'APPROVED').length;

    const totalUsers  = users.filter(u => u.role === 'user').length;
    const totalAgents = users.filter(u => u.role === 'agent').length;

    // Last 6 months for chart
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleString('default', { month: 'short' }),
        key:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        revenue: 0, expenses: 0,
      });
    }
    contracts.filter(c => ['Active','Finalized'].includes(c.status)).forEach(c => {
      const d = new Date(c.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const m = months.find(m => m.key === k);
      if (m) m.revenue += Number(c.deposit_amount || 0);
    });
    expenses.forEach(e => {
      if (!e.expense_date) return;
      const d = new Date(e.expense_date);
      const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const m = months.find(m => m.key === k);
      if (m) m.expenses += Number(e.amount || 0);
    });

    const recentContracts = [...contracts]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    return {
      propAvail, propSold, propRented, propSale, propRent,
      totalRevenue, totalExpenses, netProfit,
      cPending, cActive, cFinalized, cCancelled,
      vPending, vApproved,
      totalUsers, totalAgents,
      months, recentContracts,
    };
  }, [properties, contracts, visits, users, expenses]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 gap-3 text-white/30">
      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <span className="text-xs font-bold tracking-widest uppercase">Loading analytics…</span>
    </div>
  );

  const STATUS_CLS = {
    'Pending Signature': 'text-yellow-400',
    'Active':            'text-blue-400',
    'Finalized':         'text-green-400',
    'Cancelled':         'text-red-400',
  };

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-5xl font-bold">DASHBOARD</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">
            Analytics overview — live data
          </p>
        </div>
        <button onClick={onBack}
          className="text-xs font-bold tracking-widest text-gray-500 hover:text-white uppercase transition">
          ← Exit Admin
        </button>
      </div>

      {/* ── Row 1: KPI cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KPI
          title="Properties"  value={properties.length}
          sub={`${stats.propAvail} available`}
          icon={<Building2 size={18} className="text-blue-400" />}
          color="bg-blue-500/10 border border-blue-500/20"
        />
        <KPI
          title="Revenue"     value={fmt(stats.totalRevenue)}
          sub="from contracts"
          icon={<TrendingUp size={18} className="text-green-400" />}
          color="bg-green-500/10 border border-green-500/20"
        />
        <KPI
          title="Expenses"    value={fmt(stats.totalExpenses)}
          sub={stats.netProfit >= 0 ? `+${fmt(stats.netProfit)} net` : `${fmt(stats.netProfit)} net`}
          icon={<TrendingDown size={18} className="text-red-400" />}
          color="bg-red-500/10 border border-red-500/20"
        />
        <KPI
          title="Pending Visits" value={stats.vPending}
          sub={`${stats.vApproved} approved`}
          icon={<Calendar size={18} className="text-yellow-400" />}
          color="bg-yellow-500/10 border border-yellow-500/20"
        />
        <KPI
          title="Users / Agents" value={`${stats.totalUsers} / ${stats.totalAgents}`}
          sub={`${users.length} total accounts`}
          icon={<Users size={18} className="text-purple-400" />}
          color="bg-purple-500/10 border border-purple-500/20"
        />
      </div>

      {/* ── Row 2: Monthly chart + Property status donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">

        {/* Monthly Revenue vs Expenses */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black tracking-widest uppercase text-white/40">Revenue vs Expenses — Last 6 Months</p>
          </div>
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-400/60" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-400/50" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Expenses</span>
            </div>
          </div>
          <MonthlyChart
            revenueData={stats.months.map(m => ({ label: m.label, value: m.revenue }))}
            expenseData={stats.months.map(m => ({ label: m.label, value: m.expenses }))}
          />
        </div>

        {/* Property status donut */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-5">Property Status</p>
          <DonutChart
            label="total"
            value={properties.length}
            segments={[
              { label: 'Available', value: stats.propAvail,  color: '#4ade80' },
              { label: 'Sold',      value: stats.propSold,   color: '#f87171' },
              { label: 'Rented',    value: stats.propRented, color: '#60a5fa' },
            ].filter(s => s.value > 0)}
          />

          <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
            <p className="text-[10px] font-black tracking-widest uppercase text-white/30">Listing Type</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">For Sale</span>
                  <span className="text-[9px] font-black text-white">{stats.propSale}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-400/70 rounded-full"
                    style={{ width: properties.length ? `${(stats.propSale / properties.length) * 100}%` : '0%' }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">For Rent</span>
                  <span className="text-[9px] font-black text-white">{stats.propRent}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-400/70 rounded-full"
                    style={{ width: properties.length ? `${(stats.propRent / properties.length) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Contract pipeline + Recent contracts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Contract pipeline */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-5">Contract Pipeline</p>
          {contracts.length === 0 ? (
            <p className="text-white/20 text-xs italic">No contracts yet.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: 'Pending Signature', count: stats.cPending,   color: '#facc15', icon: <Clock       size={14} /> },
                { label: 'Active',            count: stats.cActive,    color: '#60a5fa', icon: <ShoppingBag size={14} /> },
                { label: 'Finalized',         count: stats.cFinalized, color: '#4ade80', icon: <CheckCircle size={14} /> },
                { label: 'Cancelled',         count: stats.cCancelled, color: '#f87171', icon: <TrendingDown size={14} /> },
              ].map(stage => {
                const pct = contracts.length ? (stage.count / contracts.length) * 100 : 0;
                return (
                  <div key={stage.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2" style={{ color: stage.color }}>
                        {stage.icon}
                        <span className="text-[10px] font-black uppercase tracking-widest">{stage.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/30 font-bold">{Math.round(pct)}%</span>
                        <span className="text-sm font-black text-white w-6 text-right">{stage.count}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: stage.color, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
              <p className="text-[9px] text-white/20 font-bold pt-2">{contracts.length} total contracts</p>
            </div>
          )}
        </div>

        {/* Recent contracts */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-6">
          <p className="text-[10px] font-black tracking-widest uppercase text-white/40 mb-5">Recent Contracts</p>
          {stats.recentContracts.length === 0 ? (
            <p className="text-white/20 text-xs italic">No contracts yet.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentContracts.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    {c.type === 'Rent' ? <KeyRound size={14} className="text-purple-400" /> : <Home size={14} className="text-orange-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-xs truncate">{c.property_title || `Property #${c.property_id}`}</p>
                    <p className="text-white/40 text-[10px] truncate">{c.client_name || `User #${c.user_id}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-black text-xs">{fmt(c.deposit_amount)}</p>
                    <p className={`text-[9px] font-black ${STATUS_CLS[c.status] || 'text-white/30'}`}>{c.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
