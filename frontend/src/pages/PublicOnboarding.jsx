import React, { useState, useEffect, useRef } from 'react';
import { 
    User, Mail, Briefcase, Calendar, Shield, CreditCard, Clock, 
    CheckCircle2, AlertCircle, Building2, Landmark, Home, 
    PhoneCall, Camera, Edit, X, Save, Check, Plus, Trash2, 
    FileText, Upload, GraduationCap, Award, MapPin, Activity, 
    Flag, Globe, Heart, Hash, FileCheck, Layers, Timer, Link2Off
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const isProd = import.meta.env.PROD;
const API_BASE_URL = isProd ? '/api' : 'http://localhost:5000/api';
const UPLOADS_BASE_URL = isProd ? '' : 'http://localhost:5000';

const PublicOnboarding = () => {
    const { token } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState({});
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [timeLeft, setTimeLeft] = useState('');

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE_URL}/public/onboarding/${token}`);
            setEmployee(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
            setError(err.response?.data?.message || err.message || 'Invalid or expired link');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [token]);

    // Countdown Timer Logic
    useEffect(() => {
        const startTimer = () => {
            if (!employee?.onboarding_token_created_at) {
                console.log(">>> [TIMER]: Waiting for creation timestamp...");
                return null;
            }
            console.log(">>> [TIMER]: Starting countdown for:", employee.onboarding_token_created_at);

            let dateStr = employee.onboarding_token_created_at;
            if (typeof dateStr === 'string') {
                dateStr = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
                if (!dateStr.includes('Z') && !dateStr.includes('+')) {
                    dateStr += 'Z';
                }
            }
            
            const createdDate = new Date(dateStr);
            if (isNaN(createdDate.getTime())) {
                console.error(">>> [TIMER]: Invalid creation date:", employee.onboarding_token_created_at);
                return null;
            }
            const expiryDate = new Date(createdDate.getTime() + 72 * 60 * 60 * 1000); // 72 hours (3 days)

            return setInterval(() => {
                const now = new Date();
                const diff = expiryDate - now;

                if (diff <= 0) {
                    setTimeLeft('EXPIRED');
                    setError('This onboarding link has expired. Please contact HR.');
                } else {
                    const hours = Math.floor(diff / (1000 * 60 * 60));
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                    setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);
        };

        const timerId = startTimer();
        return () => {
            if (timerId) clearInterval(timerId);
        };
    }, [employee?.onboarding_token_created_at]);

    const handleSave = async (fieldName, value) => {
        try {
            setSaving(true);
            await axios.patch(`${API_BASE_URL}/public/onboarding/${token}`, {
                [fieldName]: value
            });
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save information');
        } finally {
            setSaving(false);
        }
    };

    const handleBatchAdd = async (type, data) => {
        try {
            setSaving(true);
            await axios.patch(`${API_BASE_URL}/public/onboarding/${token}`, {
                [type]: [data]
            });
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add entry');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (file, documentType, customName = null) => {
        if (!file) return;
        if (isSectionFinalized('documents')) return alert('This section is finalized.');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);
        if (customName) formData.append('customName', customName);

        try {
            setUploading(prev => ({ ...prev, [documentType]: true }));
            await axios.post(`${API_BASE_URL}/public/onboarding/${token}/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(prev => ({ ...prev, [documentType]: false }));
        }
    };

    const handleDeleteRecord = async (type, id) => {
        if (!window.confirm('Are you sure you want to remove this record?')) return;
        try {
            setSaving(true);
            await axios.delete(`${API_BASE_URL}/public/onboarding/${token}/${type}/${id}`);
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove record');
        } finally {
            setSaving(false);
        }
    };

    const handleFinalizeSection = async (section) => {
        if (!window.confirm(`Finalize ${section}? You won't be able to edit this section again in this session.`)) return;
        try {
            setSaving(true);
            await axios.post(`${API_BASE_URL}/public/onboarding/${token}/finalize`, { section });
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to finalize');
        } finally {
            setSaving(false);
        }
    };

    const handleConfirmSubmit = async () => {
        if (!window.confirm('Are you sure you want to submit your onboarding? Once submitted, you will no longer be able to edit your details.')) return;
        try {
            setSaving(true);
            await axios.post(`${API_BASE_URL}/public/onboarding/${token}/confirm`);
            await fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit onboarding');
        } finally {
            setSaving(false);
        }
    };

    const isSectionFinalized = (section) => {
        return employee.onboarding_filled_fields?.includes(section);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white font-outfit">
            <div className="w-8 h-8 border-2 border-[#00BFA5]/10 border-t-[#00BFA5] rounded-full animate-spin" />
        </div>
    );

    if (error || employee?.onboarding_status === 'submitted') return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8 font-outfit text-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-bounce ${
                employee?.onboarding_status === 'submitted' ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'
            }`}>
                {employee?.onboarding_status === 'submitted' ? <CheckCircle2 size={48} /> : <Link2Off size={48} />}
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                {employee?.onboarding_status === 'submitted' ? 'SUBMITTED SUCCESSFULLY!' : 'LINK EXPIRED !!'}
            </h1>
            <p className="text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                {employee?.onboarding_status === 'submitted' 
                    ? "Thank you for completing your onboarding. Your details have been sent to HR for review. This link is now expired for security reasons."
                    : (error ? `Error: ${error}` : "Security Protocol: This onboarding portal is only active for 24 hours. Your session has timed out or the link is no longer valid.")
                }
            </p>
            <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <p className="text-sm font-bold text-slate-800 italic">
                    {employee?.onboarding_status === 'submitted' 
                        ? '"Your profile is now under HR review."' 
                        : '"Please contact your HR department for a new access token."'
                    }
                </p>
            </div>
            <div className="mt-12 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                Protected by MyFastHR Security
            </div>
        </div>
    );

    const tabs = [
        { id: 'profile', label: 'Employee & Personal', icon: User },
        { id: 'bank', label: 'Bank & Identification', icon: Landmark },
        { id: 'address', label: 'Address & Contact', icon: Home },
        { id: 'education', label: 'Education & Courses', icon: GraduationCap },
        { id: 'documents', label: 'Document Vault', icon: Shield }
    ];

    const isFieldFinalized = (fieldName) => {
        if (!employee || !employee.onboarding_filled_fields) return false;
        try {
            const fields = typeof employee.onboarding_filled_fields === 'string'
                ? JSON.parse(employee.onboarding_filled_fields)
                : employee.onboarding_filled_fields;
            return Array.isArray(fields) && fields.includes(fieldName);
        } catch (e) {
            return false;
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 pb-12">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4F46E5]/80 via-[#4338CA]/80 to-[#312E81]/80 backdrop-blur-md h-32 md:h-44 relative">
                <div className="max-w-7xl mx-auto px-6 h-full flex items-end pb-8">
                    <div className="flex items-center gap-6 translate-y-12">
                        <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-3xl shadow-2xl border-4 border-white flex items-center justify-center overflow-hidden">
                            {employee.photo ? (
                                <img src={`${UPLOADS_BASE_URL}/uploads/kyc/${employee.photo}`} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <User size={56} className="text-slate-200" />
                            )}
                        </div>
                        <div className="mb-4">
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-white leading-none tracking-tight">{employee.first_name} {employee.last_name}</h1>
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/20">Onboarding</span>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em] italic">{employee.company_name} • Welcome Aboard</p>
                            </div>
                        </div>
                    </div>
                    {/* Countdown Timer */}
                    <div className="ml-auto mb-16 hidden md:block">
                        <div className="bg-slate-900/30 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-2xl flex items-center gap-4">
                            <div className="p-2 bg-rose-500 rounded-xl text-white animate-pulse shadow-lg shadow-rose-500/20">
                                <Timer size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-white/70 uppercase tracking-widest leading-none mb-1">Session Expires In</p>
                                <p className="text-xl font-black text-white font-mono tracking-wider tabular-nums">
                                    {timeLeft || '24:00:00'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-24 md:h-28" />

            <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="lg:col-span-1 space-y-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                activeTab === tab.id 
                                ? 'bg-white shadow-xl shadow-indigo-100/50 text-[#00BFA5] scale-[1.02]' 
                                : 'text-slate-400 hover:bg-white hover:text-slate-600'
                            }`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${
                                activeTab === tab.id ? 'bg-[#00BFA5]/10' : 'bg-slate-100 group-hover:bg-slate-200'
                            }`}>
                                <tab.icon size={20} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}

                    <div className="mt-8 bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                            <AlertCircle size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Edit Policy</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-amber-700/80 font-medium">
                            You can edit any field <span className="font-bold underline text-amber-800">once</span>. Even if pre-filled, saving your changes will finalize that field forever.
                        </p>
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Mobile Countdown */}
                    <div className="md:hidden bg-white p-4 rounded-[1.5rem] border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3">
                            <Timer size={18} className="text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Time Remaining</span>
                        </div>
                        <span className="font-mono font-black text-rose-500">{timeLeft}</span>
                    </div>

                    {activeTab === 'profile' && (
                        <>
                            <Section title="Employee Information" icon={Briefcase}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                                    <EditableField label="Nick Name" fieldName="nick_name" value={employee.nick_name} isFinalized={isFieldFinalized('nick_name')} onSave={handleSave} icon={User} />
                                    <EditableField label="Gender" fieldName="gender" value={employee.gender} isFinalized={isFieldFinalized('gender')} type="select" options={['Male', 'Female', 'Other']} onSave={handleSave} icon={Layers} />
                                    <EditableField label="First Name" fieldName="first_name" value={employee.first_name} isFinalized={isFieldFinalized('first_name')} onSave={handleSave} icon={User} />
                                    <EditableField label="Last Name" fieldName="last_name" value={employee.last_name} isFinalized={isFieldFinalized('last_name')} onSave={handleSave} icon={User} />
                                    <EditableField label="Mobile" fieldName="phone" value={employee.phone} isFinalized={isFieldFinalized('phone')} type="tel" onSave={handleSave} icon={PhoneCall} />
                                    <EditableField label="Personal Email" fieldName="email" value={employee.email} isFinalized={isFieldFinalized('email')} type="email" onSave={handleSave} icon={Mail} />
                                    <EditableField label="Extension" fieldName="extension" value={employee.extension} isFinalized={isFieldFinalized('extension')} onSave={handleSave} icon={Hash} />
                                </div>
                            </Section>

                            <Section title="Personal Information" icon={Shield}>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10">
                                    <EditableField label="Date of Birth" fieldName="date_of_birth" value={employee.date_of_birth} isFinalized={isFieldFinalized('date_of_birth')} type="date" onSave={handleSave} icon={Calendar} />
                                    <EditableField label="Blood Group" fieldName="blood_group" value={employee.blood_group} isFinalized={isFieldFinalized('blood_group')} type="select" options={['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']} onSave={handleSave} icon={Activity} />
                                    <EditableField label="Father's Name" fieldName="father_name" value={employee.father_name} isFinalized={isFieldFinalized('father_name')} onSave={handleSave} icon={User} />
                                    <EditableField label="Marital Status" fieldName="marital_status" value={employee.marital_status} isFinalized={isFieldFinalized('marital_status')} type="select" options={['Single', 'Married', 'Divorced', 'Widowed']} onSave={handleSave} icon={Heart} />
                                    {employee.marital_status === 'Married' && (
                                        <>
                                            <EditableField label="Marriage Date" fieldName="marriage_date" value={employee.marriage_date} isFinalized={isFieldFinalized('marriage_date')} type="date" onSave={handleSave} icon={Calendar} />
                                            <EditableField label="Spouse Name" fieldName="spouse_name" value={employee.spouse_name} isFinalized={isFieldFinalized('spouse_name')} onSave={handleSave} icon={User} />
                                        </>
                                    )}
                                    <EditableField label="Nationality" fieldName="nationality" value={employee.nationality} isFinalized={isFieldFinalized('nationality')} onSave={handleSave} icon={Flag} />
                                    <EditableField label="Residential Status" fieldName="residential_status" value={employee.residential_status} isFinalized={isFieldFinalized('residential_status')} onSave={handleSave} icon={Globe} />
                                    <EditableField label="Place Of Birth" fieldName="birth_place" value={employee.birth_place} isFinalized={isFieldFinalized('birth_place')} onSave={handleSave} icon={MapPin} />
                                    <EditableField label="Religion" fieldName="religion" value={employee.religion} isFinalized={isFieldFinalized('religion')} onSave={handleSave} icon={Shield} />
                                    <EditableField label="Physically Challenged" fieldName="is_disabled" value={employee.is_disabled ? 'Yes' : 'No'} isFinalized={isFieldFinalized('is_disabled')} type="select" options={['No', 'Yes']} onSave={handleSave} icon={Activity} />
                                    <EditableField label="Personal Email (Alt)" fieldName="personal_email" value={employee.personal_email} isFinalized={isFieldFinalized('personal_email')} type="email" onSave={handleSave} icon={Mail} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <EditableField label="Height (cm)" fieldName="height" value={employee.height} isFinalized={isFieldFinalized('height')} onSave={handleSave} icon={Hash} />
                                        <EditableField label="Weight (kg)" fieldName="weight" value={employee.weight} isFinalized={isFieldFinalized('weight')} onSave={handleSave} icon={Hash} />
                                    </div>
                                    <EditableField label="Identification Mark" fieldName="id_mark" value={employee.id_mark} isFinalized={isFieldFinalized('id_mark')} onSave={handleSave} icon={Shield} />
                                    <EditableField label="Hobby" fieldName="hobby" value={employee.hobby} isFinalized={isFieldFinalized('hobby')} onSave={handleSave} icon={Heart} />
                                    <EditableField label="Caste" fieldName="caste" value={employee.caste} isFinalized={isFieldFinalized('caste')} onSave={handleSave} icon={Shield} />
                                </div>
                            </Section>
                        </>
                    )}

                    {activeTab === 'bank' && (
                        <Section title="Banking & Identification" icon={Landmark}>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                <EditableField label="Aadhaar Number" fieldName="aadhaar_number" value={employee.aadhaar_number} isFinalized={isFieldFinalized('aadhaar_number')} onSave={handleSave} icon={Shield} />
                                <EditableField label="PAN Number" fieldName="pan_number" value={employee.pan_number} isFinalized={isFieldFinalized('pan_number')} onSave={handleSave} icon={Shield} />
                                <EditableField label="Account Number" fieldName="account_number" value={employee.account_number} isFinalized={isFieldFinalized('account_number')} onSave={handleSave} icon={CreditCard} />
                                <EditableField label="IFSC Code" fieldName="ifsc_code" value={employee.ifsc_code} isFinalized={isFieldFinalized('ifsc_code')} onSave={handleSave} icon={Landmark} />
                                <EditableField label="Bank Name" fieldName="bank_name" value={employee.bank_name} isFinalized={isFieldFinalized('bank_name')} onSave={handleSave} icon={Building2} />
                                <EditableField label="Bank Branch" fieldName="bank_branch" value={employee.bank_branch} isFinalized={isFieldFinalized('bank_branch')} onSave={handleSave} icon={MapPin} />
                             </div>
                        </Section>
                    )}

                    {activeTab === 'address' && (
                        <>
                            <Section title="Address Information" icon={Home}>
                                <div className="space-y-10">
                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-[#00BFA5] uppercase tracking-widest mb-6">Present Address</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <EditableField label="Address Line" fieldName="present_address" value={employee.present_address} isFinalized={isFieldFinalized('present_address')} onSave={handleSave} icon={Home} />
                                            <EditableField label="City" fieldName="city" value={employee.city} isFinalized={isFieldFinalized('city')} onSave={handleSave} icon={MapPin} />
                                            <EditableField label="District" fieldName="district" value={employee.district} isFinalized={isFieldFinalized('district')} onSave={handleSave} icon={MapPin} />
                                            <EditableField label="State" fieldName="state" value={employee.state} isFinalized={isFieldFinalized('state')} onSave={handleSave} icon={Flag} />
                                            <EditableField label="Country" fieldName="country" value={employee.country} isFinalized={isFieldFinalized('country')} onSave={handleSave} icon={Globe} />
                                            <EditableField label="Pincode" fieldName="pincode" value={employee.pincode} isFinalized={isFieldFinalized('pincode')} onSave={handleSave} icon={Hash} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                                        <p className="text-[10px] font-black text-[#00BFA5] uppercase tracking-widest mb-6">Permanent Address</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <EditableField label="Address Line" fieldName="permanent_address" value={employee.permanent_address} isFinalized={isFieldFinalized('permanent_address')} onSave={handleSave} icon={Home} />
                                            <EditableField label="City" fieldName="permanent_city" value={employee.permanent_city} isFinalized={isFieldFinalized('permanent_city')} onSave={handleSave} icon={MapPin} />
                                            <EditableField label="Country" fieldName="permanent_country" value={employee.permanent_country} isFinalized={isFieldFinalized('permanent_country')} onSave={handleSave} icon={Globe} />
                                            <EditableField label="Pincode" fieldName="permanent_pincode" value={employee.permanent_pincode} isFinalized={isFieldFinalized('permanent_pincode')} onSave={handleSave} icon={Hash} />
                                        </div>
                                    </div>
                                </div>
                            </Section>

                            <Section title="Emergency Contact" icon={PhoneCall}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    <EditableField label="Contact Name" fieldName="emergency_contact_name" value={employee.emergency_contact_name} isFinalized={isFieldFinalized('emergency_contact_name')} onSave={handleSave} icon={User} />
                                    <EditableField label="Relationship" fieldName="emergency_contact_relation" value={employee.emergency_contact_relation} isFinalized={isFieldFinalized('emergency_contact_relation')} onSave={handleSave} icon={Heart} />
                                    <EditableField label="Mobile Number" fieldName="emergency_contact_number" value={employee.emergency_contact_number} isFinalized={isFieldFinalized('emergency_contact_number')} type="tel" onSave={handleSave} icon={PhoneCall} />
                                    <EditableField label="Email Address" fieldName="emergency_email" value={employee.emergency_email} isFinalized={isFieldFinalized('emergency_email')} type="email" onSave={handleSave} icon={Mail} />
                                    <EditableField label="Full Address" fieldName="emergency_contact_address" value={employee.emergency_contact_address} isFinalized={isFieldFinalized('emergency_contact_address')} onSave={handleSave} icon={Home} />
                                    <EditableField label="City" fieldName="emergency_city" value={employee.emergency_city} isFinalized={isFieldFinalized('emergency_city')} onSave={handleSave} icon={MapPin} />
                                </div>
                            </Section>
                        </>
                    )}

                    {activeTab === 'education' && (
                        <div className="space-y-8">
                            <Section title="Educational Background" icon={GraduationCap}>
                                <div className="space-y-6">
                                    {employee.education.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {employee.education.map(edu => (
                                                <div key={edu.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 group/edu">
                                                    <div className="p-2 bg-white rounded-lg text-indigo-500 shadow-sm"><GraduationCap size={16} /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{edu.institution_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{edu.degree} • {edu.passing_year}</p>
                                                        <p className="text-[9px] font-black text-indigo-600 uppercase mt-1 tracking-wider">{edu.percentage}%</p>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        {!isSectionFinalized('education') && (
                                                            <button 
                                                                onClick={() => handleDeleteRecord('education', edu.id)}
                                                                className="p-1.5 text-rose-400 hover:text-rose-600 opacity-0 group-hover/edu:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <CheckCircle2 size={14} className="text-[#00BFA5]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">No education entries yet</p>
                                    )}
                                    
                                    {!isSectionFinalized('education') ? (
                                        <>
                                            <MultiEntryForm 
                                                type="Education" 
                                                fields={[
                                                    { name: 'category', label: 'Type', type: 'select', options: ['School', 'University'] },
                                                    { name: 'institution_name', label: 'School/University Name', type: 'text' },
                                                    { name: 'degree', label: 'Degree/Class', type: 'text' },
                                                    { name: 'percentage', label: 'Percentage/GPA', type: 'text' },
                                                    { name: 'passing_year', label: 'Passing Year', type: 'text' }
                                                ]}
                                                onSave={(data) => handleBatchAdd('education', data)}
                                            />
                                            {employee.education.length > 0 && (
                                                <button 
                                                    onClick={() => handleFinalizeSection('education')}
                                                    className="w-full py-3 bg-[#00BFA5] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#00BFA5]/20 flex items-center justify-center gap-3"
                                                >
                                                    <Check size={16} /> Confirm & Lock Education
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3">
                                            <Shield size={16} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Education Details Finalized</span>
                                        </div>
                                    )}
                                </div>
                            </Section>

                            <Section title="Professional Courses" icon={Award}>
                                <div className="space-y-6">
                                    {employee.courses.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {employee.courses.map(course => (
                                                <div key={course.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-4 group/course">
                                                    <div className="p-2 bg-white rounded-lg text-amber-500 shadow-sm"><Award size={16} /></div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800">{course.course_name}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium">{course.institute_name}</p>
                                                        <p className="text-[9px] font-black text-amber-600 uppercase mt-1 tracking-wider">{course.duration}</p>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-2">
                                                        {!isSectionFinalized('courses') && (
                                                            <button 
                                                                onClick={() => handleDeleteRecord('course', course.id)}
                                                                className="p-1.5 text-rose-400 hover:text-rose-600 opacity-0 group-hover/course:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                        <CheckCircle2 size={14} className="text-[#00BFA5]" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-slate-400 text-[11px] font-bold uppercase tracking-widest bg-slate-50 rounded-2xl border border-dashed border-slate-200">No courses added yet</p>
                                    )}
                                    
                                    {!isSectionFinalized('courses') ? (
                                        <>
                                            <MultiEntryForm 
                                                type="Course" 
                                                fields={[
                                                    { name: 'course_name', label: 'Course Name', type: 'text' },
                                                    { name: 'institute_name', label: 'Institute Name', type: 'text' },
                                                    { name: 'duration', label: 'Duration of Course', type: 'text' }
                                                ]}
                                                onSave={(data) => handleBatchAdd('courses', data)}
                                            />
                                            {employee.courses.length > 0 && (
                                                <button 
                                                    onClick={() => handleFinalizeSection('courses')}
                                                    className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3"
                                                >
                                                    <Check size={16} /> Confirm & Lock Courses
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center justify-center gap-3">
                                            <Shield size={16} className="text-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Courses Finalized</span>
                                        </div>
                                    )}
                                </div>
                            </Section>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <Section title="Document Vault" icon={Shield}>
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <DocUploadItem label="Aadhar Card" type="Aadhar Card" icon={Shield} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Aadhar Card']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="PAN Card" type="Pan Card" icon={Shield} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Pan Card']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Resume" type="Resume" icon={FileText} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Resume']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Experience DOC" type="Previous Experience DOC" icon={Briefcase} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Previous Experience DOC']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="NOC" type="NOC" icon={CheckCircle2} employee={employee} onUpload={handleFileUpload} isUploading={uploading['NOC']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Offer Letter" type="Offer Letter" icon={Mail} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Offer Letter']} isMultiple isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Salary Slip" type="Salary Slip" icon={CreditCard} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Salary Slip']} isMultiple isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="10th Marksheet" type="10th Marksheet" icon={GraduationCap} employee={employee} onUpload={handleFileUpload} isUploading={uploading['10th Marksheet']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="12th Marksheet" type="12th Marksheet" icon={GraduationCap} employee={employee} onUpload={handleFileUpload} isUploading={uploading['12th Marksheet']} isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Degree" type="Degree" icon={GraduationCap} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Degree']} isMultiple needsCustomName isLocked={isSectionFinalized('documents')} />
                                    <DocUploadItem label="Other Document" type="Other" icon={Plus} employee={employee} onUpload={handleFileUpload} isUploading={uploading['Other']} isMultiple needsCustomName isLocked={isSectionFinalized('documents')} />
                                </div>

                                {!isSectionFinalized('documents') ? (
                                    <button 
                                        onClick={() => handleFinalizeSection('documents')}
                                        className="w-full py-4 bg-[#00BFA5] text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#00BFA5]/20 flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Shield size={20} /> Confirm & Lock Document Vault
                                    </button>
                                ) : (
                                    <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 flex items-center justify-center gap-4">
                                        <div className="p-2 bg-emerald-500 text-white rounded-xl"><Check size={20} /></div>
                                        <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Document Vault Securely Locked</p>
                                    </div>
                                )}
                            </div>
                        </Section>
                    )}

                    {/* Final Confirmation Button */}
                    <div className="pt-12 border-t border-slate-100">
                        <button 
                            onClick={handleConfirmSubmit}
                            disabled={saving}
                            className="w-full py-6 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-slate-900/20 flex flex-col items-center justify-center gap-2 group hover:bg-slate-800 transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3">
                                {saving ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <CheckCircle2 size={24} className="text-[#00BFA5] group-hover:scale-125 transition-transform" />
                                )}
                                <span className="text-lg font-black uppercase tracking-widest">Confirm & Submit Onboarding</span>
                            </div>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">This will finalize all details and expire this link</p>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};

const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-10 py-6 border-b border-slate-50 flex items-center justify-between bg-gradient-to-r from-white to-slate-50/50">
            <div className="flex items-center gap-4">
                <div className="p-2.5 bg-[#00BFA5]/10 rounded-xl text-[#00BFA5]">
                    <Icon size={20} />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-800">{title}</h3>
            </div>
        </div>
        <div className="p-10">
            {children}
        </div>
    </div>
);

const EditableField = ({ 
    label, value, fieldName, onSave, icon: Icon,
    type = 'text', options = [], isFinalized = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value || '');
    const isEmpty = value === null || value === '' || value === '-';

    const save = () => {
        onSave(fieldName, editValue);
        setIsEditing(false);
    };

    const displayValue = () => {
        if (isEmpty) return 'Not Provided';
        if (type === 'date') {
            const date = new Date(value);
            return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
        return value;
    };

    return (
        <div className="group relative">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-slate-50 text-slate-400 rounded-md">
                    <Icon size={12} />
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            </div>
            
            {isEditing ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
                    {type === 'select' ? (
                        <select 
                            autoFocus
                            className="flex-1 bg-white border-2 border-[#00BFA5]/20 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#00BFA5]/5 transition-all"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                        >
                            <option value="">Select...</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    ) : (
                        <input 
                            autoFocus
                            type={type}
                            className="flex-1 bg-white border-2 border-[#00BFA5]/20 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-4 focus:ring-[#00BFA5]/5 transition-all"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                        />
                    )}
                    <button onClick={save} className="p-2.5 bg-[#00BFA5] text-white rounded-xl shadow-lg shadow-[#00BFA5]/20 hover:scale-105 active:scale-95 transition-all"><Check size={16} /></button>
                    <button onClick={() => setIsEditing(false)} className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition-all"><X size={16} /></button>
                </div>
            ) : (
                <div className="flex items-center justify-between group-hover:bg-slate-50/50 -mx-3 px-3 py-2 rounded-xl transition-all">
                    <p className={`text-xs font-bold tracking-tight ${isEmpty ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                        {displayValue()}
                    </p>
                    {!isFinalized ? (
                        <button 
                            onClick={() => {
                                setEditValue(value || '');
                                setIsEditing(true);
                            }}
                            className="p-1.5 bg-[#00BFA5]/5 text-[#00BFA5] rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#00BFA5]/10"
                        >
                            <Edit size={14} />
                        </button>
                    ) : (
                        <div className="p-1 text-[#00BFA5]">
                            <CheckCircle2 size={14} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const MultiEntryForm = ({ type, fields, onSave }) => {
    const [show, setShow] = useState(false);
    const [formData, setFormData] = useState({});

    const save = () => {
        onSave(formData);
        setFormData({});
        setShow(false);
    };

    if (!show) return (
        <button 
            onClick={() => setShow(true)}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#00BFA5] hover:text-[#00BFA5] hover:bg-[#00BFA5]/5 transition-all flex items-center justify-center gap-3 group"
        >
            <div className="p-1 bg-slate-100 group-hover:bg-[#00BFA5]/10 rounded-md"><Plus size={14} /></div>
            <span className="text-[10px] font-black uppercase tracking-widest">Add {type} Details</span>
        </button>
    );

    return (
        <div className="bg-slate-50 p-6 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">New {type} Entry</p>
                <button onClick={() => setShow(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fields.map(f => (
                    <div key={f.name} className="space-y-1.5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{f.label}</p>
                        {f.type === 'select' ? (
                            <select 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20"
                                value={formData[f.name] || ''}
                                onChange={(e) => setFormData({...formData, [f.name]: e.target.value})}
                            >
                                <option value="">Select...</option>
                                {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        ) : (
                            <input 
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20"
                                value={formData[f.name] || ''}
                                onChange={(e) => setFormData({...formData, [f.name]: e.target.value})}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="mt-8 flex justify-end gap-3">
                <button onClick={() => setShow(false)} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">Cancel</button>
                <button onClick={save} className="px-8 py-2 bg-[#00BFA5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#00BFA5]/20 hover:scale-105 active:scale-95 transition-all">Add Entry</button>
            </div>
        </div>
    );
};

const DocUploadItem = ({ 
    label, type, icon: Icon, employee, onUpload, 
    isUploading, isMultiple = false, needsCustomName = false,
    isLocked = false 
}) => {
    const [customName, setCustomName] = useState('');
    const fileInputRef = useRef(null);
    
    const existingDocs = employee.documents.filter(d => d.document_type === type);
    const isDone = existingDocs.length > 0 && !isMultiple;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file, type, needsCustomName ? customName : null);
            setCustomName('');
        }
    };

    return (
        <div className={`p-6 rounded-3xl border transition-all ${
            isDone ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/30 border-slate-100 hover:border-[#00BFA5]/30'
        }`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isDone ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-400 shadow-sm'}`}>
                        <Icon size={18} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{label}</p>
                        {isDone && <p className="text-[9px] font-black text-emerald-600 uppercase mt-0.5 tracking-wider">Uploaded</p>}
                    </div>
                </div>
                {isDone && <CheckCircle2 size={16} className="text-emerald-500" />}
            </div>

            <div className="space-y-3">
                {existingDocs.map(doc => (
                    <div key={doc.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-emerald-100/50 shadow-sm group/doc">
                        <FileCheck size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-600 truncate flex-1">{doc.custom_name || doc.file_name}</span>
                        {!isLocked && doc.uploaded_by === 'employee' && (
                            <button 
                                onClick={() => handleDeleteRecord('document', doc.id)}
                                className="p-1 text-rose-400 hover:text-rose-600 opacity-0 group-hover/doc:opacity-100 transition-all"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}

                {(!isDone || isMultiple) && (
                    <div className="space-y-3">
                        {needsCustomName && (
                            <input 
                                placeholder="Enter document name..."
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-[#00BFA5]/20"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        )}
                        <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />
                        <button 
                            disabled={isUploading || (needsCustomName && !customName) || isLocked}
                            onClick={() => fileInputRef.current.click()}
                            className={`w-full py-3 rounded-2xl flex items-center justify-center gap-3 transition-all ${
                                (needsCustomName && !customName) || isLocked
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-white border-2 border-dashed border-slate-200 text-slate-400 hover:border-[#00BFA5] hover:text-[#00BFA5] hover:bg-[#00BFA5]/5'
                            }`}
                        >
                            {isUploading ? (
                                <div className="w-4 h-4 border-2 border-[#00BFA5]/20 border-t-[#00BFA5] rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Upload size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {existingDocs.length > 0 ? 'Upload More' : 'Upload File'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PublicOnboarding;
