# Modelo de Negocio v2 — Split B2C + B2B

> Evolucion del modelo original (`03-business-model.md`) despues de los aprendizajes de EXP-001 (Memorial) y EXP-002 (Instagram). La Tribuna no tiene un solo customer-problem fit — tiene dos, con dinamicas distintas. Este documento separa ambos tracks y explica como se alimentan entre si.

---

## Contexto: por que hacer el split

El modelo original trataba al hincha como "usuario final del B2B2C" — alguien cuyo valor se monetiza indirectamente via el negocio. Los experimentos revelaron algo distinto:

| Experimento | Senal | Implicacion |
|-------------|-------|-------------|
| **EXP-001 (Memorial)** | El dueno del bar ve valor porque "los clientes beben 1 cerveza en 90 min, consumen poco". No le interesa la "fidelizacion" en abstracto — quiere **aumentar el consumo por visita**. | El problema B2B real no es loyalty, es **increase-per-visit**. |
| **EXP-002 (Instagram)** | Un subgrupo del 50% de los registrados chequeaba activamente su posicion y comunicaba su ranking a otros. Incluso personas que no son fanaticas del futbol reportaron buena experiencia. El driver no era el futbol — era **ganarle a sus amigos**. | Hay demanda B2C pura por la mecanica competitiva, sin necesidad de presencia en un bar. |
| **EXP-003 (planeado)** | Valida si el hincha esta dispuesto a **pagar directamente** por entrar a un torneo con premio en efectivo. | Abre una linea de revenue independiente del negocio. |

**Conclusion:** En lugar de un solo embudo B2B2C, La Tribuna debe operar **dos productos que comparten plataforma**:

- **Track B2C** — Hincha paga directamente por una experiencia competitiva (torneos, premium, status)
- **Track B2B** — Bar paga por una herramienta de aumento de consumo + datos + diferenciacion

Ambos tracks comparten la misma infraestructura tecnica (preguntas, leaderboards, wallet, notificaciones) pero atacan problemas distintos y tienen economias distintas.

---

## Track B2C — Hincha Competitivo Directo

### Customer

Hinchas (y no-hinchas competitivos) entre 18-40 anos que ya tienen el habito de ver futbol y que buscan **una razon para que ver el partido sea un evento, no un fondo ambiental**.

Se divide en dos sub-segmentos:

| Sub-segmento | Motivacion dominante | Disposicion a pagar |
|--------------|----------------------|---------------------|
| **Competidor casual** | Competir con amigos, presumir ranking, ganar premios simbolicos | Baja — solo si hay entrada barata o gratis |
| **Competidor serio** | Ganar dinero real, demostrar conocimiento, torneos con stakes | Media — $20k-$100k COP por torneo |

### Problema validado

- La experiencia de ver futbol es **pasiva y olvidable** si no hay stakes.
- Discutir resultados con amigos no tiene "scoreboard" — todos reclaman tener razon.
- No existe una forma sencilla de convertir "saber de futbol" en reconocimiento tangible (status o dinero).

### Solucion

1. **Torneos con entrada y premio en efectivo** (tipo fantasy, pero con trivia en vivo)
   - Entrada: $20k–$100k COP
   - Premios: 70-80% del pot distribuido entre top 3-5
   - Duracion: 1 fin de semana, 1 semana, o 1 fecha completa de liga
2. **Ligas privadas gratis** entre amigos (el gancho viral)
   - Sin premio en efectivo, pero con leaderboard y bragging rights
   - Se crea en 30 segundos, se comparte por WhatsApp
3. **Suscripcion Premium individual** (capa monetizable para el competidor serio)
   - $15.000-$25.000 COP/mes
   - Incluye: estadisticas avanzadas, acceso anticipado a torneos, multiplicadores de XP, badge premium
4. **Patrocinio de premios** (revenue indirecto B2C)
   - Marcas patrocinan el pot de un torneo a cambio de branding en el leaderboard y la notificacion final

