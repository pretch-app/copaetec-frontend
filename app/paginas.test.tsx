import { fireEvent, render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ADMIN, USER, mockBackend } from "@/test/fixtures"

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }))

vi.mock("next/navigation", () => ({
  useRouter: () => nav,
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
}))
// Los componentes 3D usan WebGL, que jsdom no tiene.
vi.mock("@/components/copa-3d-wrapper", () => ({ Copa3D: () => null }))
vi.mock("@/components/hero-particles-wrapper", () => ({ HeroParticlesWrapper: () => null }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import HomePage from "./page"
import FixturePage from "./fixture/page"
import ResultadosPage from "./resultados/page"
import MatchDetailPage from "./resultados/[id]/page"
import PosicionesPage from "./posiciones/page"
import EstadisticasPage from "./estadisticas/page"
import LlavesPage from "./llaves/page"
import EquiposPage from "./equipos/page"
import TeamDetailPage from "./equipos/[slug]/page"
import NoticiasPage from "./noticias/page"
import NewsArticlePage from "./noticias/[id]/page"
import GaleriaPage from "./galeria/page"
import RankingPage from "./predicciones-etec/ranking/page"
import ProdePage from "./predicciones-etec/page"
import MisPrediccionesPage from "./predicciones-etec/mis-predicciones/page"
import ProfilePage from "./perfil/page"
import AdminPage from "./admin/page"

const params = <T,>(value: T) => ({ params: Promise.resolve(value) })

/** Renderiza un Server Component async como lo haría Next. */
async function renderServer(page: Promise<ReactElement> | ReactElement) {
  return render(await page)
}

beforeEach(() => {
  nav.push.mockClear()
  nav.replace.mockClear()
})

describe("páginas públicas (Server Components)", () => {
  beforeEach(() => mockBackend())

  it("inicio: muestra partidos, posiciones, goleadores y noticias", async () => {
    await renderServer(HomePage())
    expect(screen.getAllByText("Los Pibes").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0)
    expect(screen.getByText("Arrancó la Copa")).toBeInTheDocument()
  })

  it("fixture y resultados", async () => {
    const { unmount } = await renderServer(FixturePage())
    expect(screen.getAllByText("Los Pibes").length).toBeGreaterThan(0)
    unmount()
    await renderServer(ResultadosPage())
    expect(screen.getAllByText("La Banda").length).toBeGreaterThan(0)
  })

  it("detalle de un partido con sus goles y tarjetas", async () => {
    await renderServer(MatchDetailPage(params({ id: "20" })))
    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0)
    expect(screen.getByText("Gran partido")).toBeInTheDocument()
  })

  it("un partido inexistente o un id inválido da 404", async () => {
    await expect(MatchDetailPage(params({ id: "99" }))).rejects.toThrow("NEXT_NOT_FOUND")
    await expect(MatchDetailPage(params({ id: "abc" }))).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("posiciones, estadísticas y llaves", async () => {
    const posiciones = await renderServer(PosicionesPage())
    expect(screen.getAllByText("Los Pibes").length).toBeGreaterThan(0)
    posiciones.unmount()

    const estadisticas = await renderServer(EstadisticasPage())
    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0)
    estadisticas.unmount()

    await renderServer(LlavesPage())
    expect(screen.getAllByText("Los Pibes").length).toBeGreaterThan(0)
  })

  it("equipos y detalle de un equipo", async () => {
    const lista = await renderServer(EquiposPage())
    expect(screen.getByText("La Banda")).toBeInTheDocument()
    lista.unmount()

    await renderServer(TeamDetailPage(params({ slug: "los-pibes" })))
    expect(screen.getAllByText("Juan Pérez").length).toBeGreaterThan(0)
    await expect(TeamDetailPage(params({ slug: "nadie" }))).rejects.toThrow("NEXT_NOT_FOUND")
  })

  it("noticias, una noticia y galería", async () => {
    const lista = await renderServer(NoticiasPage())
    expect(screen.getByText("Arrancó la Copa")).toBeInTheDocument()
    lista.unmount()

    const noticia = await renderServer(NewsArticlePage(params({ id: "1" })))
    expect(screen.getByText("Primer partido del torneo")).toBeInTheDocument()
    expect(document.querySelector("iframe")?.getAttribute("src")).toContain("dQw4w9WgXcQ")
    noticia.unmount()
    await expect(NewsArticlePage(params({ id: "9" }))).rejects.toThrow("NEXT_NOT_FOUND")

    await renderServer(GaleriaPage())
    expect(screen.getByAltText(/la final/i)).toBeInTheDocument()
  })

  it("ranking del prode", async () => {
    await renderServer(RankingPage())
    expect(await screen.findByText("Ana")).toBeInTheDocument()
  })
})

describe("prode (Client Components)", () => {
  it("sin sesión invita a iniciar sesión o registrarse", async () => {
    mockBackend(null)
    render(<ProdePage />)
    expect(await screen.findByRole("link", { name: /iniciar sesión|ingresar/i })).toHaveAttribute("href", "/auth/login")
  })

  it("con sesión muestra los partidos para predecir", async () => {
    mockBackend(USER)
    render(<ProdePage />)
    expect((await screen.findAllByText("La Banda")).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("spinbutton").length).toBeGreaterThan(0)
  })

  it("mis predicciones muestra los puntos y redirige si no hay sesión", async () => {
    mockBackend(USER)
    const { unmount } = render(<MisPrediccionesPage />)
    expect((await screen.findAllByText("Los Pibes")).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5/).length).toBeGreaterThan(0)
    unmount()

    mockBackend(null)
    render(<MisPrediccionesPage />)
    await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/auth/login"))
  })

  it("perfil muestra mis datos y redirige si no hay sesión", async () => {
    mockBackend(USER)
    const { unmount } = render(<ProfilePage />)
    expect(await screen.findByText(/Hola, Ana/)).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("#1")).toBeInTheDocument()
    unmount()

    mockBackend(null)
    render(<ProfilePage />)
    await vi.waitFor(() => expect(nav.push).toHaveBeenCalledWith("/auth/login"))
  })
})

describe("panel de admin", () => {
  it("un usuario común no puede entrar", async () => {
    mockBackend(USER)
    render(<AdminPage />)
    await vi.waitFor(() => expect(nav.replace).toHaveBeenCalled())
  })

  it("el admin ve el panel con los datos del torneo", async () => {
    mockBackend(ADMIN)
    render(<AdminPage />)
    expect(await screen.findByRole("heading", { name: "Administración" })).toBeInTheDocument()
    expect(nav.replace).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("tab", { name: /Equipos/ }))
    expect((await screen.findAllByDisplayValue("Los Pibes")).length).toBeGreaterThan(0)
  })
})
