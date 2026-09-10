import { apiClient, type ApiResult } from "./api-client"

/** Intenciones que reconoce el backend. `unknown` es el fallback. */
export type ChatIntent =
  | "help"
  | "standings"
  | "top_scorers"
  | "tournament_stats"
  | "team_squad"
  | "head_to_head"
  | "team_next_matches"
  | "team_recent_results"
  | "team_summary"
  | "upcoming_matches"
  | "recent_results"
  | "unknown"

export type ChatAnswer = {
  intent: ChatIntent
  /** Texto listo para mostrar. Trae saltos de línea y viñetas, así que se renderiza con `whitespace-pre-wrap`. */
  answer: string
  /** Filas crudas que respaldan la respuesta, por si se quiere renderizar una tarjeta en vez del texto. */
  data: Record<string, unknown>
  /** Preguntas de seguimiento sugeridas por el backend. */
  suggestions: string[]
}

/** Debe coincidir con `MAX_QUESTION_LENGTH` del backend. */
export const MAX_QUESTION_LENGTH = 300

/**
 * El backend es stateless: no guarda la conversación y cada pregunta se
 * responde por separado. El historial vive sólo en el estado del componente y
 * no se envía, así que las preguntas deben ser autocontenidas.
 */
export async function askChatbot(question: string): Promise<ApiResult<ChatAnswer>> {
  return apiClient<ChatAnswer>("/api/chat", { method: "POST", body: { question } })
}
