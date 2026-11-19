import { http, HttpResponse, type JsonBodyType } from "msw"
import type {
  GalleryItem,
  Match,
  MatchEvent,
  NewsWithAuthor,
  Player,
  Prediction,
  ProdeRankingEntry,
  Scorer,
  StandingRow,
  Team,
  TournamentSettings,
} from "@/lib/types"
import { server } from "./server"

const API = "http://localhost:4000"
const HOUR = 60 * 60 * 1000

export const teams: Team[] = [
  { id: 1, name: "Los Pibes", slug: "los-pibes", captain: "Ana", grupo: "A", photo_url: null, escudo_url: null },
  { id: 2, name: "La Banda", slug: "la-banda", captain: "Beto", grupo: "A", photo_url: null, escudo_url: null },
]

export const players: Player[] = [
  { id: 8, team_id: 1, name: "Juan Pérez", number: 10, position: "DEL" },
  { id: 9, team_id: 2, name: "Pedro Gómez", number: 1, position: "ARQ" },
]

function match(overrides: Partial<Match>): Match {
  return {
    id: 20, matchday: 1, kickoff: null, venue: "Cancha 1", home_team_id: 1, away_team_id: 2,
    home_score: null, away_score: null, status: "scheduled", report: null, stage: "group",
    home_name: "Los Pibes", home_slug: "los-pibes", home_escudo_url: null,
    away_name: "La Banda", away_slug: "la-banda", away_escudo_url: null,
    ...overrides,
  }
}

export const finishedMatch = match({
  id: 20, matchday: 1, status: "finished", home_score: 2, away_score: 1,
  kickoff: new Date(Date.now() - 72 * HOUR).toISOString(), report: "Gran partido",
})
export const upcomingMatch = match({ id: 21, matchday: 2, kickoff: new Date(Date.now() + 48 * HOUR).toISOString() })
export const finalMatch = match({ id: 30, matchday: 104, stage: "final", status: "finished", home_score: 1, away_score: 1, home_penalties: 4, away_penalties: 2 })
export const semiMatch = match({ id: 31, matchday: 103, stage: "semi_finals" })
export const matches = [finishedMatch, upcomingMatch, semiMatch, finalMatch]

export const events: MatchEvent[] = [
  { id: 1, match_id: 20, team_id: 1, player_id: 8, player_name: "Juan Pérez", event_type: "goal", minute: 12, created_at: "2026-09-01" },
  { id: 2, match_id: 20, team_id: 2, player_id: 9, player_name: "Pedro Gómez", event_type: "yellow_card", minute: 40, created_at: "2026-09-01" },
  { id: 3, match_id: 20, team_id: 1, player_id: 8, player_name: "Juan Pérez", event_type: "penalty_goal", minute: 70, created_at: "2026-09-01" },
  { id: 4, match_id: 20, team_id: 1, player_id: null, player_name: "Pedro Gómez", event_type: "own_goal", minute: 80, created_at: "2026-09-01" },
]

export const standings: StandingRow[] = [
  { team_id: 1, name: "Los Pibes", slug: "los-pibes", grupo: "A", escudo_url: null, played: 1, won: 1, drawn: 0, lost: 0, goals_for: 2, goals_against: 1, goal_diff: 1, points: 3 },
  { team_id: 2, name: "La Banda", slug: "la-banda", grupo: "A", escudo_url: null, played: 1, won: 0, drawn: 0, lost: 1, goals_for: 1, goals_against: 2, goal_diff: -1, points: 0 },
]

export const scorers: Scorer[] = [{ scorer_name: "Juan Pérez", team_name: "Los Pibes", team_slug: "los-pibes", escudo_url: null, goals: 2 }]

export const stats = {
  totalGoals: 3, totalMatches: 1, avgGoalsPerMatch: 3,
  bestAttack: { name: "Los Pibes", slug: "los-pibes", goals_for: 2 },
  bestDefense: { name: "Los Pibes", slug: "los-pibes", goals_against: 1 },
  biggestWin: finishedMatch,
}

export const settings: TournamentSettings = {
  id: 1, tournament_name: "Copa ETec 2026", format: "both", knockout_source: "general", num_teams_advancing: 4,
  match_duration: 40, group_tiebreaker: "none", knockout_tiebreaker: "penalties", updated_at: "2026-09-01",
}

