import { http, HttpResponse } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/test/server"
import * as actions from "./admin-actions"

const API = "http://localhost:4000"

type Captured = { method: string; path: string; json?: unknown; form?: { contentType: string } }
let captured: Captured[] = []

/** Responde OK a cualquier llamada al backend y guarda qué se pidió. */
beforeEach(() => {
  captured = []
  server.use(
    http.all(`${API}/api/*`, async ({ request }) => {
      const url = new URL(request.url)
      const entry: Captured = { method: request.method, path: url.pathname }
      const type = request.headers.get("content-type") ?? ""
      if (type.includes("application/json")) entry.json = await request.json()
      else if (type.includes("multipart/form-data")) entry.form = { contentType: type }
      captured.push(entry)
      return HttpResponse.json({ success: true })
    }),
  )
})

function form(fields: Record<string, string>) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.append(key, value)
  return data
}

describe("acciones del panel de admin", () => {
  it("cada acción llama al endpoint correcto con el método correcto", async () => {
    const cases: [keyof typeof actions, Record<string, string>, string, string][] = [
      ["saveTournamentSettingsAction", { tournament_name: "Copa" }, "PATCH", "/api/settings"],
      ["autoGenerateGroupFixtureAction", {}, "POST", "/api/matches/generate-fixture"],
      ["autoGenerateBracketAction", {}, "POST", "/api/matches/generate-bracket"],
      ["createTeamAction", { name: "Los Pibes" }, "POST", "/api/teams"],
      ["updateTeamAction", { id: "4", name: "Los Pibes" }, "PATCH", "/api/teams/4"],
      ["deleteTeamAction", { id: "4" }, "DELETE", "/api/teams/4"],
      ["uploadTeamPhotoAction", { id: "4" }, "POST", "/api/teams/4/photo"],
      ["uploadTeamEscudoAction", { id: "4" }, "POST", "/api/teams/4/escudo"],
      ["createPlayerAction", { team_id: "4", name: "Juan" }, "POST", "/api/players"],
      ["deletePlayerAction", { id: "8" }, "DELETE", "/api/players/8"],
      ["createMatchAction", { home_team_id: "1", away_team_id: "2" }, "POST", "/api/matches"],
      ["updateMatchResultAction", { id: "20", home_score: "2" }, "PATCH", "/api/matches/20"],
      ["updateMatchExtrasAction", { id: "20" }, "PATCH", "/api/matches/20/extras"],
      ["deleteMatchAction", { id: "20" }, "DELETE", "/api/matches/20"],
      ["addMatchEventAction", { match_id: "20", event_type: "goal" }, "POST", "/api/matches/20/events"],
      ["deleteMatchEventAction", { id: "5" }, "DELETE", "/api/events/5"],
      ["uploadGalleryAction", { caption: "Final" }, "POST", "/api/gallery"],
      ["deleteGalleryAction", { id: "3" }, "DELETE", "/api/gallery/3"],
      ["createNewsAction", { title: "Hola" }, "POST", "/api/news"],
      ["deleteNewsAction", { id: "1" }, "DELETE", "/api/news/1"],
      ["deleteUserAction", { id: "9" }, "DELETE", "/api/users/9"],
    ]

    for (const [name, fields, method, path] of cases) {
      const action = actions[name] as (data: FormData) => Promise<actions.ActionResult>
      await expect(action(form(fields)), name).resolves.toEqual({ success: true })
      expect(captured.at(-1), name).toMatchObject({ method, path })
    }
  })

  it("manda como JSON solo los campos que corresponden", async () => {
    await actions.updateTeamAction(form({ id: "4", name: "Los Pibes", captain: "Ana", grupo: "A", extra: "no" }))
    expect(captured[0].json).toEqual({ name: "Los Pibes", captain: "Ana", grupo: "A" })

    // El marcador no viaja acá: se mueve cargando goles como eventos.
    await actions.updateMatchResultAction(form({ id: "20", status: "finished", venue: "Cancha 1", home_score: "2" }))
    expect(captured[1].json).toEqual({ status: "finished", venue: "Cancha 1" })

    await actions.updateMatchExtrasAction(form({ id: "20", home_penalties: "4", away_penalties: "3", is_extra_time: "on" }))
    expect(captured[2].json).toMatchObject({ home_penalties: "4", away_penalties: "3", is_extra_time: true })
  })

  it("las subidas de archivos viajan como multipart", async () => {
    const data = form({ id: "4" })
    data.append("photo", new File(["x"], "foto.png", { type: "image/png" }))
    await actions.uploadTeamPhotoAction(data)
    expect(captured[0].form?.contentType).toContain("multipart/form-data; boundary=")
    expect(captured[0].json).toBeUndefined()
  })

  it("devuelve el error del backend", async () => {
    server.use(http.delete(`${API}/api/users/1`, () => HttpResponse.json({ error: "No puedes eliminar tu propio usuario" }, { status: 400 })))
    await expect(actions.deleteUserAction(form({ id: "1" }))).resolves.toEqual({ error: "No puedes eliminar tu propio usuario" })
  })
})
