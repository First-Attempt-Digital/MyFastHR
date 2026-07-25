/**
 * Accepted biometric "master" API keys.
 *
 * Sourced entirely from the BIOMETRIC_API_KEY environment variable, which may hold a
 * SINGLE key or a COMMA-SEPARATED list of keys. Keeping the list in the environment lets
 * legacy device-provisioned keys keep authenticating without hard-coding any secret in
 * source (the whole point of the auth-hardening branch).
 *
 * Migration path: register every device with its own `mfhr_device_live_...` key (handled by
 * the DB-lookup path, not this list), or rotate all machines onto one master key, then trim
 * BIOMETRIC_API_KEY down to that single value.
 */
const isMasterKey = (apiKey) => {
    if (!apiKey) return false;
    const candidate = String(apiKey).trim();
    const keys = (process.env.BIOMETRIC_API_KEY || '')
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);
    return keys.includes(candidate);
};

module.exports = { isMasterKey };
