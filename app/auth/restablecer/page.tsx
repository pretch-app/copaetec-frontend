"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Lock } from "lucide-react"

function ResetContent() {
  const token = useSearchParams().get("token") ?? ""
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [linkInvalid, setLinkInvalid] = useState(!token)
  const [isPending, setIsPending] = useState(false)

  async function formAction(formData: FormData) {
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")
    setError(null)
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsPending(true)
    const result = await apiClient("/api/auth/reset-password", {
      method: "POST",
      body: { token, password, confirmPassword },
    })
    setIsPending(false)
    if (!result.ok) {
      if (result.code === "INVALID_RESET_TOKEN") setLinkInvalid(true)
      setError(result.error)
      return
    }
    router.push("/auth/login?reset=1")
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="mb-8 flex flex-col items-center text-center relative z-10">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Elegí una contraseña nueva</h1>
        </div>

        {linkInvalid ? (
          <div className="relative z-10 space-y-4 text-center">
            <p role="alert" className="text-sm font-medium text-destructive">
              {error ?? "Este link no es válido."} Pedí uno nuevo para continuar.
            </p>
            <Link href="/auth/olvide" className="block text-xs font-medium text-primary hover:underline">
              Pedir un link nuevo
            </Link>
          </div>
        ) : (
          <form action={formAction} className="relative z-10 space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="pl-10 h-10"
                placeholder="Contraseña nueva"
                aria-label="Contraseña nueva"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="pl-10 h-10"
                placeholder="Repetí la contraseña"
                aria-label="Repetir contraseña"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-medium text-destructive text-center">
                {error}
              </p>
            )}

            <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center">Cargando...</div>}>
      <ResetContent />
    </Suspense>
  )
}
