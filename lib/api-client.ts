"use client"

import { apiUrl } from "./api"

/** `code` es el código de error que manda el backend, por ejemplo `EMAIL_NOT_VERIFIED`. */
export type ApiResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number; code?: string }
export const AUTH_STATE_CHANGED_EVENT = "auth-state-changed"

export function notifyAuthStateChanged() {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT))
}

// Para Client Components: llama al backend con credenciales (cookie de sesión cross-origin).
export async function apiClient<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {}
): Promise<ApiResult<T>> {
  const { method = "GET", body, formData } = options

  const init: RequestInit = {
    method,
    credentials: "include",
    cache: "no-store",
  }

  if (formData) {
    init.body = formData
  } else if (body !== undefined) {
    init.headers = { "Content-Type": "application/json" }
    init.body = JSON.stringify(body)
  }

  try {
    const res = await fetch(apiUrl(path), init)
    const contentType = res.headers.get("content-type") || ""
    const data = contentType.includes("application/json") ? await res.json() : null

    if (!res.ok) {
      return {
        ok: false,
        error: (data && data.error) || `Error ${res.status}`,
        status: res.status,
        code: data && typeof data.code === "string" ? data.code : undefined,
      }
    }
    return { ok: true, data: data as T }
  } catch (err) {
    return { ok: false, error: "No se pudo conectar con el servidor", status: 0 }
  }
}

export type CurrentUser = {
  id: number
  email: string
  display_name: string
  role: "user" | "admin"
  created_at: string
} | null

export async function getMe(): Promise<CurrentUser> {
  const result = await apiClient<{ user: CurrentUser }>("/api/auth/me")
  return result.ok ? result.data.user : null
}

export async function logout() {
  const result = await apiClient("/api/auth/logout", { method: "POST" })
  if (result.ok) notifyAuthStateChanged()
  return result
}

export function googleLoginUrl() {
  return apiUrl("/api/auth/google")
}
