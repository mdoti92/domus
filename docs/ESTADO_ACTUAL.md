# Domus — Estado actual (relevado 2026-08-13)

Documento de relevamiento hecho probando la app en `npm run web` (Chrome vía navegador embebido), leyendo el código de `app/`, `components/`, `hooks/`, `lib/`, corriendo `npx tsc --noEmit` y `npm test`. No es un documento de diseño ni de backlog — es una foto de qué funciona hoy y qué no, para retomar sin perder contexto.

## Lo que funciona

### Auth (DOM-14)
- Login y registro reales contra Supabase Auth (`hooks/useAuth.ts`, `app/login.tsx`).
- Sesión persistida con AsyncStorage, redirección automática login ↔ tabs según sesión (`app/_layout.tsx`).
- RLS por usuario autenticado en las tablas (`supabase/migrations/20260625000000_auth_rls_policies.sql`).
- ⚠️ El proyecto de Supabase tiene **confirmación de email obligatoria**: después de registrarte no podés loguear hasta confirmar el mail. Bloquea probar signup→login de una sola pasada en dev.
- ⚠️ No hay botón de **logout** en ninguna pantalla. El método `signOut()` existe en el hook pero no se usa en la UI.

### Home — listado de Assets
- Lista de assets agrupados por categoría (`lib/groupAssetsByCategory.ts`).
- Filtro por categoría con chips, solo aparece si hay más de una categoría (DOM-12).
- Cada card muestra el asset y su último evento (DOM-13, `lib/mergeLastEvents.ts`).
- Empty state cuando no hay assets todavía, con CTA para crear el primero.
- FAB (+) para abrir el modal de creación de asset, con parámetros configurables por asset (texto/número/boolean).

### Detalle de Asset (`app/assets/[id].tsx`)
- Header con info del asset + historial de eventos.
- Editar asset y sus `parameter_definitions` (DOM-9).
- Eliminar asset con cascade a sus eventos e historial (DOM-10).
- Registrar nuevo evento con los valores de los parámetros definidos.
- Empty state cuando el asset todavía no tiene eventos.

### Detalle de Evento (`app/assets/events/[eventId].tsx`)
- Ver valores de parámetros registrados, notas y estado (pendiente/realizado/cancelado).
- Editar y eliminar evento (DOM-11).

### Infra / calidad
- Expo SDK 56, React Native 0.85, Supabase JS, design system élfico (tokens en `constants/colors.ts`), tipografías Cormorant Garamond + Inter.
- SSR deshabilitado en web para evitar `window is not defined` con AsyncStorage.
- 99 tests / 15 suites, todos en verde (`npm test`).

## Lo que NO funciona / está pendiente

- **Tabs "Mantenimiento" y "Obras"**: siguen siendo placeholders literales ("Próximamente...", `app/(tabs)/mantenimiento.tsx` y `obras.tsx`). Desde que el modelo pasó a estar centrado en Asset (categoría = solo un atributo para agrupar, no un módulo separado — ver CLAUDE.md), estos tabs quedaron huérfanos. Vale la pena decidir si se eliminan y todo se maneja desde Home con el filtro por categoría, o si cumplen otro propósito.
- ~~Bug de tipos en `groupAssetsByCategory`~~ — **arreglado** (2026-08-13): la función ahora es genérica (`<T extends Asset>`) y preserva `lastEvent` cuando recibe `AssetWithLastEvent[]`. `npx tsc --noEmit` limpio.
- **Conectividad Expo Go / Metro en el celular físico**: quedó afuera de este relevamiento por decisión del usuario — no es representativo de cómo se va a deployar (web) y se resuelve más adelante con un build real (EAS) en vez de depender de Expo Go.

## Config local necesaria

- `.env` (gitignored) con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` — sin esto la app crashea al arrancar (`lib/supabase.ts` tira `throw` explícito). Como está en `.gitignore`, hay que copiarlo a mano en cada máquina nueva.
- `react-native-reanimated` bajado de `4.3.1` a `~3.16.0` por incompatibilidad con Expo SDK 56 (commit "se arregla versionados" en `develop`).

## Cómo levantarla

```bash
npm install
npm run web
```

Abre en `http://localhost:8081`. Requiere el `.env` de arriba.
