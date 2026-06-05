import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell, PieChart as RePieChart, Pie } from 'recharts';
import { PieChart as PieIcon, TrendingUp, Users, Calendar, Activity, MapPin, Search } from 'lucide-react';
import api from '../utils/api';

const ChartCard = ({ title, subtitle, children, loading }) => (
  <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-[300px] md:h-[350px] transition-all hover:shadow-xl hover:shadow-slate-200/50 group">
    <div className="mb-4 md:mb-6">
      <h3 className="text-[11px] md:text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
      {subtitle && <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-60 leading-none">{subtitle}</p>}
    </div>
    <div className="flex-1 w-full min-h-0 relative">
      {loading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 animate-pulse">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Crunching Data...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      )}
    </div>
  </div>
);

const Analytics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('fiscal_year');

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/analytics/metrics?period=${period}`);
        setMetrics(data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [period]);

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 font-outfit">
      <header className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight flex items-center justify-center md:justify-start gap-3 italic">
             <Activity className="text-indigo-600" /> HR Intelligence
          </h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium italic opacity-70">Strategic workforce analytics and reports.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
            <Search className="text-slate-300 ml-2 shrink-0" size={14} />
            <select 
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-transparent border-none text-[10px] md:text-xs font-black text-slate-800 uppercase outline-none flex-1 md:flex-none py-1 pr-6 cursor-pointer"
            >
              <option value="fiscal_year">Current Fiscal Year</option>
              <option value="6_months">Last 6 Months</option>
            </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Years in Service */}
        <ChartCard title="Staff Tenure Distribution" subtitle="Distribution of employees by years of service" loading={loading}>
          <BarChart data={metrics?.serviceDistribution}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="years" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '10px' }}
              labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ChartCard>

        {/* Additions & Attrition */}
        <ChartCard title="Workforce Growth & Attrition Trends" subtitle="Monthly onboarding vs resignation count" loading={loading}>
          <LineChart data={metrics?.trends}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#64748b', fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#64748b', fontWeight: 800}} />
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
            <Legend verticalAlign="top" align="right" height={32} iconType="circle" wrapperStyle={{ fontSize: 8, fontWeight: 900, textTransform: 'uppercase', paddingBottom: '10px' }} />
            <Line type="monotone" name="Inflow" dataKey="joined" stroke="#10b981" strokeWidth={3} dot={{ r: 3, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
            <Line type="monotone" name="Outflow" dataKey="resigned" stroke="#f43f5e" strokeWidth={3} dot={{ r: 3, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ChartCard>

        {/* Gender Distribution */}
        <ChartCard title="Gender Diversity Breakdown" subtitle="Distribution of workforce by gender classification" loading={loading}>
          <RePieChart>
            <Pie
                data={metrics?.genderDist}
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="count"
                nameKey="gender"
            >
                {metrics?.genderDist?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#6366f1', '#ec4899', '#94a3b8'][index % 3]} />
                ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
            <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase' }} />
          </RePieChart>
        </ChartCard>

        {/* Age Distribution */}
        <ChartCard title="Age Demographics Distribution" subtitle="Headcount breakdown across age cohorts" loading={loading}>
          <LineChart data={metrics?.ageDist}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="age_range" axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 8, fill: '#94a3b8', fontWeight: 800}} />
            <Tooltip />
            <Line type="stepAfter" name="Volume" dataKey="count" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 3, fill: '#0ea5e9', stroke: '#fff' }} />
          </LineChart>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
