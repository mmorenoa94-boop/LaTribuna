# 🏟️ La Tribuna — Análisis Comercial

> *Perspectiva de founder / inversor temprano — Marzo 2026*

---

## El problema real

Los bares y restaurantes en Colombia llenan su local los días de partido **por inercia**, no por estrategia. El dueño no sabe quién vino, cuánto consumieron, si volverán, ni cómo comunicarse con ellos después del partido. El hincha, por su parte, ve el partido con la misma experiencia pasiva de siempre: cerveza, gol, silencio.

**Nadie ha monetizado el ritual del fútbol a nivel de local.**

---

## La propuesta de valor en una línea

> **La Tribuna convierte cada partido de fútbol en una experiencia interactiva que fideliza clientes para los negocios y premia a los hinchas por asistir y competir.**

---

## ¿Qué es esto realmente?

No es solo una app de trivia deportiva. Es una **plataforma de loyalty + engagement B2B2C** con tres capas de valor:

```
HINCHA ──────▶ Entretenimiento + Recompensas
    │
    └──▶ NEGOCIO ──────▶ Datos + Fidelización + Ingresos
              │
              └──▶ LA TRIBUNA ──▶ SaaS + Comisión de transacciones
```

### Para el hincha
- Juega predicciones antes y durante el partido
- Gana puntos canjeables en el mismo bar donde está viendo el partido
- Su presencia física tiene valor: el check-in presencial multiplica sus puntos
- Compite en una liga con sus amigos o con desconocidos del mismo bar

### Para el negocio
- Crea su propia liga con sus clientes habituales → **retención**.
- Sabe exactamente cuántos clientes activos tiene, con qué frecuencia vienen, qué consumen
- Puede lanzar una promoción en el descanso del partido a todos los que están en el local → **venta cruzada en tiempo real**
- Sus mejores clientes se autoidentifican compitiendo → **segmentación automática**

---

## Mercado objetivo

### TAM (Mercado total)
- **Colombia:** ~16.000 establecimientos de comidas y bebidas que transmiten fútbol regularmente
- **Latinoamérica:** Brasil, Argentina, México, Chile — mercados con cultura futbolera similar y menor penetración de loyalty digital para PYMEs

### SAM (Mercado alcanzable a 3 años)
- Bares y restaurantes de ciudades principales de Colombia (Bogotá, Medellín, Cali, Barranquilla, Bucaramanga)
- Estimado: ~3.000 negocios con ticket promedio de suscripción mensual

### SOM (Objetivo realista año 1)
- 100–300 negocios premium activos
- MRR objetivo: $150M–$450M COP / mes (~$35k–$110k USD)

---

## Modelo de negocio

### Fuentes de ingreso proyectadas

| Fuente | Modelo | Ticket |
|--------|--------|--------|
| **Suscripción Negocio** | SaaS mensual por acceso premium | $150k–$300k COP/mes |
| **Comisión de canjes** | % sobre el valor de recompensas canjeadas | 5–15% |
| **Batalla de Negocios** | Inscripción a torneos entre establecimientos | $500k–$1M COP/evento |
| **Boost de promociones** | Pago por envío de promociones segmentadas extra | CPM / CPA |
| **Datos de comportamiento** | Reportes premium de asistencia y consumo (futuro) | Por negocio |

### La palanca de crecimiento
El modelo tiene un **loop viral natural**:
1. Un negocio crea una liga y la nombra con su marca
2. Sus clientes se invitan entre sí para competir
3. Nuevos hinchas descargan la app para unirse
4. Estos nuevos hinchas descubren otros negocios en "Explorar"
5. El negocio ve más tráfico → paga → recomienda a otros negocios

---

## Ventajas competitivas (Moats)

### 1. El check-in presencial como diferenciador clave
Que los puntos se multipliquen por estar **físicamente presente** en el negocio es la decisión de diseño más inteligente del producto. Crea un comportamiento que ninguna app de trivia genérica puede replicar: el hincha **tiene que ir al bar** para sacarle el máximo provecho. Eso es churn prevention para el negocio y retención de usuario para la plataforma.

### 2. Datos propios de comportamiento presencial
Ningún sistema de fidelización tradicional (tarjeta de puntos, sellos) captura esto: **quién fue, cuándo, con qué frecuencia, y si consumió lo mínimo requerido**. La Tribuna lo hace automáticamente con GPS.

