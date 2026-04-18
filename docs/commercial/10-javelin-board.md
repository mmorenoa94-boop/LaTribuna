# Plan de Experimentacion — Javelin Experiment Board

> Plan estructurado con el formato Javelin Board para validar las hipotesis mas riesgosas del modelo de negocio v2 (B2C + B2B). Basado en los aprendizajes de EXP-001 (Memorial) y EXP-002 (Instagram), y alineado con el phasing del doc `09-modelo-negocio-b2c-b2b.md`.

---

## El Javelin Board en una linea

El Javelin Board (de la metodologia Javelin.com / Lean Startup) fuerza a cada experimento a declarar:

| # | Columna | Que captura |
|---|---------|-------------|
| 1 | **Customer** | Quien es la persona especifica |
| 2 | **Problem** | Que dolor sufre y que asumimos sobre ese dolor |
| 3 | **Solution** | La solucion que proponemos |
| 4 | **Riskiest Assumption** | La suposicion que si es falsa, mata el experimento |
| 5 | **Method** | Como vamos "fuera del edificio" a validar (entrevista, MVP, ad, etc.) |
| 6 | **Success Metric** | Numero y umbral declarado **antes** de correr |
| 7 | **Result** | Que paso (pivot/persevere/kill) |

**Regla de oro:** un experimento valida **una sola riskiest assumption**. Si la matamos, pasamos a la siguiente. Si pasa, escalamos.

---

## Mapa del tablero

```
                    TRACK B2C                     TRACK B2B                    CROSS
                    (Hincha paga)                 (Bar paga)
                  +--------------+              +---------------+           +--------+
Lane 1: Problem   | EXP-002 ✓    |              | EXP-001 ✓     |           |        |
                  | Competencia  |              | Consumo-por-  |           |        |
                  | social real? |              | visita real?  |           |        |
                  +------+-------+              +-------+-------+           +--------+
                         |                              |                        |
                         v                              v                        |
Lane 2: Solution  +------+-------+              +-------+-------+                |
                  | EXP-J01      |              | EXP-J03       |                |
                  | Liga privada |              | Multiplicador |                |
                  | gratis viral |              | de consumo    |                |
                  +------+-------+              +-------+-------+                |
                         |                              |                        |
                         v                              v                        |
Lane 3: Revenue   +------+-------+              +-------+-------+                |
                  | EXP-J02/003  |              | EXP-J04       |                |
                  | Torneo pago  |              | Conversion    |                |
                  | 30k entrada  |              | trial->pago   |                |
                  +------+-------+              +-------+-------+                |
                         |                              |                        |
                         +-----------+--------+---------+                        |
                                     |        |                                  |
Lane 4: Flywheel                     v        v                                  |
                              +---------------+----+                             |
                              | EXP-J05            |                             |
                              | Bar patrocina      |                             |
                              | torneo B2C         |                             |
                              +--------------------+                             |
                                     |                                           |
Lane 5: Scale                        v                                           |
                              +---------------+              +------------------+|
                              | EXP-J06       |              | EXP-J07          ||
                              | Referido B2B  |              | Segunda ciudad   ||
                              | "Invita bar"  |              | remota           ||
                              +---------------+              +------------------+|
```

Leyenda: ✓ = ya ejecutado (EXP-001, EXP-002). Los EXP-J## son los nuevos experimentos Javelin propuestos.

---

## Status de experimentos previos (insumo para el tablero)

| ID | Track | Que validamos | Resultado |
|----|-------|---------------|-----------|
| EXP-001 | B2B | ¿El bar tiene un problema real que pagaria por resolver? | ✓ Validado — problema es consumo-por-visita, no fidelizacion. Dueno interesado en continuar. |
| EXP-002 | B2C | ¿Existe demanda por competencia social sin contexto presencial? | ✓ Validado parcial — 5 de 10 mostraron engagement profundo. UI/sharing tienen fricciones. |
| EXP-003 | B2C | ¿Estan dispuestos a pagar entrada de $50k COP por un torneo? | Pendiente — programado para proximo fin de semana |

**Aprendizajes criticos que informan los siguientes experimentos:**
1. Notificaciones son non-negotiable (confirmado en ambos)
2. Pre-match questions no funcionan — la gente llega sobre la hora
3. Sharing organico requiere 1-click en la app (screenshot no basta)
4. El driver emocional es "ganarle a mis amigos" > "saber de futbol"
5. El bar no compra fidelizacion — compra consumo incremental por visita

---

## Track B2C

### EXP-J01 — Liga privada gratuita como gancho viral

