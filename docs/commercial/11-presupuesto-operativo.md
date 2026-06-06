# Presupuesto Operativo Mensual

> Estimacion de costos mensuales de operacion de La Tribuna durante la fase Champions Final + Mundial 2026. Construido en dos escenarios: **Lean** (minimo viable) y **Recomendado** (infra robusta para picos de carga).

Tasa de referencia: **$4.000 COP / USD**.

---

## Contexto

Este presupuesto se construye despues de las decisiones tomadas para la operacion del Mundial:

- **Sin Wompi** durante el Mundial → No hay revenue B2C self-serve. Todo el revenue B2B se cobra via transferencia/factura.
- **Plan freemium agresivo** → Los bares en piloto operan gratis. La conversion a Pro ($200k/mes) se hace fundador-led.
- **Champions Final (30 mayo) como ensayo general** del Mundial (11 jun → 19 jul).
- **Meta:** 5-8 bares en Champions, 15-25 bares en Mundial, + torneo publico B2C gratis con premio patrocinado.

---

## 1. Hosting + Infraestructura

| Item | Lean | Recomendado | Notas |
|------|------|-------------|-------|
| **Vercel** | Hobby (gratis) | Pro $20 USD = **$80k** | Pro es obligatorio para crons activos. Sin Pro no opera Mundial sola — cada partido habria que abrir/cerrar preguntas a mano. |
| **Neon** (Postgres prod + dev) | Free tier (gratis) | Launch $19 USD = **$76k** | Free aguanta hasta ~0.5GB. En Mundial puede escalar mas rapido. |
| **Upstash Redis** | Free + pay-as-you-go ~**$20k** | Pay-as-you-go ~**$80k** | El socket queue hace polling cada 500ms — el costo escala con el volumen real. |
| **Railway** (socket-server) | Hobby ~$5 USD = **$20k** | Hobby+ ~$10 USD = **$40k** | Socket server independiente de Vercel para tiempo real. |
| **Cloudinary** | Free tier (gratis) | Free tier (gratis) | 25 creditos gratis al mes — alcanza para piloto. |
| **Resend** (emails) | Free 3k emails (gratis) | Pro $20 USD = **$80k** | Free aguanta 5 bares; con 25 bares + notificaciones de partido puede pasar a Pro. |
| **Sentry** (monitoreo de errores) | Free tier (gratis) | Free tier (gratis) | Aguanta para la fase actual. |
| **Dominio** | $5k/mes prorrateado | $5k | $60k/ano amortizado mensualmente. |
| **Subtotal infra** | **~$110k COP** | **~$361k COP** | |

---

## 2. APIs externas

| Item | Lean | Recomendado | Notas |
|------|------|-------------|-------|
| **API-Football** | Free 100 req/dia (gratis) | Pro $19 USD = **$76k** | Para Mundial es **obligatorio Pro**: 7.500 req/dia. Free no soporta los 104 partidos. |
| **QStash / Vercel Cron** | $5k (QStash externo si Vercel Hobby) | Incluido en Vercel Pro | Sin crons no opera autonomo. |
| **Subtotal APIs** | **~$5k** | **~$76k** | |

---

## 3. Marketing y captacion

| Item | Lean | Recomendado | Notas |
|------|------|-------------|-------|
| **Ads Instagram/TikTok** (torneo B2C) | $300k | $800k | Lean = solo organico + bursts puntuales. Recomendado = captar 200-500 hinchas/mes. |
| **Material fisico** (QRs, posters, vinilos para 5-10 bares) | $100k (amortizado de $200k a 2 meses) | $200k (amortizado de $400k a 2 meses) | Calidad cuenta — el bar lo deja puesto durante todo el evento. |
| **Premio del torneo B2C** | $0 (lo paga sponsor) | $0 (lo paga sponsor) | Si no se consigue sponsor: **$500k-$1M extra**. |
| **Contenido / videos / fotos** | $0 (founder-led) | **$300k** | Caso de exito post-Champions = activo de venta para Mundial. |
| **Subtotal marketing** | **~$400k** | **~$1.300k** | |

---

## 4. Operacion

| Item | Lean | Recomendado | Notas |
|------|------|-------------|-------|
| **Comida + transporte** para visitas de venta a bares | $150k | $300k | 30-50 visitas a bares (~$5-10k cada una). |
| **Soporte presencial** durante eventos clave | $100k | $200k | Founder en uno de los bares la noche de Champions Final / partidos clave del Mundial. |
| **Buffer / imprevistos** | $100k | $300k | Siempre algo pasa. |
| **Subtotal operacion** | **~$350k** | **~$800k** | |

---

## 5. Total mensual

| Escenario | Total mensual COP | Equivalente USD |
|-----------|--------------------|-----------------|
| **Lean** (Champions Final + 5-8 bares) | **~$865k COP** | **~$220 USD** |
| **Recomendado** (Mundial con 15-25 bares + B2C masivo) | **~$2.540k COP** | **~$640 USD** |