### 3. El creador de ligas es el negocio, no la plataforma
El negocio tiene ownership de su liga y de sus miembros. Eso genera sentido de pertenencia del dueño hacia la plataforma. Un negocio que construyó su liga de 80 personas no va a cambiar de plataforma fácilmente → **alta retención B2B**.

### 4. Tiempo real como barrera técnica
El stack de Socket.io + Redis + Next.js 14 con App Router es significativamente más difícil de construir que un producto de trivia estático. Un competidor local tendría que invertir meses solo en replicar la infraestructura de tiempo real.

---

## Comparación con referentes

| Producto | Qué hace bien | Qué Le Tribuna hace diferente |
|----------|--------------|-------------------------------|
| **Supercell / Duolingo** | Gamificación masiva | La Tribuna ancla la gamificación al mundo físico |
| **Fanatics / FanID** | Fan engagement digital | La Tribuna incentiva presencia presencial |
| **Belly / Stamp Me** | Loyalty para PYMEs | La Tribuna lo hace en tiempo real y conectado al partido |
| **Playrz / Fan Battle** | Trivia deportiva | No tienen modelo B2B ni integración con negocios físicos |

**No hay un competidor directo en Latam** que combine loyalty B2B + trivia en vivo + presencia física + sistema de puntos canjeables. Ese es el espacio que ocupa La Tribuna.

---

## Riesgos y cómo mitigarlos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Baja adopción del negocio | Alto | Freemium con liga básica gratuita, onboarding asistido |
| El hincha no descarga la app | Alto | Incentivo de primer canje solo por registrarse |
| Dependencia de API-Football | Medio | Caché agresivo + fallback manual de fixtures |
| Estacionalidad (no hay torneos en X época) | Medio | Extender a otros deportes (béisbol, baloncesto, eSports) |
| Clonación por una big tech | Bajo | La red de negocios construida es el moat real |

---

## Traction esperada / KPIs a medir

### North Star Metric
> **"Número de hinchas que hacen check-in en un negocio La Tribuna al menos una vez por semana"**

Ese número captura todo: que el hincha usa la app, que el negocio está activo, y que la presencia física está siendo generada.

### Métricas secundarias
| KPI | Meta mes 3 | Meta mes 12 |
|-----|------------|-------------|
| Negocios activos | 20 | 200 |
| Hinchas registrados | 500 | 15.000 |
| Check-ins/semana | 150 | 5.000 |
| Preguntas respondidas/partido | 300 | 50.000 |
| MRR | $10M COP | $150M COP |

---

## Go-to-market

### Fase 1 — Validación (mes 1–3)
- 5–10 bares premium en Medellín o Bogotá como early adopters
- Liga de lanzamiento gratuita a cambio de feedback activo
- Operación manual de soporte al negocio (onboarding asistido)

### Fase 2 — Escala local (mes 4–9)
- Activar modelo freemium vs. premium
- Pitch a distribuidoras de cerveza y patrocinadores deportivos como canal de adquisición B2B
- Programa de referidos para negocios: "Invita un bar, gana un mes gratis"

### Fase 3 — Expansión (mes 10–24)
- Abrir Cali y Barranquilla
- Piloto en una ciudad latinoamericana (Ciudad de México o Lima)
- Alianza con operadores de estadios o fanzone oficiales

---

## Lo que tiene que pasar para que esto sea grande

1. **Un negocio icónico en cada ciudad** que sea la liga de referencia — "la liga del Barón Rojo", "la liga del Estadio". Eso crea aspiración social en el hincha.
2. **Un momento viral:** el partido donde el hincha local gana la predicción, canjea su cerveza gratis en el bar, y lo postea en Instagram. Eso no se paga con publicidad.
3. **La liga de negocios ("Batalla de Negocios")** como producto mediático — rankear los bares más activos de una ciudad durante la liga es contenido que los medios deportivos regionalesvan a querer cubrir.

---

## Conclusión del founder

Este no es un proyecto de trivia. Es una **plataforma de distribución de experiencias deportivas hacia el comercio físico**. El tech está bien construido — Next.js 14, Prisma, Socket.io, PWA — y el producto ya tiene la separación de roles correcta (hincha vs. negocio). El trabajo que queda no es tecnológico: es **comercial**. Ir al primer bar, ponerlo a funcionar, documentar el caso de éxito, y repetir.

> **La tribuna está lista. El partido está por comenzar.**
