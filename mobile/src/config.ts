/**
 * Backend URL configuration.
 * Set EXPO_PUBLIC_API_URL in the EAS environment for a deployed HTTPS API.
 * The fallback is only for Android Studio's local emulator.
 */
const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (configuredUrl || "http://10.0.2.2:8000").replace(/\/$/, "");
