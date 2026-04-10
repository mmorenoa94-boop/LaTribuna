# Risk Register

> Registro completo de riesgos comerciales de La Tribuna con evaluacion de probabilidad, impacto y mitigacion.

---

## Escala de evaluacion

| Dimension | Bajo | Medio | Alto | Critico |
|-----------|------|-------|------|---------|
| **Probabilidad** | <15% | 15-40% | 40-70% | >70% |
| **Impacto** | Retrasa pero no mata | Requiere pivot significativo | Puede matar la linea de revenue | Puede matar el negocio |

---

## Riesgos de mercado y adopcion

### RISK-001: Baja adopcion del negocio

**Descripcion:** Los duenos de bares no perciben suficiente valor en La Tribuna como para dedicar tiempo a configurar y mantener su liga, o no estan dispuestos a pagar.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Alta (50-60%) |
| Impacto | Critico — sin negocios, no hay plataforma |
| Estado | Abierto |

**Mitigacion actual:**
- Tier gratuito con liga basica para reducir barrera de entrada
- Onboarding 100% asistido en Phase 1
- Demo en vivo en el local del negocio (no solo pitch teorico)

**Mitigacion adicional recomendada:**
- Identificar y resolver las 3 principales objeciones del dueno de bar antes de escalar
- Crear un caso de exito documentado con datos reales en las primeras 8 semanas
- Ofrecer garantia de satisfaccion: "Si no ves resultados en 30 dias, cancela sin costo"

**Preguntas abiertas:**
- Cual es el perfil exacto del negocio que SI adopta? (EXP-001)
- Es el pricing el blocker o es el valor percibido?
- Cuanto tiempo necesita el negocio para ver ROI?

---

### RISK-002: El hincha no descarga / no regresa

**Descripcion:** Los hinchas se registran pero no vuelven a usar la app despues de la primera sesion. O directamente no descargan/registran.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Media-Alta (40-50%) |
| Impacto | Critico — sin hinchas activos, el negocio no percibe valor |
| Estado | Abierto |

**Mitigacion actual:**
- PWA (sin descarga de app store — menor friccion)
- Incentivo de primer canje solo por registrarse
- Check-in presencial como multiplicador de puntos
- Leaderboard social que genera FOMO

**Mitigacion adicional recomendada:**
- Optimizar el time-to-value: del registro al primer momento de valor en <90 segundos
- Push notifications para el siguiente partido en la liga
- Recordatorio antes de cada partido: "Tu liga juega hoy. No dejes que Pipe te gane."

**Preguntas abiertas:**
- Cual es la tasa de retencion real D1, D7, D30? (requiere datos de Phase 1)
- Es el onboarding el problema o es la profundidad del engagement?
- Que proporcion de registros son "obligados" por el mesero vs. organicos?

---

### RISK-003: Liga del negocio no alcanza masa critica

**Descripcion:** La liga de un negocio tiene menos de 15-20 miembros, lo que hace que la experiencia competitiva sea debil y el leaderboard irrelevante.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Alta (50-60%) |
| Impacto | Alto — una liga sin masa critica genera churn del negocio Y del hincha |
| Estado | Abierto |

**Mitigacion actual:**
- Link de invitacion compartible por WhatsApp
- QR en mesas del bar

**Mitigacion adicional recomendada:**
- Definir un "activation milestone" claro: la liga necesita 20 miembros en 2 semanas
- Si no se alcanza, activar protocolo de emergencia: el equipo de La Tribuna ayuda a reclutar hinchas presencialmente
- Considerar ligas agrupadas (multiples negocios en una sola liga) como mecanica temporal para negocios pequenos

**Preguntas abiertas:**
- Cual es el numero minimo de miembros para que la experiencia se sienta "viva"?
- Que hace el negocio cuando su liga tiene 5 personas y no crece?

---

## Riesgos operativos

### RISK-004: Operacion manual no escala

**Descripcion:** El onboarding asistido, el soporte personalizado y la creacion manual de preguntas requieren tiempo del founding team que no escala con el numero de negocios.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Alta (60-70%) |
| Impacto | Alto — limita el crecimiento a la capacidad operativa del equipo |
| Estado | Abierto |

