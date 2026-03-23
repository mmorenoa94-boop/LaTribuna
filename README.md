# 🏆 La Tribuna

> **"El juego de los que sí saben"**

La Tribuna es una plataforma **PWA** de gamificación deportiva enfocada en el fútbol colombiano. Conecta a dos tipos de usuarios: **hinchas** que compiten por diversión y puntos, y **negocios** (bares, restaurantes, clubes) que usan la plataforma para fidelizar clientes durante los días de partido.

---

## 📐 Arquitectura general

El proyecto está compuesto por **dos servicios**:

| Servicio | Tecnología | Descripción |
|----------|------------|-------------|
| **App principal** | Next.js 14 + TypeScript | Frontend + API Routes (SSR/ISR) |
| **Socket Server** | Node.js + Socket.io | Servidor de eventos en tiempo real (puerto 4000) |

```
┌──────────────────────────────────────────────────────────┐
│                    Cliente (Browser / PWA)                │
└───────────┬──────────────────────────────┬───────────────┘
            │ HTTP (REST + Server Actions) │ WebSocket
            ▼                              ▼
   ┌─────────────────┐           ┌──────────────────┐
   │  Next.js 14 App │           │  Socket Server   │
   │  (puerto 3000)  │──Redis──▶ │  (puerto 4000)   │
   └────────┬────────┘  queue    └──────────────────┘
            │
            ▼
   ┌─────────────────┐
   │  Neon PostgreSQL │
   │  (via Prisma)   │
   └─────────────────┘
```

---

## 🗂 Estructura de carpetas

```
laTribuna/
├── app/
│   ├── (auth)/          # Rutas de autenticación (login, onboarding)
│   ├── (hincha)/        # Área del hincha (home, ligas, perfil, wallet...)
│   ├── (negocio)/       # Área del negocio (dashboard)
│   ├── api/             # 22 grupos de endpoints REST
│   ├── invite/          # Página pública de invitación a liga
│   ├── layout.tsx       # Layout raíz + providers
│   └── page.tsx         # Redirección inteligente por rol
├── components/
│   ├── hincha/          # Componentes exclusivos del hincha
│   ├── negocio/         # Componentes exclusivos del negocio
│   ├── shared/          # Componentes compartidos (UI, modales, etc.)
│   └── layout/          # Navegación, headers, footers
├── prisma/
│   └── schema.prisma    # Esquema completo de la base de datos
├── socket-server/
│   └── index.ts         # Servidor Socket.io con polling de Redis
├── hooks/               # React hooks personalizados
├── stores/              # Estado global con Zustand
├── lib/                 # Utilidades, auth, prisma client
└── types/               # Tipos TypeScript globales
```

---

## 👥 Tipos de usuario y flujo de navegación

```
  Usuario llega a /
       │
       ├─ No autenticado ──▶  /onboarding  (landing + login)
       │
       ├─ Rol HINCHA ────────▶  /home       (área del hincha)
       │
       └─ Rol NEGOCIO ───────▶  /dashboard  (área del negocio)
```

### HINCHA (`/home`, `/ligas`, `/explorar`, `/perfil`, `/wallet`, `/notificaciones`)
El hincha puede:
- Ver partidos en vivo y programados
- Unirse a ligas por código de invitación
- Responder preguntas de predicción antes y durante el partido
- Acumular puntos y XP, subir de nivel
- Hacer check-in en un negocio para obtener multiplicador de puntos
- Canjear puntos por recompensas de los negocios
- Ver su wallet con historial de transacciones

### NEGOCIO (`/dashboard`)
El negocio puede:
- Crear y administrar ligas con sus propias reglas
- Configurar preguntas y power-ups para cada partido
- Ver el leaderboard de su liga en tiempo real
- Crear promociones segmentadas (por asistentes al local, jugadores de liga, etc.)
- Definir recompensas canjeables para hinchas
- Participar en "Batalla de Negocios" compitiendo con otros establecimientos

---

## 🗃 Modelo de datos (Prisma / PostgreSQL)

