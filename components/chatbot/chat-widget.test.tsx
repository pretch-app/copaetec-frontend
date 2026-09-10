import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/test/server"
import { ChatWidget } from "./chat-widget"

const API = "http://localhost:4000/api/chat"

type ChatBody = { question: string }

/** Responde según la pregunta, imitando el motor de reglas del backend. */
function mockChat(reply: (question: string) => Record<string, unknown>, status = 200) {
  server.use(
    http.post(API, async ({ request }) => {
      const { question } = (await request.json()) as ChatBody
      return HttpResponse.json(reply(question), { status })
    })
  )
}

const helpAnswer = {
  intent: "help",
  answer: "¡Hola! Soy el asistente de la Copa ETec.",
  data: {},
  suggestions: ["¿Cómo está la tabla de posiciones?"],
}

function open() {
  render(<ChatWidget />)
  fireEvent.click(screen.getByRole("button", { name: /abrir el asistente/i }))
}

const questionInput = () => screen.getByLabelText(/escribí tu pregunta/i)
const sendButton = () => screen.getByRole("button", { name: /^enviar$/i })

describe("ChatWidget", () => {
  it("pide el saludo al backend al abrirse, para citar equipos reales", async () => {
    mockChat(() => helpAnswer)
    open()

    expect(await screen.findByText(/soy el asistente de la copa etec/i)).toBeInTheDocument()
  })

  it("envía la pregunta y muestra la respuesta", async () => {
    mockChat((question) =>
      question === "hola"
        ? helpAnswer
        : {
            intent: "team_next_matches",
            answer: "Pichas FC juega contra Imagine Winning por la fecha 2.",
            data: {},
            suggestions: [],
          }
    )
    open()
    await screen.findByText(/soy el asistente/i)

    fireEvent.change(questionInput(), { target: { value: "cuando juega Pichas FC?" } })
    fireEvent.click(sendButton())

    // La pregunta del usuario queda en pantalla junto con la respuesta.
    expect(await screen.findByText("cuando juega Pichas FC?")).toBeInTheDocument()
    expect(await screen.findByText(/juega contra Imagine Winning/i)).toBeInTheDocument()
  })

  it("permite preguntar tocando una sugerencia", async () => {
    mockChat((question) =>
      question === "hola"
        ? helpAnswer
        : { intent: "standings", answer: "Tabla de posiciones:\n1. Oveja Negra FC", data: {}, suggestions: [] }
    )
    open()

    fireEvent.click(await screen.findByRole("button", { name: /cómo está la tabla/i }))

    expect(await screen.findByText(/oveja negra fc/i)).toBeInTheDocument()
  })

  it("muestra el mensaje de error del backend cuando falla", async () => {
    mockChat(() => ({ error: "Demasiadas consultas seguidas. Probá de nuevo en un momento." }), 429)
    open()

    expect(await screen.findByText(/demasiadas consultas seguidas/i)).toBeInTheDocument()
  })

  it("no habilita el envío con preguntas vacías", async () => {
    mockChat(() => helpAnswer)
    open()
    await screen.findByText(/soy el asistente/i)

    expect(sendButton()).toBeDisabled()

    fireEvent.change(questionInput(), { target: { value: "   " } })
    expect(sendButton()).toBeDisabled()
  })

  it("limita el largo de la pregunta al máximo que acepta el backend", async () => {
    mockChat(() => helpAnswer)
    open()
    await screen.findByText(/soy el asistente/i)

    expect(questionInput()).toHaveAttribute("maxlength", "300")
  })

  it("cierra el panel con Escape", async () => {
    mockChat(() => helpAnswer)
    open()
    await screen.findByText(/soy el asistente/i)

    fireEvent.keyDown(window, { key: "Escape" })

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})
