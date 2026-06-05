import React, { useState, useEffect } from 'react';
import { 
    User, Mail, Smartphone, MapPin, Briefcase, Calendar, 
    Shield, CreditCard, Clock, CheckCircle2, AlertCircle, 
    Building2, Users, UserCheck, Check, FileText, 
    MoreHorizontal, Download, ExternalLink, Hash, 
    Globe, Phone, Flag, Heart, Award, Landmark,
    ChevronRight, Wallet, ArrowRight, Zap, Target, Edit, X, Plus, Trash2, Key,
    Eye, EyeOff, Camera, Home, PhoneCall, HeartPulse, GraduationCap, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api, { getAssetUrl } from '../utils/api';
import SearchableSelect from '../components/common/SearchableSelect';

const Profile = () => {
    const navigate = useNavigate();
    const currentUserRole = localStorage.getItem('user_role');
    const [profile, setProfile] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [docFilter, setDocFilter] = useState('all'); // all, admin, employee
    const [uploading, setUploading] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [editValue, setEditValue] = useState('');
    // Change Password States
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [changingPasswordSubmitting, setChangingPasswordSubmitting] = useState(false);

    // Section Editing State
    const [activeEditSection, setActiveEditSection] = useState(null);
    const [sectionFormData, setSectionFormData] = useState({});
    const [maskedFields, setMaskedFields] = useState({
        mobile: true,
        personal_email: true,
        dob: true,
        marriage_date: true,
        aadhaar: true,
        pan: true,
        account_number: true,
        ifsc: true,
        present_address: true,
        permanent_address: true
    });

    const [fieldOptions, setFieldOptions] = useState({
        designation: ['Senior Software Engineer', 'Product Manager', 'HR Manager', 'Digital Marketing Intern'],
        department: ['Technology', 'Human Resources', 'Operations', 'Marketing'],
        location: ['Remote', 'Headquarters', 'Mumbai Office', 'Gurugram'],
        shift: ['Day Shift', 'Night Shift', 'Rotation'],
        bank_name: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'],
        status: ['Confirmed', 'External', 'Internal', 'Probation', 'Intern']
    });

    const [isEditingAssets, setIsEditingAssets] = useState(false);
    const [editingAssetId, setEditingAssetId] = useState(null);
    const [assetData, setAssetData] = useState({});

    // Education State
    const [isAddingEdu, setIsAddingEdu] = useState(false);
    const [editingEduId, setEditingEduId] = useState(null);
    const [eduData, setEduData] = useState({
        institution_name: '',
        degree: '',
        percentage: '',
        passing_year: '',
        category: 'University'
    });

    // Course State
    const [isAddingCourse, setIsAddingCourse] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState(null);
    const [courseData, setCourseData] = useState({
        course_name: '',
        institute_name: '',
        duration: ''
    });

    // Salary State
    const [salaryData, setSalaryData] = useState({
        base_salary: '',
        allowances: [],
        deductions: []
    });
    const [isEditingSalary, setIsEditingSalary] = useState(false);

    // Document Upload Modal State
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [docData, setDocData] = useState({
        documentType: 'Other',
        customName: '',
        file: null
    });
    const [docSubmitting, setDocSubmitting] = useState(false);

    const toggleMask = (field) => {
        setMaskedFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const fetchProfile = async (id) => {
        try {
            setLoading(true);
            const endpoint = id ? `/employees/${id}` : '/profile/me';
            const res = await api.get(endpoint);
            if (res) {
                if (id) {
                    res.role_name = res.role_name || 'employee';
                } else if (res.employee) {
                    res.employee.role_name = res.role_name || 'employee';
                }
            }
            const emp = id ? res : res.employee;
            if (emp) {
                emp.department = emp.department_name || emp.department || '';
                emp.shift = emp.shift_name || emp.shift || '';
            }
            setProfile(id ? { employee: res, role_name: res.role_name } : res);
            setAssetData({
                handover_date: '',
                handover_by: '',
                reporting_to: '',
                name: '',
                code: '',
                remark: ''
            });
            // Fetch Salary Structure
            const empId = id || res.employee?.id || res.id;
            try {
                const salRes = await api.get(`/payroll/salary-structure/${empId}`);
                if (salRes && salRes.base_salary) {
                    const safeParse = (val) => {
                        if (!val) return [];
                        if (typeof val === 'string') {
                            try {
                                let parsed = JSON.parse(val);
                                if (typeof parsed === 'string') parsed = JSON.parse(parsed);
                                return Array.isArray(parsed) ? parsed : [];
                            } catch (e) { return []; }
                        }
                        return Array.isArray(val) ? val : [];
                    };
                    setSalaryData({
                        base_salary: salRes.base_salary,
                        allowances: safeParse(salRes.allowances),
                        deductions: safeParse(salRes.deductions)
                    });
                }
            } catch(e) { console.log('No salary data yet'); }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchDocuments = async (id) => {
        try {
            const endpoint = id ? `/documents?employeeId=${id}` : '/documents';
            const res = await api.get(endpoint);
            setDocuments(res);
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
    };

    const fetchAssets = async (id) => {
        if (!id) return;
        try {
            const res = await api.get(`/employees/${id}/assets`);
            setAssets(res);
        } catch (err) {
            console.error('Failed to fetch assets', err);
        }
    };

    const handleDeleteAsset = async (assetId) => {
        if (!window.confirm('Are you sure you want to remove this asset?')) return;
        try {
            const queryParams = new URLSearchParams(window.location.search);
            const employeeId = queryParams.get('id');
            await api.delete(`/employees/${employeeId}/assets/${assetId}`);
            fetchAssets(employeeId);
        } catch (err) {
            console.error('Failed to delete asset', err);
            alert('Failed to delete asset');
        }
    };

    const handleSaveEdu = async () => {
        if (!profile?.employee?.id) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            if (editingEduId) {
                await api.put(`/employees/${employeeId}/education/${editingEduId}`, eduData);
            } else {
                await api.post(`/employees/${employeeId}/education`, eduData);
            }
            await fetchProfile(employeeId);
            setIsAddingEdu(false);
            setEditingEduId(null);
            setEduData({ institution_name: '', degree: '', percentage: '', passing_year: '', category: 'University' });
        } catch (err) {
            console.error('Failed to save education:', err);
            alert('Failed to save education');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteEdu = async (eduId) => {
        if (!window.confirm('Are you sure you want to remove this record?')) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            await api.delete(`/employees/${employeeId}/education/${eduId}`);
            await fetchProfile(employeeId);
        } catch (err) {
            console.error('Failed to delete education:', err);
            alert('Failed to delete record');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCourse = async () => {
        if (!profile?.employee?.id) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            if (editingCourseId) {
                await api.put(`/employees/${employeeId}/courses/${editingCourseId}`, courseData);
            } else {
                await api.post(`/employees/${employeeId}/courses`, courseData);
            }
            await fetchProfile(employeeId);
            setIsAddingCourse(false);
            setEditingCourseId(null);
            setCourseData({ course_name: '', institute_name: '', duration: '' });
        } catch (err) {
            console.error('Failed to save course:', err);
            alert('Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to remove this record?')) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            await api.delete(`/employees/${employeeId}/courses/${courseId}`);
            await fetchProfile(employeeId);
        } catch (err) {
            console.error('Failed to delete course:', err);
            alert('Failed to delete record');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveDocument = async () => {
        if (!docData.file) {
            alert('Please select a file');
            return;
        }
        
        const empId = profile?.employee?.id;
        if (!empId) {
            alert('Employee profile not loaded yet');
            return;
        }

        setDocSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('document', docData.file);
            formData.append('documentType', docData.documentType);
            if (docData.customName) {
                formData.append('customName', docData.customName);
            }

            const queryParams = new URLSearchParams(window.location.search);
            const idQuery = queryParams.get('id');

            let endpoint;
            if (idQuery) {
                endpoint = `/documents/employee/${empId}/upload`;
            } else {
                endpoint = `/documents/upload`;
            }

            await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert('Document uploaded successfully');
            setIsUploadingDoc(false);
            setDocData({ documentType: 'Other', customName: '', file: null });
            await fetchDocuments(idQuery);
        } catch (err) {
            console.error('Failed to upload document:', err);
            alert(err.response?.data?.message || 'Failed to upload document');
        } finally {
            setDocSubmitting(false);
        }
    };

    const handleSaveSalary = async () => {
        if (!profile?.employee?.id) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            const base_salary = salaryData.base_salary === '' ? 0 : parseFloat(salaryData.base_salary) || 0;
            const allowances = (salaryData.allowances || []).map(al => ({
                ...al,
                amount: al.amount === '' ? 0 : parseFloat(al.amount) || 0
            }));
            const deductions = (salaryData.deductions || []).map(dd => ({
                ...dd,
                amount: dd.amount === '' ? 0 : parseFloat(dd.amount) || 0
            }));
            await api.post(`/payroll/salary-structure/${employeeId}`, {
                base_salary,
                allowances: JSON.stringify(allowances),
                deductions: JSON.stringify(deductions)
            });
            alert('Salary structure updated successfully');
            setIsEditingSalary(false);
        } catch (err) {
            console.error('Failed to save salary:', err);
            alert('Failed to save salary structure');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const employeeId = queryParams.get('id');
        fetchProfile(employeeId);
        fetchDocuments(employeeId);
        fetchAssets(employeeId);
        fetchProfileOptions();
    }, []);

    const fetchProfileOptions = async () => {
        try {
            const [designations, locations, depts, shifts] = await Promise.all([
                api.get('/employees/options/designation').catch(() => []),
                api.get('/employees/options/office_location').catch(() => []),
                api.get('/org/departments').catch(() => []),
                api.get('/attendance/shift-list').catch(() => [])
            ]);

            setFieldOptions(prev => ({
                ...prev,
                designation: Array.isArray(designations) && designations.length > 0 ? designations : prev.designation,
                location: Array.isArray(locations) && locations.length > 0 ? locations : prev.location,
                department: Array.isArray(depts) && depts.length > 0 
                    ? depts.map(d => ({ label: d.name, value: d.name, id: d.id })) 
                    : prev.department,
                shift: Array.isArray(shifts) && shifts.length > 0 
                    ? shifts.map(s => ({ label: s.name, value: s.name, id: s.id })) 
                    : prev.shift
            }));
        } catch (err) {
            console.error('Failed to fetch profile options:', err);
        }
    };

    const handleStartEdit = (name, label, value, type = 'text') => {
        setEditingField({ name, label, type });
        setEditValue(value || '');
    };

    const handleSectionEditStart = (sectionName, fields) => {
        setActiveEditSection(sectionName);
        const initialData = {};
        fields.forEach(field => {
            initialData[field] = profile.employee[field] || '';
        });
        if (sectionName === 'current_position') {
            initialData.department_id = profile.employee.department_id || '';
            initialData.shift_id = profile.employee.shift_id || '';
        }
        setSectionFormData(initialData);
    };

    const handleSectionSave = async () => {
        if (!activeEditSection || !profile?.employee?.id) return;
        try {
            setLoading(true);
            const cleanedData = { ...sectionFormData };
            if (cleanedData.probation_period === '') cleanedData.probation_period = 0;
            if (cleanedData.notice_period === '') cleanedData.notice_period = 0;
            await api.put(`/employees/${profile.employee.id}`, cleanedData);
            await fetchProfile(profile.employee.id);
            setActiveEditSection(null);
            alert('Section updated successfully');
        } catch (err) {
            console.error('Failed to save section:', err);
            alert('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const handleSectionFieldChange = (name, value) => {
        let extraFields = {};
        if (name === 'department') {
            const selectedDept = fieldOptions.department?.find(d => (typeof d === 'string' ? d === value : d.value === value));
            extraFields.department_id = selectedDept && typeof selectedDept !== 'string' ? selectedDept.id : '';
        } else if (name === 'shift') {
            const selectedShift = fieldOptions.shift?.find(s => (typeof s === 'string' ? s === value : s.value === value));
            extraFields.shift_id = selectedShift && typeof selectedShift !== 'string' ? selectedShift.id : '';
        }

        setSectionFormData(prev => ({ 
            ...prev, 
            [name]: value,
            ...extraFields
        }));
    };

    const handleSaveEdit = async () => {
        if (!editingField || !profile?.employee?.id) return;
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            const updateKey = editingField.name === 'status' ? 'company_status' : editingField.name;
            
            await api.put(`/employees/${employeeId}`, {
                [updateKey]: editValue
            });
            
            await fetchProfile(employeeId);
            setEditingField(null);
        } catch (err) {
            console.error('Failed to save edit:', err);
            alert('Failed to save changes');
        } finally {
            setLoading(false);
        }
    };

    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploadingPhoto(true);
        try {
            const queryParams = new URLSearchParams(window.location.search);
            const employeeId = queryParams.get('id') || profile?.employee?.id;
            const res = await api.post(`/employees/${employeeId}/photo`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // Force a reload or update the state with the full URL
            setProfile(prev => ({
                ...prev,
                employee: { ...prev.employee, photo: res.photo }
            }));
            alert('Profile photo updated successfully');
        } catch (err) {
            console.error('Photo upload error:', err);
            alert(err.response?.data?.message || 'Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSaveAssets = async () => {
        try {
            setLoading(true);
            const employeeId = profile.employee.id;
            if (editingAssetId) {
                await api.put(`/employees/${employeeId}/assets/${editingAssetId}`, assetData);
            } else {
                await api.post(`/employees/${employeeId}/assets`, assetData);
            }
            await fetchAssets(employeeId);
            setIsEditingAssets(false);
            setEditingAssetId(null);
            setAssetData({
                handover_date: '',
                handover_by: '',
                reporting_to: '',
                name: '',
                code: '',
                remark: ''
            });
            alert(editingAssetId ? 'Asset updated successfully' : 'Asset added successfully');
        } catch (err) {
            console.error('Failed to save asset:', err);
            alert('Failed to save asset details');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePasswordSubmit = async () => {
        if (!newPassword) {
            setPasswordError("New Password is required");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        setChangingPasswordSubmitting(true);
        setPasswordError('');
        setPasswordSuccess('');

        try {
            await api.post('/auth/change-password', {
                password: newPassword
            });

            setPasswordSuccess('Password updated successfully!');
            setTimeout(() => {
                setIsChangingPassword(false);
                setNewPassword('');
                setConfirmPassword('');
                setPasswordSuccess('');
            }, 1500);
        } catch (err) {
            console.error('Change Password Error:', err);
            setPasswordError(err.response?.data?.message || 'Failed to update password');
        } finally {
            setChangingPasswordSubmitting(false);
        }
    };

    if (loading && !profile) return (

        <div className="min-h-screen flex items-center justify-center bg-white font-outfit">
            <div className="w-8 h-8 border-2 border-[#00BFA5]/10 border-t-[#00BFA5] rounded-full animate-spin" />
        </div>
    );
    
    if (!profile) return (
        <div className="min-h-screen flex items-center justify-center bg-white p-8">
            <p className="text-sm font-bold text-black uppercase tracking-widest">Profile Not Found</p>
        </div>
    );

    const employee = profile.employee || {};
    const queryParams = new URLSearchParams(window.location.search);
    const employeeIdQuery = queryParams.get('id');
    const isOwnProfile = !employeeIdQuery || (employee.id && String(employee.id) === String(localStorage.getItem('employee_id')));
    const onboardingFields = Array.isArray(employee.onboarding_filled_fields) ? employee.onboarding_filled_fields : [];

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        if (String(dateStr).includes('1899') || String(dateStr).includes('0000-00-00')) return '-';
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
            }
            return dateStr;
        } catch (e) {
            return dateStr;
        }
    };

    const getExperience = (dateStr) => {
        if (!dateStr) return '-';
        const start = new Date(dateStr);
        const now = new Date();
        const diff = now.getFullYear() - start.getFullYear();
        return `${diff}Y`;
    };

    const isUpdatedByEmployee = (sectionKey) => {
        try {
            const filledFields = typeof employee.onboarding_filled_fields === 'string'
                ? JSON.parse(employee.onboarding_filled_fields)
                : (employee.onboarding_filled_fields || []);
            return filledFields.includes(sectionKey);
        } catch (e) { return false; }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-outfit text-slate-700 pb-12">
            {/* Hidden Photo Input */}
            <input 
                type="file" 
                id="photoInput" 
                className="hidden" 
                accept="image/*"
                onChange={handlePhotoUpload}
            />
            {/* --- CORPORATE HEADER BANNER --- */}
            <div className="bg-gradient-to-r from-[#4F46E5]/80 via-[#4338CA]/80 to-[#312E81]/80 backdrop-blur-md relative h-28 md:h-36">
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
                <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-5 mt-10 md:mt-16">
                        <div 
                            className="w-20 h-20 md:w-28 md:h-28 bg-white rounded-xl shadow-xl border-4 border-white flex items-center justify-center text-slate-200 overflow-hidden relative group cursor-pointer"
                            onClick={() => document.getElementById('photoInput').click()}
                        >
                            {employee.photo ? (
                                <img 
                                    src={getAssetUrl(`/uploads/kyc/${employee.photo}`)} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => {
                                        console.error('Image load failed');
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'block';
                                    }}
                                />
                            ) : null}
                            <div style={{ display: employee.photo ? 'none' : 'block' }}>
                                <User size={48} strokeWidth={1.5} className="text-slate-300" />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="text-white flex flex-col items-center gap-1">
                                    <Camera size={20} />
                                    <span className="text-[8px] font-bold uppercase tracking-widest">Change</span>
                                </div>
                            </div>
                            {uploadingPhoto && (
                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                    <div className="w-6 h-6 border-2 border-[#00BFA5] border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                        <div className="mt-8 text-white">
                            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                                {employee.first_name} {employee.last_name}
                            </h1>
                            <p className="text-white/80 text-xs md:text-sm font-medium">#{employee.employee_id_number}</p>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10 md:mt-16 self-center md:self-end mb-4 flex-wrap">
                        {/* Change Password (Users viewing their own profile) */}
                        {isOwnProfile && (
                            <button 
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-md rounded-lg text-white border border-indigo-400/20 transition-all group"
                                onClick={() => setIsChangingPassword(true)}
                            >
                                <Key size={14} className="group-hover:rotate-45 transition-transform duration-300" />
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Change Password</span>
                            </button>
                        )}

                        {/* Onboarding Link (Admin/Manager Only, when viewing other profiles) */}
                        {!isOwnProfile && currentUserRole !== 'employee' && (
                            <button 
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-indigo-600 hover:bg-indigo-700 backdrop-blur-md rounded-lg text-white border border-indigo-400/20 transition-all group"
                                onClick={async () => {
                                    try {
                                        const res = await api.post(`/employees/${employee.id}/generate-token`);
                                        const link = `${window.location.origin}/public/onboarding/${res.token}`;
                                        await navigator.clipboard.writeText(link);
                                        alert('Onboarding Link Copied to Clipboard!');
                                    } catch (err) {
                                        console.error('Link Generation Error:', err);
                                        alert(`Failed to generate link: ${err.response?.data?.message || err.message}`);
                                    }
                                }}
                            >
                                <ExternalLink size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Share Link</span>
                            </button>
                        )}

                        {/* Password Reset/Setup Link (Admin/Manager Only, when viewing other profiles) */}
                        {!isOwnProfile && currentUserRole !== 'employee' && (
                            <button 
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-amber-600 hover:bg-amber-700 backdrop-blur-md rounded-lg text-white border border-amber-400/20 transition-all group"
                                onClick={async () => {
                                    try {
                                        const res = await api.post(`/employees/${employee.id}/generate-password-token`);
                                        const link = `${window.location.origin}/set-password?token=${res.token}`;
                                        await navigator.clipboard.writeText(link);
                                        alert('Password Reset/Setup Link Copied to Clipboard!');
                                    } catch (err) {
                                        console.error('Password Link Generation Error:', err);
                                        alert(`Failed to generate password link: ${err.response?.data?.message || err.message}`);
                                    }
                                }}
                            >
                                <ExternalLink size={14} className="group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Pass Link</span>
                            </button>
                        )}

                        {/* Regenerate Credentials (when viewing other profiles) */}
                        {!isOwnProfile && (
                            <button 
                                className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-emerald-600 hover:bg-emerald-700 backdrop-blur-md rounded-lg text-white border border-emerald-400/20 transition-all group"
                                onClick={async () => {
                                    if (!window.confirm('Are you sure you want to regenerate credentials? This will immediately reset the password.')) return;
                                    try {
                                        const res = await api.post(`/employees/${employee.id}/credentials`);
                                        alert(`New credentials generated successfully!\nNew Password: ${res.password}`);
                                    } catch (err) {
                                        console.error('Password Regeneration Error:', err);
                                        alert(`Failed to regenerate credentials: ${err.response?.data?.message || err.message}`);
                                    }
                                }}
                            >
                                <Key size={14} className="group-hover:rotate-45 transition-transform duration-300" />
                                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">Generate Pass</span>
                            </button>
                        )}

                        {/* Update Photo (Everyone, always) */}
                        <button 
                            className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-white border border-white/20 transition-all group"
                            onClick={() => document.getElementById('photoInput').click()}
                            disabled={uploadingPhoto}
                        >
                            <Camera size={14} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-widest">{uploadingPhoto ? 'Uploading...' : 'Update Photo'}</span>
                        </button>

                        {/* Delete Profile (Admin/Manager Only, when viewing other profiles) */}
                        {!isOwnProfile && currentUserRole !== 'employee' && (
                            <button 
                                className="p-2 bg-white/20 hover:bg-red-500 hover:border-red-400 backdrop-blur-md text-white rounded-lg transition-all border border-white/20"
                                onClick={async () => {
                                    if (!window.confirm('Are you sure you want to permanently delete this employee?')) return;
                                    try {
                                        await api.delete(`/employees/${employee.id}`);
                                        alert('Employee deleted successfully');
                                        navigate('/employees');
                                    } catch (err) {
                                        console.error('Failed to delete employee:', err);
                                        alert(err.response?.data?.message || 'Failed to delete employee');
                                    }
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- CONTENT SPACING --- */}
            <div className="h-10 md:h-16" />

            {/* --- MAIN PROFILE CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 space-y-6">
                
                {/* 1. Employee Information */}
                <Section 
                    title="Employee Information" 
                    icon={Briefcase} 
                    isEditing={activeEditSection === 'employee_info'}
                    isUpdated={isUpdatedByEmployee('profile')}
                    onEdit={() => handleSectionEditStart('employee_info', ['title', 'nick_name', 'gender', 'first_name', 'last_name', 'phone', 'email', 'extension'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Title" 
                            name="title"
                            value={activeEditSection === 'employee_info' ? sectionFormData.title : (employee.title || 'Mr.')} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Nick Name" 
                            name="nick_name"
                            value={activeEditSection === 'employee_info' ? sectionFormData.nick_name : (employee.nick_name || employee.first_name)} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Gender" 
                            name="gender"
                            value={activeEditSection === 'employee_info' ? sectionFormData.gender : employee.gender} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={['Male', 'Female', 'Other']}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="First Name" 
                            name="first_name"
                            value={activeEditSection === 'employee_info' ? sectionFormData.first_name : employee.first_name} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Last Name" 
                            name="last_name"
                            value={activeEditSection === 'employee_info' ? sectionFormData.last_name : employee.last_name} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Mobile" 
                            name="phone"
                            value={activeEditSection === 'employee_info' ? sectionFormData.phone : employee.phone} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.mobile && activeEditSection !== 'employee_info'} 
                            onToggleMask={() => toggleMask('mobile')} 
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Email" 
                            name="email"
                            value={activeEditSection === 'employee_info' ? sectionFormData.email : employee.email} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Extension" 
                            name="extension"
                            value={activeEditSection === 'employee_info' ? sectionFormData.extension : (employee.extension || '-')} 
                            isEditing={activeEditSection === 'employee_info'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 2. Personal Information */}
                <Section 
                    title="Personal Information" 
                    icon={User} 
                    isEditing={activeEditSection === 'personal_info'}
                    isUpdated={isUpdatedByEmployee('profile')}
                    onEdit={() => handleSectionEditStart('personal_info', ['date_of_birth', 'blood_group', 'father_name', 'mother_name', 'spouse_name', 'marital_status', 'marriage_date', 'nationality', 'residential_status', 'birth_place', 'origin_country', 'religion', 'is_international', 'is_disabled', 'is_director', 'personal_email', 'height', 'weight', 'id_mark', 'hobby', 'caste'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="DOB" 
                            name="date_of_birth"
                            type="date"
                            value={activeEditSection === 'personal_info' ? sectionFormData.date_of_birth?.split('T')[0] : formatDate(employee.date_of_birth)} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.dob && activeEditSection !== 'personal_info'} 
                            onToggleMask={() => toggleMask('dob')} 
                        />
                        <DataField label="Birthday" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '-'} />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Blood Group" 
                            name="blood_group"
                            value={activeEditSection === 'personal_info' ? sectionFormData.blood_group : (employee.blood_group || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Father's Name" 
                            name="father_name"
                            value={activeEditSection === 'personal_info' ? sectionFormData.father_name : (employee.father_name || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Marital Status" 
                            name="marital_status"
                            value={activeEditSection === 'personal_info' ? sectionFormData.marital_status : (employee.marital_status || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={['Single', 'Married', 'Divorced', 'Widowed']}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Marriage Date" 
                            name="marriage_date"
                            type="date"
                            value={activeEditSection === 'personal_info' ? sectionFormData.marriage_date?.split('T')[0] : formatDate(employee.marriage_date)} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.marriage_date && activeEditSection !== 'personal_info'} 
                            onToggleMask={() => toggleMask('marriage_date')} 
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Spouse Name" 
                            name="spouse_name"
                            value={activeEditSection === 'personal_info' ? sectionFormData.spouse_name : (employee.spouse_name || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Nationality" 
                            name="nationality"
                            value={activeEditSection === 'personal_info' ? sectionFormData.nationality : (employee.nationality || 'Indian')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Residential Status" 
                            name="residential_status"
                            value={activeEditSection === 'personal_info' ? sectionFormData.residential_status : (employee.residential_status || 'Resident India')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Place Of Birth" 
                            name="birth_place"
                            value={activeEditSection === 'personal_info' ? sectionFormData.birth_place : (employee.birth_place || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Country Of Origin" 
                            name="origin_country"
                            value={activeEditSection === 'personal_info' ? sectionFormData.origin_country : (employee.origin_country || 'India')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Religion" 
                            name="religion"
                            value={activeEditSection === 'personal_info' ? sectionFormData.religion : (employee.religion || 'Hindu')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Personal Email" 
                            name="personal_email"
                            value={activeEditSection === 'personal_info' ? sectionFormData.personal_email : (employee.personal_email || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.personal_email && activeEditSection !== 'personal_info'} 
                            onToggleMask={() => toggleMask('personal_email')} 
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Height" 
                            name="height"
                            value={activeEditSection === 'personal_info' ? sectionFormData.height : (employee.height || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Weight" 
                            name="weight"
                            value={activeEditSection === 'personal_info' ? sectionFormData.weight : (employee.weight || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Identification Mark" 
                            name="id_mark"
                            value={activeEditSection === 'personal_info' ? sectionFormData.id_mark : (employee.id_mark || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Hobby" 
                            name="hobby"
                            value={activeEditSection === 'personal_info' ? sectionFormData.hobby : (employee.hobby || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Caste" 
                            name="caste"
                            value={activeEditSection === 'personal_info' ? sectionFormData.caste : (employee.caste || '-')} 
                            isEditing={activeEditSection === 'personal_info'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 3. Joining Details */}
                <Section 
                    title="Joining Details" 
                    icon={Calendar} 
                    isEditing={activeEditSection === 'joining_details'}
                    onEdit={() => handleSectionEditStart('joining_details', ['joining_date', 'confirmation_date', 'company_status', 'probation_period', 'notice_period', 'previous_experience', 'referred_by_name'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Joined On" 
                            name="joining_date"
                            type="date"
                            value={activeEditSection === 'joining_details' ? sectionFormData.joining_date?.split('T')[0] : formatDate(employee.joining_date)} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Confirmation Date" 
                            name="confirmation_date"
                            type="date"
                            value={activeEditSection === 'joining_details' ? sectionFormData.confirmation_date?.split('T')[0] : formatDate(employee.confirmation_date)} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Status" 
                            name="company_status"
                            value={activeEditSection === 'joining_details' ? sectionFormData.company_status : (employee.company_status || 'Confirmed')} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.status}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Probation Period (Days)" 
                            name="probation_period"
                            type="number"
                            value={activeEditSection === 'joining_details' ? sectionFormData.probation_period : (employee.probation_period || 0)} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Notice Period (Days)" 
                            name="notice_period"
                            type="number"
                            value={activeEditSection === 'joining_details' ? sectionFormData.notice_period : (employee.notice_period || 0)} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Previous Experience" 
                            name="previous_experience"
                            value={activeEditSection === 'joining_details' ? sectionFormData.previous_experience : (employee.previous_experience || '-')} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Referred By" 
                            name="referred_by_name"
                            value={activeEditSection === 'joining_details' ? sectionFormData.referred_by_name : (employee.referred_by_name || '-')} 
                            isEditing={activeEditSection === 'joining_details'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 4. Current Position */}
                <Section 
                    title="Current Position" 
                    icon={Building2} 
                    isEditing={activeEditSection === 'current_position'}
                    onEdit={() => handleSectionEditStart('current_position', ['department', 'designation', 'office_location', 'manager_id', 'shift', 'role_name'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Department" 
                            name="department"
                            value={activeEditSection === 'current_position' ? sectionFormData.department : employee.department} 
                            isEditing={activeEditSection === 'current_position'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.department}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Designation" 
                            name="designation"
                            value={activeEditSection === 'current_position' ? sectionFormData.designation : employee.designation} 
                            isEditing={activeEditSection === 'current_position'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.designation}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Location/Outlet" 
                            name="office_location"
                            value={activeEditSection === 'current_position' ? sectionFormData.office_location : (employee.office_location || employee.location)} 
                            isEditing={activeEditSection === 'current_position'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.location}
                        />
                        <DataField label="Reporting To" value={employee.manager_name || '-'} />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Shift" 
                            name="shift"
                            value={activeEditSection === 'current_position' ? sectionFormData.shift : (employee.shift || 'Day Shift')} 
                            isEditing={activeEditSection === 'current_position'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.shift}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="System Role" 
                            name="role_name"
                            value={activeEditSection === 'current_position' ? sectionFormData.role_name : (employee.role_name || profile.role_name || 'employee')} 
                            isEditing={activeEditSection === 'current_position' && ['super_admin', 'company_admin'].includes(currentUserRole)}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={['employee', 'manager']}
                        />
                    </div>
                </Section>
 
                {/* 4.5 Salary & Financials */}
                <Section 
                    title="Salary & Financials" 
                    icon={Wallet} 
                    isEditing={isEditingSalary}
                    onEdit={() => setIsEditingSalary(true)}
                    onSave={handleSaveSalary}
                    onCancel={() => setIsEditingSalary(false)}
                >
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Base Salary (₹)</label>
                                {isEditingSalary ? (
                                    <input 
                                        type="number" 
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none"
                                        value={salaryData.base_salary} 
                                        onChange={(e) => setSalaryData({...salaryData, base_salary: e.target.value})} 
                                    />
                                ) : (
                                    <p className="text-xl font-black text-slate-800">
                                        {salaryData.base_salary ? `₹${Number(salaryData.base_salary).toLocaleString()}` : 'Not Set'}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Allowances */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Allowances</h3>
                                    {isEditingSalary && (
                                        <button onClick={() => setSalaryData(prev => ({...prev, allowances: [...prev.allowances, {name: '', amount: 0}]}))} 
                                            className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">
                                            + Add
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {salaryData.allowances.map((al, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            {isEditingSalary ? (
                                                <>
                                                    <input placeholder="Name (e.g. HRA)" className="w-1/2 px-3 py-2 text-sm border rounded" value={al.name} onChange={(e) => {
                                                        const newAl = [...salaryData.allowances]; newAl[idx].name = e.target.value; setSalaryData({...salaryData, allowances: newAl});
                                                    }} />
                                                    <input type="number" placeholder="Amount" className="w-1/2 px-3 py-2 text-sm border rounded" value={al.amount} onChange={(e) => {
                                                        const newAl = [...salaryData.allowances]; newAl[idx].amount = e.target.value; setSalaryData({...salaryData, allowances: newAl});
                                                    }} />
                                                    <button onClick={() => {
                                                        const newAl = salaryData.allowances.filter((_, i) => i !== idx); setSalaryData({...salaryData, allowances: newAl});
                                                    }} className="text-red-500"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <div className="flex justify-between w-full p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                                                    <span className="text-sm font-bold text-slate-600">{al.name || '-'}</span>
                                                    <span className="text-sm font-black text-indigo-600">₹{Number(al.amount).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {!isEditingSalary && salaryData.allowances.length === 0 && <p className="text-xs text-slate-400">No allowances added.</p>}
                                </div>
                            </div>

                            {/* Deductions */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fixed Deductions</h3>
                                    {isEditingSalary && (
                                        <button onClick={() => setSalaryData(prev => ({...prev, deductions: [...prev.deductions, {name: '', amount: 0}]}))} 
                                            className="text-[10px] text-red-600 font-bold bg-red-50 px-2 py-1 rounded">
                                            + Add
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    {salaryData.deductions.map((dd, idx) => (
                                        <div key={idx} className="flex gap-3 items-center">
                                            {isEditingSalary ? (
                                                <>
                                                    <input placeholder="Name (e.g. PF)" className="w-1/2 px-3 py-2 text-sm border rounded" value={dd.name} onChange={(e) => {
                                                        const newDd = [...salaryData.deductions]; newDd[idx].name = e.target.value; setSalaryData({...salaryData, deductions: newDd});
                                                    }} />
                                                    <input type="number" placeholder="Amount" className="w-1/2 px-3 py-2 text-sm border rounded" value={dd.amount} onChange={(e) => {
                                                        const newDd = [...salaryData.deductions]; newDd[idx].amount = e.target.value; setSalaryData({...salaryData, deductions: newDd});
                                                    }} />
                                                    <button onClick={() => {
                                                        const newDd = salaryData.deductions.filter((_, i) => i !== idx); setSalaryData({...salaryData, deductions: newDd});
                                                    }} className="text-red-500"><X size={16} /></button>
                                                </>
                                            ) : (
                                                <div className="flex justify-between w-full p-3 bg-red-50/50 border border-red-100 rounded-lg">
                                                    <span className="text-sm font-bold text-slate-600">{dd.name || '-'}</span>
                                                    <span className="text-sm font-black text-red-600">-₹{Number(dd.amount).toLocaleString()}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {!isEditingSalary && salaryData.deductions.length === 0 && <p className="text-xs text-slate-400">No deductions added.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                 {/* 5. Employee Identity */}
                <Section 
                    title="Employee Identity" 
                    icon={Shield} 
                    isEditing={activeEditSection === 'employee_identity'}
                    isUpdated={isUpdatedByEmployee('bank')}
                    onEdit={() => handleSectionEditStart('employee_identity', ['aadhaar_number', 'pan_number'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <div className="col-span-full">
                            <DataField 
                                label="AADHAAR" 
                                name="aadhaar_number"
                                value={activeEditSection === 'employee_identity' ? sectionFormData.aadhaar_number : employee.aadhaar_number} 
                                isEditing={activeEditSection === 'employee_identity'}
                                onChange={handleSectionFieldChange}
                                masked={maskedFields.aadhaar && activeEditSection !== 'employee_identity'} 
                                onToggleMask={() => toggleMask('aadhaar')} 
                            />
                        </div>
                        <div className="col-span-full">
                            <DataField 
                                label="PAN" 
                                name="pan_number"
                                value={activeEditSection === 'employee_identity' ? sectionFormData.pan_number : employee.pan_number} 
                                isEditing={activeEditSection === 'employee_identity'}
                                onChange={handleSectionFieldChange}
                                masked={maskedFields.pan && activeEditSection !== 'employee_identity'} 
                                onToggleMask={() => toggleMask('pan')} 
                            />
                        </div>
                    </div>
                </Section>
 
                 {/* 6. Bank Details */}
                <Section 
                    title="Bank Details for Identification" 
                    icon={Landmark} 
                    isEditing={activeEditSection === 'bank_details'}
                    onEdit={() => handleSectionEditStart('bank_details', ['account_number', 'ifsc_code', 'bank_name', 'bank_branch'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Account Number" 
                            name="account_number"
                            value={activeEditSection === 'bank_details' ? sectionFormData.account_number : employee.account_number} 
                            isEditing={activeEditSection === 'bank_details'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.account_number && activeEditSection !== 'bank_details'} 
                            onToggleMask={() => toggleMask('account_number')} 
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="IFSC Code" 
                            name="ifsc_code"
                            value={activeEditSection === 'bank_details' ? sectionFormData.ifsc_code : employee.ifsc_code} 
                            isEditing={activeEditSection === 'bank_details'}
                            onChange={handleSectionFieldChange}
                            masked={maskedFields.ifsc && activeEditSection !== 'bank_details'} 
                            onToggleMask={() => toggleMask('ifsc')} 
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Bank Name" 
                            name="bank_name"
                            value={activeEditSection === 'bank_details' ? sectionFormData.bank_name : (employee.bank_name || '-')} 
                            isEditing={activeEditSection === 'bank_details'}
                            onChange={handleSectionFieldChange}
                            type="select"
                            options={fieldOptions.bank_name}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Branch" 
                            name="bank_branch"
                            value={activeEditSection === 'bank_details' ? sectionFormData.bank_branch : (employee.bank_branch || '-')} 
                            isEditing={activeEditSection === 'bank_details'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 7. Education & Courses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Section 
                        title="Education" 
                        icon={GraduationCap}
                        isUpdated={isUpdatedByEmployee('education')}
                        onAdd={() => {
                            setEduData({ institution_name: '', degree: '', percentage: '', passing_year: '', category: 'University' });
                            setEditingEduId(null);
                            setIsAddingEdu(true);
                        }}
                    >
                        <div className="space-y-6">
                            {(isAddingEdu || editingEduId) && (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-indigo-100/50 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                                            {editingEduId ? 'Edit Education' : 'Add New Education'}
                                        </h4>
                                        <button onClick={() => { setIsAddingEdu(false); setEditingEduId(null); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institution Name</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={eduData.institution_name}
                                                onChange={(e) => setEduData({...eduData, institution_name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Degree/Class</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={eduData.degree}
                                                onChange={(e) => setEduData({...eduData, degree: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Passing Year</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={eduData.passing_year}
                                                onChange={(e) => setEduData({...eduData, passing_year: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Percentage/GPA</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={eduData.percentage}
                                                onChange={(e) => setEduData({...eduData, percentage: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</label>
                                            <select 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={eduData.category}
                                                onChange={(e) => setEduData({...eduData, category: e.target.value})}
                                            >
                                                <option value="School">School</option>
                                                <option value="University">University</option>
                                                <option value="Professional">Professional</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
                                        <button 
                                            onClick={() => { setIsAddingEdu(false); setEditingEduId(null); }}
                                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveEdu}
                                            className="px-8 py-2 bg-[#00BFA5] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#00BFA5]/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {editingEduId ? 'Save Changes' : 'Add Education'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {employee.education?.length > 0 ? employee.education.map(edu => (
                                    <motion.div 
                                        key={edu.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group relative"
                                    >
                                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setEduData({
                                                        institution_name: edu.institution_name,
                                                        degree: edu.degree,
                                                        percentage: edu.percentage,
                                                        passing_year: edu.passing_year,
                                                        category: edu.category
                                                    });
                                                    setEditingEduId(edu.id);
                                                    setIsAddingEdu(false);
                                                }}
                                                className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteEdu(edu.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                                <GraduationCap size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-slate-800 leading-tight">{edu.institution_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {edu.degree} • {edu.passing_year}
                                                </p>
                                                <div className="inline-flex px-2 py-0.5 bg-indigo-50 rounded text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">
                                                    {edu.percentage}% Score
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-200 mb-3 shadow-sm">
                                            <GraduationCap size={24} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Education Records</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section 
                        title="Professional Courses" 
                        icon={Award}
                        isUpdated={isUpdatedByEmployee('education')}
                        onAdd={() => {
                            setCourseData({ course_name: '', institute_name: '', duration: '' });
                            setEditingCourseId(null);
                            setIsAddingCourse(true);
                        }}
                    >
                        <div className="space-y-6">
                            {(isAddingCourse || editingCourseId) && (
                                <div className="p-6 bg-slate-50 rounded-2xl border border-amber-100/50 animate-in zoom-in-95 duration-200">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                            {editingCourseId ? 'Edit Course' : 'Add New Course'}
                                        </h4>
                                        <button onClick={() => { setIsAddingCourse(false); setEditingCourseId(null); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Name</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={courseData.course_name}
                                                onChange={(e) => setCourseData({...courseData, course_name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Institute Name</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={courseData.institute_name}
                                                onChange={(e) => setCourseData({...courseData, institute_name: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</label>
                                            <input 
                                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                                value={courseData.duration}
                                                onChange={(e) => setCourseData({...courseData, duration: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
                                        <button 
                                            onClick={() => { setIsAddingCourse(false); setEditingCourseId(null); }}
                                            className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleSaveCourse}
                                            className="px-8 py-2 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {editingCourseId ? 'Save Changes' : 'Add Course'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {employee.courses?.length > 0 ? employee.courses.map(course => (
                                    <motion.div 
                                        key={course.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-amber-100 transition-all group relative"
                                    >
                                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => {
                                                    setCourseData({
                                                        course_name: course.course_name,
                                                        institute_name: course.institute_name,
                                                        duration: course.duration
                                                    });
                                                    setEditingCourseId(course.id);
                                                    setIsAddingCourse(false);
                                                }}
                                                className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteCourse(course.id)}
                                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 flex-shrink-0">
                                                <Award size={24} />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-black text-slate-800 leading-tight">{course.course_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {course.institute_name}
                                                </p>
                                                <div className="inline-flex px-2 py-0.5 bg-amber-50 rounded text-[9px] font-black text-amber-600 uppercase tracking-widest mt-1">
                                                    {course.duration}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-200 mb-3 shadow-sm">
                                            <Award size={24} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">No Certification Records</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>

                {/* 8. Address */}
                <div className="space-y-6">
                    <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 pl-2">Address Information</h2>
                    <Section 
                        title="Present Address" 
                        icon={Home} 
                        isEditing={activeEditSection === 'present_address'}
                        onEdit={() => handleSectionEditStart('present_address', ['present_address', 'city', 'district', 'state', 'country', 'pincode'])}
                        onSave={handleSectionSave}
                        onCancel={() => setActiveEditSection(null)}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                            <DataField label="Name" value={`${employee.first_name} ${employee.last_name}`} />
                            <div className="col-span-1 md:col-span-2">
                                <DataField 
                                    label="Address" 
                                    name="present_address"
                                    value={activeEditSection === 'present_address' ? sectionFormData.present_address : employee.present_address} 
                                    isEditing={activeEditSection === 'present_address'}
                                    onChange={handleSectionFieldChange}
                                    masked={maskedFields.present_address && activeEditSection !== 'present_address'} 
                                    onToggleMask={() => toggleMask('present_address')} 
                                />
                            </div>
                            <DataField 
                                label="City" 
                                name="city"
                                value={activeEditSection === 'present_address' ? sectionFormData.city : (employee.city || '-')} 
                                isEditing={activeEditSection === 'present_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="District" 
                                name="district"
                                value={activeEditSection === 'present_address' ? sectionFormData.district : (employee.district || '-')} 
                                isEditing={activeEditSection === 'present_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="State" 
                                name="state"
                                value={activeEditSection === 'present_address' ? sectionFormData.state : (employee.state || '-')} 
                                isEditing={activeEditSection === 'present_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="Country" 
                                name="country"
                                value={activeEditSection === 'present_address' ? sectionFormData.country : (employee.country || 'India')} 
                                isEditing={activeEditSection === 'present_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="Pincode" 
                                name="pincode"
                                value={activeEditSection === 'present_address' ? sectionFormData.pincode : (employee.pincode || '-')} 
                                isEditing={activeEditSection === 'present_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField label="Phone 1" value={employee.phone || '-'} />
                            <DataField label="Email" value={employee.email || '-'} />
                        </div>
                    </Section>

                    <Section 
                        title="Permanent Address" 
                        icon={Flag} 
                        isEditing={activeEditSection === 'permanent_address'}
                        isUpdated={isUpdatedByEmployee('address')}
                        onEdit={() => handleSectionEditStart('permanent_address', ['permanent_address', 'permanent_city', 'permanent_pincode', 'permanent_country'])}
                        onSave={handleSectionSave}
                        onCancel={() => setActiveEditSection(null)}
                    >
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                            <DataField label="Name" value={`${employee.first_name} ${employee.last_name}`} />
                            <div className="col-span-1 md:col-span-2">
                                <DataField 
                                    label="Address" 
                                    name="permanent_address"
                                    value={activeEditSection === 'permanent_address' ? sectionFormData.permanent_address : employee.permanent_address} 
                                    isEditing={activeEditSection === 'permanent_address'}
                                    onChange={handleSectionFieldChange}
                                    masked={maskedFields.permanent_address && activeEditSection !== 'permanent_address'} 
                                    onToggleMask={() => toggleMask('permanent_address')} 
                                />
                            </div>
                            <DataField 
                                label="City" 
                                name="permanent_city"
                                value={activeEditSection === 'permanent_address' ? sectionFormData.permanent_city : (employee.permanent_city || '-')} 
                                isEditing={activeEditSection === 'permanent_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="Pincode" 
                                name="permanent_pincode"
                                value={activeEditSection === 'permanent_address' ? sectionFormData.permanent_pincode : (employee.permanent_pincode || '-')} 
                                isEditing={activeEditSection === 'permanent_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField 
                                label="Country" 
                                name="permanent_country"
                                value={activeEditSection === 'permanent_address' ? sectionFormData.permanent_country : (employee.permanent_country || 'India')} 
                                isEditing={activeEditSection === 'permanent_address'}
                                onChange={handleSectionFieldChange}
                            />
                            <DataField label="Phone 1" value={employee.phone || '-'} />
                        </div>
                    </Section>
                </div>

                {/* 9. Emergency Contact */}
                <Section 
                    title="Emergency Contact" 
                    icon={PhoneCall} 
                    isEditing={activeEditSection === 'emergency_contact'}
                    isUpdated={isUpdatedByEmployee('address')}
                    onEdit={() => handleSectionEditStart('emergency_contact', ['emergency_contact_name', 'emergency_contact_relation', 'emergency_contact_address', 'emergency_city', 'emergency_contact_number', 'emergency_email'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Name" 
                            name="emergency_contact_name"
                            value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_contact_name : (employee.emergency_contact_name || '-')} 
                            isEditing={activeEditSection === 'emergency_contact'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Relationship" 
                            name="emergency_contact_relation"
                            value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_contact_relation : (employee.emergency_contact_relation || 'Father')} 
                            isEditing={activeEditSection === 'emergency_contact'}
                            onChange={handleSectionFieldChange}
                        />
                        <div className="col-span-1 md:col-span-2">
                            <DataField 
                                label="Address" 
                                name="emergency_contact_address"
                                value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_contact_address : (employee.emergency_contact_address || '-')} 
                                isEditing={activeEditSection === 'emergency_contact'}
                                onChange={handleSectionFieldChange}
                            />
                        </div>
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="City" 
                            name="emergency_city"
                            value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_city : (employee.emergency_city || '-')} 
                            isEditing={activeEditSection === 'emergency_contact'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Phone" 
                            name="emergency_contact_number"
                            value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_contact_number : (employee.emergency_contact_number || '-')} 
                            isEditing={activeEditSection === 'emergency_contact'}
                            onChange={handleSectionFieldChange}
                        />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Email" 
                            name="emergency_email"
                            value={activeEditSection === 'emergency_contact' ? sectionFormData.emergency_email : (employee.emergency_email || '-')} 
                            isEditing={activeEditSection === 'emergency_contact'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 10. Background Check */}
                <Section 
                    title="Background Check" 
                    icon={UserCheck} 
                    isEditing={activeEditSection === 'background_check'}
                    onEdit={() => handleSectionEditStart('background_check', ['background_remarks'])}
                    onSave={handleSectionSave}
                    onCancel={() => setActiveEditSection(null)}
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
                        <DataField label="Verification Status" value="Verified" className="text-green-600" />
                        <DataField label="Verification Completed on" value={formatDate(employee.created_at)} />
                        <DataField label="Agency Name" value="Internal Audit" />
                        <DataField 
                            onboardingFields={onboardingFields}
                            label="Remarks" 
                            name="background_remarks"
                            value={activeEditSection === 'background_check' ? sectionFormData.background_remarks : (employee.background_remarks || 'Verified and Background clearance received.')} 
                            isEditing={activeEditSection === 'background_check'}
                            onChange={handleSectionFieldChange}
                        />
                    </div>
                </Section>

                {/* 11. Documents Vault */}
                <Section title="Documents Vault" icon={FileText} isUpdated={isUpdatedByEmployee('documents')} onAdd={() => setIsUploadingDoc(true)}>
                    <div className="space-y-6">
                        {/* Status Stats & Filters */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                {['all', 'admin', 'employee'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setDocFilter(f)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                            docFilter === f 
                                            ? 'bg-[#00BFA5] text-white shadow-lg shadow-[#00BFA5]/20 border border-[#00BFA5]' 
                                            : 'bg-white text-slate-400 border border-slate-100 hover:border-slate-200 hover:text-slate-600'
                                        }`}
                                    >
                                        {f === 'all' ? 'All Documents' : f === 'admin' ? 'Administrative' : 'Employee Uploaded'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 bg-[#00BFA5] rounded-full animate-pulse" />
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Total: {documents.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                            {documents.filter(d => docFilter === 'all' || d.uploaded_by === docFilter).length > 0 ? 
                             documents.filter(d => docFilter === 'all' || d.uploaded_by === docFilter).map((doc, idx) => (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={doc.id} 
                                    className="group relative p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#00BFA5]/40 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-[#00BFA5]/10 transition-colors">
                                            <FileText size={20} className="text-slate-400 group-hover:text-[#00BFA5] transition-colors" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={`text-[7px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-md shadow-sm ${
                                                doc.uploaded_by === 'employee' 
                                                ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                                                : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                            }`}>
                                                {doc.uploaded_by === 'employee' ? 'From Employee' : 'From Admin'}
                                            </span>
                                            {doc.status === 'verified' && (
                                                <span className="bg-emerald-50 text-emerald-600 text-[6px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                                    <Check size={8} /> Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-[#00BFA5] transition-colors">
                                            {doc.custom_name || doc.document_type}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                {new Date(doc.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                                                {(doc.file_size / 1024).toFixed(0)} KB
                                            </p>
                                        </div>
                                    </div>

                                    {doc.batch_name && (
                                        <div className="mt-3 px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                                            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest truncate">
                                                Batch: {doc.batch_name}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-5 pt-4 border-t border-slate-50 flex gap-2">
                                        <a 
                                            href={getAssetUrl(`/uploads/kyc/${doc.file_path}`)} 
                                            target="_blank" rel="noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-[#00BFA5] text-slate-600 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300"
                                        >
                                            <Eye size={12} />
                                            View
                                        </a>
                                        <a 
                                            href={getAssetUrl(`/uploads/kyc/${doc.file_path}`)} 
                                            download
                                            className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all duration-300"
                                        >
                                            <Download size={14} />
                                        </a>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="col-span-full py-20 text-center bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-200">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                                        <FileText size={28} className="text-slate-200" />
                                    </div>
                                    <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">No Documents Found</h5>
                                    <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest mt-1">
                                        {docFilter === 'all' ? 'The employee vault is currently empty.' : `No documents match the ${docFilter} filter.`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>
                
                {/* 12. Assets Details */}
                <Section 
                    title="Assets Details" 
                    icon={Briefcase} 
                    onAdd={() => {
                        setAssetData({
                            handover_date: '',
                            handover_by: '',
                            reporting_to: '',
                            name: '',
                            code: '',
                            remark: ''
                        });
                        setEditingAssetId(null);
                        setIsEditingAssets(true);
                    }}
                >
                    <div className="space-y-6">
                        {isEditingAssets && (
                            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">
                                        {editingAssetId ? 'Edit Asset Details' : 'Register New Asset'}
                                    </h4>
                                    <button onClick={() => { setIsEditingAssets(false); setEditingAssetId(null); }} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Handover Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                            value={assetData.handover_date}
                                            onChange={(e) => setAssetData({...assetData, handover_date: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Handover By</label>
                                        <input 
                                            type="text" 
                                            placeholder="Name of person"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                            value={assetData.handover_by}
                                            onChange={(e) => setAssetData({...assetData, handover_by: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting to</label>
                                        <input 
                                            type="text" 
                                            placeholder="Manager Name"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                            value={assetData.reporting_to}
                                            onChange={(e) => setAssetData({...assetData, reporting_to: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Name</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. MacBook Pro"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                            value={assetData.name}
                                            onChange={(e) => setAssetData({...assetData, name: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asset Code</label>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. ASSET-001"
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all"
                                            value={assetData.code}
                                            onChange={(e) => setAssetData({...assetData, code: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remark</label>
                                    <textarea 
                                        rows="2"
                                        placeholder="Enter any additional notes..."
                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#00BFA5]/20 focus:border-[#00BFA5] outline-none transition-all resize-none"
                                        value={assetData.remark}
                                        onChange={(e) => setAssetData({...assetData, remark: e.target.value})}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                                    <button 
                                        onClick={() => { setIsEditingAssets(false); setEditingAssetId(null); }}
                                        className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSaveAssets}
                                        className="px-8 py-2 bg-[#00BFA5] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#008F7A] shadow-lg shadow-[#00BFA5]/20 transition-all"
                                    >
                                        {editingAssetId ? 'Save Changes' : 'Add Asset'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            {assets.length > 0 ? assets.map(asset => (
                                <div key={asset.id} className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all group relative">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button 
                                            onClick={() => {
                                                setAssetData({
                                                    handover_date: asset.handover_date ? asset.handover_date.split('T')[0] : '',
                                                    handover_by: asset.handover_by || '',
                                                    reporting_to: asset.reporting_to || '',
                                                    name: asset.name || '',
                                                    code: asset.code || '',
                                                    remark: asset.remark || ''
                                                });
                                                setEditingAssetId(asset.id);
                                                setIsEditingAssets(true);
                                            }}
                                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteAsset(asset.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                        <DataField label="Asset Name" value={asset.name} className="text-indigo-600 font-black" />
                                        <DataField label="Asset Code" value={asset.code} />
                                        <DataField label="Handover Date" value={formatDate(asset.handover_date)} />
                                        <DataField label="Handover By" value={asset.handover_by} />
                                        <DataField label="Reporting to" value={asset.reporting_to} />
                                        <DataField label="Remark" value={asset.remark} className="italic text-slate-400" />
                                    </div>
                                </div>
                            )) : (
                                <div className="py-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                                    <Briefcase size={24} className="mx-auto text-slate-300 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">No assets assigned yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Section>

                {/* Change Password Dialog Modal */}
                <AnimatePresence>
                    {isChangingPassword && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-outfit">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                                onClick={() => {
                                    if (!changingPasswordSubmitting) {
                                        setIsChangingPassword(false);
                                        setPasswordError('');
                                        setPasswordSuccess('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }
                                }} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col"
                            >
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <Key size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Change Password</h2>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Secure your employee account</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!changingPasswordSubmitting) {
                                                setIsChangingPassword(false);
                                                setPasswordError('');
                                                setPasswordSuccess('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }
                                        }} 
                                        className="p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                                    >
                                        <X size={18} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    {passwordError && (
                                        <div className="p-3.5 bg-rose-50 border border-rose-100/60 rounded-xl text-rose-600 text-xs font-semibold flex items-center gap-2">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{passwordError}</span>
                                        </div>
                                    )}

                                    {passwordSuccess && (
                                        <div className="p-3.5 bg-emerald-50 border border-emerald-100/60 rounded-xl text-emerald-600 text-xs font-semibold flex items-center gap-2">
                                            <CheckCircle2 size={16} className="shrink-0" />
                                            <span>{passwordSuccess}</span>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showNewPassword ? 'text' : 'password'}
                                                required
                                                value={newPassword}
                                                onChange={(e) => {
                                                    setNewPassword(e.target.value);
                                                    setPasswordError('');
                                                }}
                                                placeholder="Enter new password (min. 8 chars)"
                                                disabled={changingPasswordSubmitting}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowNewPassword(!showNewPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                                        <div className="relative">
                                            <input 
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    setPasswordError('');
                                                }}
                                                placeholder="Confirm new password"
                                                disabled={changingPasswordSubmitting}
                                                className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                            >
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsChangingPassword(false);
                                                setPasswordError('');
                                                setPasswordSuccess('');
                                                setNewPassword('');
                                                setConfirmPassword('');
                                            }}
                                            disabled={changingPasswordSubmitting}
                                            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200/60 hover:bg-slate-100 transition-all text-center disabled:opacity-55"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleChangePasswordSubmit}
                                            disabled={changingPasswordSubmitting}
                                            className="flex-1 py-3 bg-[#00BFA5] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#008F7A] shadow-lg shadow-[#00BFA5]/10 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-55"
                                        >
                                            {changingPasswordSubmitting ? (
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : 'Save Password'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                    {isUploadingDoc && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-outfit">
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
                                onClick={() => {
                                    if (!docSubmitting) {
                                        setIsUploadingDoc(false);
                                        setDocData({ documentType: 'Other', customName: '', file: null });
                                    }
                                }} 
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white w-full max-w-md rounded-[28px] shadow-2xl overflow-hidden z-10 flex flex-col"
                            >
                                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Upload Document</h2>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Add a new record to documents vault</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (!docSubmitting) {
                                                setIsUploadingDoc(false);
                                                setDocData({ documentType: 'Other', customName: '', file: null });
                                            }
                                        }} 
                                        className="p-1.5 hover:bg-slate-50 rounded-full transition-colors"
                                    >
                                        <X size={18} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="p-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Type</label>
                                        <select 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            value={docData.documentType}
                                            onChange={(e) => setDocData({ ...docData, documentType: e.target.value })}
                                        >
                                            <option value="Aadhar Card">Aadhar Card</option>
                                            <option value="Pan Card">PAN Card</option>
                                            <option value="Resume">Resume</option>
                                            <option value="Previous Experience DOC">Experience Certificate</option>
                                            <option value="NOC">NOC</option>
                                            <option value="Offer Letter">Offer Letter</option>
                                            <option value="Salary Slip">Salary Slip</option>
                                            <option value="10th Marksheet">10th Marksheet</option>
                                            <option value="12th Marksheet">12th Marksheet</option>
                                            <option value="Degree">Degree</option>
                                            <option value="Other">Other Document</option>
                                        </select>
                                    </div>

                                    {(docData.documentType === 'Other' || docData.documentType === 'Degree') && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Custom Name</label>
                                            <input 
                                                type="text"
                                                placeholder="e.g. Master's Degree"
                                                value={docData.customName}
                                                onChange={(e) => setDocData({ ...docData, customName: e.target.value })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select File</label>
                                        <div className="relative">
                                            <input 
                                                type="file"
                                                required
                                                onChange={(e) => setDocData({ ...docData, file: e.target.files[0] })}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsUploadingDoc(false);
                                                setDocData({ documentType: 'Other', customName: '', file: null });
                                            }}
                                            disabled={docSubmitting}
                                            className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-200/60 hover:bg-slate-100 transition-all text-center disabled:opacity-55"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={handleSaveDocument}
                                            disabled={docSubmitting || !docData.file}
                                            className="flex-1 py-3 bg-[#00BFA5] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#008F7A] shadow-lg shadow-[#00BFA5]/10 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-55"
                                        >
                                            {docSubmitting ? (
                                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : 'Upload'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
const Section = ({ title, icon: Icon, onEdit, onAdd, onSave, onCancel, isEditing, isUpdated, children }) => (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00BFA5]/10 flex items-center justify-center text-[#00BFA5]">
                    <Icon size={18} />
                </div>
                <div className="flex items-center gap-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-800">{title}</h3>
                    {isUpdated && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-200 animate-pulse">
                            Updated
                        </span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={onCancel}
                            className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-rose-400"
                        >
                            <X size={16} />
                        </button>
                        <button 
                            onClick={onSave}
                            className="p-1.5 hover:bg-[#00BFA5]/10 rounded-lg transition-colors text-[#00BFA5]"
                        >
                            <Check size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        {onAdd && (
                            <button onClick={onAdd} className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-md hover:bg-indigo-100 transition-all flex items-center gap-1.5">
                                <Plus size={12} />
                                Add
                            </button>
                        )}
                        {onEdit && (
                            <button onClick={onEdit} className="p-1.5 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-[#00BFA5]">
                                <Edit size={16} />
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
        <div className="p-6">
            {children || (
                <div className="flex flex-col items-center justify-center py-6 text-slate-300">
                    <History size={24} strokeWidth={1} />
                    <p className="text-[10px] font-medium uppercase tracking-widest mt-2">No records found</p>
                </div>
            )}
        </div>
    </div>
);

const DataField = ({ 
    label, value, masked, onToggleMask, className = "", 
    isEditing, name, onChange, type = "text", options = [], isUpdated: isUpdatedProp, onboardingFields 
}) => {
    const isUpdated = isUpdatedProp || (Array.isArray(onboardingFields) && onboardingFields.includes(name));
    const displayValue = (val) => {
        if (!val || val === '---') return '-';
        if (masked) {
            const s = String(val);
            if (s.length > 4) return 'X'.repeat(s.length - 4) + s.slice(-4);
            return 'X'.repeat(s.length);
        }
        return val;
    };

    return (
        <div className="space-y-1 group">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
            <div className="flex items-center gap-2 min-h-[1.5rem]">
                {isEditing ? (
                    type === 'select' ? (
                        <select 
                            value={value || ''}
                            onChange={(e) => onChange(name, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold focus:ring-1 focus:ring-[#00BFA5] focus:border-[#00BFA5] outline-none"
                        >
                            <option value="">Select {label}</option>
                            {options.map(opt => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                const lbl = typeof opt === 'string' ? opt : opt.label;
                                return <option key={val} value={val}>{lbl}</option>;
                            })}
                        </select>
                    ) : (
                        <input 
                            type={type}
                            value={value || ''}
                            onChange={(e) => onChange(name, e.target.value)}
                            className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold focus:ring-1 focus:ring-[#00BFA5] focus:border-[#00BFA5] outline-none"
                        />
                    )
                ) : (
                    <>
                        <p className={`text-xs font-bold tracking-tight text-slate-700 ${className}`}>
                            {displayValue(value)}
                        </p>
                        {isUpdated && (
                            <span className="text-[7px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase tracking-[0.15em] border border-amber-200 animate-pulse">Updated</span>
                        )}
                        {onToggleMask && (
                            <button 
                                onClick={onToggleMask}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-300 hover:text-[#00BFA5]"
                            >
                                {masked ? <EyeOff size={12} /> : <Eye size={12} />}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Profile;