| Columna | Contenido |
|---------|-----------|
| **Customer** | Hinchas entre 22-35 anos en grupos de WhatsApp de amigos que ven futbol juntos (6-12 personas) |
| **Problem** | Sus discusiones de futbol no tienen scoreboard. Todos reclaman tener razon y no hay forma de resolverlo ni darle status al que sabe mas. |
| **Solution** | Crear una "liga privada" gratis en 30 segundos, invitar al grupo de WhatsApp, competir durante 1 fecha de Liga BetPlay. Sin entrada, sin premio en efectivo. Solo bragging rights. |
| **Riskiest Assumption** | Un hincha tomara la iniciativa de crear la liga privada y convencera a 5+ amigos de unirse sin incentivo monetario. |
| **Method** | Construir feature "Crear liga privada" con share-to-WhatsApp pre-escrito. Activar con 3 grupos semilla (amigos cercanos de founders). Medir si el link se comparte mas alla del grupo semilla. |
| **Success Metric** | **K-factor > 1.0** en 2 semanas. Ratio: nuevos usuarios invitados por un grupo / miembros iniciales del grupo. |
| **Fail Criterion** | K-factor < 0.5 → el hincha no toma la iniciativa de invitar espontaneamente. Pivot: buscar otro trigger (ej. el bar es el que crea la liga). |
| **Duracion** | 2 semanas |
| **Muestra** | 3 grupos x ~8 personas = 24 usuarios iniciales |
| **Dependencia tecnica** | Boton de compartir con mensaje pre-escrito en WhatsApp (ya existe en invite page pero requiere verificar) |

---

### EXP-J02 — Conversion de liga privada gratis a torneo pago

| Columna | Contenido |
|---------|-----------|
| **Customer** | Jugadores activos de una liga privada gratis (output de EXP-J01) que han respondido al menos 10 preguntas |
| **Problem** | La liga privada gratis da bragging rights pero no es suficiente motivacion para mantener el engagement despues de 2-3 fechas. Se necesita escalar el stake. |
| **Solution** | Al final de la temporada regular, ofrecer a los 10 primeros de cada liga privada un torneo "finalista" con entrada de $30k COP y pot distribuido entre top 3. |
| **Riskiest Assumption** | Un jugador que ya invirtio tiempo en la liga gratis estara dispuesto a pagar $30k para "defender" su posicion en el torneo pago. |
| **Method** | Enviar push notification + DM de WhatsApp ofreciendo el "torneo campeon" al top 10 de cada liga semilla. Medir conversion. |
| **Success Metric** | **>40% de los top 10 aceptan pagar** (12+ conversiones de 30 posibles) |
| **Fail Criterion** | <20% → El paso de gratis a pago es demasiado abrupto. Pivot: probar tiers intermedios ($10k, $5k) o premios no monetarios. |
| **Duracion** | 1 semana (ventana de registro) + 1 semana (torneo) |
| **Muestra** | 30 jugadores top 10 de las 3 ligas de EXP-J01 |
| **Dependencia** | Pagos Wompi integrados para entrada de torneo |

---

### EXP-J03 — Sharing organico con 1-click post-torneo

| Columna | Contenido |
|---------|-----------|
| **Customer** | Ganadores y top 3 de cualquier torneo (B2C o liga privada) |
| **Problem** | EXP-002 confirmo que los ganadores quieren contar a sus amigos que ganaron, pero el screenshot manual tiene tanta friccion que casi nadie lo hace. Pierden viralidad. |
| **Solution** | Generar una card visual automatica post-torneo con "Gane la liga X con Y puntos" + logo de La Tribuna + CTA "Unete" con share-to-Instagram/WhatsApp/X nativo. |
| **Riskiest Assumption** | Si bajamos la friccion de compartir a 1 tap, al menos 30% de los top 3 compartiran, y eso generara K-factor adicional (>0.3) por sharing. |
| **Method** | Construir "Share result card" con generacion automatica. Activarla para los participantes de EXP-J02. Medir shares ejecutados y registros generados por UTM. |
| **Success Metric** | **>30% de top 3 comparten + K-factor de sharing > 0.3** |
| **Fail Criterion** | <15% comparten → El problema no es la friccion, es la motivacion. Pivot: incentivar el share con puntos extra o badge. |
| **Duracion** | Simultaneo a EXP-J02 (2 semanas) |
| **Muestra** | ~9 top 3 (3 torneos x 3 personas) |
| **Dependencia** | Componente de card compartible (nuevo desarrollo) |

---

## Track B2B

### EXP-J04 — Multiplicador de consumo como driver de ventas incrementales

