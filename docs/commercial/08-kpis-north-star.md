# KPIs & North Star

> Definicion de la metrica North Star, KPIs secundarios, indicadores leading vs. lagging, y estructura de dashboard semanal.

---

## North Star Metric

### Definicion

> **"Numero de hinchas que hacen check-in en un negocio La Tribuna al menos una vez por semana"**

### Por que esta metrica

Esta unica metrica captura la salud de las tres capas del negocio simultaneamente:

| Capa | Que implica la metrica |
|------|------------------------|
| **Hincha** | El hincha tiene la app, la usa activamente, y asiste fisicamente a un bar |
| **Negocio** | El negocio esta activo en la plataforma, tiene una liga funcional, y genera trafico presencial |
| **Plataforma** | El puente entre lo digital y lo fisico esta funcionando — la propuesta de valor core se esta materializando |

### Metodologia de medicion

```
North Star = COUNT(DISTINCT user_id)
             WHERE event = 'check-in'
             AND check_in_validated = true
             AND date >= current_week_start
             AND date <= current_week_end
```

**Fuente de datos:** Tabla `Checkin` en la base de datos. Un check-in es valido si:
- El GPS del usuario esta dentro del radio del negocio
- El check-in ocurrio durante un horario de partido activo
- El usuario pertenece a una liga del negocio

**Frecuencia de medicion:** Semanal (lunes a domingo)

**Segmentacion recomendada:**
- Por ciudad
- Por negocio
- Nuevos vs. recurrentes (primera vez vs. repeat check-in)

### Targets por fase

| Fase | North Star Target | Negocios activos | Implicacion |
|------|-------------------|------------------|-------------|
| Phase 1 (mes 3) | 150 check-ins/semana | 10-20 | ~10 hinchas recurrentes por negocio |
| Phase 2 (mes 9) | 1.500 check-ins/semana | 50-100 | ~20 hinchas recurrentes por negocio |
| Phase 3 (mes 24) | 5.000 check-ins/semana | 200-300 | ~20-25 hinchas recurrentes por negocio |

---

## KPIs secundarios por segmento

### Hinchas

| KPI | Definicion | Tipo | Target Phase 1 |
|-----|------------|------|----------------|
| WAU | Hinchas que abren la app al menos 1x/semana | Engagement | 500 |
| Retencion D7 | % de nuevos registros que vuelven 7 dias despues | Retencion | >40% |
| Retencion D30 | % de nuevos registros que vuelven 30 dias despues | Retencion | >20% |
| Preguntas respondidas/partido | Total de respuestas durante un partido en vivo | Engagement | 300 |
| Tasa de canje | % de hinchas con puntos suficientes que canjean al menos 1x/mes | Monetizacion | >30% |
| Invitaciones enviadas | Invitaciones de liga compartidas por WhatsApp | Viralidad | 100/semana |
| K-factor | Nuevos registros via invitacion / invitaciones enviadas | Viralidad | >0.5 |

### Negocios

| KPI | Definicion | Tipo | Target Phase 1 |
|-----|------------|------|----------------|
| Negocios activos | Negocios con >1 liga con >10 miembros | Adopcion | 20 |
| Retencion mensual | % negocios activos que siguen activos al mes siguiente | Retencion | >80% |
| Miembros/liga | Promedio de miembros activos por liga | Salud de liga | >30 |
| Promociones/mes | Promociones enviadas por negocio por mes | Uso de features | >2 |
| Conversion freemium→pago | % de negocios en tier gratis que upgradan | Monetizacion | >40% |
| NPS del negocio | Net Promoter Score trimestral | Satisfaccion | >40 |
| Time-to-activation | Dias desde registro del negocio hasta primer partido con >10 hinchas | Onboarding | <7 dias |

### Plataforma / Revenue

| KPI | Definicion | Tipo | Target Phase 1 |
|-----|------------|------|----------------|
| MRR | Monthly Recurring Revenue total | Revenue | $10M COP |
| ARPU negocio | Revenue promedio por negocio activo | Revenue | $200k COP |
| CAC negocio | Costo de adquirir un negocio de pago | Eficiencia | <$200k COP |
| LTV negocio | Lifetime value del negocio | Revenue | >$3M COP |
| LTV:CAC | Ratio de eficiencia comercial | Eficiencia | >5:1 |
| Churn MRR | % de MRR perdido por cancelaciones | Retencion | <8% |
| Canjes totales/semana | Volumen total de canjes en la plataforma | Actividad | 200 |

---

## Indicadores leading vs. lagging

### Leading indicators (predicen el futuro)

Estos indicadores cambian ANTES de que la North Star se mueva. Monitorearlos permite actuar proactivamente.

| Indicador | Que predice | Tiempo de anticipacion |
|-----------|-------------|----------------------|
| Invitaciones enviadas por hincha | Crecimiento de miembros de liga | 1-2 semanas |
| Preguntas creadas por negocio | Engagement del hincha en el proximo partido | 1-3 dias |
| Registros nuevos esta semana | Check-ins de la proxima semana | 1 semana |
| Partidos programados esta semana | Actividad de la plataforma | 1 semana |
| Tiempo promedio de respuesta del hincha | Engagement depth → predictor de retencion | 2-4 semanas |
| QR scans sin registro completado | Friccion en onboarding → predictor de conversion | Inmediato |
| Mensajes de soporte del negocio | Satisfaccion del negocio → predictor de churn | 2-4 semanas |

