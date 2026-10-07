import React, { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, Search, Save, Info } from 'lucide-react';
import api from '../../utils/api';

// Paid days off per month: absences up to this number are paid, beyond it are cut.
// Set here for selected employees or everyone at once.
const PaidDaysOff = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [days, setDays] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            setData(await api.get('/employees/paid-off-days'));
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load employees.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        const list = data?.employees || [];
        if (!q) return list;
        return list.filter(e =>
            `${e.first_name} ${e.last_name} ${e.employee_id_number || ''} ${e.department_name || ''} ${e.designation || ''}`
                .toLowerCase().includes(q)
        );
    }, [data, search]);

    const allFilteredSelected = filtered.length > 0 && filtered.every(e => selected.includes(e.id));
    const toggleAll = () => {
        const ids = filtered.map(e => e.id);
        setSelected(prev => allFilteredSelected ? prev.filter(id => !ids.includes(id)) : [...new Set([...prev, ...ids])]);
    };
    const toggleOne = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const apply = async (target) => {
        const n = Number(days);
        if (days === '' || isNaN(n) || n < 0 || n > 31) {
            setMessage({ type: 'error', text: 'Enter a number of days from 0 to 31.' });
            return;
        }
        const count = target === 'all' ? data.employees.length : selected.length;
        if (!window.confirm(`Set ${n} paid days off per month for ${count} employee(s)? This applies to every payroll month not yet locked.`)) return;
        try {
            setSaving(true);
            const res = await api.put('/employees/paid-off-days', { employee_ids: target === 'all' ? 'all' : selected, days: n });
            setMessage({ type: 'success', text: res.message });
            setSelected([]);
            await fetchData();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading && !data) {
        return <div className="p-10 text-center text-sm text-slate-400 font-bold">Loading...</div>;
    }

    if (data && !data.enabled) {
        return (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500 font-semibold">
                Paid days off are not enabled for this company.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 rounded-xl"><CalendarCheck size={20} className="text-indigo-600" /></div>
                <div>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight">Paid Days Off</h1>
                    <p className="text-xs text-slate-500 font-semibold">Days per month an employee can be absent without a salary cut</p>
                </div>
            </div>

            <div className="p-4 bg-indigo-50/50 border border-indigo-100/50 rounded-xl text-indigo-900 text-xs font-semibold leading-relaxed flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5" />
                <span>
                    Absences up to this number are paid; absences beyond it are cut from salary. Unused days do not carry over to the next month.
                    Employees without their own number get the company default of {data?.company_default} days.
                </span>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-xs font-bold ${message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center gap-3">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Days per month</label>
                <input
                    type="number"
                    min="0"
                    max="31"
                    step="0.5"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    placeholder="e.g. 3"
                    className="px-3 py-2 bg-white border border-slate-300 rounded text-sm w-28 focus:outline-none focus:border-indigo-400"
                />
                <button
                    type="button"
                    disabled={saving || selected.length === 0}
                    onClick={() => apply('selected')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 disabled:opacity-40"
                >
                    <Save size={14} /> Apply to selected ({selected.length})
                </button>
                <button
                    type="button"
                    disabled={saving}
                    onClick={() => apply('all')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-600 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-50 disabled:opacity-40"
                >
                    Apply to all employees ({data?.employees.length || 0})
                </button>
                <div className="ml-auto relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, ID, department"
                        className="pl-8 pr-3 py-2 bg-white border border-slate-300 rounded text-sm w-64 focus:outline-none focus:border-indigo-400"
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                            <th className="p-3 w-10 text-left">
                                <input type="checkbox" checked={allFilteredSelected} onChange={toggleAll} />
                            </th>
                            <th className="p-3 text-left">Employee</th>
                            <th className="p-3 text-left">ID</th>
                            <th className="p-3 text-left">Department</th>
                            <th className="p-3 text-left">Designation</th>
                            <th className="p-3 text-right">Paid days off / month</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(e => (
                            <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                                <td className="p-3">
                                    <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleOne(e.id)} />
                                </td>
                                <td className="p-3 font-semibold text-slate-800">{e.first_name} {e.last_name}</td>
                                <td className="p-3 text-slate-500">{e.employee_id_number || '-'}</td>
                                <td className="p-3 text-slate-500">{e.department_name || '-'}</td>
                                <td className="p-3 text-slate-500">{e.designation || '-'}</td>
                                <td className="p-3 text-right font-bold text-slate-800">
                                    {e.effective}
                                    {e.paid_off_days_per_month === null && <span className="ml-1 text-[10px] font-semibold text-slate-400">(default)</span>}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400 text-xs font-bold">No employees found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaidDaysOff;
