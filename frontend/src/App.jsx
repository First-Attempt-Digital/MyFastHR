import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';
import Leaves from './pages/Leaves';
import Profile from './pages/Profile';
import Payslips from './pages/Payslips';
import Login from './pages/Login';
import AdminCompanies from './pages/AdminCompanies';
import OrgChart from './pages/OrgChart';
import Compliance from './pages/Compliance';
import IdentityHub from './pages/IdentityHub';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import EmployeeLogin from './pages/EmployeeLogin';
import EmployeeOverview from './pages/EmployeeOverview';
import EmployeeAnalytics from './pages/EmployeeAnalytics';
import EmployeeOrgChart from './pages/EmployeeOrgChart';
import LetterGenerator from './pages/LetterGenerator';
import BulkUpload from './pages/BulkUpload';
import DocumentVault from './pages/DocumentVault';
import TaskManagement from './pages/TaskManagement';
import PublicOnboarding from './pages/PublicOnboarding';
import SetPassword from './pages/SetPassword';
import LeaveAttendanceLayout from './pages/leave-attendance/LeaveAttendanceLayout';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import SupportPage from './pages/SupportPage';
import InfrastructurePage from './pages/InfrastructurePage';
import BlogPage from './pages/BlogPage';
import AboutPage from './pages/AboutPage';
import BookDemoPage from './pages/BookDemoPage';
import InspectAssets from './pages/InspectAssets';
import LegalPage from './pages/LegalPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import ComicsPage from './pages/ComicsPage';
import GlobalBottomNav from './components/layout/GlobalBottomNav';
import LeaveOverview from './pages/leave-attendance/Overview';
import AttendanceOverview from './pages/leave-attendance/AttendanceOverview';
import HolidayList from './pages/leave-attendance/HolidayList';
import LeaveCalendar from './pages/leave-attendance/LeaveCalendar';
import WhoIsIn from './pages/leave-attendance/WhoIsIn';
import ShiftOverride from './pages/leave-attendance/ShiftOverride';
import ManualOverride from './pages/leave-attendance/ManualOverride';
import ShiftRoaster from './pages/leave-attendance/ShiftRoaster';
import LeaveTypeReviewer from './pages/leave-attendance/LeaveTypeReviewer';
import AttendanceMuster from './pages/leave-attendance/AttendanceMuster';
import EmployeeRecords from './pages/leave-attendance/EmployeeRecords';
import WeekendOverride from './pages/leave-attendance/WeekendOverride';
import AssignScheme from './pages/leave-attendance/AssignScheme';
import { fetchBranding, getAssetUrl } from './utils/api';
import RegularizationView from './pages/dashboards/RegularizationView';
import LeaveGranter from './pages/LeaveGranter';

