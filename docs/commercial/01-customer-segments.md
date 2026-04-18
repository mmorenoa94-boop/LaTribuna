# Customer Segments

> La Tribuna opera un modelo B2B2C con dos segmentos primarios y dos segmentos secundarios que emergen a medida que la plataforma escala.

---

## Segmento 1: Hinchas (Fans) — Usuario Final (C)

### Perfil

- **Demografía:** Hombres y mujeres entre 18–45 anos, clase media y media-alta en ciudades principales de Colombia (Medellin, Bogota, Cali, Barranquilla, Bucaramanga).
- **Psicografia:** Apasionados por el futbol colombiano e internacional. Socializan alrededor del deporte — ver un partido es un evento social, no individual. Buscan pertenencia a un grupo, competencia amistosa y reconocimiento entre pares.
- **Comportamiento digital:** Usan smartphone como dispositivo principal. Estan familiarizados con apps de delivery, redes sociales y juegos casuales. Toleran apps nuevas si el valor es inmediato. Baja paciencia para onboardings largos.
- **Patron de consumo:** Frecuentan bares/restaurantes al menos 1-2 veces por semana durante temporada de futbol. Gastan entre $30.000-$80.000 COP por visita en comida y bebidas.

### Problema que La Tribuna resuelve

El hincha vive el partido de forma pasiva: llega al bar, ve el juego, grita un gol, se va. No hay una capa de interaccion que convierta esa experiencia en algo memorable, competitivo o recompensable. No hay razon para elegir un bar sobre otro mas alla de la cercania o la costumbre.

La Tribuna transforma la experiencia pasiva en un juego activo con stakes reales: puntos, rankings, premios canjeables en el mismo lugar donde esta viendo el partido.

### Descubrimiento y onboarding

| Canal | Mecanismo | Conversion esperada |
|-------|-----------|---------------------|
| Invitacion directa del negocio | QR en mesa / codigo de liga compartido por mesero | Alta — contexto presencial + incentivo inmediato |
| Boca a boca entre hinchas | Link de invitacion a liga compartido por WhatsApp | Alta — confianza social + FOMO competitivo |
| Redes sociales del negocio | Post del bar promocionando su liga | Media — requiere descarga y registro |
| Exploracion organica | Busqueda en app stores o Google | Baja — sin contexto de negocio |
| Momento viral | Hincha comparte premio canjeado en Instagram/TikTok | Variable — alto potencial pero impredecible |

**Flujo de onboarding critico:**
1. Hincha escanea QR o recibe link de invitacion
2. Abre la PWA (sin descarga de app store)
3. Registro con Google/Apple (1 toque)
4. Se une a la liga del negocio automaticamente
5. Primera pregunta disponible de inmediato si hay partido en curso
6. Primer canje disponible con puntos de bienvenida

**Tiempo critico:** Del escaneo al primer momento de valor debe ser < 90 segundos.

### Drivers de retencion

1. **Competencia social:** Leaderboard de la liga con amigos genera FOMO semanal. "No puedo dejar que Pipe me gane."
2. **Recompensas tangibles:** Los puntos se canjean por productos reales en el bar donde ya esta. No es un descuento generico — es una cerveza gratis ahora mismo.
3. **Multiplicador presencial:** El check-in fisico multiplica puntos. El hincha siente que pierde si ve el partido en casa.
4. **Progresion de nivel:** Sistema de 20 niveles con XP acumulativo. El nivel se muestra en el perfil — status social dentro de la comunidad.
5. **Variedad de mecanicas:** Predicciones pre-partido + trivia en vivo mantienen el engagement antes y durante el juego.
6. **Habito de ritual:** El futbol tiene calendario fijo. La Tribuna se monta sobre un habito existente — no necesita crear uno nuevo.

### Riesgos de churn

| Riesgo | Descripcion | Severidad | Senal temprana |
|--------|-------------|-----------|----------------|
| Recompensas poco atractivas | El hincha acumula puntos pero no encuentra nada valioso que canjear | Alta | Puntos acumulados sin canje por >3 semanas |
| Liga inactiva | El negocio deja de crear preguntas o el match schedule esta vacio | Alta | 0 preguntas en >2 partidos consecutivos |
| Grupo social se dispersa | Los amigos dejan de ir al mismo bar | Media | Caida en check-ins grupales |
| Fatiga de trivia | Las preguntas se repiten o son demasiado faciles/dificiles | Media | Tiempo de respuesta plano + accuracy >90% o <20% |
| Fricciones tecnicas | App lenta, preguntas que no cargan, puntos que no se acreditan | Alta | Sesiones <30s, errores de socket |
| Estacionalidad | No hay partidos durante recesos de liga | Media | Drop en DAU >60% entre temporadas |

