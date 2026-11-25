const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "project_portal_token";
const USER_KEY = "project_portal_user";

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getDashboardPath(role) {
  if (role === "guide") return "/guide";
  if (role === "coordinator") return "/coordinator";
  return "/student";
}

function handleUnauthorized(status, path) {
  if (status === 401 && !path.startsWith("/auth/login")) {
    clearAuth();
  }
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Unable to reach server. Make sure the backend is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    handleUnauthorized(response.status, path);
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export async function apiUpload(path, formData) {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch {
    throw new Error("Unable to reach server. Make sure the backend is running on port 5000.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    handleUnauthorized(response.status, path);
    throw new Error(data.error || data.message || `Upload failed with status ${response.status}`);
  }

  return data;
}

export async function apiDownload(path, fallbackFilename = "submission") {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { headers });
  } catch {
    throw new Error("Unable to reach server. Make sure the backend is running on port 5000.");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    handleUnauthorized(response.status, path);
    throw new Error(data.error || data.message || "Unable to download file.");
  }

  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match ? match[1] : fallbackFilename;

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
