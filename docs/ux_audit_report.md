# La Tribuna — UX & Accessibility Audit Report

> **Auditor**: Senior UX Engineer & Accessibility Specialist  
> **Date**: 2026-03-29  
> **Scope**: Full frontend layer — all pages, components, hooks, and shared utilities  
> **Files audited**: 35+ TSX/TS files across `app/`, `components/`, `hooks/`, `stores/`, `lib/`

---

## Issues Found

---

**Issue #1**
- **Location**: [layout.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/layout.tsx#L43-L49) — `viewport` export
- **Category**: Accessibility
- **Severity**: Critical
- **What's wrong**: `userScalable: false` and `maximumScale: 1` are set in the viewport config. This prevents users from zooming in on the page.
- **Why it matters**: Users with low vision rely on pinch-to-zoom to read content. This is a WCAG 2.1 AA violation (Success Criterion 1.4.4 — Resize Text). It also violates app store accessibility guidelines for iOS and Android PWAs.
- **How to fix it**: Remove `maximumScale: 1` and set `userScalable: true` (or remove the property entirely, since `true` is the default). If you're trying to prevent unwanted zoom on iOS form inputs, use `font-size: 16px` on inputs instead.

---

**Issue #2**
- **Location**: [BottomNav.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/layout/BottomNav.tsx#L36-L63) — `<nav>` element
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: The `<nav>` element has no `aria-label` to distinguish it from other navigation landmarks. Each `<Link>` renders only an icon and label text, but the SVG icons have no `aria-hidden="true"` attribute, meaning they are announced by screen readers as meaningless content.
- **Why it matters**: Screen reader users hear navigation announced without context. The icons may be announced as "group" or empty strings, creating confusion.
- **How to fix it**:
  1. Add `aria-label="Navegación principal"` to the `<nav>` element.
  2. Add `aria-hidden="true"` to each SVG icon component (e.g., `<svg aria-hidden="true" ...>`).
  3. Optionally, add `aria-current="page"` to the active link for screen reader context.

---

**Issue #3**
- **Location**: [BottomNav.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/layout/BottomNav.tsx#L40) — notification badge placement
- **Category**: Navigation & Flow
- **Severity**: Medium
- **What's wrong**: The unread notification badge is attached to the "Inicio" (Home) nav item rather than a dedicated "Notificaciones" link in the bottom nav. There is no direct bottom nav link to `/notificaciones` at all — the user must navigate through a separate flow or use a back link from Home.
- **Why it matters**: Users have no obvious path to notifications from the bottom navigation. The badge on "Inicio" does not affordance-signal that notifications exist on a separate page. Users may never discover the notifications screen.
- **How to fix it**: Either add "Notificaciones" as a bottom nav item (replacing one of the 5 current items, or using a popover badge on an icon), or move the badge to a header notification bell on each page. Ensure the badge count reflects the actual unread count for the notifications page.

---

**Issue #4**
- **Location**: [login/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/login/page.tsx#L82-L88) — show/hide password button
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: The show/hide password toggle button has no accessible label. It renders an SVG icon with no `aria-label`, `title`, or visually-hidden text.
- **Why it matters**: Screen reader users hear "button" with no label, making it impossible to understand its purpose.
- **How to fix it**: Add `aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}` to the button. Also add `aria-hidden="true"` to the SVG icons inside.

---

**Issue #5**
- **Location**: [login/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/login/page.tsx#L100-L108) — "forgot password" link
- **Category**: Interaction & Feedback / Copy
- **Severity**: High
- **What's wrong**: The "¿Olvidaste tu contraseña?" link opens a WhatsApp chat with a pre-filled message instead of providing an in-app password reset flow. There is no visual indication that clicking this link will leave the app and open WhatsApp.
- **Why it matters**: Users expect a standard password reset via email. Being redirected to WhatsApp is unusual; users without WhatsApp will have no recourse. There's no indication of the external redirect, violating the principle of least surprise.
- **How to fix it**: 
  1. Add an external link icon (↗) next to the text.
  2. Add `aria-label="Contacto por WhatsApp para recuperar contraseña (abre WhatsApp)"`.
  3. Consider implementing a proper email-based password reset flow long-term.

---

**Issue #6**
- **Location**: [login/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/login/page.tsx#L25) — login callbackUrl
- **Category**: Navigation & Flow
- **Severity**: Medium
- **What's wrong**: The `handleEmailLogin` function always redirects to `/home` on success. The page has no `searchParams` handling for `callbackUrl`, despite the invite page (`invite/[code]/page.tsx` line 55) sending users to `/login?callbackUrl=...`.
- **Why it matters**: When a user clicks "Unirme a la liga" while logged out, they're sent to login with a callbackUrl, but after login they always land on `/home` instead of being redirected back to the invite page. This breaks the join-league flow.
- **How to fix it**: Read `searchParams.get('callbackUrl')` and use it in `router.push(callbackUrl ?? '/home')` after successful login. Validate the callbackUrl is a relative path to prevent open redirect vulnerabilities.

---

**Issue #7**
- **Location**: [register/hincha/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/register/hincha/page.tsx#L86-L109) — form validation
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: Registration form inputs have no client-side validation feedback. When the user clicks "Continuar →" with invalid data, the button is simply disabled — but there is no error message explaining *what* is wrong (e.g., "La contraseña necesita al least 8 caracteres"). The email input only uses browser `type="email"` validation, which varies across browsers.
- **Why it matters**: Users with passwords shorter than 8 characters see a grayed-out button with no explanation. They may not realize the password requirement exists.
- **How to fix it**: Add inline validation messages beneath each input. For example, show `"Mínimo 8 caracteres"` in red when `form.password.length < 8 && form.password.length > 0`. Also add `aria-describedby` linking each input to its error message, and `aria-invalid="true"` when invalid.

---

**Issue #8**
- **Location**: [register/negocio/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/register/negocio/page.tsx#L56) — geolocation failure
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: When `navigator.geolocation.getCurrentPosition` fails (line 56: `() => setGeoLoading(false)`), there is no error feedback shown to the user. The button silently stops showing the loading state with no message.
- **Why it matters**: The user presses "Usar mi ubicación actual", sees a spinner, then nothing happens. They don't know why it failed (permission denied, timeout, etc.) or what to do next.
- **How to fix it**: Set a state variable like `geoError` and display a contextual error message: "No se pudo obtener la ubicación. Verifica los permisos de tu navegador." Show this message below the geolocation button.

---

**Issue #9**
- **Location**: [ExplorarScreen.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/explorar/_components/ExplorarScreen.tsx#L574) — `alert()` for check-in errors
- **Category**: Interaction & Feedback
- **Severity**: High
- **What's wrong**: Check-in error handling uses `alert(err.error || 'Error al hacer check-in')` (line 574) and `alert('Error de conexión')` (line 577). These are native browser alerts.
- **Why it matters**: Native `alert()` dialogs break the visual design, are not styleable, cannot be localized consistently, and block the UI thread. On PWAs they feel foreign. Users are forced to dismiss them before they can interact with the app.
- **How to fix it**: Replace `alert()` with an inline error toast or in-card error message. Create a reusable `Toast` component that appears at the top/bottom of the screen, auto-dismisses after a few seconds, and matches the design language (e.g., `bg-lt-red/15 border-lt-red text-lt-red`).

---

**Issue #10**
- **Location**: [ExplorarScreen.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/explorar/_components/ExplorarScreen.tsx#L130-L141) — HTML entity encoding
- **Category**: Copy & Microcopy
- **Severity**: Medium
- **What's wrong**: Text uses HTML entities like `&oacute;`, `&aacute;`, `&iacute;`, `&eacute;`, `&ldquo;`, `&rdquo;` in JSX (e.g., `"Activa tu ubicaci&oacute;n"` on line 130). These render as literal text `&oacute;` instead of `ó` in React JSX, because JSX does not parse HTML entities.
- **Why it matters**: Users see garbled text like "Activa tu ubicaci&oacute;n" instead of "Activa tu ubicación". This affects the GPS prompt, empty state, error state, and search empty state — critical user-facing copy.
- **How to fix it**: Replace all HTML entities with their UTF-8 equivalents:
  - `&oacute;` → `ó`
  - `&aacute;` → `á`
  - `&iacute;` → `í`
  - `&eacute;` → `é`
  - `&ldquo;` → `"`
  - `&rdquo;` → `"`
  
  Alternatively, use Unicode escapes (`\u00F3`), though direct UTF-8 characters are cleaner.

---

**Issue #11**
- **Location**: [wallet/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/wallet/page.tsx#L120-L125) — disabled CTA button
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: The "🎁 Explorar premios y canjes" button is permanently `disabled` with no explanation of why it's disabled or when it will become active.
- **Why it matters**: Users see a prominent CTA that looks like a feature, try to tap it, and get no response. There's no tooltip, no "Próximamente" label, nothing to explain the disabled state. It creates false affordance.
- **How to fix it**: Either:
  1. Add a "Próximamente" badge overlay on the button and change the copy to "Próximamente: Explorar premios y canjes".
  2. Or remove the button entirely until the feature is ready.
  3. Add `title="Próximamente"` or cursor tooltip for desktop users.

---

**Issue #12**
- **Location**: [wallet/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/wallet/page.tsx) — no back navigation
- **Category**: Navigation & Flow
- **Severity**: Medium
- **What's wrong**: The Wallet page has no back button or breadcrumb. The only way to navigate away is through the bottom nav.
- **Why it matters**: Users who arrive via the profile page balance link (which is a common entry point) may expect a back button to return to the profile page. This is an inconsistency with the notifications page (which has an explicit back link to "/home").
- **How to fix it**: Add a back/close button in the header area, similar to how NotificacionesScreen has `← Inicio`. For the wallet, it could be `← Mi Perfil` or `← Inicio`.

---

**Issue #13**
- **Location**: [Sidebar.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/negocio/Sidebar.tsx#L32) — desktop sidebar
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: The desktop sidebar `<aside>` element has no `aria-label`. The mobile bottom `<nav>` has no `aria-label`. The sidebar navigation `<nav>` also has no `aria-label`. With two `<nav>` landmarks on desktop and a `<nav>` + `<aside>` on the page, screen readers cannot distinguish between them.
- **Why it matters**: Screen reader users navigating by landmarks will see multiple unlabeled navigation regions, making it impossible to determine which is which.
- **How to fix it**: Add `aria-label="Menú del negocio"` to the sidebar `<aside>`. Add `aria-label="Navegación principal"` to the `<nav>` inside it. Add `aria-label="Navegación móvil"` to the mobile bottom nav. Also add `role="navigation"` if not implicit.

---

**Issue #14**
- **Location**: [Sidebar.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/negocio/Sidebar.tsx#L84-L91) — logout button
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: The logout button (`Cerrar sesión`) triggers `signOut()` immediately without any confirmation dialog.
- **Why it matters**: An accidental tap on "Cerrar sesión" (especially on mobile where it's in the bottom nav area) immediately logs the user out. There's no undo or "Are you sure?" prompt. This is destructive and disruptive.
- **How to fix it**: Show a confirmation modal before calling `signOut()`. The modal should say "¿Seguro que quieres cerrar sesión?" with "Cancelar" and "Cerrar sesión" buttons. Alternatively, require a double-tap or add the button to a submenu to reduce accidental taps.

---

**Issue #15**
- **Location**: All SVG icons across the codebase — `GoogleIcon`, `AppleIcon`, `EyeIcon`, `EyeOffIcon`, `UsersIcon`, `StarIcon`, `PencilIcon`, `ExternalLinkIcon`, `ChevronRightIcon`, `HomeIcon`, `TrophyIcon`, `CompassIcon`, `WalletIcon`, `UserIcon`, etc.
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: None of the inline SVG icons have `aria-hidden="true"` or `role="img"` with an `aria-label`. Decorative icons should have `aria-hidden="true"`, while meaningful icons need `aria-label`.
- **Why it matters**: Screen readers may attempt to announce these SVGs, producing confusing empty or "image" announcements. This affects every single page in the app.
- **How to fix it**: Add `aria-hidden="true"` to all decorative SVGs (icons next to text labels). For icons that are the sole content of a button (like the "X" close button), add `aria-label` to the parent `<button>` instead and `aria-hidden="true"` to the SVG.

---

**Issue #16**
- **Location**: [home/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/home/page.tsx#L11) — server-side `return null`
- **Category**: Performance UX / State Management
- **Severity**: Medium
- **What's wrong**: If `session` is falsy, the page returns `null` (line 11). The same pattern appears in `ligas/page.tsx` (line 10). This creates a blank white screen instead of redirecting.
- **Why it matters**: If the auth check race-conditions don't redirect fast enough (or if the session middleware fails silently), users see a completely blank page with no indication of what happened. No loading, no error, nothing.
- **How to fix it**: Replace `if (!session) return null` with `if (!session) redirect('/login')` to match the pattern used in the layout (which already does this). The `return null` approach is a dead code path that should be a redirect for consistency.

---

**Issue #17**
- **Location**: [TriviaQuestion.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/hincha/TriviaQuestion.tsx#L22) — timer percentage calculation
- **Category**: State Management UX
- **Severity**: High
- **What's wrong**: The `timerPct` calculation on line 22 is `(timeLeft / ((question.expiresAt - Date.now()) / 1000 + timeLeft)) * 100`. This divides `timeLeft` by a dynamic value that also depends on `Date.now()`, causing the denominator to change on every render. The progress bar does not linearly decrease from 100% to 0%.
- **Why it matters**: The timer progress bar will jump erratically and not smoothly fill down. The visual feedback for time remaining is unreliable, which is critical in a time-sensitive trivia game.
- **How to fix it**: Store the total question duration when the question arrives (e.g., `const totalSeconds = (question.expiresAt - questionReceivedAt) / 1000`), then calculate `timerPct = (timeLeft / totalSeconds) * 100`. Pass `totalSeconds` as a prop or compute it once using a ref.

---

**Issue #18**
- **Location**: [TriviaQuestion.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/hincha/TriviaQuestion.tsx#L75-L79) — answered state feedback
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: After the user selects an answer, the selected option shows `bg-lt-green/20 border-lt-green text-lt-green` but there's no indication of whether the answer was correct or incorrect. The `lastResult` from the store is never visually shown in this component.
- **Why it matters**: Users answer a trivia question and never get feedback about whether they were right or wrong within the question UI. The only feedback might come later from a notification, breaking the tight feedback loop that makes trivia engaging.
- **How to fix it**: After `question:resolved` fires, show correct/incorrect styling on the options: green background for the correct answer, red for the user's incorrect selection. Display "+X pts" or "Incorrecto" inline.

---

**Issue #19**
- **Location**: [LigasActions.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/ligas/_components/LigasActions.tsx#L326-L354) — BottomSheet modal
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: The BottomSheet modal component has no focus trap. When the modal opens, focus is not locked within the modal. Users can Tab behind the backdrop into the underlying page content. There is no `role="dialog"`, no `aria-modal="true"`, and no `aria-label` or `aria-labelledby`.
- **Why it matters**: Keyboard users and screen reader users can interact with content behind the modal. Screen readers don't know a dialog has opened. This violates WCAG 2.1 Success Criterion 2.4.3 (Focus Order) and 4.1.2 (Name, Role, Value).
- **How to fix it**:
  1. Add `role="dialog"` and `aria-modal="true"` to the bottom sheet container.
  2. Add `aria-labelledby` pointing to the title `<h2>`.
  3. Implement a focus trap using a library like `focus-trap-react` or a custom `useEffect` that constrains Tab cycling.
  4. Return focus to the trigger button when the modal closes.
  5. Handle `Escape` key to close the modal.

---

**Issue #20**
- **Location**: [LigasActions.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/ligas/_components/LigasActions.tsx#L336) — BottomSheet max-height
- **Category**: Responsiveness & Layout
- **Severity**: Medium
- **What's wrong**: The BottomSheet has `max-h-[92vh]` but no minimum height. On very small screens (e.g., iPhone SE, 320px wide / 568px tall), the "Crear liga" form may overflow the scrollable area and the submit button may be hidden behind the keyboard.
- **Why it matters**: When the virtual keyboard opens on mobile during form input, the visible area shrinks significantly. The submit button may become unreachable without dismissing the keyboard first.
- **How to fix it**: Use `max-h-[calc(100dvh-env(safe-area-inset-top,0px))]` with `100dvh` (dynamic viewport height) so the sheet respects the keyboard. Also ensure the submit button uses `position: sticky; bottom: 0` within the scroll container so it's always visible.

---

**Issue #21**
- **Location**: [ligas/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/ligas/page.tsx#L80-L95) — "Explorar ligas públicas" link
- **Category**: Navigation & Flow
- **Severity**: Medium
- **What's wrong**: The "Explorar ligas públicas" link points to `/ligas/publicas`, but there is no corresponding page at that route. The only routes under `/ligas` are `page.tsx`, `_components/`, and `[id]/`.
- **Why it matters**: Users who click this CTA will land on a 404 page. This is a dead-end link.
- **How to fix it**: Either create the `/ligas/publicas` page, or remove/hide this CTA until the feature is built. Alternatively, disable the link and add a "Próximamente" badge.

---

**Issue #22**
- **Location**: [NotificacionesScreen.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/notificaciones/_components/NotificacionesScreen.tsx#L58-L63) — mark-all-as-read race condition
- **Category**: State Management UX
- **Severity**: Medium
- **What's wrong**: On mount, the component fires `mark-read (all:true)` *before* the notifications have been fetched and rendered. This means unread notifications are marked as read before the user sees them. The `load()` function and `mark-read` call are fired in parallel.
- **Why it matters**: Users navigate to the notifications page and all notifications are immediately marked as read, even though the user hasn't actually seen them yet (the list might still be loading). The unread badge in BottomNav disappears, and the visual unread indicators (`border-l-lt-green`) might not render because `n.read` is now `true` by the time data arrives.
- **How to fix it**: Move the `mark-read` call to *after* the notifications have loaded and rendered. For example, trigger it with a delay (`setTimeout(() => markRead(), 2000)`) or after the fetch completes, or use an intersection observer to mark items as read when they enter the viewport.

---

**Issue #23**
- **Location**: [PromoBanner.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/hincha/PromoBanner.tsx#L79-L86) — dismiss button
- **Category**: Accessibility
- **Severity**: High
- **What's wrong**: The dismiss button (X icon) on promo banners has no `aria-label`. The button renders only an SVG with no accessible text.
- **Why it matters**: Screen reader users hear "button" with no context — they don't know this dismisses the promotion.
- **How to fix it**: Add `aria-label="Descartar promoción"` to the button. Add `aria-hidden="true"` to the SVG.

---

**Issue #24**
- **Location**: [PromoCard.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/negocio/PromoCard.tsx#L102-L137) — action buttons
- **Category**: Accessibility
- **Severity**: Medium
- **What's wrong**: The edit and delete buttons use `title` attributes for tooltips but have no `aria-label`. The `title` attribute is not reliably announced by screen readers on buttons. The "Enviar ahora" button has no confirmation step.
- **Why it matters**: Screen readers may not announce "Editar" or "Eliminar". The "Enviar ahora" button immediately sends a promotion to all targeted users with no "Are you sure?" confirmation, which is a destructive action that cannot be undone.
- **How to fix it**:
  1. Replace `title` with `aria-label` on the edit and delete buttons.
  2. Add a confirmation modal for "Enviar ahora" and "Eliminar" actions.

---

**Issue #25**
- **Location**: [perfil/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/perfil/page.tsx#L130) — profile avatar alt text
- **Category**: Accessibility
- **Severity**: Low
- **What's wrong**: The profile avatar `<Image>` uses `alt={user.name}`, which is acceptable, but the fallback initial character `<div>` (line 137-139) has no accessible label — screen readers see an empty `<div>`.
- **Why it matters**: When no image is present, the avatar initial is decorative but the containing `<div>` has no `role` or `aria-label`, making it silently rendered.
- **How to fix it**: Add `role="img"` and `aria-label={user.name}` to the fallback `<div>`, or add `aria-hidden="true"` since the name is already displayed as a heading.

---

**Issue #26**
- **Location**: [LiveTicker.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/layout/LiveTicker.tsx#L15) — performance
- **Category**: Performance UX
- **Severity**: Low
- **What's wrong**: The matches array is duplicated with `const items = [...matches, ...matches]` to create a seamless loop animation, but this duplication causes React to render twice as many DOM nodes as necessary.
- **Why it matters**: With many live matches, the DOM element count doubles. Combined with CSS animation, this can cause jank on low-end mobile devices.
- **How to fix it**: Use CSS `animation` with `translateX(-50%)` on a single container rather than duplicating elements. Alternatively, use `will-change: transform` and ensure the animation runs on the GPU.

---

**Issue #27**
- **Location**: [LiveTicker.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/layout/LiveTicker.tsx#L23) — ticker animation
- **Category**: Accessibility
- **Severity**: Medium
- **What's wrong**: The ticker animation runs continuously with no `prefers-reduced-motion` check. There is no way to pause the ticker.
- **Why it matters**: Users with vestibular disorders or motion sensitivity may experience discomfort from the continuous horizontal scrolling. WCAG 2.1 SC 2.3.3 (Animation from Interactions) recommends respecting `prefers-reduced-motion`.
- **How to fix it**: Add a CSS media query or a `useReducedMotion()` hook. When reduced motion is preferred, either pause the ticker animation or display scores as a static list.

---

**Issue #28**
- **Location**: [dashboard/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(negocio)/dashboard/page.tsx#L98-L120) — quick action cards
- **Category**: Responsiveness & Layout
- **Severity**: Low
- **What's wrong**: The quick action cards use `grid grid-cols-3 gap-3`. On narrow mobile screens (< 360px), the three columns can become very cramped, making text illegible and touch targets small.
- **Why it matters**: On small phones, the text "Ver ligas", "Audiencia", "Mi negocio" may wrap and the icons + text together create a crowded layout. Touch targets may fall below the 44x44px minimum.
- **How to fix it**: Use `grid-cols-2 sm:grid-cols-3` so on very small screens it falls back to 2 columns with better spacing. Set `min-h-[80px]` on each card to ensure adequate touch target sizing.

---

**Issue #29**
- **Location**: [register/hincha/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(auth)/register/hincha/page.tsx#L147-L161) — team selection grid
- **Category**: Responsiveness & Layout
- **Severity**: Low
- **What's wrong**: The team selection buttons use `grid grid-cols-2 gap-2` but team names like "Atlético Bucaramanga" are long and may overflow or cause uneven button heights on small screens.
- **Why it matters**: Long team names may truncate or cause layout shifts, making some options harder to read or tap.
- **How to fix it**: Add `min-h-[48px]` to each button and use `line-clamp-2` or `truncate` to handle long text gracefully. Consider single-column layout on screens < 360px.

---

**Issue #30**
- **Location**: [AccuracyStatCard.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/perfil/_components/AccuracyStatCard.tsx#L32-L38) — info button
- **Category**: Accessibility
- **Severity**: Medium
- **What's wrong**: The tooltip trigger button contains only `<span>i</span>` and has no `aria-label`. The tooltip popup has no `role="tooltip"`, no `aria-describedby` connection, and disappears on outside click without keyboard support.
- **Why it matters**: Screen reader users can't discover the accuracy breakdown. Keyboard users can't trigger the tooltip (no focus handling). The button's purpose is unclear.
- **How to fix it**:
  1. Add `aria-label="Ver detalle de aciertos"` to the button.
  2. Add `role="tooltip"` and `id="accuracy-tooltip"` to the tooltip div.
  3. Add `aria-describedby="accuracy-tooltip"` to the button when tooltip is shown.
  4. Support `onFocus`/`onBlur` to show/hide the tooltip for keyboard users.

---

**Issue #31**
- **Location**: [useTrivia.ts](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/hooks/useTrivia.ts#L50-L54) — answer submission
- **Category**: Interaction & Feedback
- **Severity**: High
- **What's wrong**: The `submitAnswer` function sends a POST request to `/api/answers` but does not handle the response or errors at all. There's no `.then()` or `.catch()` after the `fetch()` call (line 50-54). If the request fails, the user sees their selection highlighted but the server never received the answer.
- **Why it matters**: A network failure during trivia means the user's answer is lost silently. They believe they answered, but no points are awarded. In a competitive trivia game, this is a critical failure mode.
- **How to fix it**: Add error handling:
  ```ts
  const res = await fetch(...)
  if (!res.ok) {
    // revert the selected answer state
    // show an error toast
  }
  ```
  Consider adding optimistic UI with rollback on failure.

---

**Issue #32**
- **Location**: [audiencia/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(negocio)/dashboard/audiencia/page.tsx#L41-L56) — fetch without error handling
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: The `fetchAudience` function catches errors silently (`finally { setLoading(false) }`). If the API fails, `audience` stays empty and the user sees the empty state "Sin participantes aún" — indistinguishable from actually having no participants.
- **Why it matters**: A network error looks exactly like an empty database. Business owners may think they have no customers when actually the request failed.
- **How to fix it**: Add a `fetchError` state and show a distinct error state UI (e.g., "Error al cargar la audiencia. Reintentar") when the fetch fails, similar to how ExplorarScreen handles errors.

---

**Issue #33**
- **Location**: All `<select>` elements — [LigasActions.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(hincha)/ligas/_components/LigasActions.tsx#L211-L219), [audiencia/page.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/(negocio)/dashboard/audiencia/page.tsx#L108-L118)
- **Category**: Responsiveness & Layout
- **Severity**: Low
- **What's wrong**: `<select>` elements use `bg-lt-card` and `text-lt-white`, but native `<select>` dropdown menus on mobile are rendered by the OS and won't match these styles. The `<option>` elements will use the OS theme (often white background with dark text), creating a jarring contrast.
- **Why it matters**: The dropdown looks styled when closed but opens with a completely different visual style (native OS picker on iOS/Android). This is a minor but noticeable inconsistency.
- **How to fix it**: This is a known limitation of native `<select>`. For better visual consistency, consider replacing with a custom dropdown component (e.g., Radix UI Select or a custom BottomSheet picker for mobile). Alternatively, accept the native behavior as it's familiar to users.

---

**Issue #34**
- **Location**: [globals.css](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/globals.css#L24-L28) — global reset
- **Category**: Accessibility
- **Severity**: Low
- **What's wrong**: The global CSS resets all padding and margin to 0 with `* { padding: 0; margin: 0; }`. While this is common, it removes default focus outlines on interactive elements. The `focus:outline-none` Tailwind class is used extensively on inputs, and there are no custom focus indicators to replace them.
- **Why it matters**: Keyboard users cannot see which element has focus. The green border on focus (`focus:border-lt-green`) is too subtle as the only focus indicator — it has very low contrast against the card backgrounds and may be invisible to users with low vision.
- **How to fix it**:
  1. Add a global focus-visible style: `:focus-visible { outline: 2px solid #00E676; outline-offset: 2px; }`.
  2. Only suppress outlines using `focus:outline-none` when a more visible custom focus style is provided.
  3. Use `focus-visible:ring-2 focus-visible:ring-lt-green` on interactive elements.

---

**Issue #35**
- **Location**: [page.tsx (root)](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/app/page.tsx) — redirect chain
- **Category**: Performance UX
- **Severity**: Low
- **What's wrong**: The root page (`/`) performs a server-side redirect to `/onboarding`, `/dashboard`, or `/home`. This adds an extra round-trip. Additionally, there's no loading state during this redirect.
- **Why it matters**: Users who bookmark or visit the root URL see a brief blank flash before being redirected. On slow connections, this can be a noticeable delay.
- **How to fix it**: Add middleware-level redirects in `next.config.js` or `middleware.ts` for the root path to avoid rendering a component at all. This eliminates the blank flash.

---

**Issue #36**
- **Location**: [MatchWidget.tsx](file:///wsl.localhost/Ubuntu/home/juanca/laTribuna/components/shared/MatchWidget.tsx#L27-L28) — team logo images
- **Category**: Accessibility
- **Severity**: Low
- **What's wrong**: Team logo images use `alt={match.homeTeam}` and `alt={match.awayTeam}`, which is good. However, when logos are missing (no `homeLogo` or `awayLogo`), there's no fallback — the team name text is the only identifier, which is correct. Minor: the `<Image>` component uses fixed `width={28} height={28}`, which is fine for display density.
- **Why it matters**: Minor — this is actually handled reasonably well. No significant issue.
- **How to fix it**: No action needed; included for completeness.

---

## Summary Table

| # | Category | Severity | Location | Issue |
|---|----------|----------|----------|-------|
| 1 | Accessibility | **Critical** | `layout.tsx` | `userScalable: false` prevents zoom |
| 2 | Accessibility | High | `BottomNav.tsx` | No `aria-label` on nav, icons not hidden |
| 3 | Navigation | Medium | `BottomNav.tsx` | No direct notifications link in nav |
| 4 | Accessibility | High | `login/page.tsx` | Password toggle has no accessible label |
| 5 | Interaction / Copy | High | `login/page.tsx` | Password reset via WhatsApp, no external link indicator |
| 6 | Navigation | Medium | `login/page.tsx` | `callbackUrl` ignored after login |
| 7 | Interaction | Medium | `register/hincha` | No inline validation messages |
| 8 | Interaction | Medium | `register/negocio` | Geolocation failure is silent |
| 9 | Interaction | High | `ExplorarScreen.tsx` | Uses `alert()` for error handling |
| 10 | Copy | Medium | `ExplorarScreen.tsx` | HTML entities render as literal text in JSX |
| 11 | Interaction | Medium | `wallet/page.tsx` | Permanently disabled button with no explanation |
| 12 | Navigation | Medium | `wallet/page.tsx` | No back button |
| 13 | Accessibility | High | `Sidebar.tsx` | No `aria-label` on sidebar or nav landmarks |
| 14 | Interaction | Medium | `Sidebar.tsx` | Logout has no confirmation |
| 15 | Accessibility | High | All SVG icons | Icons missing `aria-hidden` |
| 16 | State Management | Medium | `home/page.tsx` | `return null` instead of redirect |
| 17 | State Management | High | `TriviaQuestion.tsx` | Timer percentage calculation is broken |
| 18 | Interaction | Medium | `TriviaQuestion.tsx` | No correct/incorrect answer feedback |
| 19 | Accessibility | High | `LigasActions.tsx` | BottomSheet has no focus trap or ARIA dialog role |
| 20 | Layout | Medium | `LigasActions.tsx` | BottomSheet doesn't account for keyboard height |
| 21 | Navigation | Medium | `ligas/page.tsx` | "Explorar ligas públicas" links to non-existent page |
| 22 | State Management | Medium | `NotificacionesScreen.tsx` | Mark-all-read fires before notifications render |
| 23 | Accessibility | High | `PromoBanner.tsx` | Dismiss button has no accessible label |
| 24 | Accessibility | Medium | `PromoCard.tsx` | Action buttons lack `aria-label`; no confirmation for destructive actions |
| 25 | Accessibility | Low | `perfil/page.tsx` | Avatar fallback not accessible |
| 26 | Performance | Low | `LiveTicker.tsx` | DOM nodes duplicated for animation |
| 27 | Accessibility | Medium | `LiveTicker.tsx` | No `prefers-reduced-motion` support |
| 28 | Layout | Low | `dashboard/page.tsx` | Quick action cards cramped on small screens |
| 29 | Layout | Low | `register/hincha` | Long team names overflow |
| 30 | Accessibility | Medium | `AccuracyStatCard.tsx` | Tooltip not keyboard-accessible |
| 31 | Interaction | High | `useTrivia.ts` | Answer submission has no error handling |
| 32 | Interaction | Medium | `audiencia/page.tsx` | Fetch error indistinguishable from empty state |
| 33 | Layout | Low | Multiple files | Native `<select>` style mismatch on mobile |
| 34 | Accessibility | Low | `globals.css` | Custom focus indicators insufficient |
| 35 | Performance | Low | Root `page.tsx` | Redirect chain with blank flash |
| 36 | Accessibility | Low | `MatchWidget.tsx` | Minor — handled adequately |

---

## Priority Fix List — Top 5 Issues by User Impact

| Rank | Issue # | What to fix | Why it's urgent |
|------|---------|-------------|-----------------|
| **1** | **#1** | Remove `userScalable: false` from viewport config | **Critical a11y violation** — blocks all users from zooming; potential legal/compliance risk (WCAG 2.1 AA) |
| **2** | **#10** | Replace HTML entities with UTF-8 characters in ExplorarScreen | **Users see garbled text** (`"Activa tu ubicaci&oacute;n"`) on the GPS prompt, empty state, and error state — core user-facing flows |
| **3** | **#17** | Fix TriviaQuestion timer percentage calculation | **Core gameplay is broken** — the progress bar jumps erratically during live trivia, undermining the time pressure mechanic that drives engagement |
| **4** | **#19** | Add focus trap, ARIA roles, and Escape key to BottomSheet | **High-traffic modal** (create/join league) is inaccessible to keyboard/screen reader users and lacks basic dialog semantics |
| **5** | **#6 + #21** | Fix callbackUrl handling on login + remove/fix dead "ligas públicas" link | **Two broken user flows** — invite links lose context after login; "Explorar ligas públicas" leads to 404 |

---

## Visual Audit Complement — Browser Testing

> **Method**: Live browser testing of the running app (Next.js dev server, `localhost:3000`)  
> **Date**: 2026-03-29  
> **Tested**: All unauthenticated and authenticated flows via a newly created test account  
> **Browser**: Chromium (Playwright), tested at both desktop (~1000px) and mobile (375px) viewports

---

### Visually Confirmed Issues from Code Audit

The following issues from the code audit were **confirmed live in the browser**:

#### ✅ Issue #7 — Registration has no inline validation feedback
![Registration silent validation — password too short, no feedback shown](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\register_no_feedback_short_pw_1774802197229.png)

The "Continuar →" button appears in a muted amber color when the password is too short (5 characters instead of required 8), but there is **no error message, no red border, no tooltip** explaining why the button won't proceed. The user has no way to know what's wrong.

---

#### ✅ Issue #19 — BottomSheet modals don't close on Escape or backdrop click
![Crear liga modal open state](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\crear_liga_modal_open_1774802455962.png)

Confirmed: pressing **Escape** does not close the modal. Clicking the **backdrop** behind the modal does not close it. Only the explicit **✕** close button works. This is a significant accessibility and usability issue.

---

#### ✅ Issue #21 — "Explorar ligas públicas" links to 404
![404 page when navigating to /ligas/publicas](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\ligas_publicas_page_audit_1774802579007.png)

The link at the bottom of the Ligas page navigates to `/ligas/publicas`, which returns a default Next.js 404 page ("This page could not be found."). The 404 page has no custom styling and no way to navigate back except the browser back button or bottom nav.

---

#### ✅ Issue #11 — Wallet "Explorar premios" button has no explanation for being disabled
![Wallet page showing dead CTA button](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\wallet_page_audit_1774802311042.png)

The "🎁 Explorar premios y canjes" button appears fully styled but does nothing when clicked. There's no "Próximamente" badge or tooltip to explain the disabled state.

---

#### ⚠️ Issue #10 — HTML Entities: **PARTIALLY INCORRECT** in Original Audit
![Explorar page GPS prompt — accents render correctly](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\explorar_page_audit_1774802353283.png)

**Correction**: The GPS prompt text ("ACTIVA TU UBICACIÓN", "Permite el acceso a tu ubicación para encontrar negocios cercanos y hacer check-in") renders **correctly** in the browser. The accented characters (ó, á, í, é) display as proper UTF-8. 

This means either:
1. The HTML entities in the source code are being properly parsed by some mechanism, OR
2. The source code actually uses UTF-8 characters and the entities are only in comments/non-rendered sections

**Downgraded from Medium to Low** — the code still uses HTML entity syntax which is a code quality concern, but it does not produce garbled user-facing text as originally reported.

---

### New Issues Discovered via Visual Testing

---

**Issue #37 — NEW**
- **Location**: `/notificaciones` page
- **Category**: Interaction & Feedback
- **Severity**: High
- **What's wrong**: The notifications page shows **only a green loading spinner** with no header, no title, and no empty state. The page appears broken.

![Notifications page — blank with only a spinner](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\notificaciones_page_audit_1774802563308.png)

The page renders a centered green circle spinner with no surrounding content. There is:
- No page title ("Notificaciones")
- No "← Inicio" back link (which exists in the source code but isn't visible)
- No empty state message like "No tienes notificaciones"
- No skeleton loading state

**Why it matters**: A user navigating to notifications sees what looks like an endlessly loading page. There's no indication the page has actually finished loading — it may appear permanently broken.
**How to fix it**: Ensure the loading state has a limited duration before falling through to the empty state. Add a page header that renders independently of the data fetch.

---

**Issue #38 — NEW**
- **Location**: "Unirme con código" modal in `/ligas`
- **Category**: Interaction & Feedback
- **Severity**: High
- **What's wrong**: Entering an invalid league invite code and clicking "Unirme →" produces **zero error feedback**. The button briefly shows a loading state, then returns to active without any message.

![Join with code modal — no error after invalid code submission](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\unirme_codigo_error_final_1774802518887.png)

The user types "ABC123", clicks "Unirme →", and after a brief pause the form just sits there with no indication that the code was invalid. No red text, no shake animation, no toast.

**Why it matters**: Users don't know if they mistyped the code, if the code expired, or if the server had an error. They're left guessing.
**How to fix it**: Display a contextual error message below the code input (e.g., "Código no válido. Verifica e intenta de nuevo.") in red text.

---

**Issue #39 — NEW**
- **Location**: Check-in flow in `/explorar`
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: After successfully checking in to a business (clicking "Check-in" on "Cognity"), the UI returns to the **exact same state** with no success feedback. No toast, no animation, no "Checked in ✓" state change.

![Explorar page — check-in completed with no visible feedback](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\explorar_checkin_result_1774802552569.png)

The "Check-in" button appears identical before and after the action. Users can't tell if the check-in actually succeeded.

**Why it matters**: Check-in is a core flow — users visit a business, check in, and earn XP. If there's no feedback confirming the action, users may tap repeatedly or leave without confidence that it worked.
**How to fix it**: After a successful check-in, change the button to "✓ Check-in hecho" with a green fill, show a brief confetti/celebration animation, and display "+X XP" earned.

---

**Issue #40 — NEW**
- **Location**: Login error state
- **Category**: Interaction & Feedback
- **Severity**: Low (positive finding)
- **What's wrong**: N/A — **this works correctly**.

![Login error state showing clear error message](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\login_error_state_1774802152199.png)

When entering wrong credentials, the app correctly displays "Email o contraseña incorrectos" in red/orange text below the password field. This is clear and visible. However, the "Entrar" button shows **no loading state** during the request, which could lead to double-submissions.

---

**Issue #41 — NEW**
- **Location**: "Crear liga" form in modal
- **Category**: Interaction & Feedback
- **Severity**: Medium
- **What's wrong**: Clicking "Crear liga" with an empty name field produces **no validation feedback**. The form silently does nothing.

![Crear liga empty form — no validation feedback](C:\Users\juanc\.gemini\antigravity\brain\6830dc12-de73-4347-b74c-c53cdee9de58\crear_liga_empty_validation_1774802483778.png)

The "Nombre *" field is marked as required (red asterisk), but when the submit button is clicked with no name, nothing happens. No red border, no "Este campo es obligatorio" message.

**Why it matters**: Users may think the button is broken since there's no feedback at all.
**How to fix it**: Add inline validation: when submit is attempted with an empty name, show "El nombre es obligatorio" in red below the field and add a red border to the input.

---

**Issue #42 — NEW**
- **Location**: Password recovery link in `/login`
- **Category**: Navigation & Flow
- **Severity**: Medium
- **What's wrong**: Clicking "¿Olvidaste tu contraseña?" opens a WhatsApp link in a **new tab** with no visual warning that the user is leaving the app.

The link text is plain — no external link icon (↗), no "WhatsApp" label, no tooltip. Users expect a standard password reset flow (email verification) and are surprised by being redirected to WhatsApp.

**Why it matters**: Users without WhatsApp have no alternative. The surprise navigation breaks trust.
**How to fix it**: This was already documented as Issue #5, but now **visually confirmed** — the link provides no external navigation affordance whatsoever.

---

### Page-by-Page Visual Summary

| Page | Status | Key Observation | Screenshot |
|------|--------|----------------|------------|
| **Onboarding** | ✅ Clean | Well-designed, responsive, clear CTAs | `onboarding_mobile_view` |
| **Login** | ⚠️ Minor issues | Error states work, but no loading indicator on button | `login_error_state` |
| **Register Hincha** | ❌ Silent failures | No validation feedback for short passwords | `register_no_input_error` |
| **Register Negocio** | ❌ Silent failures | Same silent validation issue; 4-step form has no error states | `register_no_feedback_short_pw` |
| **Home** | ✅ Clean | XP bar, greeting, empty league state all render properly | `home_page_audit` |
| **Wallet** | ⚠️ Dead CTA | "Explorar premios" button is disabled with no explanation | `wallet_page_audit` |
| **Perfil** | ✅ Clean | Stats, completion bar, account links all render well | `perfil_page_audit` |
| **Editar Perfil** | ✅ Clean | Form pre-populated, completion gamification visible | `editar_perfil_page_audit` |
| **Ligas** | ❌ Broken link | "Explorar ligas públicas" → 404 | `ligas_page_audit` |
| **Crear Liga Modal** | ❌ No validation | Empty form submits silently, no Escape/backdrop close | `crear_liga_modal_open` |
| **Unirse Modal** | ❌ No error feedback | Invalid code produces zero feedback | `unirme_codigo_error_final` |
| **Explorar** | ⚠️ No check-in feedback | GPS prompt works, businesses load, but check-in has no success state | `explorar_page_loaded_audit` |
| **Notificaciones** | ❌ Appears broken | Only shows spinner, no header or empty state | `notificaciones_page_audit` |
| **Ligas Públicas** | ❌ 404 | Route doesn't exist | `ligas_publicas_page_audit` |

---

### Updated Priority Fix List — Top 7 (Incorporating Visual Findings)

| Rank | Issue # | What to fix | Why it's urgent |
|------|---------|-------------|-----------------|
| **1** | **#1** | Remove `userScalable: false` | **Critical a11y/legal** — blocks zooming for all users |
| **2** | **#37** | Fix notifications page loading/empty state | **Page appears broken** — spinner only, no content ever shown |
| **3** | **#19** | Add Escape/backdrop close + focus trap to modals | **Unusable for keyboard users**, confirmed visually that neither Escape nor backdrop click works |
| **4** | **#38 + #41** | Add error/validation feedback to all modals | **Two core flows** (create league, join with code) have zero error feedback |
| **5** | **#7** | Add inline validation to registration forms | **Both registration flows** silently fail with no explanation — confirmed via both hincha and negocio forms |
| **6** | **#17** | Fix TriviaQuestion timer calculation | **Core gameplay broken** — progress bar jumps erratically |
| **7** | **#21** | Fix/remove "Explorar ligas públicas" dead link | **Visually confirmed 404** — prominent CTA leads to dead end |

---

### Browser Recording Artifacts

The full browser interaction sessions were recorded as video:

1. **Onboarding inspection**: `onboarding_inspection_1774801800544.webp`
2. **Login & registration audit**: `login_page_audit_1774801940194.webp`
3. **Login error testing**: `login_attempt_test_1774802116974.webp`
4. **Authenticated pages audit**: `authenticated_pages_audit_1774802239600.webp`
5. **Modal & flow testing**: `modal_and_flow_audit_1774802430559.webp`
