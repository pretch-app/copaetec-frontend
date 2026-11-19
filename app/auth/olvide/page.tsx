"use client"

import { useState } from "react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Mail, MailCheck } from "lucide-react"

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function formAction(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim()
    setIsPending(true)
    setError(null)
    const result = await apiClient("/api/auth/forgot-password", { method: "POST", body: { email } })
    setIsPending(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setSentTo(email)
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface-elevated p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />

        {sentTo ? (
          <div className="relative z-10 space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MailCheck className="h-8 w-8" />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight">Revisá tu correo</h1>
            <p className="text-sm text-muted-foreground text-balance">
              Si <span className="font-medium text-foreground">{sentTo}</span> está registrado, te mandamos un link para
              elegir una contraseña nueva. Vence en 60 minutos.
            </p>
            <Link href="/auth/login" className="block text-xs font-medium text-primary hover:underline">
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center text-center relative z-10">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="h-8 w-8" />
              </div>
              <h1 className="font-display text-2xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
              <p className="mt-2 text-sm text-muted-foreground text-balance">
                Te mandamos un link para elegir una nueva. También sirve si entraste con Google y querés sumar una
                contraseña.
              </p>
            </div>

            <form action={formAction} className="relative z-10 space-y-4">
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

              {error && (
                <p role="alert" className="text-xs font-medium text-destructive text-center">
                  {error}
                </p>
              )}

              <Button type="submit" variant="secondary" className="w-full" disabled={isPending}>
                {isPending ? "Enviando..." : "Enviar link"}
              </Button>

              <Link href="/auth/login" className="block text-center text-xs font-medium text-primary hover:underline">
                Volver a iniciar sesión
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