### Revenue streams B2C

| Stream | Precio | Margen | Activacion |
|--------|--------|--------|------------|
| Entradas de torneo | $20k-$100k COP | 20-30% (resto es premio) | Phase 1 (validable con EXP-003) |
| Suscripcion Premium individual | $15k-$25k COP/mes | ~90% | Phase 2 |
| Patrocinio de pot por marca | $1M-$5M COP por torneo | 70-90% | Phase 2 |
| Venta de cosmeticos/skins (largo plazo) | $2k-$10k COP por item | 95% | Phase 3 |

### Unit economics B2C (escenario base)

```
Torneo tipo: 30 participantes x $30.000 COP entrada = $900.000 COP pot
  Premios (75%):  $675.000 COP
  Margen (25%):   $225.000 COP
  CAC estimado:   $3.000-$8.000 COP por participante (ad de Instagram/TikTok)
  CAC total:      $90.000-$240.000 COP
  Margen neto:    -$15k a +$135k COP por torneo
```

**Lectura:** La economia del torneo como producto unico es ajustada o negativa. El torneo **no es el negocio** — es el mecanismo de adquisicion. El negocio real B2C es la **retencion** del jugador en torneos posteriores (LTV) y la conversion a Premium.

```
LTV estimado (12 meses, competidor serio):
  Torneos participados:     6 x $30.000 x 25% margen = $45.000 COP
  Suscripcion Premium:      8 meses x $20.000 = $160.000 COP
  LTV total:                ~$205.000 COP
  CAC target:               <$50.000 COP
  LTV:CAC objetivo:         4:1
```

### Metricas clave del Track B2C

| Metrica | Meta Phase 1 | Meta Phase 2 |
|---------|--------------|--------------|
| Participantes por torneo | 15 | 50 |
| Tasa de retorno torneo→torneo | 40% | 55% |
| Conversion a Premium | 5% | 12% |
| % de participantes referidos por otro jugador | 20% | 35% |
| NPS del competidor | >50 | >60 |

---

## Track B2B — Bar con Problema de Consumo

### Customer

Bares deportivos, cervecerias artesanales y restaurantes con pantallas en ciudades principales colombianas. El decision maker es el dueno/admin.

### Problema validado (ajustado)

Aqui esta el insight clave de EXP-001: **el dueno del bar no tiene un problema de "fidelizacion", tiene un problema de consumo por visita.**

Los clientes llegan el dia de partido grande, piden 1 cerveza y se quedan 90 minutos. El local esta lleno pero la venta es baja. Los partidos medios (miercoles, equipos menores) el local esta vacio. El dueno no necesita una app de puntos — necesita una **maquina de aumento de ticket promedio durante el partido + ocupacion en dias muertos**.

| Problema asumido (v1) | Problema validado (v2) |
|------------------------|--------------------------|
| El bar quiere fidelizar clientes | El bar quiere que los clientes consuman mas por visita |
| El bar no conoce a sus clientes | El bar conoce a sus clientes regulares pero no los puede activar en dias medios |
| La diferenciacion es via experiencia unica | La diferenciacion debe traducirse en tickets mas altos para que sea pagable |

### Solucion (ajustada)

1. **Liga del bar con mecanica anclada al consumo** — El hincha gana multiplicadores de puntos cuando pide una segunda bebida, una comida, o permanece mas alla del partido.
2. **Promociones en tiempo real con medicion** — El dueno envia "2x1 en alitas" durante el descanso y ve la conversion en el dashboard. ROI inmediato y visible.
3. **Dias muertos como eventos** — El dueno activa "Miercoles de trivia: doble puntos si vienes hoy" para llenar dias que normalmente estan vacios.
4. **Modo TV** (ya implementado) — Proyeccion del leaderboard en las pantallas del bar para crear presion social y FOMO visual dentro del local.
5. **Reportes de consumo** — Dashboard con ticket promedio, frecuencia por cliente, dias pico vs. dias muertos.

