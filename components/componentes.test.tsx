import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { http, HttpResponse } from "msw"
import { afterEach, describe, expect, it, vi } from "vitest"
import { server } from "@/test/server"
import type { Match, ProdeRankingEntry, StandingRow } from "@/lib/types"
import { MatchCard } from "./match-card"
import { PredictionCard } from "./prode/prediction-card"
import { RankingTable } from "./prode/ranking-table"
import { GroupStandings } from "./group-standings"

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock("sonner", () => ({ toast }))

const API = "http://localhost:4000"
const HOUR = 60 * 60 * 1000

function match(overrides: Partial<Match> = {}): Match {
  return {
    id: 20,
    matchday: 3,
    kickoff: new Date(Date.now() + 48 * HOUR).toISOString(),
    venue: "Cancha 1",
    home_team_id: 1,
    away_team_id: 2,
    home_name: "Los Pibes",
    away_name: "La Banda",
    home_score: null,
    away_score: null,
    status: "scheduled",
    ...overrides,
  } as Match
}

function standing(id: number, name: string, grupo: string | null, points: number): StandingRow {
  return {
    team_id: id, name, slug: name.toLowerCase(), grupo, escudo_url: null,
    played: 2, won: 1, drawn: 0, lost: 1, goals_for: 3, goals_against: 2, goal_diff: 1, points,
  } as StandingRow
}

afterEach(() => vi.useRealTimers())

describe("MatchCard", () => {
  it("un partido programado muestra VS y la fecha", async () => {
    render(<MatchCard match={match()} />)
    expect(screen.getByText("VS")).toBeInTheDocument()
    expect(screen.getByText("Fecha 3")).toBeInTheDocument()
    expect(screen.getByText("Los Pibes")).toBeInTheDocument()
  })

  it("un partido finalizado muestra el marcador y los penales", () => {
    render(<MatchCard match={match({ status: "finished", home_score: 2, away_score: 2, home_penalties: 4, away_penalties: 3 } as Partial<Match>)} />)
    expect(screen.queryByText("VS")).not.toBeInTheDocument()
    expect(screen.getAllByText("2")).toHaveLength(2)
    expect(screen.getByText("(4 - 3)")).toBeInTheDocument()
  })

  it("un partido que ya empezó aparece en vivo", async () => {
    render(<MatchCard match={match({ kickoff: new Date(Date.now() - 10 * 60 * 1000).toISOString() })} />)
    expect(await screen.findByText("En Vivo")).toBeInTheDocument()
  })

  it("actualiza el marcador en vivo consultando al backend", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    server.use(http.get(`${API}/api/matches/live`, () => HttpResponse.json([{ id: 20, home_score: 1, away_score: 0, status: "scheduled" }])))

    render(<MatchCard match={match({ kickoff: new Date(Date.now() - 5 * 60 * 1000).toISOString() })} />)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100)
    })

    expect(await screen.findByText("1")).toBeInTheDocument()
  })
})

describe("PredictionCard", () => {
  it("guarda la predicción y avisa", async () => {
    let body: unknown
    server.use(
      http.post(`${API}/api/predictions`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ success: true })
      }),
    )
    const { container } = render(<PredictionCard match={match()} />)
    const [home, away] = container.querySelectorAll("input[type=number]")
    fireEvent.change(home, { target: { value: "2" } })
    fireEvent.change(away, { target: { value: "1" } })
    fireEvent.click(screen.getByRole("button"))

    await vi.waitFor(() => expect(toast.success).toHaveBeenCalledWith("Predicción guardada"))
    expect(body).toEqual({ match_id: 20, predicted_home: 2, predicted_away: 1 })
  })

  it("muestra el error del backend", async () => {
    server.use(http.post(`${API}/api/predictions`, () => HttpResponse.json({ error: "Las predicciones para este partido ya cerraron" }, { status: 400 })))
    const { container } = render(<PredictionCard match={match()} prediction={{ predicted_home: 1, predicted_away: 1 } as never} />)
    expect(screen.getByText("Guardado")).toBeInTheDocument()
    expect(container.querySelector<HTMLInputElement>("input[name=predicted_home]")?.value).toBe("1")
    fireEvent.click(screen.getByRole("button"))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith("Las predicciones para este partido ya cerraron"))
  })

  it("un partido finalizado queda cerrado y sin poder editarse", () => {
    const { container } = render(<PredictionCard match={match({ status: "finished", home_score: 1, away_score: 0 })} />)
    expect(screen.getByText("Cerrado")).toBeInTheDocument()
    for (const input of container.querySelectorAll("input[type=number]")) expect(input).toBeDisabled()
  })
})

describe("RankingTable", () => {
  const ranking = [
    { user_id: 9, display_name: "beto", total_points: 20, exact_hits: 3, winner_hits: 2 },
    { user_id: 3, display_name: "Ana", total_points: 12, exact_hits: 1, winner_hits: 3 },
    { user_id: 4, display_name: "Caro", total_points: 8, exact_hits: 0, winner_hits: 4 },
    { user_id: 5, display_name: "Dani", total_points: 2, exact_hits: 0, winner_hits: 1 },
  ] as ProdeRankingEntry[]

  it("ordena el ranking y marca al usuario actual", async () => {
    server.use(http.get(`${API}/api/auth/me`, () => HttpResponse.json({ user: { id: 3, display_name: "Ana", role: "user" } })))
    render(<RankingTable ranking={ranking} />)

    expect(await screen.findByText(/Ana.*\(Vos\)/)).toBeInTheDocument()
    const rows = screen.getAllByRole("row").slice(1)
    expect(within(rows[0]).getByText("20")).toBeInTheDocument()
    expect(within(rows[3]).getByText("4")).toBeInTheDocument()
    expect(within(rows[0]).getByText("B")).toBeInTheDocument()
  })

  it("avisa cuando todavía no hay puntos", async () => {
    server.use(http.get(`${API}/api/auth/me`, () => HttpResponse.json({ user: null })))
    render(<RankingTable ranking={[]} />)
    expect(screen.getByText(/todavía no hay puntos/i)).toBeInTheDocument()
  })
})

describe("GroupStandings", () => {
  const rows = [standing(1, "Los Pibes", "A", 6), standing(2, "La Banda", "B", 3), standing(3, "Los Pumas", "A", 1)]

  it("en formato grupos muestra una tabla por grupo", () => {
    render(<GroupStandings rows={rows} format="groups" />)
    expect(screen.getByRole("heading", { name: "Grupo A" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Grupo B" })).toBeInTheDocument()
    expect(screen.getAllByRole("table")).toHaveLength(2)
  })

  it("en formato general o sin grupos muestra una sola tabla", () => {
    const { unmount } = render(<GroupStandings rows={rows} format="general" />)
    expect(screen.getAllByRole("table")).toHaveLength(1)
    unmount()
    render(<GroupStandings rows={rows.map((r) => ({ ...r, grupo: null }))} />)
    expect(screen.getAllByRole("table")).toHaveLength(1)
  })

  it("en formato mixto ofrece pestañas", () => {
    render(<GroupStandings rows={rows} />)
    expect(screen.getByRole("tab", { name: "Tabla General" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Fase de Grupos" })).toBeInTheDocument()
  })
})
