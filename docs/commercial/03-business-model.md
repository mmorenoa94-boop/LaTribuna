# Business Model

> Desglose completo de las fuentes de revenue, unit economics, loop viral y framework de proyecciones.

---

## Fuentes de ingreso

### 1. Suscripcion de Negocio (SaaS)

**Modelo:** Pago mensual recurrente por acceso a funcionalidades premium de la plataforma.

| Tier | Precio estimado | Incluye |
|------|----------------|---------|
| **Gratis** | $0 | 1 liga, hasta 20 miembros, preguntas basicas, sin promociones |
| **Pro** | $150.000-$200.000 COP/mes (~$35-50 USD) | Ligas ilimitadas, miembros ilimitados, promociones en tiempo real, dashboard completo |
| **Premium** | $250.000-$300.000 COP/mes (~$60-75 USD) | Todo Pro + Batalla de Negocios, reportes avanzados, soporte prioritario, branding personalizado |

**Unit economics:**
- CAC estimado: $80.000-$200.000 COP ($20-50 USD) — venta directa + onboarding asistido
- Ticket promedio: $200.000 COP/mes
- Churn mensual esperado: 5-8% (alta para SaaS, normal para SMB Latam)
- LTV estimado: $200.000 / 0.065 = ~$3.1M COP (~$750 USD)
- LTV:CAC ratio: ~5:1 a ~15:1
- Margen bruto: ~85% (solo costo de infraestructura)

**Dependencias:**
- Requiere que el negocio perciba valor en las primeras 4 semanas
- Requiere masa critica de hinchas en la liga (>15 miembros)
- El tier gratuito debe ser lo suficientemente util para demostrar valor, pero limitado para motivar upgrade

---

### 2. Comision de canjes

**Modelo:** Porcentaje sobre el valor de cada recompensa canjeada por un hincha en un negocio.

| Variable | Estimado |
|----------|----------|
| Comision | 5-15% del valor del producto canjeado |
| Valor promedio de canje | $8.000-$15.000 COP (una cerveza, unas alitas) |
| Comision promedio por canje | $600-$2.000 COP |
| Canjes por negocio por semana | 20-50 (negocio activo) |
| Revenue semanal por negocio | $12.000-$100.000 COP |

**Unit economics:**
- Revenue mensual por negocio activo: $50.000-$400.000 COP
- Margen: ~95% (transaccion digital pura)
- Escala con el numero de hinchas activos y frecuencia de canje

**Dependencias:**
- Requiere que los negocios configuren recompensas atractivas
- Requiere que los hinchas acumulen suficientes puntos para canjear
- Requiere volumen de transacciones para ser significativo (long tail)

---

### 3. Batalla de Negocios (Torneos)

**Modelo:** Inscripcion de negocios a torneos competitivos entre establecimientos. Los hinchas de cada bar compiten en trivia, y el bar con mas puntos agregados gana.

| Variable | Estimado |
|----------|----------|
| Inscripcion por negocio | $500.000-$1.000.000 COP por evento |
| Negocios por torneo | 8-16 |
| Revenue por torneo | $4M-$16M COP |
| Frecuencia | 1-2 torneos por mes (durante temporada) |
| Revenue mensual | $4M-$32M COP |

**Unit economics:**
- Costo de operacion por torneo: ~$1M-$2M COP (premios + soporte)
- Margen: 50-75%
- Revenue es concentrado (pocos eventos de alto valor)

**Dependencias:**
- Requiere minimo 8 negocios activos y comprometidos
- Requiere que la mecanica de Batalla de Negocios este completa en el producto
- Requiere un nivel de engagement baseline alto en cada liga participante

---

### 4. Boost de promociones

**Modelo:** Pago por envio de promociones segmentadas fuera del plan base. Similar a "boost" de publicaciones en redes sociales.

