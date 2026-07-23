import axios from 'axios';

const isProd = import.meta.env.PROD;
const devHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = isProd ? '/api' : `http://${devHost}:5000/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// In development we fall back to a demo bypass token (matches the seed data) so the app
// is usable without logging in. In production there is NO fallback — the backend rejects
// test.* tokens there, so a missing token must surface as a real "logged out" flow.
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token') || (import.meta.env.DEV ? 'test.admin.token' : null);
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let openDeleteSecurityModalCallback = null;

export const setOpenDeleteSecurityModal = (callback) => {
    openDeleteSecurityModalCallback = callback;
};

export const clearOpenDeleteSecurityModal = (callback) => {
    if (openDeleteSecurityModalCallback === callback) {
        openDeleteSecurityModalCallback = null;
    }
};

api.interceptors.response.use(
    response => response.data,
    async error => {
        const originalRequest = error.config;

        // Check if we need a delete security key
        if (error.response?.data?.code === 'DELETE_KEY_REQUIRED' && !originalRequest._retry) {
            originalRequest._retry = true;

            if (openDeleteSecurityModalCallback) {
                try {
                    const verifiedPin = await new Promise((resolve, reject) => {
                        openDeleteSecurityModalCallback({ resolve, reject, url: originalRequest.url });
                    });

                    originalRequest.headers['X-Delete-Security-Key'] = verifiedPin;
                    return api(originalRequest);
                } catch (modalErr) {
                    return Promise.reject(modalErr);
                }
            }
        }

        const message = error.response?.data?.message || 'Something went wrong';
        console.error('[API Error]:', message);
        
        // Auto-logout on auth failures.
        if (error.response?.status === 401 || error.response?.status === 403) {
            // Not a delete-key challenge (which also returns 403).
            if (error.response?.data?.code !== 'DELETE_KEY_REQUIRED') {
                // Failures of the auth endpoints themselves (wrong password / wrong OTP on a
                // login page) are NOT a logged-out state — they must surface as an inline form
                // error, not a redirect. The admin login is at /login and the employee login at
                // /employee, so key off the request URL, not the current pathname.
                const reqUrl = originalRequest?.url || '';
                const isAuthEndpoint = /\/auth\/(login|request-otp|verify-otp)/.test(reqUrl);

                // 401 = not authenticated (missing/absent token) → logged out.
                // 403 = treat as auth failure only when it's a token problem (expired/invalid),
                // detected via the "token" message; a plain permission-denied 403 (e.g.
                // "Unauthorized to update ticket…") must NOT kick the user out of the app.
                const isAuthFailure =
                    !isAuthEndpoint && (
                        error.response.status === 401 ||
                        message.toLowerCase().includes('token')
                    );

                if (isAuthFailure) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user_data');

                    // Prevent infinite reload loops on login page
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                }
            }
        }
        
        return Promise.reject(error);
    }
);

export const getAssetUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    
    // Normalize path to make sure it has a leading slash
    let cleanPath = path;
    if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
    }
    
    // If it's just a raw filename of logo or favicon, prepend the folder path
    if (cleanPath.startsWith('/logo-') || cleanPath.startsWith('/favicon-')) {
        cleanPath = '/uploads/branding' + cleanPath;
    }
    
    const isProd = import.meta.env.PROD;
    const base = isProd ? '' : `http://${devHost}:5000`;
    return `${base}${cleanPath}`;
};

export const fetchBranding = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL.replace('/api', '')}/api/public/branding`);
        return response.data;
    } catch (err) {
        console.error('Failed to fetch branding:', err);
        return {
            logo_url: '/uploads/branding/logo.png',
            favicon_url: '/uploads/branding/favicon.png'
        };
    }
};

export default api;