### Lagging indicators (confirman el pasado)

Estos indicadores cambian DESPUES de que algo ya paso. Sirven para validar, no para anticipar.

| Indicador | Que confirma |
|-----------|-------------|
| MRR | Que los negocios estan pagando → product-market fit monetizable |
| Churn mensual de negocios | Que la retencion B2B funciona (o no) |
| Retencion D30 del hincha | Que el engagement es sostenido, no un spike inicial |
| Canjes totales del mes | Que el ciclo completo funciona: jugar → ganar → canjear |
| NPS | Que la satisfaccion general es positiva |

### Como usar leading vs. lagging

```
LEADING baja → ACTUAR AHORA
  "Las invitaciones cayeron 40% esta semana"
  → Investigar por que. Hay menos partidos? La feature esta rota? Los hinchas se cansaron?

LAGGING baja → DIAGNOSTICAR
  "El churn de negocios subio a 15% este mes"
  → Ya paso. Que leading indicators lo predijeron? Que leading indicators monitorear ahora?
```

---

## Dashboard semanal

### Vista ejecutiva (para revisiones de equipo)

```
SEMANA: [fecha inicio] — [fecha fin]
PARTIDOS ESTA SEMANA: [N]
```

#### North Star

| Metrica | Esta semana | Semana anterior | Delta | Target |
|---------|-------------|-----------------|-------|--------|
| Check-ins semanales | — | — | — | 150 |

#### Hinchas

| Metrica | Esta semana | Semana anterior | Delta | Target |
|---------|-------------|-----------------|-------|--------|
| WAU | — | — | — | 500 |
| Nuevos registros | — | — | — | — |
| Preguntas respondidas | — | — | — | 300 |
| Canjes realizados | — | — | — | — |
| Invitaciones enviadas | — | — | — | 100 |

#### Negocios

| Metrica | Esta semana | Semana anterior | Delta | Target |
|---------|-------------|-----------------|-------|--------|
| Negocios activos | — | — | — | 20 |
| Ligas con >20 miembros | — | — | — | — |
| Promociones enviadas | — | — | — | — |
| Negocios en riesgo (sin actividad >7d) | — | — | — | 0 |

#### Revenue

| Metrica | Este mes | Mes anterior | Delta | Target |
|---------|----------|--------------|-------|--------|
| MRR | — | — | — | $10M COP |
| Negocios de pago | — | — | — | — |
| Churn negocios (%) | — | — | — | <8% |

#### Alertas

| Alerta | Descripcion | Accion requerida |
|--------|-------------|------------------|
| — | — | — |

#### Top 3 prioridades de la semana

1. —
2. —
3. —

---

### Vista operativa (para monitoreo diario)

#### Por negocio

| Negocio | Liga | Miembros | Check-ins semana | Preguntas creadas | Canjes | Estado |
|---------|------|----------|------------------|-------------------|--------|--------|
| — | — | — | — | — | — | Activo / En riesgo / Inactivo |

**Definicion de estados:**
- **Activo:** >5 check-ins/semana Y >1 pregunta creada en la ultima semana
- **En riesgo:** <5 check-ins/semana O 0 preguntas en >7 dias
- **Inactivo:** 0 check-ins en >14 dias

#### Funnel semanal

```
QR Scans / Link clicks          [N]
    ↓ [X%]
Registros completados            [N]
    ↓ [X%]
Primera pregunta respondida      [N]
    ↓ [X%]
Check-in presencial              [N]
    ↓ [X%]
Primer canje                     [N]
    ↓ [X%]
Retorno semana siguiente         [N]
```

---

## Definicion de exito por fase

### Phase 1: "Hay product-market fit?"

**Duracion:** Mes 1-3

**La respuesta es SI si:**
- North Star: >150 check-ins/semana
- Al menos 3 negocios dicen "quiero seguir usando esto" sin descuento
- Retencion D7 del hincha >40%
- Al menos 1 liga supera 30 miembros organicamente
- El equipo puede operar sin "heroics" (la plataforma funciona sin soporte constante)

**La respuesta es NO si:**
- North Star: <50 check-ins/semana despues de 3 meses
- 0 negocios dispuestos a pagar
- Retencion D7 <20%
- Ninguna liga supera 15 miembros

**La respuesta es INCONCLUSA si:**
- Los numeros estan entre los umbrales
- No hubo suficientes partidos para medir (estacionalidad)
- Problemas tecnicos distorsionaron la medicion

### Phase 2: "El modelo de revenue funciona?"

**Duracion:** Mes 4-9

**La respuesta es SI si:**
- MRR >$10M COP y creciendo
- Churn mensual de negocios <8%
- LTV:CAC >5:1
- Al menos 1 canal de adquisicion B2B escala sin el founder (referidos o distribuidora)
- K-factor de hinchas >0.5

### Phase 3: "Esto puede ser grande?"

**Duracion:** Mes 10-24

**La respuesta es SI si:**
- Funciona en 2+ ciudades con el mismo playbook
- MRR >$100M COP
- >200 negocios activos
- Al menos 1 fuente de revenue no-SaaS genera >20% del total
- Hay demanda en al menos 1 mercado fuera de Colombia
