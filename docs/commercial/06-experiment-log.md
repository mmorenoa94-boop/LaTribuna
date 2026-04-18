# Experiment Log

> Template y registro de experimentos comerciales para validar hipotesis clave de La Tribuna.

---

## Como usar este documento

Cada experimento comercial debe documentarse usando el template de abajo. El objetivo es:
1. Forzar claridad sobre que estamos tratando de aprender
2. Definir exito antes de correr el experimento (no despues)
3. Acumular aprendizajes para informar decisiones futuras

**Reglas:**
- Un experimento por hipotesis. No mezclar multiples hipotesis en un solo experimento.
- Definir el criterio de exito ANTES de empezar. No mover el arco despues.
- Documentar el resultado aunque sea negativo. Los "fracasos" informan tanto como los exitos.
- Mantener los experimentos cortos (1-4 semanas). Si necesitas mas tiempo, probablemente la hipotesis es demasiado amplia.

---

## Template

```markdown
### EXP-[NNN]: [Nombre del experimento]

**Estado:** Pendiente | En curso | Completado | Cancelado

**Hipotesis:**
> Si [accion/cambio], entonces [resultado esperado], porque [razonamiento].

**Metrica principal:**
[La unica metrica que determina si el experimento fue exitoso]

**Metricas secundarias:**
- [Metrica 2]
- [Metrica 3]

**Metodo:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Duracion:** [N semanas]

**Tamano de muestra:** [N negocios / N hinchas / N partidos]

**Criterio de exito:**
- Exito: [metrica principal] > [valor]
- Fracaso: [metrica principal] < [valor]
- Inconcluso: [condicion]

**Resultado:**
[Completar despues del experimento]

**Aprendizajes:**
[Que aprendimos, incluso si el resultado fue negativo. Que hariamos diferente.]

**Siguiente paso:**
[Que hacer con este resultado — escalar, iterar, pivotar, o abandonar]
```

---

## Experimentos prioritarios

Los siguientes experimentos estan disenados para resolver las incognitas comerciales mas criticas de Phase 1.

---

### EXP-001: Validacion de disposicion a pagar del negocio

**Estado:** Pendiente

**Hipotesis:**
> Si ofrecemos a 5 negocios una suscripcion Pro a $150.000 COP/mes despues de 4 semanas de uso gratuito, entonces al menos 2 convertiran a pago, porque habran experimentado el valor de la liga activa con datos de check-in y canjes.

**Metrica principal:**
Tasa de conversion de gratuito a pago (% de negocios que aceptan pagar)

**Metricas secundarias:**
- Razon de rechazo (para los que no convierten)
- Precio maximo que estarian dispuestos a pagar (sondeo)
- Tiempo entre oferta y decision

**Metodo:**
1. Activar 5 negocios con liga gratuita completa (sin limitaciones de features)
2. Onboarding asistido durante 4 semanas con soporte activo
3. En la semana 5, presentar oferta de suscripcion Pro a $150.000/mes
4. Documentar reacciones, objeciones y decisiones de cada negocio
5. Si 2+ convierten: validado. Si 0: diagnosticar y iterar pricing/propuesta.

**Duracion:** 6 semanas (4 de trial + 2 de conversion)

**Tamano de muestra:** 5 negocios

**Criterio de exito:**
- Exito: 2+ negocios convierten a pago sin descuento
- Exito parcial: 1 negocio convierte, 2+ expresan interes con condiciones
- Fracaso: 0 convierten y 0 expresan interes
- Inconcluso: Los negocios no tuvieron suficiente actividad en sus ligas para evaluar valor

**Resultado:**
_Pendiente_

**Aprendizajes:**
_Pendiente_

**Siguiente paso:**
_Pendiente_

---

### EXP-002: Tasa de conversion hincha via QR en mesa

**Estado:** Pendiente

**Hipotesis:**
> Si colocamos un QR de liga en cada mesa del bar con un call-to-action claro ("Escanea, juega y gana cerveza gratis"), entonces al menos el 15% de las personas presentes durante un partido se registraran, porque el contexto social + incentivo inmediato reduce la friccion de descarga.

**Metrica principal:**
Tasa de conversion: registros / personas presentes en el bar durante el partido

