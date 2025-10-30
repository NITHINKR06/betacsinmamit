// Admin token config for secure login verification (replace value as needed)
// In production, VITE_ADMIN_LOGIN_TOKEN MUST be set in environment variables
export const ADMIN_LOGIN_TOKEN = import.meta.env.VITE_ADMIN_LOGIN_TOKEN || (import.meta.env.DEV ? "DEV_ADMIN_TOKEN" : null);
