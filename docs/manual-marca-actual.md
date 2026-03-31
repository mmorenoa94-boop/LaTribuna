# La Tribuna — Manual de Marca & Sistema de Diseno

> Version: 1.0 | Fecha: Marzo 2026 | Estado: Activo en produccion

---

## 1. Identidad de Marca

### Mision

Convertir cada partido de futbol en una experiencia interactiva que fideliza clientes para los negocios y premia a los hinchas por asistir y competir.

### Posicionamiento

La Tribuna es una plataforma de loyalty + engagement B2B2C para el futbol colombiano. Dos audiencias, una experiencia:

- **Hinchas**: Predicen, compiten y ganan. Su presencia fisica tiene valor real.
- **Negocios**: Datos reales de clientes, fidelizacion automatica y promociones en tiempo real.

### Tagline

> El juego de los que si saben

### Personalidad

| Atributo    | Descripcion                                                              |
| ----------- | ------------------------------------------------------------------------ |
| Apasionado  | Celebra cada gol y cada prediccion acertada con la energia del hincha    |
| Inteligente | Los datos que genera son estrategicos, no decorativos                    |
| Local       | Nacio en Colombia. Habla como el hincha, no como una corporacion global  |

---

## 2. Paleta de Colores

### Colores Primarios

| Token Tailwind | Nombre   | Hex       | Uso                                       |
| -------------- | -------- | --------- | ----------------------------------------- |
| `lt-black`     | Negro    | `#0A0C0F` | Fondo principal, body, pitch-bg            |
| `lt-green`     | Verde    | `#00E676` | CTA primario, icono activo, acento hincha  |
| `lt-amber`     | Ambar    | `#FFB300` | Acento negocio, puntos, badges             |
| `lt-white`     | Blanco   | `#F0F2F5` | Texto principal sobre fondos oscuros       |

### Colores Secundarios

| Token Tailwind | Nombre     | Hex       | Uso                                    |
| -------------- | ---------- | --------- | -------------------------------------- |
| `lt-dark`      | Oscuro     | `#111318` | Fondo secundario, sidebar, scrollbar   |
| `lt-card`      | Tarjeta    | `#161A22` | Superficie de cards y contenedores     |
| `lt-card2`     | Tarjeta 2  | `#1C2130` | Cards anidadas, controles inactivos    |
| `lt-gd`        | Verde grad | `#00C853` | Extremo oscuro del gradiente verde     |
| `lt-orange`    | Naranja    | `#FF6D00` | Acentos secundarios                    |
| `lt-red`       | Rojo       | `#FF4444` | Errores, alertas, estado EN VIVO       |
| `lt-blue`      | Azul       | `#4488FF` | Informacion, enlaces                   |
| `lt-purple`    | Morado     | `#9B59B6` | Acento decorativo                      |
| `lt-muted`     | Gris 1     | `#3A4455` | Bordes, texto deshabilitado            |
| `lt-muted2`    | Gris 2     | `#6B7280` | Texto secundario, metadata, timestamps |

### Variables CSS (globals.css)

```css
:root {
  --black:   #0A0C0F;
  --dark:    #111318;
  --card:    #161A22;
  --card2:   #1C2130;
  --green:   #00E676;
  --gd:      #00C853;
  --amber:   #FFB300;
  --orange:  #FF6D00;
  --red:     #FF4444;
  --blue:    #4488FF;
  --purple:  #9B59B6;
  --white:   #F0F2F5;
  --muted:   #3A4455;
  --muted2:  #6B7280;
  --border:  rgba(255,255,255,0.07);
  --border2: rgba(255,255,255,0.12);
}
```

### Reglas de Color

1. **Contraste**: `lt-green` y `lt-amber` solo sobre fondos oscuros (`lt-black`, `lt-dark`, `lt-card`). Nunca sobre fondos claros.
2. **Semantica**: Verde = exito/activo/hincha. Ambar = negocio/puntos/recompensas. Rojo = urgencia/en vivo/error. No intercambiar roles.
3. **Profundidad**: La app usa 3 niveles de oscuro: `lt-black` (fondo) > `lt-dark` (superficie) > `lt-card` (card). No mezclar con grises genericos.
4. **Contexto de rol**: Hincha usa `lt-green` como acento primario. Negocio usa `lt-amber` como acento primario.

---

## 3. Tipografia

### Fuentes

| Familia           | Variable CSS              | Pesos         | Uso                                    |
| ----------------- | ------------------------- | ------------- | -------------------------------------- |
| Bebas Neue        | `--font-bebas`            | 400           | Display, titulos grandes, contadores   |
| Barlow            | `--font-barlow`           | 300, 400, 500, 600 | Texto body, parrafos, descripciones |
| Barlow Condensed  | `--font-barlow-condensed` | 600, 700, 800 | Labels, badges, nav, texto compacto   |