### Revenue streams B2B

| Stream | Precio | Margen | Activacion |
|--------|--------|--------|------------|
| SaaS mensual (Pro) | $150k-$200k COP/mes | ~85% | Phase 1 |
| SaaS mensual (Premium + reportes) | $250k-$350k COP/mes | ~85% | Phase 2 |
| Comision sobre canjes | 5-15% del valor del producto canjeado | ~95% | Phase 1 |
| Boost de promociones (envios extra) | $20k-$50k COP por boost | ~90% | Phase 2 |
| Torneo inter-bares (Batalla) | $500k-$1M COP por bar inscrito | 50-75% | Phase 2 |

### Unit economics B2B (escenario base)

```
Bar Pro tipico:
  Suscripcion:         $200.000 COP/mes
  Comision canjes:     ~$100.000 COP/mes (50 canjes x $12k x 15%)
  Boost promociones:   ~$50.000 COP/mes (2 boosts)
  Total MRR:           $350.000 COP/mes
  CAC estimado:        $150.000-$300.000 COP (venta directa)
  Payback:             ~1 mes
  LTV (12 meses):      $4.200.000 COP
  LTV:CAC:             ~15:1
```

### Metricas clave del Track B2B

| Metrica | Meta Phase 1 | Meta Phase 2 |
|---------|--------------|--------------|
| Bares pagando | 5 | 25 |
| Ticket promedio de cliente La Tribuna vs. cliente regular | +15% | +25% |
| Canjes por bar/semana | 15 | 40 |
| Ocupacion en dias medios (miercoles/jueves) | +10% | +25% |
| NPS del bar | >40 | >55 |
| Churn mensual | <10% | <6% |

---

## Como los dos tracks se alimentan

Aunque son productos distintos, comparten plataforma y generan efectos de red entre si:

```
            B2C (Hincha Competitivo)            B2B (Bar)
          +--------------------------+     +---------------------+
          | Torneos pagos            |     | Liga del bar        |
          | Ligas privadas gratis    |     | Promociones RT      |
          | Premium individual       |     | Reportes de consumo |
          +--------------------------+     +---------------------+
                        |                          |
                        |  Discovery bidireccional |
                        v                          v
          +-----------------------------------------------+
          | Hincha competitivo descubre bares via         |
          | "Explorar" y se une a ligas locales           |
          |                                                |
          | Bar descubre hinchas competitivos y los invita |
          | a sus eventos presenciales                     |
          +-----------------------------------------------+
                                |
                                v
                 +------------------------------+
                 | Bar patrocina torneos B2C    |
                 | y captura hinchas nuevos     |
                 | presencialmente              |
                 +------------------------------+
```

### Tres mecanismos concretos de cross-pollination

1. **Bar patrocina torneo B2C**: El bar paga el pot de un torneo virtual a cambio de que los top 10 reciban un cupon para canjear en el local. Convierte jugadores B2C en clientes B2B presenciales.
2. **Hincha Premium descubre bares**: La seccion Explorar muestra bares con ligas activas. El jugador B2C serio viaja a probar nuevos lugares. Revenue B2B indirecto.
3. **Datos compartidos**: Los datos agregados de comportamiento B2C (accuracy, tiempo de respuesta, preferencias de competencia) alimentan el dashboard B2B para que los bares sepan que preguntas crean mas engagement.

---

## Phasing recomendado

### Phase 1 (meses 0-3): Validar ambos tracks en paralelo, pero con prioridad B2B

**Razon:** El CAC B2C requiere ad spend continuo que ahora mismo no tenemos. El B2B tiene venta directa (mas lento pero mas barato) y LTV probado. La prioridad es tener 5 bares pagando + 1-2 torneos B2C validando la mecanica.