### Metricas clave del segmento

| Metrica | Definicion | Meta Phase 1 |
|---------|------------|--------------|
| WAU (Weekly Active Users) | Hinchas que abren la app al menos 1 vez por semana | 500 |
| Check-ins/semana | Numero de check-ins presenciales semanales | 150 |
| Preguntas respondidas/partido | Total de respuestas durante un partido en vivo | 300 |
| Tasa de canje | % de hinchas con puntos suficientes que canjean al menos 1 vez al mes | >30% |
| NPS del hincha | Net Promoter Score via encuesta in-app | >50 |
| Ratio invitaciones enviadas/aceptadas | Viralidad organica del hincha | >25% |

---

## Segmento 2: Negocios (Businesses) — Cliente B2B

### Perfil

- **Tipo:** Bares deportivos, restaurantes con pantallas, cervecerías artesanales, sports lounges, fanzones. Establecimientos donde el futbol es parte central de la experiencia.
- **Tamano:** PYMEs con 1-5 locales. Facturacion mensual entre $15M-$80M COP. Equipo de 3-20 empleados.
- **Decision maker:** Dueno/a o administrador/a del local. Persona practica, poco tiempo libre, esceptica de tecnologia que no muestre resultados rapidos.
- **Madurez digital:** Baja a media. Tienen Instagram del negocio pero rara vez usan herramientas digitales de gestion. Muchos aun llevan cuentas en cuaderno. No tienen CRM ni sistema de loyalty.
- **Motivacion principal:** Llenar el local mas dias, no solo los de partido grande. Fidelizar a los clientes que ya vienen para que vuelvan y traigan amigos.

### Problema que La Tribuna resuelve

El negocio deportivo llena por inercia los dias de partido grande pero no tiene herramientas para:
- Saber quien vino (no hay registro de clientes)
- Comunicarse con ellos despues (no hay base de datos)
- Incentivar la recurrencia (no hay programa de lealtad)
- Diferenciarse de la competencia (la experiencia es identica en todos los bares)
- Aprovechar el momento del partido para hacer ventas cruzadas (descanso = tiempo muerto)

La Tribuna convierte cada partido en una herramienta de fidelizacion automatica con datos accionables.

### Descubrimiento y onboarding

| Canal | Mecanismo | Conversion esperada |
|-------|-----------|---------------------|
| Venta directa (founding team) | Visita presencial al negocio con demo en vivo | Alta — relacion personal + demo contextual |
| Referido de otro negocio | Programa "Invita un bar, gana un mes gratis" | Alta — confianza de par |
| Distribuidora de cerveza | Pitch a traves del distribuidor como valor agregado | Media — requiere alineacion con distribuidor |
| Redes sociales / contenido | Cases de exito publicados en Instagram/LinkedIn | Media — atrae negocios curiosos |
| Evento de la industria | Presencia en ferias de gastronomia/nightlife | Baja-Media — lead generation de largo plazo |

**Flujo de onboarding critico:**
1. Demo presencial o videollamada de 15 minutos
2. Creacion de cuenta de negocio (datos basicos + logo)
3. Creacion de la primera liga con nombre del negocio
4. Configuracion de al menos 3 recompensas canjeables
5. Generacion del QR de invitacion a la liga
6. Primer partido con al menos 10 hinchas activos (asistido por el equipo de La Tribuna)

**Tiempo critico:** Del primer contacto al primer partido activo debe ser < 7 dias.

### Drivers de retencion

1. **Ownership de la liga:** El negocio construye "su" comunidad. 80 miembros en la liga son 80 razones para no cancelar.
2. **Datos accionables:** Dashboard con check-ins, frecuencia de visita, clientes top. Informacion que nunca tuvieron.
3. **Promociones en tiempo real:** Poder enviar una oferta a todos los que estan en el local durante el descanso. ROI inmediato y visible.
4. **Batalla de Negocios:** Competir contra otros bares genera orgullo y engagement del staff.
5. **Auto-segmentacion de clientes:** Los hinchas mas activos se identifican solos. El negocio sabe a quien premiar sin encuestas.
6. **Efecto de red local:** Mientras mas negocios estan en La Tribuna, mas hinchas. Mientras mas hinchas, mas valor para el negocio.