### Clases Tailwind

```
font-bebas     → Bebas Neue (titulos, numeros grandes)
font-barlow    → Barlow (cuerpo de texto)
font-condensed → Barlow Condensed (etiquetas, botones, nav)
```

### Escala Tipografica

| Elemento                  | Clase                                              | Ejemplo                        |
| ------------------------- | -------------------------------------------------- | ------------------------------ |
| Titulo pantalla           | `font-bebas text-4xl text-lt-white`                | "Iniciar sesion"               |
| Nombre de usuario         | `font-bebas text-3xl text-lt-white leading-tight`  | "Juan Carlos"                  |
| Nivel / Contador grande   | `font-bebas text-4xl text-lt-green leading-none`   | "12"                           |
| Marcador en vivo          | `font-bebas text-2xl tabular-nums`                 | "2 - 1"                        |
| Titulo de card            | `font-condensed text-lg font-700 text-lt-white`    | "Liga Deportivo Cali"          |
| Label / badge             | `font-condensed text-[10px] font-600 uppercase`    | "TRIVIA", "EN VIVO"           |
| Body text                 | `text-sm text-lt-muted2`                           | descripciones, metadata        |
| Timestamp                 | `font-condensed text-xs text-lt-muted2`            | "Hace 3 min"                   |
| Puntos en card            | `font-condensed font-700 text-lt-green`            | "840 pts"                      |

### Reglas Tipograficas

- **Numeros**: Todos los contadores usan `tabular-nums` para evitar saltos de layout. Se muestran en `font-bebas` para valores grandes o `font-condensed` para valores en linea.
- **Mayusculas**: Labels, badges y texto de navegacion siempre en `uppercase tracking-wider`.
- **Pesos**: `font-700` / `font-800` para titulos y nombres. `font-600` para botones y nav. `font-400` / `font-500` para body.

---

## 4. Espaciado & Layout

### Sistema de Espaciado

| Concepto            | Valor                | Clase Tailwind      |
| ------------------- | -------------------- | ------------------- |
| Padding de pagina   | 16px horizontal      | `px-4`              |
| Padding de card     | 16px                 | `p-4`               |
| Gap entre secciones | 24px                 | `space-y-6`         |
| Gap entre cards     | 12px                 | `gap-3`             |
| Gap entre items     | 16px                 | `gap-4`             |
| Padding de boton    | 14px vertical, 16px h| `py-3.5 px-4`       |
| Padding de input    | 12px vertical, 16px h| `py-3 px-4`         |

### Border Radius

| Elemento  | Valor  | Token Tailwind |
| --------- | ------ | -------------- |
| Cards     | 14px   | `rounded-card` |
| Botones   | 10px   | `rounded-btn`  |
| Badges    | 20px   | `rounded-full` |
| Inputs    | 10px   | `rounded-btn`  |

### Bordes

```
Borde estandar:  border border-[rgba(255,255,255,0.07)]
Borde hover:     border-lt-green/30  (hincha)
                 border-lt-amber/25  (negocio)
Borde activo:    border-lt-green     (hincha)
                 border-lt-amber     (negocio)
Borde inactivo:  border-lt-muted
```

---

## 5. Sombras & Efectos

### Box Shadows

| Nombre     | Valor                                  | Uso                          |
| ---------- | -------------------------------------- | ---------------------------- |
| `card`     | `0 4px 24px rgba(0,0,0,0.4)`          | Sombra de tarjetas           |
| `glow-g`   | `0 0 20px rgba(0,230,118,0.15)`       | Glow verde (hover cards)     |
| `glow-a`   | `0 0 20px rgba(255,179,0,0.15)`       | Glow ambar (hover negocio)   |

### Gradientes de Fondo

```
glow-green:  radial-gradient(ellipse 300px 200px at 50% -10%,
             rgba(0,230,118,0.12) 0%, transparent 60%)

glow-amber:  radial-gradient(ellipse 300px 200px at 50% -10%,
             rgba(255,179,0,0.12) 0%, transparent 60%)

pitch-grid:  repeating-linear-gradient(90deg,
             transparent 0px, transparent 29px,
             rgba(255,255,255,0.015) 29px, rgba(255,255,255,0.015) 30px)
```

### Efectos de Hover en Cards

```css
.card-hover-green:hover {
  box-shadow: 0 0 20px rgba(0, 230, 118, 0.12);
  transition: box-shadow 0.2s ease;
}
.card-hover-amber:hover {
  box-shadow: 0 0 20px rgba(255, 179, 0, 0.12);
  transition: box-shadow 0.2s ease;
}
```

---

## 6. Animaciones

