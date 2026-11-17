"use client"

import { useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { GoogleButton, OrDivider } from "@/components/auth/google-button"
import { ResendVerification } from "@/components/auth/resend-verification"
import { Trophy, Mail, Lock, User, MailCheck } from "lucide-react"

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [pendingEmail, setPendingEmail] = useState<string | null>(null)

  async function formAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim()
    const password = String(formData.get("password") ?? "")
    const confirmPassword = String(formData.get("confirmPassword") ?? "")
    setError(null)

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsPending(true)
    const result = await apiClient<{ pendingVerification?: boolean }>("/api/auth/register", {
      method: "POST",
      body: { name: formData.get("name"), email, password, confirmPassword },
    })
    setIsPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setPendingEmail(email)
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

        {pendingEmail ? (
          <div className="relative z-10 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Revisá tu correo</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Te mandamos un link a <span className="font-medium text-foreground">{pendingEmail}</span> para
              activar tu cuenta. Vence en 24 horas.
            </p>
            <ResendVerification email={pendingEmail} />
            <Link href="/auth/login" className="block text-xs font-medium text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center text-center relative z-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Trophy className="h-8 w-8" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight">Crear cuenta</h1>
              <p className="mt-2 text-sm text-muted-foreground text-balance">
                Registrate para jugar el prode de la Copa ETec.
              </p>
            </div>

            <div className="relative z-10 space-y-4">
              <GoogleButton />

              <OrDivider />

              <form action={formAction} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    className="pl-10 h-10"
                    placeholder="Nombre"
                    aria-label="Nombre"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
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
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="pl-10 h-10"
                    placeholder="Contraseña"
                    aria-label="Contraseña"
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
                  {isPending ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>

              <p className="text-xs text-center text-muted-foreground">
                ¿Ya tenés cuenta?{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                  Iniciá sesión
                </Link>
              </p>
              <p className="text-xs text-center text-muted-foreground">Solo se permiten correos de la institución.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