---

## 6. Plan recomendado de inversion por mes

```
Mayo (Champions):           ~$865k    (Lean, infra minima)
Junio (Mundial arranque):   ~$2.540k  (Recomendado, escalar todo)
Julio (Mundial fin):        ~$2.540k
─────────────────────────────────────
Total 3 meses:              ~$5.945k COP (~$1.500 USD)
```

**Logica:** En mayo aun no estamos cerca del techo de uso. La inversion grande se justifica solo cuando hay 25 bares operando concurrentemente con cargas de partidos del Mundial.

---

## 7. Recuperacion de la inversion (revenue proyectado)

Si la meta del Mundial es **15 bares operando** (5 piloto Champions + 10 nuevos pre-Mundial):

| Tasa de conversion | Bares pagando $200k/mes | Revenue mensual |
|---------------------|------------------------|-----------------|
| Conservadora (30%) | 5 | **$1.000k COP** |
| Esperada (50%) | 8 | **$1.600k COP** |
| Optimista (70%) | 11 | **$2.200k COP** |

**Punto de break-even (Lean):** ~5 bares pagando cubren el escenario Lean.
**Punto de break-even (Recomendado):** ~13 bares pagando cubren el escenario Recomendado.

**Revenue adicional posible:**
- Patrocinador del torneo B2C: $500k-$2M COP por evento (uno-shot)
- Comision sobre canjes: ~$100k/mes por bar Pro activo
- Boost de promociones: ~$50k/mes por bar Pro activo

---

## 8. Que NO esta incluido

| Item | Por que no esta | Cuando incluirlo |
|------|-----------------|-------------------|
| **Salarios fundadores** | Asumido como $0 (founder-led) | Cuando MRR > $5M COP/mes |
| **Wompi / pasarelas de pago** | Excluido por decision (post-Mundial) | Q3 2026 |
| **Diseno externo / agencia** | Founder-led | Cuando se levante ronda o haya MRR estable |
| **Asesoria legal regulatoria** (torneos pagos) | No aplica sin Wompi | Antes de activar B2C pago |
| **Almacenamiento adicional Cloudinary** | Free tier alcanza | Si se pasa de 25 creditos/mes |
| **Contabilidad** | Asumido founder-led o externo a parte | Cuando facture estable |

---

## 9. Decisiones inmediatas que disparan gasto

| Decision | Costo | Cuando | Justificacion |
|----------|-------|--------|---------------|
| **Activar Vercel Pro** | $80k/mes | Esta semana (semana 1) | Sin esto, no hay crons → no opera Champions ni Mundial autonomo |
| **Comprar material fisico para 5 bares** | ~$200k one-time | Semana 2-3 | QRs, posters, vinilos para Champions Final |
| **Activar API-Football Pro** | $76k/mes | Semana 6 (justo antes de Mundial) | Para mayo no hace falta. Activar el 1 de junio. |
| **Activar Resend Pro** | $80k/mes | Solo si pasamos 3k emails/mes | Monitorear; activar solo si se necesita |

---

## 10. Sensibilidad y riesgos del presupuesto

| Variable | Si crece... | Impacto en presupuesto |
|----------|-------------|------------------------|
| **# de bares activos** | de 15 a 30 | +$200k-$400k/mes en Upstash + Resend |
| **# de hinchas concurrentes en pico** | de 1k a 5k | +$100k-$300k/mes en Upstash + Vercel functions |
| **Falta de sponsor B2C** | — | +$500k-$1M (premio del torneo lo asume La Tribuna) |
| **Bug critico en partido grande** | — | +$200k-$500k (soporte intensivo, comunicacion) |
| **Churn alto post-Champions** | — | Reduce recovery — replantear plan Mundial |

---

## 11. Reglas operativas para no quemar caja

1. **No activar nada del tier Recomendado hasta tener metrica que lo justifique.** Vercel Pro y QStash si se activan ya. El resto solo cuando se vea el dolor.
2. **Material fisico solo para bares confirmados** — no imprimir antes de cerrar al menos 3.
3. **Ads B2C empiezan recien la primera semana de mayo** — no antes. La oferta no esta lista hasta entonces.
4. **Sponsor del torneo B2C debe estar firmado antes del 25 de mayo** — sino, el torneo se hace sin premio (solo bragging rights).
5. **Cualquier costo > $300k requiere validacion comercial previa** — debe haber una hipotesis ligada en `10-javelin-board.md`.

---

## 12. Como actualizar este presupuesto

- Revisar al final de cada mes (mayo / junio / julio) y comparar real vs. proyectado.
- Documentar desviaciones en `06-experiment-log.md` con la causa.
- Si una linea se desvia > 30%, replantear escenario en el siguiente mes.
- Cuando se active Wompi (post-Mundial), agregar seccion 13 con costos de pasarela (~3-4% sobre transacciones).