| Columna | Contenido |
|---------|-----------|
| **Customer** | Dueno de Memorial (validado en EXP-001) + 2 bares adicionales similares |
| **Problem** | Los clientes del bar deportivo consumen 1 cerveza en 90 minutos. El dueno necesita que consuman 2-3 para que el negocio sea viable los dias de partido. |
| **Solution** | Mecanica nueva: cada pedido adicional en el bar (validado por mesero con codigo) otorga un multiplicador 2x a los puntos de la proxima pregunta. El hincha ve el multiplicador activo en la UI y queda incentivado a pedir mas. |
| **Riskiest Assumption** | Hinchas con multiplicador activo aumentaran su consumo en al menos 30% vs. el baseline de un hincha sin La Tribuna durante el mismo partido. |
| **Method** | Durante 3 partidos en Memorial, dividir mesas en dos grupos: grupo A ve el multiplicador, grupo B no lo ve. Medir ticket promedio por mesa al final del partido. (A/B test presencial.) |
| **Success Metric** | **Ticket promedio mesa A > Ticket mesa B en al menos 30%** |
| **Fail Criterion** | Diferencia < 15% → El multiplicador no cambia comportamiento de consumo. Pivot: cambiar mecanica a "recompensa directa" (cerveza gratis al comprar 2, validable en liga). |
| **Duracion** | 3 partidos (~2 semanas) |
| **Muestra** | ~40 mesas totales entre los 3 partidos |
| **Dependencia** | Feature de multiplicador con validacion por codigo de mesero (nuevo desarrollo, 1-2 dias) |

**Nota:** Este es el experimento **mas critico del Track B2B**. Si falla, la propuesta de valor "aumento de consumo" no se sostiene y el modelo v2 tiene que ajustarse.

---

### EXP-J05 — Conversion de trial gratuito a pago tras ver ROI medido

| Columna | Contenido |
|---------|-----------|
| **Customer** | Los 2 bares piloto de EXP-J04 (post-resultado) + Memorial |
| **Problem** | El dueno del bar es esceptico de pagar SaaS antes de ver resultados. Necesita evidencia concreta de que La Tribuna incremento ventas. |
| **Solution** | Despues de 3 partidos con La Tribuna, presentar reporte con: ticket promedio vs. baseline, canjes realizados, y proyeccion de impacto mensual. Ofrecer Pro a $200k/mes. |
| **Riskiest Assumption** | Si el reporte muestra un uplift de ventas de al menos 15%, al menos 2 de 3 bares aceptaran pagar el Pro. |
| **Method** | Presentar el reporte en reunion presencial de 30 min con cada dueno. Cerrar o pedir proxima reunion. |
| **Success Metric** | **2/3 bares convierten a Pro pago** |
| **Fail Criterion** | 0/3 convierten → El valor percibido no justifica $200k/mes. Pivot: revisar precio a $100k o cambiar a modelo 100% comision. |
| **Duracion** | 1 semana post-EXP-J04 |
| **Muestra** | 3 bares |
| **Dependencia** | Reporte automatico de ticket promedio en dashboard |

---

## Cross-pollination

### EXP-J06 — Bar patrocina torneo B2C a cambio de adquisicion de clientes

| Columna | Contenido |
|---------|-----------|
| **Customer** | Un bar Pro pagador + jugadores de Track B2C |
| **Problem** | El bar quiere adquirir clientes nuevos pero sin gastar en ads tradicionales. El jugador B2C quiere descubrir lugares fisicos donde pueda vivir su hobby competitivo con otros hinchas. |
| **Solution** | Bar patrocina el pot de un torneo virtual ($500k COP) a cambio de: 1) Logo del bar en la pantalla del torneo, 2) Los top 10 reciben un cupon para canjear en el bar, 3) El bar recibe la lista de los top 10 con permiso de contacto. |
| **Riskiest Assumption** | Al menos 50% de los top 10 haran check-in fisico en el bar dentro de las 2 semanas siguientes al torneo para canjear su cupon. |
| **Method** | Cerrar 1 bar patrocinador (Memorial u otro). Ejecutar torneo B2C de ~30 jugadores. Dar cupones a top 10. Medir check-ins fisicos post-torneo. |
| **Success Metric** | **5+ de los top 10 hacen check-in en el bar patrocinador en 2 semanas** |
| **Fail Criterion** | <3 check-ins → El torneo B2C no convierte bien a trafico fisico. Pivot: ofrecer cupon con expiracion de 72h, o hacer el torneo con final presencial en el bar. |
| **Duracion** | 1 semana (torneo) + 2 semanas (redencion) |
| **Muestra** | ~30 jugadores, 10 cupones |
| **Dependencia** | EXP-J02 debe haber validado primero el torneo pago B2C |

---

## Escalamiento

### EXP-J07 — Referido B2B "Invita un bar"

