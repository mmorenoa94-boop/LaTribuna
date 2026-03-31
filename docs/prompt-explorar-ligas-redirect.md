# Prompt: Redirigir "Explorar ligas públicas" a /explorar

## Contexto

En la página de Ligas (`app/(hincha)/ligas/page.tsx`), al final de la lista hay una card que dice **"Explorar ligas públicas"** con subtítulo *"Descubre ligas de otros hinchas y negocios"*. Actualmente apunta a `/ligas/publicas`, que **no existe** y muestra un 404.

## Cambio necesario

En `app/(hincha)/ligas/page.tsx`, buscar el `Link` o `<a>` que tiene `href="/ligas/publicas"` y cambiarlo a `href="/explorar"`.

Eso es todo. Un solo cambio de href.