| Track | Objetivo Phase 1 | Experimento ligado |
|-------|------------------|---------------------|
| B2B | 5 bares pagando $200k/mes | EXP-004 (precio), EXP-006 (consumo) |
| B2C | 2 torneos ejecutados con 15+ participantes c/u | EXP-003, EXP-011 |

### Phase 2 (meses 4-9): Escalar B2B, abrir canal pago B2C

**Razon:** Con 5+ bares validados, se invierte en venta directa con 1 SDR dedicado. En paralelo, se activa ad spend B2C una vez que la retencion torneo→torneo supere el 40%.

| Track | Objetivo Phase 2 | Experimento ligado |
|-------|------------------|---------------------|
| B2B | 25 bares pagando + Batalla de Negocios lanzada | EXP-005 (referidos B2B), EXP-009 (Batalla) |
| B2C | 200 jugadores mensuales + Premium lanzado | EXP-012 (Premium pricing) |

### Phase 3 (meses 10-24): Datos, patrocinios, expansion geografica

El ecosistema ya tiene masa critica para monetizar patrocinios de marcas, reportes de datos a distribuidoras, y expandir a segunda ciudad.

---

## Revenue mix proyectado (v2)

| Fuente | Phase 1 | Phase 2 | Phase 3 |
|--------|---------|---------|---------|
| SaaS B2B | 60% | 45% | 30% |
| Comision canjes B2B | 20% | 20% | 20% |
| Entradas de torneo B2C | 15% | 15% | 10% |
| Premium individual B2C | 0% | 10% | 15% |
| Batalla de Negocios | 5% | 5% | 10% |
| Boost promociones | 0% | 5% | 10% |
| Patrocinios + datos | 0% | 0% | 5% |

**Diferencia clave vs. v1:** El B2C pasa de 0% a ~25% del revenue combinado (torneos + premium) en Phase 2-3, en lugar de ser puramente un driver indirecto via negocios.

---

## Riesgos del split

| Riesgo | Severidad | Mitigacion |
|--------|-----------|------------|
| **Dispersion de foco** — Intentar ejecutar ambos tracks con un equipo pequeno diluye la calidad de ambos | Alta | Priorizacion estricta: B2B prioritario Phase 1, B2C con 20% del tiempo. No lanzar nada de B2C hasta tener 3 bares pagando. |
| **Canibalizacion** — Un hincha que paga $30k por torneo B2C puede dejar de ir al bar | Media | Disenar torneos B2C para ocurrir fuera de dias de partido grande, o anclarlos a bares patrocinadores. |
| **Costo operativo de torneos** — Cada torneo B2C requiere curacion manual de preguntas y soporte en vivo | Media | Automatizar generacion de preguntas con IA (ya tenemos GenerateQuestionsModal). Un operador puede correr 3 torneos simultaneos. |
| **Riesgo regulatorio** — Torneos con entrada en efectivo pueden cruzar linea de "juegos de azar" en Colombia | Alta | Consultar con abogado. Diferenciar habilidad vs. azar documentalmente. Usar modelo de "torneo de habilidad" (similar a Panna). |
| **Fragmentacion de la marca** — Dos productos con identidades distintas confunde al mercado | Media | Una sola marca (La Tribuna), dos modos en la misma PWA. No lanzar una app separada. |

---

## Decision pendiente (para Juan)

**El split requiere responder una pregunta estrategica:**

> ¿Lanzamos B2C como producto pago (torneos con entrada) o como gancho gratuito viral (ligas privadas sin premio) para alimentar B2B?

**Opcion A — B2C como producto pago independiente**
- Pro: Revenue directo rapido, valida disposicion a pagar del hincha
- Contra: CAC alto, riesgo regulatorio, distrae del B2B

**Opcion B — B2C como gancho viral gratis**
- Pro: CAC casi cero, alimenta el funnel de descubrimiento B2B
- Contra: No genera revenue directo, mas lento

**Recomendacion:** Opcion B hasta tener 10 bares pagando (~mes 4). Luego Opcion A para el subgrupo serio que ya demostro engagement.