### Riesgos de churn

| Riesgo | Descripcion | Severidad | Senal temprana |
|--------|-------------|-----------|----------------|
| No ve ROI rapido | El negocio no percibe aumento en ventas o asistencia en primeras 4 semanas | Critica | No renueva trial / no responde mensajes |
| Operacion manual excesiva | Crear preguntas y gestionar ligas consume mas tiempo del esperado | Alta | <2 preguntas creadas por semana |
| Liga con pocos miembros | <15 hinchas en la liga = experiencia poco competitiva | Alta | Liga con <15 miembros a las 3 semanas |
| Staff no adopta la herramienta | Meseros no promocionan el QR ni explican La Tribuna | Media | Check-ins bajos vs. trafico real del local |
| Cambio de administracion | Nuevo dueno/admin no conoce ni valora la plataforma | Media | Cambio de contacto + caida en actividad |

### Metricas clave del segmento

| Metrica | Definicion | Meta Phase 1 |
|---------|------------|--------------|
| Negocios activos | Negocios con >1 liga activa y >10 miembros | 20 |
| Retencion mensual | % de negocios que permanecen activos mes a mes | >80% |
| Miembros promedio por liga | Hinchas activos en la liga del negocio | >30 |
| Promociones enviadas/mes | Uso de la herramienta de promociones | >2 por negocio |
| MRR por negocio | Ingreso recurrente mensual promedio | $200k COP |
| NPS del negocio | Net Promoter Score via encuesta trimestral | >40 |

---

## Segmento Secundario A: Distribuidoras y Marcas de Bebidas

### Perfil

Grandes distribuidoras de cerveza (Bavaria/ABInBev, Heineken, Postobón) y marcas de bebidas que ya tienen relacion comercial con los bares deportivos.

### Problema que La Tribuna resuelve

Las marcas gastan millones en patrocinio deportivo generico (vallas en estadios, comerciales de TV) pero no pueden medir el impacto en el punto de consumo final: el bar. No saben si el hincha que ve su anuncio en TV luego pide su cerveza en el bar.

La Tribuna ofrece un canal directo al momento de consumo con datos de comportamiento presencial.

### Rol en el ecosistema

- **Canal de adquisicion B2B:** La distribuidora recomienda La Tribuna a sus bares aliados como herramienta de valor agregado.
- **Patrocinador de ligas/torneos:** La marca patrocina una "Batalla de Negocios" y gana visibilidad contextualizada.
- **Fuente de datos:** Reportes de consumo por marca en establecimientos La Tribuna (fase futura con integracion POS).

### Timing

Este segmento es relevante a partir de Phase 2, cuando haya masa critica de negocios para ofrecer escala.

---

## Segmento Secundario B: Operadores de Estadios y Fanzones

### Perfil

Operadores de estadios de futbol, fanzones oficiales de equipos, y organizadores de eventos deportivos masivos.

### Problema que La Tribuna resuelve

Los estadios tienen miles de personas durante 90 minutos pero la experiencia del hincha es unidireccional. No hay interactividad digital integrada ni mecanismo para capturar datos del asistente mas alla de la boleta.

### Rol en el ecosistema

- **Expansion de escala:** Un estadio con 30.000 asistentes puede generar miles de usuarios nuevos en un solo evento.
- **Validacion de marca:** Estar presente en un estadio oficial legitima La Tribuna como plataforma seria.
- **Canal de contenido:** Momentos virales en el estadio generan contenido organico de alto impacto.

### Timing

Este segmento es relevante a partir de Phase 3, como parte de la estrategia de expansion y alianzas.

---

## Matriz de Segmentos

| Dimension | Hinchas | Negocios | Distribuidoras | Estadios |
|-----------|---------|----------|-----------------|----------|
| **Prioridad** | Core | Core | Secundario | Terciario |
| **Phase activa** | 1-3 | 1-3 | 2-3 | 3 |
| **Modelo de revenue** | Indirecto (engagement) | SaaS + comisiones | Patrocinio + data | Patrocinio + licencia |
| **CAC esperado** | <$1 USD (viral) | $20-50 USD (venta directa) | $0 (relacion comercial) | $0 (alianza estrategica) |
| **LTV esperado** | Indirecto via negocio | $200-600 USD/ano | $5.000-50.000 USD/ano | Por negociar |
| **Esfuerzo de onboarding** | Bajo (self-serve) | Alto (asistido) | Medio (propuesta comercial) | Alto (negociacion) |