const ProtectedRoute = ({ children, allowedRoles = [], noShell = false }) => {
  const token = localStorage.getItem('auth_token');
  const role = localStorage.getItem('user_role');

  if (!token) {
    // If accessing /employee specific routes or coming from /employee slug
    if (window.location.pathname.startsWith('/employee')) {
      return <Navigate to="/employee" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const errorContent = (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] p-10 animate-in fade-in duration-700">
        <div className="relative">
          <h1 className="text-[180px] font-black text-slate-100 leading-none select-none">404</h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
            <p className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Module Not Found</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Access Denied</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="mt-12 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
    return noShell ? errorContent : <AppShell>{errorContent}</AppShell>;
  }

  return noShell ? children : <AppShell>{children}</AppShell>;
};

const LeavesRouteSelector = () => {
  const role = localStorage.getItem('user_role');
  if (role === 'employee') {
    return <Navigate to="personal" replace />;
  }
  return <Navigate to="overview" replace />;
};

function App() {
  const allRoles = ['super_admin', 'company_admin', 'manager', 'employee'];
  const exceptAdmin = ['super_admin', 'manager', 'employee']; // Admin blocked
  const exceptEmployee = ['super_admin', 'company_admin', 'manager']; // Employee blocked
  const restrictedBoth = ['super_admin', 'manager']; // Both Admin & Employee blocked

  React.useEffect(() => {
    const loadDynamicBranding = async () => {
      try {
        const branding = await fetchBranding();
        if (branding) {
          // Update Document Title
          if (branding.app_name) {
            document.title = branding.app_name;
            localStorage.setItem('platform_app_name', branding.app_name);
          }
           // Save global brand color for AppShell to pick up
          if (branding.primary_color) {
            localStorage.setItem('platform_primary_color', branding.primary_color);
            // Dynamic theme update for entire portfolio style system
            document.documentElement.style.setProperty('--primary-purple', branding.primary_color);
            document.documentElement.style.setProperty('--dark-purple', branding.primary_color);
            document.documentElement.style.setProperty('--light-purple', branding.primary_color + '22');
            document.documentElement.style.setProperty('--cta-gradient', `linear-gradient(135deg, ${branding.primary_color}, ${branding.primary_color}dd)`);
          }
          // Update Favicon Link
          if (branding.favicon_url) {
            const resolvedFaviconUrl = getAssetUrl(branding.favicon_url);
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.getElementsByTagName('head')[0].appendChild(link);
            }
            link.href = resolvedFaviconUrl;
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic white labeling:', err);
      }
    };
    loadDynamicBranding();

    // Capture PWA install prompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.deferredPrompt = e;
      // Dispatch custom event to notify components
      window.dispatchEvent(new Event('app-installable'));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* Entry Points */}
        <Route path="/login" element={<Login />} />
        <Route path="/login/:companySlug" element={<Login />} />
        <Route path="/employee" element={<EmployeeLogin />} />
        <Route path="/employee/:companySlug" element={<EmployeeLogin />} />

        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/infrastructure" element={<InfrastructurePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/comics" element={<ComicsPage />} />
        <Route path="/inspect" element={<InspectAssets />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />

        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={allRoles}><Dashboard /></ProtectedRoute>} />
        <Route path="/employees" element={<ProtectedRoute allowedRoles={exceptEmployee}><Employees /></ProtectedRoute>} />
        <Route path="/employees/overview" element={<ProtectedRoute allowedRoles={exceptEmployee}><EmployeeOverview /></ProtectedRoute>} />
        <Route path="/employees/analytics" element={<ProtectedRoute allowedRoles={exceptEmployee}><EmployeeAnalytics /></ProtectedRoute>} />
        <Route path="/employees/org-chart" element={<ProtectedRoute allowedRoles={allRoles}><EmployeeOrgChart /></ProtectedRoute>} />



        <Route path="/employees/onboard" element={<ProtectedRoute allowedRoles={exceptEmployee}><Onboarding /></ProtectedRoute>} />
        <Route path="/admin/employees" element={<ProtectedRoute allowedRoles={exceptEmployee}><Employees /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute allowedRoles={exceptEmployee}><Analytics /></ProtectedRoute>} />

        {/* Blocked for Employee */}
        <Route path="/attendance" element={<ProtectedRoute allowedRoles={allRoles}><Attendance /></ProtectedRoute>} />
        <Route path="/payslips" element={<ProtectedRoute allowedRoles={allRoles}><Payslips /></ProtectedRoute>} />

        {/* Blocked for Company Admin */}
        <Route path="/payroll" element={<ProtectedRoute allowedRoles={exceptEmployee}><Payroll /></ProtectedRoute>} />

        <Route path="/admin/compliance" element={<ProtectedRoute allowedRoles={exceptEmployee}><Compliance /></ProtectedRoute>} />
        <Route path="/organization/chart" element={<Navigate to="/employees/org-chart" replace />} />

        {/* Blocked for BOTH Company Admin & Employee */}
        {/* Leave and Attendance Module */}
        <Route path="/leaves" element={<ProtectedRoute allowedRoles={allRoles}><LeaveAttendanceLayout /></ProtectedRoute>}>
          <Route index element={<LeavesRouteSelector />} />
          <Route path="overview" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><LeaveOverview /></ProtectedRoute>} />
          <Route path="personal" element={<Leaves />} />
          <Route path="attendance-overview" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><AttendanceOverview /></ProtectedRoute>} />
          <Route path="calendar" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><LeaveCalendar /></ProtectedRoute>} />
          <Route path="who-is-in" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><WhoIsIn /></ProtectedRoute>} />
          <Route path="employee-records" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><EmployeeRecords /></ProtectedRoute>} />
          <Route path="shift-roaster" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><ShiftRoaster /></ProtectedRoute>} />
          <Route path="attendance-muster" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><AttendanceMuster /></ProtectedRoute>} />

          <Route path="granter" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><LeaveGranter /></ProtectedRoute>} />
          <Route path="assign-scheme" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><AssignScheme /></ProtectedRoute>} />
          <Route path="manual-override" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><ManualOverride /></ProtectedRoute>} />
          <Route path="shift-override" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><ShiftOverride /></ProtectedRoute>} />

          <Route path="holidays" element={<HolidayList />} />
          <Route path="weekend-override" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><WeekendOverride /></ProtectedRoute>} />

          <Route path="reviewer" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><LeaveTypeReviewer /></ProtectedRoute>} />
          <Route path="regularizations" element={<ProtectedRoute allowedRoles={exceptEmployee} noShell={true}><RegularizationView isFullPage={true} onBack={() => window.history.back()} /></ProtectedRoute>} />
        </Route>

        <Route path="/identity-vault" element={<ProtectedRoute allowedRoles={restrictedBoth}><IdentityHub /></ProtectedRoute>} />

        <Route path="/profile" element={<ProtectedRoute allowedRoles={allRoles}><Profile /></ProtectedRoute>} />
        <Route path="/admin/companies" element={<ProtectedRoute allowedRoles={['super_admin']}><AdminCompanies /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute allowedRoles={['super_admin', 'company_admin']}><Settings /></ProtectedRoute>} />
        <Route path="/admin/letters/generate" element={<ProtectedRoute allowedRoles={exceptEmployee}><LetterGenerator /></ProtectedRoute>} />
        <Route path="/admin/documents/bulk-upload" element={<ProtectedRoute allowedRoles={exceptEmployee}><BulkUpload /></ProtectedRoute>} />
        <Route path="/admin/documents/vault" element={<ProtectedRoute allowedRoles={exceptEmployee}><DocumentVault /></ProtectedRoute>} />
        <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={exceptEmployee}><TaskManagement /></ProtectedRoute>} />




        <Route path="/public/onboarding/:token" element={<PublicOnboarding />} />
        <Route path="/onboarding/:token" element={<PublicOnboarding />} />
        <Route path="/set-password" element={<SetPassword />} />
        <Route path="*" element={<div className="p-10 text-center font-bold text-slate-400">Page coming soon...</div>} />
      </Routes>
      <GlobalBottomNav />
    </Router>
  );
}

export default App;