export const news: NewsWithAuthor[] = [
  { id: 1, title: "Arrancó la Copa", content: "Primer partido del torneo", image_url: null, youtube_id: "dQw4w9WgXcQ", color: "blue", author_id: 1, created_at: "2026-09-01T12:00:00Z", author_name: "Administrador" },
]

export const gallery: GalleryItem[] = [{ id: 1, url: "https://example.public.blob.vercel-storage.com/f.jpg", caption: "La final", created_at: "2026-09-01" }]

export const ranking: ProdeRankingEntry[] = [
  { user_id: 3, display_name: "Ana", total_points: 12, total_predictions: 4, exact_hits: 1, winner_hits: 2 },
]

/** Como responde /api/predictions/me: la predicción con los datos del partido. */
export const myPredictions: (Prediction & Record<string, unknown>)[] = [
  {
    id: 1, user_id: 3, match_id: 20, predicted_home: 2, predicted_away: 1, points_awarded: 5,
    created_at: "2026-09-01", updated_at: "2026-09-01",
    matchday: 1, kickoff: finishedMatch.kickoff, match_status: "finished", home_score: 2, away_score: 1, stage: "group",
    home_name: "Los Pibes", home_slug: "los-pibes", home_escudo_url: null,
    away_name: "La Banda", away_slug: "la-banda", away_escudo_url: null,
  },
  {
    id: 2, user_id: 3, match_id: 21, predicted_home: 0, predicted_away: 0, points_awarded: null,
    created_at: "2026-09-01", updated_at: "2026-09-01",
    matchday: 2, kickoff: upcomingMatch.kickoff, match_status: "scheduled", home_score: null, away_score: null, stage: "group",
    home_name: "Los Pibes", home_slug: "los-pibes", home_escudo_url: null,
    away_name: "La Banda", away_slug: "la-banda", away_escudo_url: null,
  },
]

export const USER = { id: 3, email: "ana@alumno.etec.um.edu.ar", display_name: "Ana", role: "user", created_at: "2026-08-01" }
export const ADMIN = { id: 1, email: "admin@copaetec.online", display_name: "Administrador", role: "admin", created_at: "2026-08-01" }

/** Instala respuestas del backend para todas las rutas públicas y la sesión `user` (o ninguna). */
export function mockBackend(user: typeof USER | typeof ADMIN | null = null) {
  const json = (data: JsonBodyType) => () => HttpResponse.json(data)
  server.use(
    http.get(`${API}/api/auth/me`, json({ user })),
    http.get(`${API}/api/teams`, json(teams)),
    http.get(`${API}/api/teams/slug/:slug`, ({ params }) =>
      params.slug === "los-pibes" ? HttpResponse.json(teams[0]) : new HttpResponse(null, { status: 404 }),
    ),
    http.get(`${API}/api/teams/:id/players`, json(players.filter((p) => p.team_id === 1))),
    http.get(`${API}/api/teams/:id/matches`, json([finishedMatch, upcomingMatch])),
    http.get(`${API}/api/players`, json(players)),
    http.get(`${API}/api/matches`, json(matches)),
    http.get(`${API}/api/matches/finished`, json([finishedMatch])),
    http.get(`${API}/api/matches/live`, json([])),
    http.get(`${API}/api/matches/:id`, ({ params }) =>
      params.id === "20" ? HttpResponse.json(finishedMatch) : new HttpResponse(null, { status: 404 }),
    ),
    http.get(`${API}/api/matches/:id/events`, json(events)),
    http.get(`${API}/api/events`, json(events)),
    http.get(`${API}/api/standings`, json(standings)),
    http.get(`${API}/api/scorers`, json(scorers)),
    http.get(`${API}/api/stats`, json(stats)),
    http.get(`${API}/api/settings`, json(settings)),
    http.get(`${API}/api/news`, json(news)),
    http.get(`${API}/api/news/:id`, ({ params }) =>
      params.id === "1" ? HttpResponse.json(news[0]) : new HttpResponse(null, { status: 404 }),
    ),
    http.get(`${API}/api/gallery`, json(gallery)),
    http.get(`${API}/api/users`, json([ADMIN, USER])),
    http.get(`${API}/api/predictions/upcoming`, json([upcomingMatch])),
    http.get(`${API}/api/predictions/ranking`, json(ranking)),
    http.get(`${API}/api/predictions/me`, json(user ? myPredictions : [])),
    http.get(`${API}/api/predictions/stats/me`, json(user ? { rank: 1, ...ranking[0] } : null)),
  )
}