**Mitigacion actual:**
- En Phase 1 es aceptable y necesario (aprender de cerca)

**Mitigacion adicional recomendada:**
- Documentar el playbook de onboarding para que pueda ser ejecutado por city leads o contractors en Phase 2
- Automatizar la creacion de preguntas (integracion con API-Football para generar preguntas basadas en datos del partido)
- Self-serve onboarding mejorado para Phase 2: wizard en el dashboard del negocio

**Preguntas abiertas:**
- Cuantos negocios puede manejar 1 persona con onboarding asistido? (estimado: 5-8)
- Que partes del onboarding son realmente necesarias vs. cuales son "nice to have"?

---

### RISK-005: Creacion de preguntas insuficiente o de baja calidad

**Descripcion:** Si las preguntas de trivia son repetitivas, muy faciles, muy dificiles o irrelevantes, el hincha pierde interes rapidamente.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Media (30-40%) |
| Impacto | Alto — la trivia es el core del engagement. Sin buenas preguntas, no hay juego |
| Estado | Abierto |

**Mitigacion actual:**
- El negocio puede crear sus propias preguntas
- Preguntas generales disponibles para todos

**Mitigacion adicional recomendada:**
- Banco de preguntas pre-generadas por partido (usando datos de API-Football)
- Mecanica de predicciones pre-partido (no requiere creacion manual)
- Sistema de feedback: "Esta pregunta fue buena?" para iterar la calidad
- AI-generated questions basadas en el contexto del partido

**Preguntas abiertas:**
- Quien crea las preguntas en la practica? El negocio o La Tribuna?
- Cuantas preguntas por partido son optimas?

---

## Riesgos tecnicos con impacto comercial

### RISK-006: Dependencia de API-Football

**Descripcion:** La sincronizacion de datos de partidos depende de API-Football. Si el servicio falla, cambia precios, o elimina cobertura del futbol colombiano, el producto se ve afectado.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Media (25-35%) |
| Impacto | Medio — hay workarounds manuales pero degradan la experiencia |
| Estado | Abierto |

**Mitigacion actual:**
- Cache agresivo de fixtures
- Fallback manual para fixture data

**Mitigacion adicional recomendada:**
- Evaluar APIs alternativas como backup (SportMonks, Football-Data.org)
- Construir un modo "manual" robusto para que el negocio pueda operar sin API
- Monitorear cambios en pricing y ToS de API-Football

---

### RISK-007: Estacionalidad del futbol

**Descripcion:** Entre temporadas de liga (diciembre-enero, junio-julio en Colombia), la actividad cae drasticamente. Los hinchas no tienen razon para abrir la app y los negocios cuestionan el valor.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Alta (70-80%) — es inevitable, no probabilistico |
| Impacto | Medio — predecible y planificable, pero puede generar churn si no se maneja |
| Estado | Abierto |

**Mitigacion actual:**
- Previsto en la hoja de ruta: extender a otros deportes

**Mitigacion adicional recomendada:**
- Mecanicas de inter-temporada: predicciones de transferencias, quiz historicos, "Tribuna Retro"
- Copa America, Mundiales, Champions League como contenido durante gaps locales
- Pausar cobros durante periodos sin actividad (para evitar churn por "estoy pagando y nadie juega")
- Batallas de Negocios programadas para periodos de baja actividad deportiva

**Preguntas abiertas:**
- Que porcentaje de la actividad se pierde entre temporadas?
- El negocio cancela o pausa durante el receso?

---

## Riesgos financieros

### RISK-008: Unit economics no cierran a escala

**Descripcion:** El costo de adquisicion y soporte de cada negocio es mayor que el revenue que genera, especialmente con churn alto de SMBs.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Media (30-40%) |
| Impacto | Critico — si LTV < CAC, el modelo no es viable |
| Estado | Abierto |

**Mitigacion actual:**
- Costos de infraestructura bajos (Vercel Hobby + Neon + Upstash free tiers)
- Equipo minimo (founder-led)

**Mitigacion adicional recomendada:**
- Medir CAC y LTV desde el primer negocio que paga
- Si el churn es >10% mensual, priorizar retencion sobre adquisicion
- Diversificar revenue (no depender solo de SaaS) con comisiones y batallas