### Entidades principales

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuario base con XP, nivel, streak y rol (`HINCHA`, `NEGOCIO`, `SUPER_ADMIN`) |
| `Business` | Perfil de negocio vinculado a un `User`, con geolocalización y radio de check-in |
| `League` | Liga de predicciones (privada, por invitación, pública o de negocio) |
| `LeagueMember` | Membresía de un usuario en una liga con sus puntos totales |
| `Match` | Partido sincronizado desde la API externa de fútbol |
| `LeagueMatch` | Relación entre una liga y los partidos que cubre |
| `LeagueQuestion` | Preguntas de predicción asociadas a un partido de una liga |
| `Prediction` | Respuesta pre-partido de un hincha a una pregunta |
| `Answer` | Respuesta en vivo de un hincha a una pregunta durante el partido |
| `PowerUp` | Preguntas relámpago lanzadas durante el partido (duración: segundos) |
| `Wallet` + `WalletTransaction` | Sistema de puntos canjeables con historial de movimientos |
| `Reward` | Premio físico o virtual definido por un negocio |
| `Redemption` | Canje de puntos por un reward, con código único |
| `Promotion` | Mensaje promocional segmentado enviado por un negocio |
| `Battle` + `BattleParticipant` | Competencia entre negocios de una ciudad/zona |
| `Checkin` | Registro de presencia GPS de un hincha en un negocio |
| `PushSubscription` | Suscripción Web Push para notificaciones |
| `Notification` | Notificación en-app por usuario |

### Enums relevantes

| Enum | Valores |
|------|---------|
| `UserRole` | `HINCHA`, `NEGOCIO`, `SUPER_ADMIN` |
| `LeagueType` | `PRIVATE`, `INVITE_ONLY`, `PUBLIC`, `BUSINESS` |
| `MatchMode` | `PER_MATCH`, `SEASON`, `HYBRID` |
| `QuestionType` | `WINNER`, `SCORE`, `SCORER`, `YES_NO`, `RANGE`, `CUSTOM` |
| `QuestionTiming` | `PRE_MATCH`, `LIVE` |
| `TransactionType` | `MATCH_WIN`, `PREDICTION_WIN`, `PROFILE_BONUS`, `POWER_UP_WIN`, `REDEMPTION`, `EXPIRY`, `ADMIN_ADJUSTMENT` |
| `PUTrigger` | `MANUAL`, `GOAL`, `HALFTIME`, `MINUTE` |
| `PromoSegment` | `ALL_IN_VENUE`, `LEAGUE_PLAYERS`, `VERIFIED_CONSUMERS`, `RECURRING` |

---

## 🚀 API Routes (`/app/api/`)

El proyecto expone **22 grupos de endpoints** como API Routes de Next.js:

| Grupo | Descripción |
|-------|-------------|
| `/api/auth` | Autenticación con NextAuth v5 (Google OAuth + credenciales) |
| `/api/users` | CRUD de perfil de usuario |
| `/api/profile` | Actualización de datos de perfil |
| `/api/leagues` | Creación, listado y administración de ligas |
| `/api/businesses` | Gestión de negocios |
| `/api/matches` | Listado y detalle de partidos |
| `/api/fixtures` | Sincronización de fixtures desde API-Football |
| `/api/answers` | Registro de respuestas en vivo |
| `/api/leaderboard` | Clasificación por liga |
| `/api/wallet` | Historial y saldo de puntos |
| `/api/rewards` | Gestión de premios por negocio |
| `/api/redemptions` | Proceso de canje de premios |
| `/api/notifications` | Notificaciones en-app |
| `/api/push` | Registro/cancelación de suscripciones Web Push |
| `/api/promotions` | Creación y envío de promociones |
| `/api/payments` | Integración con Wompi (pagos Colombia) |
| `/api/checkins` | Registro de check-ins con validación GPS |
| `/api/battles` | Gestión de batalla de negocios |
| `/api/upload` | Subida de imágenes a Cloudinary |
| `/api/cron` | Tareas automáticas (sincronización partidos, expiración de puntos) |
| `/api/seed` | Datos de prueba para desarrollo |
| `/api/admin` | Operaciones de administrador |

---

## ⚡ Tiempo real con Socket.io

El `socket-server` (puerto 4000) gestiona la comunicación en tiempo real entre el servidor Next.js y los clientes conectados.

