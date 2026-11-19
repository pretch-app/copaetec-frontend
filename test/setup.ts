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

// jsdom no trae IntersectionObserver. Este doble avisa que el elemento ya está visible,
// como pasaría al hacer scroll hasta él.
class VisibleIntersectionObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??= VisibleIntersectionObserver as unknown as typeof IntersectionObserver
