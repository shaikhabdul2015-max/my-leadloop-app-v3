import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  Percent, 
  CalendarCheck2, 
  AlertCircle,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { formatCurrency } from '../utils/crmUtils';

export const AnalyticsPage: React.FC = () => {
  const { leads, stages, followups } = useApp();

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'won');
  const lostLeads = leads.filter((l) => l.status === 'lost');
  const activeLeads = leads.filter((l) => l.status === 'active');

  const wonRevenue = wonLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
  const pipelineValue = activeLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
  const totalValueEver = leads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);

  // Conversion rate: Won / Total closed (or won / total leads)
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads.length / totalLeads) * 100) : 0;

  // Follow-up completion rate
  const completedFollowups = followups.filter((f) => f.status === 'completed');
  const followupRate = followups.length > 0 ? Math.round((completedFollowups.length / followups.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Sales & Follow-up Analytics</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Monitor your pipeline velocity, won revenue, and follow-up completion efficiency.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>WON REVENUE</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{formatCurrency(wonRevenue, 'INR')}</span>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{wonLeads.length} deals closed</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>PIPELINE VALUE</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{formatCurrency(pipelineValue, 'INR')}</span>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">{activeLeads.length} active opportunities</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>CONVERSION RATE</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{conversionRate}%</span>
            <p className="text-[11px] text-violet-600 font-bold mt-0.5">Leads to Won</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>FOLLOW-UP COMPLETION</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{followupRate}%</span>
            <p className="text-[11px] text-amber-700 font-bold mt-0.5">{completedFollowups.length} completed</p>
          </div>
        </div>
      </div>

      {/* Breakdown Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Funnel Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Leads by Stage</h3>
            <span className="text-xs text-slate-400">Total: {totalLeads}</span>
          </div>

          <div className="space-y-3.5">
            {stages.map((st) => {
              const stageLeads = leads.filter((l) => l.stage_id === st.id);
              const count = stageLeads.length;
              const val = stageLeads.reduce((acc, l) => acc + (Number(l.deal_value) || 0), 0);
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;

              return (
                <div key={st.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: st.color }} />
                      {st.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{count} leads</span>
                      <span className="text-slate-400 text-[11px]">({formatCurrency(val, 'INR')})</span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: st.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Won vs Lost Comparison Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Won vs Lost Deals</h3>
            <span className="text-xs text-slate-400">Outcome Distribution</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Deals Won</span>
              <p className="text-3xl font-black text-emerald-900 mt-1">{wonLeads.length}</p>
              <p className="text-xs font-semibold text-emerald-800 mt-1">{formatCurrency(wonRevenue, 'INR')}</p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Deals Lost</span>
              <p className="text-3xl font-black text-rose-900 mt-1">{lostLeads.length}</p>
              <p className="text-xs font-semibold text-rose-800 mt-1">
                {formatCurrency(lostLeads.reduce((a, b) => a + (Number(b.deal_value) || 0), 0), 'INR')}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Avg Deal Size (Won):</span>
              <span className="font-bold text-slate-900">
                {wonLeads.length > 0 ? formatCurrency(wonRevenue / wonLeads.length, 'INR') : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Active Leads in Negotiation:</span>
              <span className="font-bold text-indigo-600">
                {leads.filter((l) => l.stage_id === 'stage-4').length} leads
              </span>
            </div>
          </div>
        </div>

        {/* AI Priority & Health Temperature */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-rose-500" />
              <h3 className="font-bold text-slate-900 text-sm">AI Lead Health & Temperature Distribution</h3>
            </div>
            <span className="text-xs font-bold text-indigo-600">Scoring Engine 2.0</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">HOT (75-100)</span>
              <p className="text-3xl font-black text-rose-900 mt-1">{leads.filter((l) => l.score_category === 'HOT').length}</p>
              <p className="text-xs text-rose-600 font-bold mt-1">High purchase intent & activity</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">WARM (45-74)</span>
              <p className="text-3xl font-black text-amber-900 mt-1">{leads.filter((l) => l.score_category === 'WARM').length}</p>
              <p className="text-xs text-amber-700 font-bold mt-1">Active conversation & nurturing</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">COLD (0-44)</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{leads.filter((l) => l.score_category === 'COLD').length}</p>
              <p className="text-xs text-slate-500 font-bold mt-1">Needs re-engagement touchpoint</p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-950">Deals requiring immediate intervention due to stalled momentum:</span>
            </div>
            <span className="font-extrabold text-amber-800 bg-amber-200/80 px-3 py-1 rounded-full text-center">
              {leads.filter((l) => l.risk_level === 'high' || l.risk_level === 'medium').length} deals at risk
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
