import { fireEvent, render, screen } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/test/server"
import { ADMIN, USER } from "@/test/fixtures"
import { notifyAuthStateChanged } from "@/lib/api-client"
import { SiteHeader } from "./site-header"
import { UserMenu } from "./user-menu"
import { ThemeToggle } from "./theme-toggle"

const nav = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn(), pathname: "/" }))
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => nav.pathname,
}))
vi.mock("sonner", () => ({ toast }))

const API = "http://localhost:4000/api/auth"

function session(user: typeof USER | typeof ADMIN | null) {
  server.use(http.get(`${API}/me`, () => HttpResponse.json({ user })))
}

beforeEach(() => {
  nav.replace.mockClear()
  nav.pathname = "/"
})

describe("UserMenu", () => {
  it("sin sesión muestra el botón Ingresar", async () => {
    session(null)
    render(<UserMenu />)
    expect(await screen.findByRole("link", { name: "Ingresar" })).toHaveAttribute("href", "/auth/login")
  })

  it("el admin ve el acceso al panel; un usuario común no", async () => {
    session(ADMIN)
    const { unmount } = render(<UserMenu />)
    fireEvent.click(await screen.findByRole("button", { name: /Administrador/ }))
    expect(screen.getByRole("link", { name: /Panel Admin/ })).toHaveAttribute("href", "/admin")
    unmount()

    session(USER)
    render(<UserMenu />)
    fireEvent.click(await screen.findByRole("button", { name: /Ana/ }))
    expect(screen.queryByRole("link", { name: /Panel Admin/ })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Mis Predicciones/ })).toBeInTheDocument()
  })

  it("cerrar sesión vuelve al inicio", async () => {
    session(USER)
    server.use(http.post(`${API}/logout`, () => HttpResponse.json({ success: true })))
    render(<UserMenu />)
    fireEvent.click(await screen.findByRole("button", { name: /Ana/ }))
    fireEvent.click(screen.getByRole("button", { name: /Cerrar Sesión/ }))

    await vi.waitFor(() => expect(nav.replace).toHaveBeenCalledWith("/"))
  })

  it("si el logout falla, avisa y no sale", async () => {
    session(USER)
    server.use(http.post(`${API}/logout`, () => HttpResponse.json({ error: "Origen no permitido" }, { status: 403 })))
    render(<UserMenu />)
    fireEvent.click(await screen.findByRole("button", { name: /Ana/ }))
    fireEvent.click(screen.getByRole("button", { name: /Cerrar Sesión/ }))

    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("Origen no permitido"))
    expect(nav.replace).not.toHaveBeenCalled()
  })

  it("se actualiza cuando cambia la sesión en otra parte de la página", async () => {
    session(null)
    render(<UserMenu />)
    await screen.findByRole("link", { name: "Ingresar" })

    session(USER)
    notifyAuthStateChanged()
    expect(await screen.findByRole("button", { name: /Ana/ })).toBeInTheDocument()
  })
})

describe("ThemeToggle", () => {
  it("alterna entre modo oscuro y claro y lo recuerda", async () => {
    localStorage.removeItem("theme")
    render(<ThemeToggle />)

    fireEvent.click(await screen.findByRole("button", { name: "Cambiar a modo claro" }))
    expect(document.documentElement).toHaveClass("light")
    expect(localStorage.getItem("theme")).toBe("light")

    fireEvent.click(screen.getByRole("button", { name: "Cambiar a modo oscuro" }))
    expect(document.documentElement).toHaveClass("dark")
  })
})

describe("SiteHeader", () => {
  it("abre el menú móvil con las secciones del sitio", async () => {
    session(null)
    nav.pathname = "/noticias"
    render(<SiteHeader />)

    fireEvent.click(screen.getByRole("button", { name: "Abrir menú" }))
    const links = screen.getAllByRole("link", { name: "Noticias" })
    expect(links.some((link) => link.className.includes("text-primary"))).toBe(true)
    fireEvent.scroll(window, { target: { scrollY: 200 } })
  })
})
