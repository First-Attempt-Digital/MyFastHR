import React, { useState, useEffect } from 'react';
import { 
  Building2, Plus, Search, Filter, MoreVertical, 
  CheckCircle2, XCircle, Clock, Globe, Mail, 
  Shield, CreditCard, ArrowUpRight, Loader2, Activity,
  Users, Briefcase, Download, Upload
} from 'lucide-react';
import api, { fetchBranding, getAssetUrl } from '../utils/api';

const StatCard = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-2.5 rounded-xl ${color} bg-slate-50`}>
                <Icon size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global</span>
        </div>
        <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
        </div>
    </div>
);

const BrandingPanel = () => {
    const [branding, setBranding] = useState({ 
        logo_url: '', 
        favicon_url: '', 
        logo_height: 36,
        app_name: 'MyFastHR',
        primary_color: '#6366f1',
        login_title: 'Welcome to MyFastHR',
        login_subtitle: 'Access your tenant HR cluster',
        footer_copyright: '© 2026 MyFastHR. All rights reserved.'
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [faviconPreview, setFaviconPreview] = useState(null);
    const [logoFile, setLogoFile] = useState(null);
    const [faviconFile, setFaviconFile] = useState(null);
    const [hasHeightChanged, setHasHeightChanged] = useState(false);
    const [hasTextChanged, setHasTextChanged] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loadingBranding, setLoadingBranding] = useState(true);

    const colorPresets = [
        { name: 'Indigo Accent', hex: '#6366f1' },
        { name: 'Ocean Blue', hex: '#0284c7' },
        { name: 'Emerald Teal', hex: '#10b981' },
        { name: 'Amethyst Violet', hex: '#8b5cf6' },
        { name: 'Amber Gold', hex: '#f59e0b' },
        { name: 'Crimson Rose', hex: '#f43f5e' }
    ];

    const loadBrandingData = async () => {
        setLoadingBranding(true);
        try {
            const data = await fetchBranding();
            setBranding({
                logo_url: getAssetUrl(data.logo_url),
                favicon_url: getAssetUrl(data.favicon_url),
                logo_height: data.logo_height ? parseInt(data.logo_height) : 36,
                app_name: data.app_name || 'MyFastHR',
                primary_color: data.primary_color || '#6366f1',
                login_title: data.login_title || 'Welcome to MyFastHR',
                login_subtitle: data.login_subtitle || 'Access your tenant HR cluster',
                footer_copyright: data.footer_copyright || '© 2026 MyFastHR. All rights reserved.'
            });
        } catch (err) {
            console.error('Error fetching branding settings', err);
        } finally {
            setLoadingBranding(false);
        }
    };

    useEffect(() => {
        loadBrandingData();
    }, []);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleFaviconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFaviconFile(file);
            setFaviconPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!logoFile && !faviconFile && !hasHeightChanged && !hasTextChanged) {
            setMessage({ type: 'warning', text: 'Please modify logo, favicon, theme, or texts to save.' });
            return;
        }

        setSaving(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        if (logoFile) formData.append('logo', logoFile);
        if (faviconFile) formData.append('favicon', faviconFile);
        formData.append('logo_height', branding.logo_height);
        formData.append('app_name', branding.app_name);
        formData.append('primary_color', branding.primary_color);
        formData.append('login_title', branding.login_title);
        formData.append('login_subtitle', branding.login_subtitle);
        formData.append('footer_copyright', branding.footer_copyright);

        try {
            const res = await api.post('/admin/branding', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage({ type: 'success', text: 'White label branding configuration updated successfully!' });
            setLogoFile(null);
            setFaviconFile(null);
            setHasHeightChanged(false);
            setHasTextChanged(false);
            
            // Reload updated files
            await loadBrandingData();

            // Fire event to notify AppShell / other components
            window.dispatchEvent(new Event('branding_updated'));
            
            // Update browser tab favicon link element dynamically
            if (res.updates && res.updates.favicon_url) {
                const link = document.querySelector("link[rel~='icon']");
                if (link) {
                    link.href = getAssetUrl(res.updates.favicon_url);
                }
            }
        } catch (err) {
            console.error('Update branding failed', err);
            setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update branding settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loadingBranding) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="animate-spin mb-4 text-indigo-600" size={32} />
                <p className="text-sm font-semibold">Loading branding preferences...</p>
            </div>
        );
    }

    const isDirty = logoFile || faviconFile || hasHeightChanged || hasTextChanged;

    return (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-500 text-left">
            {message.text && (
                <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold uppercase tracking-wider ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                    message.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                    'bg-rose-50 border-rose-100 text-rose-600'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        message.type === 'success' ? 'bg-emerald-500' :
                        message.type === 'warning' ? 'bg-amber-500' :
                        'bg-rose-500'
                    }`} />
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Logo Setup Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-md font-bold text-slate-800">Platform Brand Logo</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure the main company logo displayed on login screens and layouts</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Current Logo / Preview */}
                        <div className="flex flex-col items-center justify-center p-8 bg-slate-900 rounded-xl border border-slate-800 relative group overflow-hidden min-h-[160px]">
                            <span className="absolute top-3 left-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Logo Preview Backdrop</span>
                            <img 
                                src={logoPreview || branding.logo_url || '/uploads/branding/logo.png'} 
                                alt="Logo Preview" 
                                style={{ height: `${branding.logo_height || 36}px` }}
                                className="w-auto object-contain max-w-[220px]" 
                                onError={(e) => {
                                    e.target.src = '/uploads/branding/logo.png';
                                }}
                            />
                        </div>

                        {/* File Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Upload New Logo (Light or Dark color scheme)</label>
                            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-400 transition-all flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <Upload className="text-slate-400 mb-2" size={24} />
                                <span className="text-xs font-bold text-slate-700">
                                    {logoFile ? logoFile.name : 'Click to select logo image'}
                                </span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">PNG, JPG, SVG, or GIF (max 5MB)</span>
                            </div>
                        </div>

                        {/* Logo Height Control */}
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logo Size (Height)</label>
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{branding.logo_height}px</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <input 
                                    type="range" 
                                    min="20" 
                                    max="120" 
                                    value={branding.logo_height || 36} 
                                    onChange={(e) => {
                                        setBranding(prev => ({ ...prev, logo_height: parseInt(e.target.value) }));
                                        setHasHeightChanged(true);
                                    }}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                                />
                            </div>
                            <span className="text-[9px] text-slate-400 uppercase tracking-wider pl-1 block">Drag the slider to adjust height between 20px and 120px</span>
                        </div>
                    </div>
                </div>

                {/* Favicon Setup Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-md font-bold text-slate-800">Browser Favicon Icon</h3>
                        <p className="text-xs text-slate-400 mt-1">Configure the browser tab shortcut icon displayed next to the page title</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Tab Simulation / Preview */}
                        <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center min-h-[160px]">
                            {/* Simulate a Mock Browser Tab */}
                            <div className="bg-white shadow-md border border-slate-200 rounded-t-lg px-4 py-2 flex items-center gap-2 max-w-xs w-full">
                                <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <img 
                                        src={faviconPreview || branding.favicon_url || '/uploads/branding/favicon.png'} 
                                        alt="Favicon Preview" 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.src = '/uploads/branding/favicon.png';
                                        }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 truncate leading-none">{branding.app_name} | Platform OS</span>
                                <div className="w-2.5 h-2.5 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer ml-auto flex-shrink-0">
                                    <span className="text-[7px] font-bold text-slate-400">×</span>
                                </div>
                            </div>
                        </div>

                        {/* File Select */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Upload New Favicon Icon</label>
                            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-400 transition-all flex flex-col items-center justify-center bg-slate-50/50 cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={handleFaviconChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <Upload className="text-slate-400 mb-2" size={24} />
                                <span className="text-xs font-bold text-slate-700">
                                    {faviconFile ? faviconFile.name : 'Click to select favicon icon'}
                                </span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-1">ICO, PNG, or SVG (max 2MB)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Advanced Theme & Text Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Text preferences */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-3">Portal Brand Settings</h3>
                    
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Application Custom Name</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={branding.app_name}
                            onChange={(e) => {
                                setBranding(prev => ({ ...prev, app_name: e.target.value }));
                                setHasTextChanged(true);
                            }}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Login Welcome Greeting</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={branding.login_title}
                                onChange={(e) => {
                                    setBranding(prev => ({ ...prev, login_title: e.target.value }));
                                    setHasTextChanged(true);
                                }}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Login Description Subtext</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                value={branding.login_subtitle}
                                onChange={(e) => {
                                    setBranding(prev => ({ ...prev, login_subtitle: e.target.value }));
                                    setHasTextChanged(true);
                                }}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Footer Copyright Note</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                            value={branding.footer_copyright}
                            onChange={(e) => {
                                setBranding(prev => ({ ...prev, footer_copyright: e.target.value }));
                                setHasTextChanged(true);
                            }}
                            required
                        />
                    </div>
                </div>

                {/* Primary theme color */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <h3 className="text-md font-bold text-slate-800 border-b border-slate-100 pb-3">Primary Theme Accent</h3>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Color Presets</label>
                        <div className="grid grid-cols-2 gap-2">
                            {colorPresets.map(preset => (
                                <button
                                    key={preset.hex}
                                    type="button"
                                    onClick={() => {
                                        setBranding(prev => ({ ...prev, primary_color: preset.hex }));
                                        setHasTextChanged(true);
                                    }}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 ${
                                        branding.primary_color.toLowerCase() === preset.hex.toLowerCase()
                                            ? 'bg-slate-50 border-slate-300 font-extrabold text-slate-800'
                                            : 'bg-white hover:bg-slate-50/50 border-slate-100 text-slate-500'
                                    }`}
                                >
                                    <div className="w-3.5 h-3.5 rounded-md shadow-sm border border-black/10" style={{ backgroundColor: preset.hex }} />
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1 block">Custom Hex Palette</label>
                        <div className="flex items-center gap-3">
                            <input 
                                type="color" 
                                value={branding.primary_color}
                                onChange={(e) => {
                                    setBranding(prev => ({ ...prev, primary_color: e.target.value }));
                                    setHasTextChanged(true);
                                }}
                                className="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer bg-transparent focus:outline-none"
                            />
                            <input 
                                type="text"
                                maxLength="7"
                                value={branding.primary_color}
                                onChange={(e) => {
                                    setBranding(prev => ({ ...prev, primary_color: e.target.value }));
                                    setHasTextChanged(true);
                                }}
                                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider font-mono focus:ring-2 focus:ring-indigo-500/20 outline-none w-32"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {isDirty && (
                    <button 
                        type="button" 
                        onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                            setFaviconFile(null);
                            setFaviconPreview(null);
                            setHasHeightChanged(false);
                            setHasTextChanged(false);
                            loadBrandingData();
                            setMessage({ type: '', text: '' });
                        }}
                        className="px-6 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Reset Changes
                    </button>
                )}
                <button 
                    type="submit" 
                    disabled={saving || !isDirty}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin" size={14} />
                            Saving Branding...
                        </>
                    ) : (
                        'Save Branding Configuration'
                    )}
                </button>
            </div>
        </form>
    );
};

const AdminCompanies = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'branding'
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        subscription: 'active',
        device_name: '',
        device_serial: '',
        ip_address: '',
        port: 5005
    });

    // Edit/Reset/Delete States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ 
        id: '', name: '', email: '', subscription_status: 'active', 
        subscription_plan: 'Starter', billing_amount: 49.00, brand_color: '#6366f1',
        max_employees_limit: 100, enabled_features: [], slug: '', logo_url: ''
    });
    const [companyLogoFile, setCompanyLogoFile] = useState(null);
    const [companyLogoPreview, setCompanyLogoPreview] = useState(null);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ id: '', companyName: '', password: '', confirmPassword: '' });
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Biometric device management states
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [devices, setDevices] = useState([]);
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
    const [deviceName, setDeviceName] = useState('');
    const [deviceSerial, setDeviceSerial] = useState('');
    const [deviceIp, setDeviceIp] = useState('');
    const [devicePort, setDevicePort] = useState(5005);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/companies');
            setCompanies(res || []);
        } catch (err) {
            console.error('Fetch companies failed', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async (companyId) => {
        try {
            const originalToken = localStorage.getItem('auth_token');
            const res = await api.post(`/admin/companies/${companyId}/impersonate`);
            if (res.accessToken) {
                localStorage.setItem('super_admin_token', originalToken);
                localStorage.setItem('auth_token', res.accessToken);
                localStorage.setItem('user_role', 'company_admin');
                localStorage.setItem('super_admin_view_mode', 'tenant');
                alert('Impersonation session established. Redirecting to tenant space...');
                window.location.href = '/dashboard';
            }
        } catch (err) {
            console.error('Impersonation failed', err);
            alert('Failed to impersonate: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('name', editFormData.name);
            formData.append('email', editFormData.email);
            formData.append('subscription_status', editFormData.subscription_status);
            formData.append('subscription_plan', editFormData.subscription_plan);
            formData.append('billing_amount', editFormData.billing_amount);
            formData.append('brand_color', editFormData.brand_color);
            formData.append('slug', editFormData.slug || '');
            if (companyLogoFile) {
                formData.append('logo', companyLogoFile);
            }

            await api.put(`/admin/companies/${editFormData.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await api.patch(`/admin/companies/${editFormData.id}/features`, {
                max_employees_limit: editFormData.max_employees_limit,
                enabled_features: editFormData.enabled_features
            });
            setIsEditModalOpen(false);
            setCompanyLogoFile(null);
            setCompanyLogoPreview(null);
            fetchCompanies();
            window.dispatchEvent(new Event('branding_updated'));
            alert('Organization details, limits, and feature flags updated successfully!');
        } catch (err) {
            console.error('Update failed', err);
            alert('Failed to update organization: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            alert('Passwords do not match.');
            return;
        }
        try {
            await api.post(`/admin/companies/${passwordData.id}/reset-password`, {
                password: passwordData.password
            });
            setIsPasswordModalOpen(false);
            alert('Admin password reset successfully!');
        } catch (err) {
            console.error('Password reset failed', err);
            alert('Failed to reset password: ' + (err.response?.data?.message || err.message));
        }
    };

    const fetchDevices = async (companyId) => {
        setLoadingDevices(true);
        try {
            const res = await api.get('/v1/machine/devices', { params: { company_id: companyId } });
            setDevices(res || []);
        } catch (err) {
            console.error('Fetch devices failed', err);
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleCreateDevice = async (e) => {
        e.preventDefault();
        try {
            await api.post('/v1/machine/register', {
                company_id: selectedCompany.id,
                device_name: deviceName,
                device_serial: deviceSerial,
                ip_address: deviceIp || '0.0.0.0',
                port: parseInt(devicePort) || 5005
            });
            setDeviceName('');
            setDeviceSerial('');
            setDeviceIp('');
            setDevicePort(5005);
            fetchDevices(selectedCompany.id);
        } catch (err) {
            alert('Failed to register device: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteDevice = async (deviceId) => {
        if (!confirm('Are you sure you want to remove this biometric device?')) return;
        try {
            await api.delete(`/v1/machine/devices/${deviceId}`, { params: { company_id: selectedCompany.id } });
            fetchDevices(selectedCompany.id);
        } catch (err) {
            alert('Failed to delete device: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();

        try {
            const res = await api.post('/admin/companies', {
                name: formData.name,
                email: formData.email,
                subscription_status: formData.subscription
            });
            
            // If biometric device details are supplied, register it as well!
            if (formData.device_name && formData.device_serial) {
                try {
                    await api.post('/v1/machine/register', {
                        company_id: res.id,
                        device_name: formData.device_name,
                        device_serial: formData.device_serial,
                        ip_address: formData.ip_address || '0.0.0.0',
                        port: parseInt(formData.port) || 5005
                    });
                } catch (devErr) {
                    console.error('Initial device registration failed:', devErr);
                    alert('Company created successfully, but initial biometric device registration failed: ' + (devErr.response?.data?.message || devErr.message));
                }
            }

            // Alert the generated credentials
            alert(`Company Onboarded Successfully!\n\nTemporary Password generated: ${res.password}`);

            setIsModalOpen(false);
            fetchCompanies();
            setFormData({ 
                name: '', email: '', password: '', confirmPassword: '', subscription: 'active',
                device_name: '', device_serial: '', ip_address: '', port: 5005
            });
        } catch (err) {
            console.error('Creation failed', err);
            const errMsg = err.response?.data?.error || err.response?.data?.message || err.message;
            alert('Failed to onboard organization: ' + errMsg);
        }
    };

    const filteredCompanies = companies.filter(c => 
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 font-outfit text-slate-900">
            {/* Header */}
            <header className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Company Management</h1>
                    <p className="text-slate-500 font-medium mt-1">Manage and monitor global organization tenants</p>
                </div>

                {activeTab === 'directory' && (
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={18} />
                        Add New Company
                    </button>
                )}
            </header>

            {/* Tab Selection */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab('directory')}
                    className={`pb-4 text-sm font-black tracking-tight border-b-2 transition-all ${
                        activeTab === 'directory' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Organizations Directory
                </button>
                <button
                    onClick={() => setActiveTab('branding')}
                    className={`pb-4 text-sm font-black tracking-tight border-b-2 transition-all ${
                        activeTab === 'branding' 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                >
                    Platform Branding
                </button>
            </div>

            {activeTab === 'branding' ? (
                <BrandingPanel />
            ) : (
                <>
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <StatCard label="Total Organizations" value={companies.length} icon={Building2} color="text-indigo-600" />
                        <StatCard label="Active Subscriptions" value={companies.filter(c => c.subscription_status === 'active').length} icon={CheckCircle2} color="text-emerald-600" />
                        <StatCard label="Total Users" value="1.2k+" icon={Users} color="text-slate-600" />
                        <StatCard label="System Health" value="99.9%" icon={Activity} color="text-amber-500" />
                    </div>

                    {/* Content Area */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                            <div className="relative group">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text" 
                                    placeholder="Find organization..." 
                                    className="pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none w-64"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Primary Email</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Plan</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 text-sm font-medium">Loading organization directory...</td>
                                </tr>
                            ) : filteredCompanies.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-20 text-center text-slate-400 text-sm font-medium">No results found.</td>
                                </tr>
                            ) : filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-xs text-indigo-600 uppercase overflow-hidden p-1 shrink-0">
                                                {company.logo_url ? (
                                                    <img src={getAssetUrl(company.logo_url)} alt="Logo" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                                ) : (
                                                    company.name ? company.name.substring(0, 2) : '??'
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{company.name}</p>
                                                <p className="text-[10px] font-medium text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                    <span>ID: {company.id?.toString().padStart(4, '0')}</span>
                                                    {company.slug && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <a 
                                                                href={`/login/${company.slug}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer" 
                                                                className="text-indigo-600 hover:underline font-bold text-[9px] uppercase tracking-wider bg-indigo-50/50 px-1.5 py-0.5 rounded"
                                                            >
                                                                Portal: /{company.slug}
                                                            </a>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                            <Mail size={12} className="text-slate-300" />
                                            {company.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                            company.subscription_status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            company.subscription_status === 'trial' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 
                                            'bg-slate-100 text-slate-500'
                                        }`}>
                                            {company.subscription_status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-slate-700">Business</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => {
                                                setSelectedCompany(company);
                                                fetchDevices(company.id);
                                                setIsDeviceModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1.5 mr-2"
                                        >
                                            <Activity size={12} />
                                            Biometrics
                                        </button>
                                        <div className="relative inline-block text-left">
                                            <button 
                                                onClick={() => setActiveDropdownId(activeDropdownId === company.id ? null : company.id)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            {activeDropdownId === company.id && (
                                                <>
                                                    <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white border border-slate-100 ring-1 ring-black ring-opacity-5 z-20 focus:outline-none text-left">
                                                        <div className="py-1">
                                                             <button
                                                                onClick={() => {
                                                                    handleImpersonate(company.id);
                                                                    setActiveDropdownId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                                                            >
                                                                ⚡ Impersonate Admin
                                                             </button>
                                                             <button
                                                                onClick={() => {
                                                                    let features = [];
                                                                    try {
                                                                        features = typeof company.enabled_features === 'string'
                                                                            ? JSON.parse(company.enabled_features || '["payroll", "kudos", "helpdesk"]')
                                                                            : (company.enabled_features || ["payroll", "kudos", "helpdesk"]);
                                                                    } catch (e) {
                                                                        features = ["payroll", "kudos", "helpdesk"];
                                                                    }
                                                                    setEditFormData({
                                                                        id: company.id,
                                                                        name: company.name,
                                                                        email: company.email,
                                                                        subscription_status: company.subscription_status,
                                                                        subscription_plan: company.subscription_plan || 'Starter',
                                                                        billing_amount: company.billing_amount || 49.00,
                                                                        brand_color: company.brand_color || '#6366f1',
                                                                        max_employees_limit: company.max_employees_limit || 100,
                                                                        enabled_features: features,
                                                                        slug: company.slug || '',
                                                                        logo_url: company.logo_url || ''
                                                                    });
                                                                    setIsEditModalOpen(true);
                                                                    setActiveDropdownId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                Edit Organization
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setPasswordData({
                                                                        id: company.id,
                                                                        companyName: company.name,
                                                                        password: '',
                                                                        confirmPassword: ''
                                                                    });
                                                                    setIsPasswordModalOpen(true);
                                                                    setActiveDropdownId(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                                            >
                                                                Reset Admin Password
                                                            </button>
                                                            <button
                                                                onClick={async () => {
                                                                    setActiveDropdownId(null);
                                                                    if (!confirm(`Are you sure you want to permanently delete "${company.name}"? This will delete all employees, users, and attendance records.`)) return;
                                                                    try {
                                                                        await api.delete(`/admin/companies/${company.id}`);
                                                                        alert('Company deleted successfully');
                                                                        fetchCompanies();
                                                                    } catch (err) {
                                                                        alert('Failed to delete company: ' + (err.response?.data?.message || err.message));
                                                                    }
                                                                }}
                                                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                                            >
                                                                Delete Company
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            </>
            )}

            {/* Create Company Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-outfit border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Onboard New Organization</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Initialise a new company tenant</p>
                            </div>
                        </div>

                        <form onSubmit={handleCreateCompany} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>



                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Initial Subscription State</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={formData.subscription}
                                    onChange={(e) => setFormData({...formData, subscription: e.target.value})}
                                >
                                    <option value="active">Active</option>
                                    <option value="trial">Free Trial</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="border-t border-slate-100 pt-6 space-y-4">
                                <h4 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Initial Biometric Device Setup (Optional)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Device Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Front Gate"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            value={formData.device_name}
                                            onChange={(e) => setFormData({...formData, device_name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Device Serial Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. ZK-102939"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            value={formData.device_serial}
                                            onChange={(e) => setFormData({...formData, device_serial: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">IP Address</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 192.168.1.100"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            value={formData.ip_address}
                                            onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Port</label>
                                        <input 
                                            type="number" 
                                            placeholder="5005"
                                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                            value={formData.port}
                                            onChange={(e) => setFormData({...formData, port: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Complete Onboarding
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Biometric Device Management Modal */}
            {isDeviceModalOpen && selectedCompany && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsDeviceModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden font-outfit border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Biometric Devices</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Manage machines for <strong>{selectedCompany.name}</strong> (ID: {selectedCompany.id})</p>
                            </div>
                            <button 
                                onClick={() => setIsDeviceModalOpen(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 text-xs font-bold"
                            >
                                Close
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Add Device Form */}
                            <form onSubmit={handleCreateDevice} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Register New Biometric Machine</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Device Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="e.g. Front Gate"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                            value={deviceName}
                                            onChange={(e) => setDeviceName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Serial Number</label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="e.g. ZK-102939"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                            value={deviceSerial}
                                            onChange={(e) => setDeviceSerial(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">IP Address (Optional)</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. 192.168.1.100"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                            value={deviceIp}
                                            onChange={(e) => setDeviceIp(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider pl-1">Port</label>
                                        <input 
                                            type="number" 
                                            required
                                            placeholder="5005"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500/20" 
                                            value={devicePort}
                                            onChange={(e) => setDevicePort(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all"
                                    >
                                        Register Device
                                    </button>
                                </div>
                            </form>

                            {/* Registered Devices List */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Registered Devices</h4>
                                
                                {loadingDevices ? (
                                    <div className="flex items-center justify-center py-10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                                        <Loader2 className="animate-spin mr-2 text-indigo-600" size={16} />
                                        Loading registered devices...
                                    </div>
                                ) : devices.length === 0 ? (
                                    <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-400">
                                        No biometric devices registered for this company.
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {devices.map((device) => (
                                            <div key={device.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-slate-800">{device.device_name}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                                            device.status === 'online' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {device.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-semibold space-y-0.5">
                                                        <p>Serial: <span className="text-slate-800 font-bold">{device.device_serial}</span></p>
                                                        <p>LAN Host: <span className="text-slate-800 font-bold">{device.ip_address}:{device.port}</span></p>
                                                        <p className="flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-100 p-2 rounded-xl mt-2 select-all">
                                                            <strong>API Key:</strong> <code className="text-indigo-600 font-mono text-[10px] break-all">{device.api_key}</code>
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteDevice(device.id)}
                                                    className="px-3.5 py-2 border border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all self-end md:self-center"
                                                >
                                                    Deregister
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Organization Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-outfit border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Edit Organization</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Modify tenant specifications</p>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateCompany} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Admin Email</label>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subscription State</label>
                                <select 
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    value={editFormData.subscription_status}
                                    onChange={(e) => setEditFormData({...editFormData, subscription_status: e.target.value})}
                                >
                                    <option value="active">Active</option>
                                    <option value="trial">Free Trial</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Maximum Employees Limit</label>
                                <input 
                                    type="number" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={editFormData.max_employees_limit || 100}
                                    onChange={(e) => setEditFormData({...editFormData, max_employees_limit: parseInt(e.target.value) || 0})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subscription Plan</label>
                                    <select 
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                        value={editFormData.subscription_plan || 'Starter'}
                                        onChange={(e) => setEditFormData({...editFormData, subscription_plan: e.target.value})}
                                    >
                                        <option value="Starter">Starter</option>
                                        <option value="Growth">Growth</option>
                                        <option value="Enterprise">Enterprise</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monthly Billing (₹)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        required
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                        value={editFormData.billing_amount || 49.00}
                                        onChange={(e) => setEditFormData({...editFormData, billing_amount: parseFloat(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Portal URL Slug</label>
                                <div className="flex items-center">
                                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3.5 py-2.5 rounded-l-xl border border-r-0 border-slate-200">/login/</span>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. hotelhighwayking"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-r-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                        value={editFormData.slug || ''}
                                        onChange={(e) => setEditFormData({...editFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium pl-1">Alphanumeric characters and hyphens only. Used for login: /login/slug</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Custom Organization Logo</label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden p-2 shrink-0">
                                        <img 
                                            src={companyLogoPreview || (editFormData.logo_url ? getAssetUrl(editFormData.logo_url) : '/uploads/branding/logo.png')} 
                                            alt="Tenant Logo Preview" 
                                            className="w-full h-full object-contain"
                                            onError={(e) => { e.target.src = '/uploads/branding/logo.png'; }}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            id="company-logo-upload"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    setCompanyLogoFile(file);
                                                    setCompanyLogoPreview(URL.createObjectURL(file));
                                                }
                                            }}
                                        />
                                        <label 
                                            htmlFor="company-logo-upload"
                                            className="cursor-pointer px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all inline-block"
                                        >
                                            Choose Logo
                                        </label>
                                        <p className="text-[10px] text-slate-400 font-medium">Recommended height: 36px (PNG, SVG, JPG)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tenant Accent / Brand Color</label>
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="color" 
                                        className="w-12 h-10 bg-transparent border-0 cursor-pointer p-0" 
                                        value={editFormData.brand_color || '#6366f1'}
                                        onChange={(e) => setEditFormData({...editFormData, brand_color: e.target.value})}
                                    />
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                        value={editFormData.brand_color || '#6366f1'}
                                        onChange={(e) => setEditFormData({...editFormData, brand_color: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Enabled Feature Modules</label>
                                <div className="flex gap-4">
                                    {['payroll', 'kudos', 'helpdesk'].map(feature => {
                                        const isChecked = (editFormData.enabled_features || []).includes(feature);
                                        return (
                                            <label key={feature} className="flex items-center gap-2 text-xs font-bold text-slate-700 capitalize cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => {
                                                        const current = editFormData.enabled_features || [];
                                                        const updated = isChecked 
                                                            ? current.filter(f => f !== feature)
                                                            : [...current, feature];
                                                        setEditFormData({...editFormData, enabled_features: updated});
                                                    }}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                />
                                                {feature}
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Admin Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPasswordModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden font-outfit border border-slate-200">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Reset Admin Password</h3>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Reset master key for <strong>{passwordData.companyName}</strong></p>
                            </div>
                        </div>

                        <form onSubmit={handleResetPassword} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">New Password</label>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Confirm Password</label>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" 
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                                >
                                    Reset Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCompanies;
