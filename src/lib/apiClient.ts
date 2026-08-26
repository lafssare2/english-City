import { auth } from "./firebase";

/**
 * Retrieves the current Firebase Auth ID token (or test token if offline/guest)
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken(false);
    }
  } catch (err) {
    console.warn("Could not retrieve Firebase ID token:", err);
  }
  
  // Safe anonymous guest fallback for preview sandbox
  return "test_token_guest:anonymous_citizen";
}

/**
 * Universal authenticated API fetch wrapper
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data: any = null;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : null;
  } catch (err) {
    data = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    data: data as T,
  };
}

export async function apiPost<T = any>(endpoint: string, body: any): Promise<T> {
  const res = await apiFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorMsg = (res.data as any)?.message || (res.data as any)?.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    (err as any).status = res.status;
    (err as any).code = (res.data as any)?.code;
    throw err;
  }

  return res.data;
}

export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const res = await apiFetch<T>(endpoint, { method: "GET" });
  if (!res.ok) {
    throw new Error((res.data as any)?.message || `Request failed with status ${res.status}`);
  }
  return res.data;
}