**Metricas secundarias:**
- Momento del registro (antes, durante, o despues del partido)
- % que responde al menos 1 pregunta en la misma sesion
- % que hace check-in presencial
- Tipo de registro (Google vs. Apple vs. Credentials)

**Metodo:**
1. Seleccionar 3 negocios con trafico conocido en dia de partido (>40 personas)
2. Colocar QR en cada mesa + 1 poster en la entrada
3. Capacitar a 1 mesero para mencionar La Tribuna al tomar el pedido
4. Medir durante 3 partidos consecutivos por negocio
5. Conteo manual de personas presentes (o estimacion del dueno) como denominador

**Duracion:** 2-3 semanas (3 partidos por negocio)

**Tamano de muestra:** 3 negocios, ~120-300 personas totales

**Criterio de exito:**
- Exito: >15% de conversion promedio
- Aceptable: 8-15% de conversion promedio
- Fracaso: <8% de conversion promedio
- Inconcluso: Partidos con baja asistencia (<20 personas) invalidan la medicion

**Resultado:**
_Pendiente_

**Aprendizajes:**
_Pendiente_

**Siguiente paso:**
_Pendiente_

---

### EXP-003: Viralidad organica del hincha (K-factor)

**Estado:** Pendiente

**Hipotesis:**
> Si facilitamos que el hincha comparta el link de su liga por WhatsApp con un mensaje pre-escrito ("Unite a mi liga y compitamos este partido"), entonces cada hincha activo generara al menos 0.5 registros nuevos en 2 semanas, porque la competencia social entre amigos es un motivador fuerte en la cultura futbolera colombiana.

**Metrica principal:**
K-factor: nuevos registros via invitacion / hinchas activos que invitaron

**Metricas secundarias:**
- Invitaciones enviadas por hincha activo
- Tasa de conversion de invitacion a registro
- Tiempo entre invitacion y registro
- Retencion del invitado vs. retencion del invitante

**Metodo:**
1. En 2 ligas activas con >20 miembros, activar feature de "Invitar amigos" con mensaje pre-escrito para WhatsApp
2. Trackear invitaciones enviadas (via link con UTM unico por hincha)
3. Medir registros y actividad de los invitados durante 2 semanas
4. Comparar retencion de invitados vs. registros organicos

**Duracion:** 2 semanas

**Tamano de muestra:** 2 ligas, ~40-60 hinchas activos

**Criterio de exito:**
- Exito: K-factor > 0.7 (crecimiento casi autonomo)
- Aceptable: K-factor 0.3-0.7 (crecimiento con acquisition pagada minima)
- Fracaso: K-factor < 0.3 (necesita acquisition pagada significativa)
- Inconcluso: <10 invitaciones enviadas (el feature no fue descubierto/usado)

**Resultado:**
_Pendiente_

**Aprendizajes:**
_Pendiente_

**Siguiente paso:**
_Pendiente_

---

## Backlog de experimentos futuros

| ID | Nombre | Hipotesis (resumen) | Prioridad | Phase |
|----|--------|---------------------|-----------|-------|
| EXP-004 | Precio optimo de suscripcion | Testear $150k vs $200k vs $250k en negocios nuevos | Alta | 1-2 |
| EXP-005 | Referido B2B "Invita un bar" | Medir si negocios activos refieren a otros bares con incentivo de 1 mes gratis | Alta | 2 |
| EXP-006 | Promocion en descanso como driver de ventas | Medir conversion de una promocion push durante descanso del partido | Media | 1-2 |
| EXP-007 | Recompensas optimas para retencion | Testear diferentes tipos de recompensas (cerveza vs descuento vs item exclusivo) | Media | 1 |
| EXP-008 | Canal distribuidora como adquisicion B2B | Piloto con 1 distribuidora para activar 5 bares via su red | Alta | 2 |
| EXP-009 | Batalla de Negocios como evento de PR | Organizar 1 torneo y medir cobertura mediatica + negocios interesados post-evento | Media | 2 |
| EXP-010 | Expansion a segunda ciudad (sin presencia fisica) | Activar 3 negocios en otra ciudad via videollamada y soporte remoto | Alta | 2-3 |
