"use client"

import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"

/** Botón para pedir otro link de activación. El backend responde igual exista o no la cuenta. */
export function ResendVerification({ email }: { email: string }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  async function resend() {
    setState("sending")
    setError(null)
    const result = await apiClient("/api/auth/resend-verification", { method: "POST", body: { email } })
    if (result.ok) {
      setState("sent")
    } else {
      setState("error")
      setError(result.error)
    }
  }

  if (state === "sent") {
    return <p className="text-xs text-center text-muted-foreground">Listo, te mandamos un link nuevo.</p>
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" className="w-full" onClick={resend} disabled={state === "sending"}>
        {state === "sending" ? "Enviando..." : "Reenviar correo de activación"}
      </Button>
      {error && <p className="text-xs font-medium text-destructive text-center">{error}</p>}
    </div>
  )
}
