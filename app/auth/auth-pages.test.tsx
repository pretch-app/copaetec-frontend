import { fireEvent, render, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/test/server"

const nav = vi.hoisted(() => ({ params: new URLSearchParams(), push: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, refresh: nav.refresh, replace: vi.fn() }),
  useSearchParams: () => nav.params,
}))

import LoginPage from "./login/page"
import RegisterPage from "./registro/page"

const API = "http://localhost:4000/api/auth"

function fill(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

beforeEach(() => {
  nav.params = new URLSearchParams()
  nav.push.mockClear()
})

describe("Login", () => {
  it("ofrece Google y email, y entra con email y contraseña", async () => {
    server.use(http.post(`${API}/login`, () => HttpResponse.json({ success: true })))
    render(<LoginPage />)

    expect(screen.getByRole("link", { name: /continuar con google/i })).toHaveAttribute(
      "href",
      "http://localhost:4000/api/auth/google",
    )
    fill(/^email$/i, "ana@alumno.etec.um.edu.ar")
    fill(/^contraseña$/i, "secreto123")
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/predicciones-etec"))
  })

  it("si la cuenta no está activada, ofrece reenviar el correo", async () => {
    let resentTo = ""
    server.use(
      http.post(`${API}/login`, () =>
        HttpResponse.json(
          { error: "Tenés que activar tu cuenta desde el correo que te enviamos.", code: "EMAIL_NOT_VERIFIED" },
          { status: 403 },
        ),
      ),
      http.post(`${API}/resend-verification`, async ({ request }) => {
        resentTo = ((await request.json()) as { email: string }).email
        return HttpResponse.json({ success: true })
      }),
    )
    render(<LoginPage />)

    fill(/^email$/i, "ana@alumno.etec.um.edu.ar")
    fill(/^contraseña$/i, "secreto123")
    fireEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }))

    expect(await screen.findByText(/tenés que activar tu cuenta/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /reenviar correo/i }))
    expect(await screen.findByText(/te mandamos un link nuevo/i)).toBeInTheDocument()
    expect(resentTo).toBe("ana@alumno.etec.um.edu.ar")
    expect(nav.push).not.toHaveBeenCalled()
  })

  it("avisa cuando la cuenta se activó desde el link", () => {
    nav.params = new URLSearchParams("verified=1")
    render(<LoginPage />)
    expect(screen.getByRole("status")).toHaveTextContent(/cuenta activada/i)
  })

  it("avisa cuando el link venció o ya se usó", () => {
    nav.params = new URLSearchParams("error=InvalidVerificationToken")
    render(<LoginPage />)
    expect(screen.getByRole("alert")).toHaveTextContent(/venció o ya se usó/i)
  })
})

describe("Registro", () => {
  function fillForm(confirm = "secreto123") {
    fill(/^nombre$/i, "Ana")
    fill(/^email$/i, "ana@alumno.etec.um.edu.ar")
    fill(/^contraseña$/i, "secreto123")
    fill(/repetir contraseña/i, confirm)
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }))
  }

  it("después de registrarse pide revisar el correo, sin iniciar sesión", async () => {
    let body: Record<string, string> = {}
    server.use(
      http.post(`${API}/register`, async ({ request }) => {
        body = (await request.json()) as Record<string, string>
        return HttpResponse.json({ success: true, pendingVerification: true }, { status: 201 })
      }),
    )
    render(<RegisterPage />)
    fillForm()

    expect(await screen.findByRole("heading", { name: /revisá tu correo/i })).toBeInTheDocument()
    expect(screen.getByText("ana@alumno.etec.um.edu.ar")).toBeInTheDocument()
    expect(body).toMatchObject({ name: "Ana", email: "ana@alumno.etec.um.edu.ar", confirmPassword: "secreto123" })
    expect(nav.push).not.toHaveBeenCalled()
  })

  it("no llama al backend si las contraseñas no coinciden", async () => {
    // Sin handler para /register: si se llamara, MSW haría fallar el test.
    render(<RegisterPage />)
    fillForm("otra-clave")
    expect(await screen.findByRole("alert")).toHaveTextContent(/no coinciden/i)
  })

  it("muestra el error del backend", async () => {
    server.use(
      http.post(`${API}/register`, () =>
        HttpResponse.json({ error: "Solo se permiten correos institucionales de la ETec/UM" }, { status: 400 }),
      ),
    )
    render(<RegisterPage />)
    fillForm()
    expect(await screen.findByRole("alert")).toHaveTextContent(/correos institucionales/i)
  })
})