---

### RISK-009: Competidor con mas capital entra al mercado

**Descripcion:** Una startup bien financiada o una empresa existente (Rappi, Bavaria, una cadena de bares) decide lanzar un producto similar.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Baja-Media (20-30%) en 12 meses |
| Impacto | Alto — podria acelerar la competencia por negocios y hinchas |
| Estado | Abierto |

**Mitigacion actual:**
- No hay competidor directo identificado en Latam actualmente

**Mitigacion adicional recomendada:**
- Construir la red de negocios lo mas rapido posible (el moat principal)
- Generar switching costs altos via comunidades construidas
- Considerar exclusividad temporal con negocios clave ("Eres el unico bar La Tribuna en tu cuadra")
- Estar abierto a alianzas o adquisicion si un player grande se interesa

---

## Riesgos regulatorios y legales

### RISK-010: Regulacion de juegos de azar / apuestas

**Descripcion:** Si las autoridades colombianas interpretan las predicciones deportivas con premios canjeables como una forma de apuesta, La Tribuna podria necesitar una licencia de juegos de azar.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Baja-Media (20-30%) |
| Impacto | Critico — podria requerir licencia costosa o forzar cambio de mecanica |
| Estado | Abierto |

**Mitigacion actual:**
- Los puntos se ganan por conocimiento (trivia) y asistencia, no por azar
- No hay apuesta monetaria del usuario

**Mitigacion adicional recomendada:**
- Consulta legal formal antes de escalar
- Documentar que la mecanica es de "skill-based gaming" no de "gambling"
- Evitar cualquier feature que se pueda interpretar como apuesta (no cobrar por participar, no premiar por azar)

---

### RISK-011: Privacidad de datos de geolocalizacion

**Descripcion:** El check-in GPS captura datos de ubicacion de los usuarios. Si no se maneja correctamente, podria generar problemas legales o de reputacion.

| Dimension | Evaluacion |
|-----------|------------|
| Probabilidad | Baja (10-20%) |
| Impacto | Medio-Alto — multas o perdida de confianza |
| Estado | Abierto |

**Mitigacion actual:**
- GPS se usa solo para verificar presencia en el momento del check-in

**Mitigacion adicional recomendada:**
- No almacenar historial de ubicacion — solo validar presencia puntual
- Consentimiento explicito en el registro
- Politica de privacidad clara y accesible
- Cumplir con Ley 1581 de 2012 (proteccion de datos personales Colombia)

---

## Top 3 riesgos que pueden matar el negocio en Phase 1

Estos son los riesgos que requieren atencion inmediata y activa. Si no se resuelven antes del final de Phase 1, la viabilidad del proyecto esta en riesgo.

### 1. RISK-001: Baja adopcion del negocio

**Por que es critico:** Sin negocios activos, no hay plataforma. Los hinchas no se registran solos — necesitan un negocio que los active. Si los primeros 5-10 bares no adoptan, no hay product-market fit B2B.

**Que tiene que pasar:** Al menos 3 de los primeros 10 negocios deben decir "esto funciona y quiero seguir usandolo" al final de Phase 1. Si 0 lo dicen, hay que pivotar.

### 2. RISK-002 + RISK-003: El hincha no regresa / la liga no alcanza masa critica

**Por que es critico:** El negocio abandona si su liga no tiene suficientes miembros activos. Y los hinchas se van si la liga es aburrida. Es un circulo vicioso: pocos hinchas → liga aburrida → negocio cancela → mas hinchas se van.

**Que tiene que pasar:** Al menos 3 ligas deben superar los 20 miembros activos en las primeras 4 semanas. La retencion semanal debe ser >30%.

### 3. RISK-010: Regulacion de juegos de azar

**Por que es critico:** Aunque la probabilidad es baja-media, el impacto es potencialmente fatal. Si se activa, podria forzar un rediseno completo de la mecanica core o requerir una licencia prohibitivamente cara para una startup.

**Que tiene que pasar:** Consulta legal formal completada ANTES de invertir en adquisicion de negocios a escala. Obtener opinion escrita de un abogado especializado en regulacion de juegos en Colombia.