| Columna | Contenido |
|---------|-----------|
| **Customer** | Bares Pro pagadores (output de EXP-J05) |
| **Problem** | El CAC B2B via venta directa es alto ($150k-300k COP). Escalar requiere canales con CAC mas bajo. |
| **Solution** | Programa de referidos: cada bar Pro que invite a otro bar y convierta, recibe 1 mes gratis. Incluye kit de referido (material para mostrar al otro bar). |
| **Riskiest Assumption** | Al menos 30% de los bares Pro referiran al menos un bar vecino en 4 semanas. |
| **Method** | Activar programa con los 5 primeros bares Pro. Seguimiento manual semanal. Medir referidos enviados y convertidos. |
| **Success Metric** | **>=2 bares nuevos activados via referido en 4 semanas** (de una base de 5 bares referidores) |
| **Fail Criterion** | 0 referidos enviados → No hay motivacion suficiente. Pivot: reemplazar "1 mes gratis" por comision economica directa ($100k por referido exitoso). |
| **Duracion** | 4 semanas |
| **Muestra** | 5 bares referidores |
| **Dependencia** | Necesita 5 bares Pro pagadores (post EXP-J05) |

---

## Orden de ejecucion y dependencias

```
Semana 1-2:    EXP-J01 (liga privada gratis)      ────────────┐
                                                              │
Semana 1-3:    EXP-J04 (multiplicador consumo)  (en paralelo) │
                                                              │
                         │                                    │
                         ▼                                    ▼
Semana 3-5:    EXP-J02 (torneo pago)             EXP-J05 (conversion pago)
               EXP-J03 (sharing 1-click)
                         │                                    │
                         ▼                                    │
Semana 6-7:    EXP-J06 (bar patrocina torneo)  ←──────────────┘

Semana 7-10:   EXP-J07 (referido B2B)
```

**Dependencias criticas:**
- EXP-J02 depende de EXP-J01 (necesita ligas con jugadores activos)
- EXP-J05 depende de EXP-J04 (necesita reporte de ROI medido)
- EXP-J06 depende de EXP-J02 Y EXP-J05 (necesita torneo pago validado Y bar pagador)
- EXP-J07 depende de EXP-J05 (necesita 5 bares pagadores como referidores)

---

## Gates de decision

Despues de cada fase de experimentos, hay decisiones que tomar:

| Gate | Despues de | Decision |
|------|------------|----------|
| **Gate 1** | EXP-J01 | ¿B2C es viable como producto gratis y viral? Si no, pivot a 100% B2B. |
| **Gate 2** | EXP-J04 | ¿El multiplicador de consumo genera uplift real? Si no, la propuesta de valor B2B tiene que reformularse (no mas "aumento de consumo"). |
| **Gate 3** | EXP-J02 + EXP-J05 | ¿Tenemos al menos uno de los dos tracks monetizandose? Si los dos fallan, es una senal roja — revisar customer-problem fit profundo. |
| **Gate 4** | EXP-J06 | ¿Los dos tracks se alimentan o son independientes? Si son independientes, tratarlos como dos compañias internas con presupuestos separados. |
| **Gate 5** | EXP-J07 | ¿Podemos escalar B2B sin que el CAC suba? Si el referido funciona, activar ventas con SDR. Si no, quedarse en venta fundador-led mas tiempo. |

---

## Presupuesto estimado para ejecutar el plan completo

| Concepto | Estimado |
|----------|----------|
| Ad spend B2C (EXP-J01 seeds + EXP-J02 fill-up) | $300.000 COP |
| Pot del torneo patrocinado EXP-J06 | $500.000 COP (pagado por bar) |
| Kit de referido B2B (EXP-J07) | $200.000 COP |
| Reporte impreso para EXP-J05 | $50.000 COP |
| Tiempo de equipo (semanas 1-10) | — |
| **Total cash out de La Tribuna** | **~$550.000 COP** |

**Nota:** La mayoria de los experimentos son baratos en cash. El costo real es el tiempo de ejecucion del equipo fundador (aproximadamente 50% del tiempo de 2 personas durante 10 semanas).

---

## Como actualizar este tablero

- Cada experimento ejecutado actualiza su fila con resultado, aprendizaje y decision (persevere / pivot / kill).
- Los aprendizajes pueden crear experimentos nuevos (EXP-J08, EXP-J09...) que se anaden al tablero.
- El tablero se revisa semanalmente. El meta-objetivo es matar hipotesis malas rapido y escalar las validadas.
- Cuando un experimento cambia la vision del producto o del mercado, se actualiza `09-modelo-negocio-b2c-b2b.md` y se marca el cambio con un registro en `06-experiment-log.md`.
