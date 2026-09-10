import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterAll, afterEach, beforeAll } from "vitest"
import { server } from "./server"

beforeAll(() => server.listen({ onUnhandledRequest: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// El auto-cleanup de Testing Library sólo se registra con `globals: true`, y
// este proyecto usa `globals: false`. Sin esto, el DOM de un test se filtra al
// siguiente y las consultas encuentran elementos duplicados.
afterEach(() => cleanup())