| Nombre       | Duracion | Easing     | Uso                                  |
| ------------ | -------- | ---------- | ------------------------------------ |
| `pulse-dot`  | 1.3s     | ease       | Indicador de "en vivo" pulsante      |
| `slide-up`   | 0.3s     | ease-out   | Entrada de elementos desde abajo     |
| `fade-in`    | 0.2s     | ease-out   | Aparicion suave de contenido         |
| `ticker`     | 30s      | linear     | Scroll horizontal de partidos ticker |
| `xp-fill`    | 1s       | ease-out   | Llenado de barra de XP               |

### Keyframes

```css
pulseDot:  0%,100% → opacity:1 scale(1)  |  50% → opacity:0.4 scale(0.7)
slideUp:   from → translateY(10px) opacity:0  |  to → translateY(0) opacity:1
fadeIn:    from → opacity:0  |  to → opacity:1
ticker:    0% → translateX(0)  |  100% → translateX(-50%)
xpFill:    from → width:0%  (al ancho final)
```

---

## 7. Componentes UI

### 7.1 Botones

**Boton Primario (Hincha)**
```
bg-lt-green text-lt-black font-condensed font-700 text-sm
py-3.5 rounded-btn active:scale-[0.98] transition-all
```

**Boton Primario (Negocio)**
```
bg-lt-amber text-lt-black font-condensed font-700 text-sm
py-3.5 rounded-btn active:scale-[0.98] transition-all
```

**Boton Secundario / Ghost**
```
bg-lt-green/10 border border-lt-green/30 text-lt-green
font-condensed font-700 text-sm py-3.5 rounded-btn
```

**Boton Danger**
```
bg-lt-red text-white font-condensed font-700
py-3 rounded-btn
```

**Boton Tab (Login)**
```
Activo:   bg-lt-green text-lt-black font-condensed text-sm font-600 rounded-[8px] py-2
Inactivo: text-lt-muted2 font-condensed text-sm font-600 rounded-[8px] py-2
```

### 7.2 Cards

**Card Estandar**
```
bg-lt-card rounded-card border border-[rgba(255,255,255,0.07)]
p-4 hover:border-lt-green/30 transition-all card-hover-green
```

**Card Interior (nested)**
```
bg-lt-card2 rounded-btn p-3
```

### 7.3 Badges

**Badge EN VIVO**
```
bg-lt-red text-white font-condensed text-[10px] font-700
px-2 py-0.5 rounded-full uppercase
```

**Badge Tipo de Liga**
```
bg-lt-card2 border border-lt-muted text-lt-muted2
font-condensed text-[10px] font-600 px-2 py-0.5
rounded-full uppercase tracking-wider
```

**Badge de Puntos**
```
text-lt-green font-condensed font-700
```

### 7.4 Inputs

```
bg-lt-card border border-[rgba(255,255,255,0.07)] rounded-btn
px-4 py-3 text-sm text-lt-white placeholder:text-lt-muted2
focus:outline-none focus:border-lt-green/40 transition-colors
```

### 7.5 Barra de XP

```
Contenedor: h-2 w-full bg-lt-card2 rounded-full overflow-hidden
Fill:       bg-gradient-to-r from-lt-green to-lt-gd rounded-full animate-xp-fill
Glow tip:   w-2 h-2 rounded-full bg-white/60 blur-sm (absolute right)
Labels:     text-lt-muted2 text-xs font-condensed
```

### 7.6 Trivia - Opciones de Respuesta

```
Default:     bg-lt-card border-lt-muted text-lt-white hover:border-lt-green/50
Selected:    bg-lt-green/20 border-lt-green text-lt-green
Wrong/Other: bg-lt-card border-lt-muted text-lt-muted2 opacity-60
```

**Indicador de Opcion (A, B, C, D)**
```
Default:  bg-lt-card2 text-lt-muted2 w-7 h-7 rounded-full font-bebas text-xs
Selected: bg-lt-green text-lt-black
```

---

## 8. Navegacion

### Bottom Nav (Hincha)

| Propiedad       | Valor                                         |
| --------------- | --------------------------------------------- |
| Posicion        | `fixed bottom-0 left-0 right-0 z-50`          |
| Fondo           | `bg-lt-dark`                                  |
| Borde superior  | `border-t border-[rgba(255,255,255,0.07)]`    |
| Altura          | `h-16`                                        |
| Items           | Inicio, Ligas, Explorar, Wallet, Perfil       |
| Icono activo    | `text-lt-green` (verde)                       |
| Icono inactivo  | `text-lt-muted2` (gris)                       |
| Label           | `text-[10px] font-condensed font-600`         |
| Iconos          | SVG stroke, `w-5 h-5`, strokeWidth `1.8`      |

### Sidebar (Negocio)