**Flujo de eventos:**
```
Next.js API Route
       │
       ▼ rpush a Redis (clave: lt:socket:events)
Upstash Redis
       │
       ▼ polling cada 500ms
Socket Server
       │
       ▼ io.to(room).emit(event, data)
Clientes conectados
```

**Eventos de sala:**

| Evento (cliente → servidor) | Descripción |
|----------------------------|-------------|
| `league:join` | Entrar a sala de liga + partido específico |
| `league:subscribe` | Suscribirse a eventos generales de una liga |
| `league:leave` | Salir de todas las salas de una liga |
| `match:subscribe` | Suscribirse a marcador en vivo de un partido |
| `match:unsubscribe` | Cancelar suscripción a marcador |
| `answer:submit` | ACK de envío de respuesta (la lógica real es via REST) |

---

## 🧰 Stack tecnológico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Animaciones | Framer Motion |
| ORM | Prisma 5 |
| Base de datos | Neon (PostgreSQL serverless) |
| Auth | NextAuth v5 (Google OAuth + email/password) |
| Cache / Rate limiting | Upstash Redis |
| Tiempo real | Socket.io |
| Notificaciones push | Web Push API (VAPID) |
| Imágenes | Cloudinary |
| API de fútbol | API-Football (api-sports.io) |
| Pagos | Wompi (Colombia) |
| Estado global | Zustand |
| Queries | TanStack Query (React Query) |
| Deploy app | Vercel |
| Deploy socket | Railway |
| PWA | next-pwa (service worker + caché offline) |

---

## 🔧 Variables de entorno requeridas

Copia `.env.example` a `.env.local` y completa los valores:

| Variable | Servicio | Obligatoria |
|----------|----------|-------------|
| `DATABASE_URL` / `DIRECT_URL` | Neon PostgreSQL | ✅ |
| `NEXTAUTH_SECRET` / `NEXTAUTH_URL` | NextAuth | ✅ |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth | ✅ |
| `API_FOOTBALL_KEY` | API-Football | ✅ para fixtures |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | Upstash Redis | ✅ para socket |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push | ✅ para notificaciones |
| `CLOUDINARY_*` | Cloudinary | Para subir imágenes |
| `WOMPI_*` | Wompi | Para pagos premium |
| `CRON_SECRET` | Cron jobs | Para tareas automáticas |
| `NEXT_PUBLIC_SOCKET_URL` | Socket server | ✅ |
| `NEXT_PUBLIC_APP_URL` | General | ✅ |

---

## 🛠 Comandos disponibles

```bash
# Desarrollo
npm run dev              # Inicia el servidor Next.js en localhost:3000

# Base de datos
npm run db:generate      # Genera el cliente de Prisma
npm run db:push          # Aplica el schema sin migraciones
npm run db:migrate       # Crea y aplica una migración
npm run db:studio        # Abre Prisma Studio (GUI de la BD)

# Producción
npm run build            # Genera prisma client + build de Next.js
npm run start            # Servidor de producción

# Socket server (desde socket-server/)
pnpm dev                 # Inicia el socket server en localhost:4000
```

---

## 🚢 Deploy

### App principal → Vercel
1. Conectar el repositorio en [vercel.com](https://vercel.com)
2. Agregar todas las variables de entorno en el panel de Vercel
3. `NEXTAUTH_URL` debe apuntar al dominio de producción

### Socket server → Railway
1. Crear un nuevo servicio en [railway.app](https://railway.app)
2. Apuntar al directorio `socket-server/`
3. Configurar `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, y `NEXT_PUBLIC_APP_URL`
4. Actualizar `NEXT_PUBLIC_SOCKET_URL` en Vercel con la URL de Railway

### Base de datos → Neon
1. Crear un proyecto en [neon.tech](https://neon.tech)
2. Copiar `DATABASE_URL` (pooler) y `DIRECT_URL` (directo) al `.env`
3. Ejecutar `npm run db:migrate` para inicializar las tablas

---

## 📱 PWA (Progressive Web App)

La app está configurada como PWA completa con `next-pwa`:
- **Instalable** en Android/iOS desde el navegador
- **Caché offline** para imágenes, fuentes, JS/CSS y datos de API
- **Service Worker** activo solo en producción (deshabilitado en desarrollo)
- **Notificaciones push** via Web Push API con claves VAPID
