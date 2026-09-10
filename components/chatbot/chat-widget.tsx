"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { askChatbot, MAX_QUESTION_LENGTH, type ChatAnswer } from "@/lib/chatbot"
import { cn } from "@/lib/utils"

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "bot"; text: string; suggestions: string[]; isError?: boolean }

let nextId = 0

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState("")
  const [isPending, setIsPending] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasGreeted = useRef(false)

  // El saludo se pide al backend en vez de escribirlo acá: así los ejemplos
  // nombran equipos que existen de verdad en el torneo.
  useEffect(() => {
    if (!isOpen || hasGreeted.current) return
    hasGreeted.current = true
    void send("hola")
    // `send` es estable para este uso: sólo lee refs y setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  // Mantiene la vista pegada al último mensaje. La animación la hace el
  // navegador vía `scroll-smooth`, así que acá alcanza con mover `scrollTop`.
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, isPending])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  // Cierra con Escape desde cualquier lugar del panel.
  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [isOpen])

  function pushBotAnswer(answer: ChatAnswer) {
    setMessages((prev) => [
      ...prev,
      { id: nextId++, role: "bot", text: answer.answer, suggestions: answer.suggestions },
    ])
  }

  async function send(question: string, options: { echo?: boolean } = {}) {
    const trimmed = question.trim()
    if (!trimmed || isPending) return

    const { echo = false } = options
    if (echo) setMessages((prev) => [...prev, { id: nextId++, role: "user", text: trimmed }])
    setDraft("")
    setIsPending(true)

    const result = await askChatbot(trimmed)
    setIsPending(false)

    if (result.ok) {
      pushBotAnswer(result.data)
    } else {
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: "bot", text: result.error, suggestions: [], isError: true },
      ])
    }
    inputRef.current?.focus()
  }

  const lastMessage = messages[messages.length - 1]
  const suggestions = !isPending && lastMessage?.role === "bot" ? lastMessage.suggestions : []

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        aria-label={isOpen ? "Cerrar el asistente" : "Abrir el asistente de la Copa"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg"
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Asistente de la Copa ETec"
          className="fixed bottom-20 right-4 z-50 flex h-[min(32rem,calc(100dvh-7rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl"
        >
          <header className="border-b border-border px-4 py-3">
            <p className="font-semibold">Asistente de la Copa</p>
            <p className="text-xs text-muted-foreground">Resultados, fixture, tabla y goleadores</p>
          </header>

          <div
            ref={listRef}
            role="log"
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto scroll-smooth px-4 py-3"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : message.isError
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-foreground"
                )}
              >
                {message.text}
              </div>
            ))}

            {isPending && (
              <p className="text-sm text-muted-foreground" role="status">
                Buscando…
              </p>
            )}

            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    type="button"
                    variant="outline"
                    size="xs"
                    className="h-auto whitespace-normal py-1 text-left"
                    onClick={() => void send(suggestion, { echo: true })}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void send(draft, { echo: true })
            }}
            className="flex items-center gap-2 border-t border-border px-3 py-3"
          >
            <Input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_QUESTION_LENGTH}
              disabled={isPending}
              placeholder="¿Cuándo juega mi equipo?"
              aria-label="Escribí tu pregunta"
              className="h-9"
            />
            <Button type="submit" size="icon" aria-label="Enviar" disabled={isPending || draft.trim() === ""}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
