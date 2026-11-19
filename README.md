# Copa ETec Frontend

Frontend de la Copa ETec 2026 desarrollado con Next.js. Consume la API del proyecto hermano `copaetec-backend`.

## Requisitos

- Node.js 20 o superior
- `copaetec-backend` configurado con una base de datos Postgres
- Credenciales de Google OAuth para el inicio de sesión

## Configuración local

En el backend, crea `copaetec-backend/.env.local` a partir de `.env.example` y completa las variables necesarias, especialmente `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

En este frontend, copia `.env.example` como `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
# Opcional: dejar comentada cuando el torneo ya comenzó
# NEXT_PUBLIC_TOURNAMENT_START_DATE=2026-08-14T13:00:00-03:00
```

Los archivos `.env*` locales están excluidos de Git. No subas credenciales al repositorio.

## Ejecución

Inicia el backend en una terminal:

```bash
cd ../copaetec-backend
npm install
npm run dev
```

Inicia el frontend en otra terminal:

```bash
npm ci
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

El backend corre en `http://localhost:4000` y el frontend en `http://localhost:3000`.

## Google OAuth

En Google Cloud Console, dentro de **APIs y servicios → Credenciales → ID de cliente OAuth 2.0**, agrega esta URI de redireccionamiento autorizada:

```text
http://localhost:4000/api/auth/callback/google
```

Si cambias el puerto del backend, actualiza también esta URI en Google Cloud y `NEXT_PUBLIC_API_URL`.

## Despliegue en Vercel

Configura en el proyecto frontend las siguientes variables de entorno:

```env
NEXT_PUBLIC_API_URL=https://tu-backend.example.com
# Opcional, en formato ISO 8601 con zona horaria
NEXT_PUBLIC_TOURNAMENT_START_DATE=2026-08-14T13:00:00-03:00
```

En el backend configura `FRONTEND_URL` y `ALLOWED_ORIGINS` con la URL HTTPS exacta del frontend. No uses `*`: las peticiones autenticadas utilizan cookies. La URI de callback de Google debe usar la URL pública del backend:

```text
https://tu-backend.example.com/api/auth/callback/google
```

El frontend usa `package-lock.json` como lockfile oficial; Vercel instalará las dependencias con npm.

## Tests y cobertura

```bash
npm test                # todos los tests
npm run test:coverage   # tests + cobertura (reporte en coverage/)
```

Los tests usan Vitest, Testing Library y MSW para simular el backend (`test/fixtures.ts`). En cada PR, el CI corre `npm run test:coverage` y falla si la cobertura baja del 60% en líneas, sentencias, funciones o ramas. El reporte queda como artifact `coverage-report`. Quedan fuera de la medición los componentes generados de shadcn/ui (`components/ui`) y las escenas 3D con three.js, que necesitan WebGL.

## Desarrollo

Puedes editar `app/page.tsx`; el servidor de desarrollo actualiza los cambios automáticamente.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.
