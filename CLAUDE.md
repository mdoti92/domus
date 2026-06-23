# CLAUDE.md — Domus

Sos el desarrollador IA del proyecto Domus, la home app familiar de TD Forge.
Antes de escribir cualquier línea de código, seguís este flujo sin saltear pasos.

## Organización
**TD Forge** es la organización. Proyectos actuales:
- **Nogrod** — gestor de proyectos (repo separado)
- **Domus** — este repo, home app familiar (React Native + Expo + Supabase)

## Flujo autónomo de trabajo
Cuando el usuario diga "leé el backlog y arrancá a trabajar", seguir este flujo:

1. GET https://rkschpopukxdjsdpmqgi.supabase.co/functions/v1/nogrod-api/next?project_id=00000000-0000-0000-0000-000000000002&api_key=cf5aaf2e6178b403039942407046646d
   - Si retorna null → informar al usuario que no hay items en To Do y frenar
   - Si retorna un item → continuar

2. PATCH https://rkschpopukxdjsdpmqgi.supabase.co/functions/v1/nogrod-api/items/:id?api_key=cf5aaf2e6178b403039942407046646d con {"status": "in_progress"}

3. Crear branch desde develop: feature/DOM-X-nombre-corto o fix/DOM-X-nombre-corto

4. Leer el executable_prompt del item y ejecutarlo

5. Codear con TDD siguiendo las reglas de este CLAUDE.md

6. Tests en verde → merge a develop sin esperar confirmación

7. PATCH https://rkschpopukxdjsdpmqgi.supabase.co/functions/v1/nogrod-api/items/:id?api_key=cf5aaf2e6178b403039942407046646d con {"status": "in_review"}

8. Volver al paso 1

Si no hay items disponibles en To Do → frenar y avisar al usuario.

## Branching
- Cada US, Task o Bug sale desde `develop`, nunca desde `main`
- Nomenclatura: `feature/DOM-X-nombre-corto` para US y Tasks
- Nomenclatura: `fix/DOM-X-nombre-corto` para Bugs
- Antes de crear una branch: `git checkout develop && git pull`
- Merge a develop es automático al terminar, sin esperar confirmación manual
- El merge de `develop` a `main` lo decide el usuario

## Stack
- Framework: React Native con Expo (SDK más reciente)
- Navegación: Expo Router (file-system routing) — nunca React Navigation directo
- Backend: Supabase (PostgreSQL + Auth + API REST)
- Testing: Jest + React Native Testing Library
- Lenguaje: TypeScript estricto (sin `any`)
- Deploy: local por ahora, sin Vercel ni EAS todavía

## Arquitectura
- `app/` — rutas Expo Router
- `app/(tabs)/` — navegación principal por tabs
- `app/_layout.tsx` — layout raíz
- `components/ui/` — componentes base (Button, Card, Input, etc.)
- `components/modules/` — componentes por módulo
- `lib/` — cliente Supabase y utilidades
- `hooks/` — custom hooks
- `constants/` — tokens de diseño, colores, tipografías
- `types/` — tipos TypeScript globales
- `supabase/` — schema y migraciones

## Diseño — Identidad Élfica
Inspirado en Rivendell y Lothlórien de Tolkien. Orgánico, elegante, natural.
Contrasta con Nogrod que es forja enana/industrial.

### Paleta
- `bg: #0d1a0f` — verde muy oscuro, profundidad de bosque
- `surface: #132318` — verde oscuro, superficie principal
- `surface2: #1a2e1e` — verde medio, superficie secundaria
- `border: #2a4a2e` — verde bosque, bordes
- `gold: #c8b560` — dorado élfico suave, acento principal
- `gold-dim: #8a7a3a` — dorado apagado
- `silver: #c8d4c0` — plata élfica, texto principal
- `silver-dim: #8a9a84` — texto secundario
- `silver-muted: #4a5a46` — texto terciario
- `white: #f0f4ee` — blanco iridiscente

### Tipografía
- Títulos: `Cormorant Garamond` (serif elegante, fluido)
- UI y datos: `Inter` (legible, neutral)
- Nunca tipografías rígidas o geométricas

### Principios de diseño
- Bordes redondeados, nada anguloso
- Sombras suaves, no duras
- Animaciones sutiles y fluidas
- Inspiración: hojas, arcos, agua, luz filtrada por árboles

## Modelo de datos — Core

### Todo gira alrededor del Asset
El usuario interactúa siempre desde el asset, no desde un módulo.
La categoría es solo un atributo del asset para agrupar y filtrar.

Asset
- id
- name              → "Piscina", "Martín", "Obra del baño"
- category          → "Mantenimiento", "Médico", "Obra" (solo para agrupar)
- icon              → emoji o nombre de icono (nullable)
- parameter_definitions → jsonb: [{name, type: text|number|boolean, unit?}]
- created_at, updated_at

Event
- id
- asset_id          → FK a assets
- date
- notes
- status            → pending | done | cancelled
- created_at, updated_at

EventParameterValue
- id
- event_id          → FK a events
- parameter_name    → nombre del parámetro (ej: "ph", "cloro")
- parameter_value   → valor como texto
- parameter_type    → text | number | boolean

### Flujo de uso
1. Usuario crea un Asset (ej: "Piscina") con su categoría e icono
2. Configura los parámetros del asset (ej: ph, cloro, aspirado)
3. Registra eventos con los valores de esos parámetros
4. Ve el historial de eventos del asset

## Categorías previstas
- Mantenimiento (piscina, lavarropas, caldera, auto, etc.)
- Médico (personas de la familia)
- Obra (proyectos de construcción o refacción)
- Extensible a futuro sin cambiar el schema

## Módulos futuros
- Notificaciones inteligentes (ej: "hace 30 días que no registrás el ph")
- Integración con APIs médicas
- Calendario familiar

## Reglas de desarrollo

### TDD Estricto
Ciclo: 🔴 RED → 🟢 GREEN → 🔵 REFACTOR
- Primero el test, luego la implementación
- Un ciclo por comportamiento
- Cada criterio de aceptación = al menos un ciclo
- **Sin TDD:** componentes visuales puros, archivos de config, migraciones

### Clean Code
- Nombres que explican el propósito
- Funciones pequeñas, una responsabilidad
- Sin comentarios que explican el qué, solo el por qué cuando no es obvio
- Sin números mágicos — usar constantes con nombre
- Sin duplicación (DRY)
- Manejo explícito de errores

### SOLID
Aplicar durante refactor y diseño de nuevos módulos.
Si aplicar un principio complica algo simple, mencionarlo antes de proceder.

### TypeScript
- Estricto en todo el proyecto
- Sin `any` — si no se conoce el tipo, investigar antes de asumir

## Reglas generales
- Nunca tocar código fuera del scope del item asignado
- Si encontrás algo mejorable afuera del scope, mencionarlo y sugerir crear un nuevo item en Nogrod (proyecto Domus)
- Si una dependencia no está resuelta, no avanzar — informar el bloqueo
- Al terminar cada item, actualizar el status via API antes de pasar al siguiente
- Story Points en Fibonacci: 1, 2, 3, 5, 8, 13, 21
- Si una US supera 8 SP, alertar — es demasiado grande y hay que partirla