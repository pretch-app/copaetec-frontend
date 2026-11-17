"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient, notifyAuthStateChanged } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleButton, OrDivider } from "@/components/auth/google-button"
import { ResendVerification } from "@/components/auth/resend-verification"
import { Trophy, Mail, Lock, AlertCircle, CheckCircle2 } from "lucide-react"

/** Mensaje para los parámetros con los que el backend redirige al login. */
function messageFromParams(params: URLSearchParams): { kind: "success" | "error"; text: string } | null {
  if (params.get("verified") === "1") {
    return { kind: "success", text: "¡Cuenta activada! Ya podés iniciar sesión." }
  }
  const error = params.get("error")
  if (!error) return null
  if (error === "InvalidVerificationToken") {
    return { kind: "error", text: "El link de activación venció o ya se usó. Iniciá sesión para pedir uno nuevo." }
  }
  if (error === "DomainNotAllowed") {
    return { kind: "error", text: "Solo se permiten correos de la institución." }
  }
  if (error === "ServerError") {
    return { kind: "error", text: "No pudimos activar la cuenta. Intentá de nuevo en un rato." }
  }
  return { kind: "error", text: "Error al iniciar sesión con Google. Intentá nuevamente." }
}

function LoginContent() {
  const [error, setError] = useState<string | null>(null)
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const banner = messageFromParams(searchParams)

  async function formAction(formData: FormData) {
    const email = String(formData.get("email") ?? "")
    setIsPending(true)
    setError(null)
    setUnverifiedEmail(null)
    const result = await apiClient("/api/auth/login", {
      method: "POST",
      body: { email, password: formData.get("password") },
    })
    setIsPending(false)
    if (!result.ok) {
      setError(result.error)
      if (result.code === "EMAIL_NOT_VERIFIED") setUnverifiedEmail(email)
      return
    }
    notifyAuthStateChanged()
    router.push("/predicciones-etec")
    router.refresh()
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="mb-8 flex flex-col items-center text-center relative z-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Copa ETec</h1>
          <p className="mt-2 text-sm text-muted-foreground text-balance">
            Iniciá sesión para predecir los resultados.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {banner && (
            <div
              role={banner.kind === "error" ? "alert" : "status"}
              className={
                banner.kind === "error"
                  ? "flex items-center gap-2 text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg"
                  : "flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 p-3 rounded-lg"
              }
            >
              {banner.kind === "error" ? (
                <AlertCircle className="h-4 w-4 shrink-0" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              )}
              <p>{banner.text}</p>
            </div>
          )}

          <GoogleButton />

          <OrDivider />

          <form action={formAction} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="pl-10 h-10"
                placeholder="Email institucional"
                aria-label="Email"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="pl-10 h-10"
                placeholder="Contraseña"
                aria-label="Contraseña"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive text-center">
                {error}
              </p>
            )}

            <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
              {isPending ? "Ingresando..." : "Iniciar sesión"}
            </Button>
          </form>

          {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}

          <p className="text-xs text-center text-muted-foreground">
            ¿No tenés cuenta?{" "}
            <Link href="/auth/registro" className="font-medium text-primary hover:underline">
              Registrate con tu email
            </Link>
          </p>
          <p className="text-xs text-center text-muted-foreground">Solo se permiten correos de la institución.</p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  )
}
