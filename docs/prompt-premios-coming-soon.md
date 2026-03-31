# Prompt: Pantalla "Próximamente" para Explorar Premios

## Contexto

En la página de Wallet (`app/(hincha)/wallet/page.tsx`), existe un botón **"🎁 Explorar premios y canjes"** que actualmente está `disabled` sin ninguna explicación. El usuario lo toca y no pasa nada. 

Necesito reemplazar ese comportamiento con una pantalla de "coming soon" que se abra al tocar el botón.

## Imagen de referencia

La imagen de referencia del diseño está en `/docs/premio.jpg`.

## Lo que necesito

Cuando el usuario toque el botón **"🎁 Explorar premios y canjes"** en la wallet, debe abrirse un **modal/overlay a pantalla completa** (no una nueva página) con el siguiente contenido:

### Copy exacto

- **Título**: `🎁 ¡MUY PRONTO!`
- **Subtítulo**: `Pronto podrás conocer a nuestros aliados y canjear tus puntos por premios exclusivos.`
- **Texto pequeño abajo**: `Te avisaremos cuando esté listo`
- **Botón para cerrar**: `← Volver a mi billetera`

### Diseño

- Fondo oscuro igual al resto de la app (usa las variables CSS existentes: `--lt-bg`, `--lt-card`)
- Un ícono grande de regalo centrado con un efecto de glow verde sutil (puedes usar un emoji 🎁 en grande o un SVG)
- El título en la fuente condensada bold del proyecto (la misma de los headers), blanco, con un acento verde (`--lt-green` / `#00E676`)
- El subtítulo en gris claro (`text-gray-400`), centrado, máximo 2 líneas
- Todo envuelto en una card con glassmorphism: `bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl`
- El botón de volver como ghost button: borde verde, fondo transparente, texto verde
- Animación de entrada suave con Framer Motion (ya está instalado en el proyecto): `fadeIn` + `scale` sutil
- Partículas o sparkles sutiles opcionales en el fondo (si es fácil de hacer)
- Centrado verticalmente, mobile-first

### Cambios técnicos

1. **Quitar el `disabled`** del botón "Explorar premios y canjes" en `wallet/page.tsx`
2. **Agregar un state** `const [showComingSoon, setShowComingSoon] = useState(false)`
3. **onClick del botón** → `setShowComingSoon(true)`
4. **Crear el componente** `ComingSoonPremios` (puede ser inline en wallet o un componente aparte en `components/hincha/`)
5. El modal debe tener `role="dialog"` y `aria-modal="true"` para accesibilidad
6. Debe cerrarse con **Escape**, click en el backdrop, y el botón "Volver"

### Stack del proyecto

- Next.js (App Router)
- Tailwind CSS con colores custom (`lt-green`, `lt-card`, `lt-bg`, etc. definidos en `tailwind.config.ts`)
- Framer Motion para animaciones
- Fuentes: `var(--font-tt)` para headers condensados