| Variable | Estimado |
|----------|----------|
| Costo por boost | $20.000-$50.000 COP por envio (CPM) o CPA |
| Alcance por boost | 50-500 hinchas (segun segmento) |
| Frecuencia | 2-4 boosts por negocio por mes |
| Revenue mensual por negocio | $40.000-$200.000 COP |

**Unit economics:**
- Margen: ~90% (costo marginal de notificacion es ~$0)
- Escala con el numero de hinchas en la red

**Dependencias:**
- Requiere red suficientemente grande para que el boost tenga alcance
- Requiere que las promociones anteriores hayan mostrado ROI al negocio
- Relevante a partir de Phase 2

---

### 5. Datos de comportamiento (futuro)

**Modelo:** Reportes premium vendidos a distribuidoras de bebidas y marcas. Datos anonimizados y agregados de comportamiento presencial en establecimientos.

| Variable | Estimado |
|----------|----------|
| Precio por reporte | $1M-$5M COP por mes por marca |
| Clientes potenciales | 3-5 distribuidoras nacionales |
| Revenue mensual | $3M-$25M COP |

**Unit economics:**
- Margen: ~80% (costo de generacion de reportes)
- Revenue de alto margen pero requiere escala significativa (>100 negocios)

**Dependencias:**
- Requiere masa critica de datos (>100 negocios, >5.000 hinchas activos)
- Requiere cumplimiento de regulaciones de privacidad de datos
- Relevante a partir de Phase 3

---

## Revenue mix proyectado por fase

| Fuente | Phase 1 (mes 1-3) | Phase 2 (mes 4-9) | Phase 3 (mes 10-24) |
|--------|-------------------|-------------------|---------------------|
| Suscripciones SaaS | 70% | 50% | 35% |
| Comision de canjes | 15% | 20% | 25% |
| Batalla de Negocios | 10% | 15% | 15% |
| Boost de promociones | 5% | 10% | 15% |
| Datos | 0% | 5% | 10% |

---

## Loop viral explicado paso a paso

```
1. NEGOCIO CREA LIGA
   El dueno del bar crea su liga y la nombra "Liga El Estadio Beer"
   ↓
2. NEGOCIO INVITA CLIENTES
   QR en mesas, post en Instagram del bar, meseros mencionan la liga
   ↓
3. HINCHAS SE REGISTRAN
   10-20 hinchas se unen en la primera semana via PWA
   ↓
4. HINCHAS INVITAN HINCHAS
   Los hinchas comparten el link de la liga por WhatsApp a amigos
   Motivacion: "Unete para competir conmigo" / FOMO del leaderboard
   ↓
5. LIGA CRECE
   La liga pasa de 20 a 50 miembros en 3-4 semanas
   ↓
6. EXPERIENCIA MEJORA
   Mas competencia → leaderboard mas dinamico → mas engagement
   Mas gente → mas canjes → negocio ve mas trafico
   ↓
7. NEGOCIO VE RESULTADOS
   Dashboard muestra: 50 miembros activos, 30 check-ins/semana, 15 canjes
   "Esto funciona. Voy a renovar."
   ↓
8. NEGOCIO RECOMIENDA
   Dueno le cuenta al bar del amigo: "Ponle La Tribuna, funciona"
   Programa de referidos: invitar un bar = 1 mes gratis
   ↓
9. NUEVO NEGOCIO SE UNE
   El ciclo comienza de nuevo con un nuevo establecimiento
   ↓
10. HINCHA DESCUBRE NUEVOS BARES
    En la seccion "Explorar", el hincha ve otros negocios con ligas activas
    Va a un nuevo bar → se une a otra liga → mas engagement
    ↓
    VUELTA AL PASO 3
```

### Coeficiente viral estimado

| Variable | Estimado | Notas |
|----------|----------|-------|
| Invitaciones enviadas por hincha | 2-3 | Via link de WhatsApp |
| Tasa de conversion de invitacion | 25-35% | Alta por contexto social (amigos) |
| Hinchas nuevos por hincha existente | 0.5-1.0 | K-factor |
| Tiempo del ciclo | 1-2 semanas | Tiempo entre registro e invitacion |

