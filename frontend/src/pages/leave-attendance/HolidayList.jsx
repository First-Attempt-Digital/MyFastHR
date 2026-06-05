import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Settings, FileText, Plus, Trash, Save, ChevronDown, Info, HelpCircle
} from 'lucide-react';
import api from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';
import CustomAlertModal from '../../components/common/CustomAlertModal';

const HolidayList = () => {
    const navigate = useNavigate();
    const [holidays, setHolidays] = useState([]);
    const [locationsList, setLocationsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);
    const [location, setLocation] = useState('All');
    
    const currentYear = new Date().getFullYear();
    const yearsList = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
    const [yearRange, setYearRange] = useState(String(currentYear));
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: null
    });

    const showAlert = (message, type = 'info', title = 'Notification', onConfirm = null) => {
        setAlertConfig({
            isOpen: true,
            title,
            message,
            type,
            onConfirm
        });
    };

    useEffect(() => {
        fetchHolidays();
    }, [yearRange]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const res = await api.get('/employees/options/office_location');
                setLocationsList(Array.isArray(res) ? res : []);
            } catch (err) {
                console.error('Failed to fetch locations', err);
            }
        };
        fetchLocations();
    }, []);

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/settings/holidays?year=${yearRange}`);
            let data = [];
            if (res && Array.isArray(res)) {
                data = res.map(h => ({ ...h, isDirty: false }));
            }
            setHolidays(data);
        } catch (err) {
            console.error('Failed to fetch holidays', err);
            setHolidays([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (id, field, value) => {
        setHolidays(prev => prev.map(h => {
            if (h.id === id) {
                return { ...h, [field]: value, isDirty: true };
            }
            return h;
        }));
    };

    const handleSaveChanges = async () => {
        const dirtyHolidays = holidays.filter(h => h.isDirty);
        if (dirtyHolidays.length === 0) {
            showAlert('No changes to save.', 'warning', 'No Changes');
            return;
        }

        try {
            setSaveLoading(true);
            await Promise.all(dirtyHolidays.map(h => 
                api.put(`/settings/holidays/${h.id}`, {
                    name: h.name,
                    date: h.date ? new Date(h.date).toISOString().split('T')[0] : null,
                    type: h.type,
                    location: h.location === 'All' ? null : h.location
                })
            ));
            showAlert('Changes saved successfully!', 'success', 'Saved');
            fetchHolidays();
        } catch (err) {
            console.error('Failed to save holiday changes:', err);
            showAlert(err.response?.data?.message || 'Failed to save changes.', 'error', 'Error');
        } finally {
            setSaveLoading(false);
        }
    };

    const generalCount = useMemo(() => 
        holidays.filter(h => h && h.name && h.type !== 'restricted').length
    , [holidays]);

    const restrictedCount = useMemo(() => 
        holidays.filter(h => h && h.name && h.type === 'restricted').length
    , [holidays]);

    const getDayName = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[date.getDay()];
        } catch (e) { return ''; }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch (e) { return ''; }
    };

    const toggleSelectAll = () => {
        if (selectedRows.length === filteredHolidays.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(filteredHolidays.map(h => h.id));
        }
    };

    const toggleRow = (id) => {
        setSelectedRows(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleAddHoliday = async (data) => {
        try {
            await api.post('/settings/holidays', {
                name: data.name,
                date: data.date,
                type: data.type === 'restricted' ? 'restricted' : 'fixed',
                location: data.location === 'All' ? null : data.location
            });
            fetchHolidays();
        } catch (err) {
            console.error('Failed to add holiday', err);
        }
    };

    const handleDelete = async () => {
        if (selectedRows.length === 0) return;
        showAlert(
            `Are you sure you want to delete ${selectedRows.length} selected holiday(s)?`,
            'confirm',
            'Delete Holidays',
            async () => {
                try {
                    await Promise.all(selectedRows.map(id => api.delete(`/settings/holidays/${id}`)));
                    setSelectedRows([]);
                    fetchHolidays();
                    showAlert('Selected holidays deleted successfully.', 'success', 'Deleted');
                } catch (err) {
                    console.error('Failed to delete holidays', err);
                    showAlert(err.response?.data?.message || 'Failed to delete holidays.', 'error', 'Error');
                }
            }
        );
    };

    const handleExport = () => {
        if (!filteredHolidays || filteredHolidays.length === 0) {
            showAlert("No data available to export.", "warning", "Export Failed");
            return;
        }
        const dataToExport = filteredHolidays.map((h, index) => ({
            "S.No.": index + 1,
            "Occasion": h.name,
            "Date": formatDate(h.date),
            "Day": getDayName(h.date),
            "Location": h.location || 'All Locations',
            "Type": h.type === 'restricted' ? 'Restricted' : 'Public/Fixed'
        }));
        exportToCSV(dataToExport, `Holiday_List_${yearRange}.csv`);
    };

    const filteredHolidays = holidays.filter(h => {
        if (location !== 'All' && h.location !== location) return false;
        return true;
    });

    if (loading && holidays.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Loading Holidays...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-2 animate-in fade-in duration-300">
            <AddHolidayModal 
                isOpen={isAddOpen} 
                onClose={() => setIsAddOpen(false)} 
                onSave={handleAddHoliday} 
                locationsList={locationsList}
            />
            
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight">Holiday List</h2>
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-md px-3 py-1">
                        <span className="text-[9px] font-black text-slate-500 uppercase">{generalCount} Gen</span>
                        <div className="w-px h-3 bg-slate-200" />
                        <span className="text-[9px] font-black text-slate-500 uppercase">{restrictedCount} Res</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsAddOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-sm">
                        <Plus size={10} /> Add
                    </button>
                    <button onClick={() => navigate('/settings')} className="p-1.5 bg-slate-100 text-slate-505 rounded-md hover:bg-slate-200 transition-all" title="Go to Settings">
                        <Settings size={12} />
                    </button>
                </div>
            </div>

            {/* Compact Filters */}
            <div className="flex items-center justify-between gap-4 bg-white p-1.5 rounded-lg border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <select 
                            value={yearRange}
                            onChange={(e) => setYearRange(e.target.value)}
                            className="appearance-none bg-slate-50 border border-slate-100 rounded-md pl-2 pr-6 py-1 text-[10px] font-bold text-slate-650 outline-none focus:border-indigo-300 cursor-pointer"
                        >
                            {yearsList.map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                        <select 
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="bg-white border border-slate-100 rounded-md pl-2 pr-6 py-1 text-[10px] font-bold text-slate-600 outline-none focus:border-indigo-300 min-w-[120px] cursor-pointer"
                        >
                            <option value="All">All Locations</option>
                            {locationsList.map((loc, idx) => (
                                <option key={idx} value={loc}>{loc}</option>
                            ))}
                        </select>
                        <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-55 transition-all shadow-sm cursor-pointer"
                >
                    <FileText size={10} /> Export CSV
                </button>
            </div>

            {/* Ultra-Slim Scrollable Grid */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-y-auto max-h-[420px] custom-scrollbar border-b border-slate-100">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                            <tr className="border-b border-slate-200">
                                <th className="p-1.5 w-7 border-r border-slate-200 bg-slate-50">
                                    <input 
                                        type="checkbox" 
                                        checked={filteredHolidays.length > 0 && selectedRows.length === filteredHolidays.length} 
                                        onChange={toggleSelectAll}
                                        className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" 
                                    />
                                </th>
                                <th className="p-1.5 w-8 text-[8px] font-black text-slate-400 uppercase border-r border-slate-200 text-center bg-slate-50">#</th>
                                <th className="p-1.5 w-1/3 text-[8px] font-black text-slate-400 uppercase border-r border-slate-200 bg-slate-50">Occasion</th>
                                <th className="p-1.5 w-32 text-[8px] font-black text-slate-400 uppercase border-r border-slate-200 text-center bg-slate-50">Date</th>
                                <th className="p-1.5 w-14 text-[8px] font-black text-slate-400 uppercase border-r border-slate-200 text-center bg-slate-50">Day</th>
                                <th className="p-1.5 w-32 text-[8px] font-black text-slate-400 uppercase border-r border-slate-200 bg-slate-50">Location</th>
                                <th className="p-1.5 w-14 text-[8px] font-black text-slate-400 uppercase text-center bg-slate-50">Res</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredHolidays.map((h, index) => (
                                <tr key={h.id} className="hover:bg-slate-50/50 transition-colors bg-white">
                                    <td className="p-1 border-r border-slate-50 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedRows.includes(h.id)} 
                                            onChange={() => toggleRow(h.id)}
                                            className="w-3 h-3 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" 
                                        />
                                    </td>
                                    <td className="p-1 text-[8px] font-bold text-slate-300 border-r border-slate-50 text-center">{index + 1}</td>
                                    <td className="p-1 border-r border-slate-50">
                                        <input 
                                            type="text" 
                                            value={h.name || ''} 
                                            onChange={(e) => handleFieldChange(h.id, 'name', e.target.value)}
                                            placeholder="..."
                                            className="w-full bg-transparent text-[10px] font-bold text-slate-700 outline-none focus:bg-indigo-50/50 px-1.5 py-0.5 rounded placeholder-slate-200"
                                        />
                                    </td>
                                    <td className="p-1 border-r border-slate-50 text-center">
                                        <input 
                                            type="date" 
                                            value={h.date ? new Date(h.date).toISOString().split('T')[0] : ''} 
                                            onChange={(e) => handleFieldChange(h.id, 'date', e.target.value)}
                                            className="w-full bg-transparent text-[10px] font-bold text-slate-600 text-center outline-none focus:bg-indigo-50/50 px-1.5 py-0.5 rounded"
                                        />
                                    </td>
                                    <td className="p-1 border-r border-slate-50 text-center text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                                        {getDayName(h.date)}
                                    </td>
                                    <td className="p-1 border-r border-slate-50">
                                        <select
                                            value={h.location || 'All'}
                                            onChange={(e) => handleFieldChange(h.id, 'location', e.target.value)}
                                            className="w-full bg-transparent text-[9px] font-bold text-slate-600 outline-none focus:bg-indigo-50/50 px-1.5 py-0.5 rounded cursor-pointer"
                                        >
                                            <option value="All">All Locations</option>
                                            {locationsList.map((loc, idx) => (
                                                <option key={idx} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-1 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={h.type === 'restricted'} 
                                            onChange={(e) => handleFieldChange(h.id, 'type', e.target.checked ? 'restricted' : 'fixed')}
                                            className="w-3 h-3 rounded border-slate-305 text-indigo-600 focus:ring-0 cursor-pointer" 
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Slim Footer */}
            <div className="flex items-center justify-between p-1">
                <div className="flex items-center gap-1.5 opacity-50">
                    <Info size={10} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase">{filteredHolidays.length} Holidays Filtered</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDelete}
                        disabled={selectedRows.length === 0}
                        className={`px-4 py-1 border border-rose-100 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${selectedRows.length === 0 ? 'text-rose-200 bg-rose-50 cursor-not-allowed' : 'text-rose-500 hover:bg-rose-50'} `}
                    >
                        <Trash size={10} className="inline mr-1" /> Del
                    </button>
                    <button 
                        onClick={handleSaveChanges}
                        disabled={saveLoading}
                        className="px-6 py-1 bg-slate-900 text-white rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1 disabled:opacity-50"
                    >
                        <Save size={10} /> {saveLoading ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            <CustomAlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={alertConfig.onConfirm}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
            />

            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            ` }} />
        </div>
    );
};

// Add Holiday Modal Component
const AddHolidayModal = ({ isOpen, onClose, onSave, locationsList }) => {
  const [form, setForm] = React.useState({ name: '', date: '', type: 'public', location: 'All' });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(form);
    onClose();
    setForm({ name: '', date: '', type: 'public', location: 'All' });
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-xl p-6 font-outfit">
        <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">Add Holiday</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occasion Name</label>
            <input name="name" placeholder="New Year, Holi, etc." value={form.name} onChange={handleChange} required className="w-full border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</label>
            <input type="date" name="date" value={form.date} onChange={handleChange} required className="w-full border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50 cursor-pointer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Type</label>
              <select name="type" value={form.type} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50 cursor-pointer">
                <option value="public">Public</option>
                <option value="restricted">Restricted</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Location</label>
              <select name="location" value={form.location} onChange={handleChange} className="w-full border rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-400 bg-slate-50 cursor-pointer">
                <option value="All">All Locations</option>
                {locationsList.map((loc, idx) => (
                    <option key={idx} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-50">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HolidayList;