| Propiedad       | Valor                                         |
| --------------- | --------------------------------------------- |
| Ancho           | `w-60`                                        |
| Fondo           | `bg-lt-dark`                                  |
| Borde derecho   | `border-r border-[rgba(255,255,255,0.07)]`    |
| Brand           | `font-bebas text-2xl text-lt-amber`           |
| Nav activo      | `bg-lt-amber/15 text-lt-amber border-lt-amber/25` |
| Nav inactivo    | `text-lt-muted2 hover:text-lt-white`          |
| Mobile          | Bottom nav con `text-lt-amber` como activo    |

---

## 9. Fondos & Texturas

### Pitch Background

Textura de lineas verticales sutiles que simula una cancha. Se aplica al body con la clase `pitch-bg`:

```css
.pitch-bg {
  background-color: #0A0C0F;
  background-image: repeating-linear-gradient(
    90deg,
    transparent 0px, transparent 29px,
    rgba(255,255,255,0.015) 29px,
    rgba(255,255,255,0.015) 30px
  );
}
```

### Glow de Seccion

Cada seccion de la app tiene un glow radial sutil en la parte superior:
- **Hincha**: `bg-glow-green` (verde sutil)
- **Negocio**: `bg-glow-amber` (ambar sutil)

---

## 10. PWA & Metadata

| Propiedad         | Valor        |
| ----------------- | ------------ |
| Theme color       | `#0A0C0F`    |
| Background color  | `#0A0C0F`    |
| Display           | `standalone` |
| Orientation       | `portrait`   |
| Lang              | `es-CO`      |
| Status bar (iOS)  | `black-translucent` |

---

## 11. Diferenciacion Visual Hincha vs Negocio

| Aspecto            | Hincha (Fan)                    | Negocio (Business)              |
| ------------------ | ------------------------------- | ------------------------------- |
| Color primario     | `lt-green` (#00E676)            | `lt-amber` (#FFB300)            |
| Glow de fondo      | `bg-glow-green`                 | `bg-glow-amber`                 |
| Glow de hover      | `card-hover-green`              | `card-hover-amber`              |
| Shadow de glow     | `shadow-glow-g`                 | `shadow-glow-a`                 |
| Nav activo         | `text-lt-green`                 | `text-lt-amber`                 |
| Layout             | Bottom nav (mobile-first)       | Sidebar desktop + bottom mobile |
| Boton CTA          | `bg-lt-green text-lt-black`     | `bg-lt-amber text-lt-black`     |

---

## 12. Iconografia

### Estilo

- **Libreria**: SVG inline (estilo Lucide/Feather)
- **Stroke width**: `1.5` (general) / `1.8` (nav)
- **Tamano nav**: `w-5 h-5` (20px)
- **Tamano UI**: `w-4 h-4` (16px) para inline, `w-6 h-6` (24px) para acciones
- **Line cap/join**: `round`
- **Fill**: `none` (solo stroke). Excepto iconos de estado confirmado.

### Colores de Icono

| Estado     | Color                           |
| ---------- | ------------------------------- |
| Activo     | `text-lt-green` / `text-lt-amber` |
| Inactivo   | `text-lt-muted2`               |
| Peligro    | `text-lt-red`                  |
| Info       | `text-lt-blue`                 |

---

## 13. Voz y Tono

### Principios

1. **Habla como hincha, no como marca**: Conciso, directo, con emocion genuina.
2. **Una idea por mensaje**: El usuario esta en un bar viendo el partido.
3. **Urgente cuando importa**: En vivo = tono mas breve y directo.
4. **Colombia primero**: Sin forzar regionalismos pero sin sonar extranjero.

### Ejemplos

| Contexto          | Si                                                    | No                                                              |
| ----------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Canje exitoso     | "Tu cerveza ya esta lista en la barra."               | "Ha completado exitosamente el proceso de canje de recompensas."|
| Descanso          | "15 min de descanso. Tus puntos se duplican con check-in." | "Aproveche el intervalo para maximizar su acumulacion." |
| Ranking           | "Estas en el puesto #3. Faltan 80 pts para ser lider."| "Su posicion actual en el ranking es 3/N."                      |

---

## 14. Archivos de Referencia

| Archivo                        | Contenido                              |
| ------------------------------ | -------------------------------------- |
| `tailwind.config.ts`           | Tokens de color, fuentes, animaciones  |
| `app/globals.css`              | Variables CSS, estilos base            |
| `app/layout.tsx`               | Importacion de fuentes Google          |
| `components/layout/BottomNav`  | Navegacion inferior hincha             |
| `components/negocio/Sidebar`   | Sidebar dashboard negocio              |
| `components/hincha/LeagueCard` | Patron de tarjeta de liga              |
| `components/hincha/XPBar`      | Barra de experiencia                   |
| `components/hincha/TriviaQuestion` | Pregunta de trivia en vivo         |
| `public/manifest.json`         | Configuracion PWA                      |