Un K-factor de ~0.7 significa crecimiento sostenido con adquisicion pagada minima. Un K-factor >1.0 significaria crecimiento viral autonomo — posible pero no asumido.

---

## Mapa de dependencias de revenue

```
REVENUE STREAM          DEPENDE DE...
─────────────────────────────────────────────────────────────
Suscripcion SaaS    ←── Negocio percibe valor
                    ←── Liga tiene >15 miembros
                    ←── Hincha usa la app recurrentemente

Comision canjes     ←── Hincha acumula puntos
                    ←── Negocio configura recompensas
                    ←── Hincha asiste presencialmente (check-in)

Batalla Negocios    ←── >8 negocios activos en una ciudad
                    ←── Producto de Batalla terminado
                    ←── Engagement baseline alto por liga

Boost promociones   ←── Red de hinchas >500 en la ciudad
                    ←── Negocio ha visto ROI de promociones basicas
                    ←── Segmentacion funcional

Datos              ←── >100 negocios activos
                    ←── >5.000 hinchas con historial
                    ←── Compliance de datos resuelto
```

**Insight clave:** Todas las fuentes de revenue dependen de dos comportamientos base:
1. **El hincha asiste y juega** (engagement + check-in)
2. **El negocio mantiene su liga activa** (recompensas + preguntas)

Si esos dos comportamientos no ocurren, ninguna fuente de revenue funciona.

---

## Framework de proyecciones

### Variables de entrada

```
N = numero de negocios activos
H = hinchas promedio por liga
P = partidos por mes (tipicamente 8-12 en temporada de liga)
A = tasa de actividad por partido (% de hinchas que juegan)
C = tasa de check-in presencial (% de hinchas activos que hacen check-in)
R = tasa de canje (% de hinchas con puntos que canjean)
V = valor promedio del canje
T = ticket de suscripcion promedio
Ch = churn mensual del negocio
```

### Formulas base

```
MRR_SaaS = N * T * (1 - % en tier gratis)

Canjes_mes = N * H * P * A * C * R
Revenue_canjes = Canjes_mes * V * comision%

Revenue_batallas = torneos_mes * negocios_por_torneo * inscripcion
                   (solo si N > 8 en una ciudad)

Revenue_total = MRR_SaaS + Revenue_canjes + Revenue_batallas + Revenue_boost
```

### Escenario ilustrativo — Mes 6

| Variable | Valor |
|----------|-------|
| Negocios activos (N) | 50 |
| Hinchas/liga (H) | 35 |
| Partidos/mes (P) | 10 |
| Tasa actividad (A) | 40% |
| Tasa check-in (C) | 30% |
| Tasa canje (R) | 25% |
| Valor canje (V) | $12.000 COP |
| Comision | 10% |
| Ticket SaaS (T) | $200.000 COP |
| % en tier gratis | 40% |

```
MRR_SaaS = 50 * $200.000 * 0.6 = $6.000.000 COP
Canjes = 50 * 35 * 10 * 0.4 * 0.3 * 0.25 = 5.250
Revenue_canjes = 5.250 * $12.000 * 0.10 = $6.300.000 COP
Revenue_total ≈ $12.300.000 COP + batallas + boost
             ≈ $15M-$20M COP/mes (~$3.700-$5.000 USD)
```

### Sensibilidad

Las variables con mayor impacto en revenue son:
1. **N (negocios activos)** — driver principal; todo escala linealmente con negocios
2. **H (hinchas/liga)** — segundo driver; determina si la experiencia es viable
3. **Ch (churn)** — el destructor silencioso; 5% vs. 10% de churn mensual cambia la trajectoria completamente

### Break-even estimado

Con costos operativos de ~$5M-$8M COP/mes (infra + 1-2 personas):
- Break-even en ~30-40 negocios de pago
- Alcanzable en Phase 1 si la conversion del freemium es >50%
