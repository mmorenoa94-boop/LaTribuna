# La Tribuna — Guía de arranque

## Requisitos previos
1. Instalar [Node.js LTS 22.x](https://nodejs.org)
2. Instalar pnpm: `npm install -g pnpm`

## Arranque del proyecto

```bash
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
# Edita .env.local con tus credenciales reales

# 3. Generar el cliente de Prisma
pnpm db:generate

# 4. Migrar la base de datos (necesita DATABASE_URL en .env.local)
pnpm db:migrate

# 5. Instalar shadcn/ui
npx shadcn@latest init
# → Seleccionar: Default, Dark, CSS variables: yes
npx shadcn@latest add button card input label tabs badge avatar progress

# 6. Correr en desarrollo
pnpm dev
# → http://localhost:3000

# 7. (Opcional) Socket server en otra terminal
cd socket-server && pnpm install && pnpm dev
```

## Servicios externos a configurar

| Servicio | URL | Variable |
|----------|-----|----------|
| Neon (Postgres) | neon.tech | DATABASE_URL, DIRECT_URL |
| Upstash (Redis) | upstash.com | UPSTASH_REDIS_REST_URL/TOKEN |
| Google OAuth | console.cloud.google.com | GOOGLE_CLIENT_ID/SECRET |
| API-Football | api-football.com | SPORTS_API_KEY |
| Cloudinary | cloudinary.com | CLOUDINARY_* |
| Firebase | console.firebase.google.com | FIREBASE_* |
| Wompi | wompi.co | WOMPI_* |

## Deploy

- **Vercel**: conectar repositorio, agregar variables de entorno
- **Railway**: desplegar `socket-server/` como servicio Node separado
- **Neon**: crear proyecto en neon.tech, copiar DATABASE_URL
- **Upstash**: crear base Redis en upstash.com, copiar URL y token
