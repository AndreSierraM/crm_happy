# Happy CRM — Mapa de renombre Twenty → Happy (capa pública con compatibilidad)

> Estrategia elegida: **solo capa pública**. El código interno sigue siendo `twenty-*`
> para no romper Nx, i18n, migraciones ni imports (17.256 archivos con `twenty`).
> Lo público se expone como `happy-*` con aliases duales. Fork duro desde aquí.
> Riesgo legal pendiente: `LICENSE`, `HAPPY_LICENSES.md` y `HAPPY_REBRAND.md` no existen
> en `HEAD` (borrados en `64422f1d`); sin `LICENSE` se rompe AGPL. El usuario decidió
> seguir sin restaurar — queda documentado como deuda.

Inventario real (grep, excluye `.git`/`node_modules`/`yarn.lock`):
- `twenty-`: 14.819 archivos | `Twenty`: 3.835 | `TWENTY`: 525
- `twenty.com`: 913 archivos | `twentyhq`: 447 | `twentycrm`: 75
- `TWENTY_*` distintas: ~60 (casi todas son **constantes internas**, no env)

## 1. Paquetes npm — `twenty-*` → `happy-*` (convención simple)

El nombre físico en `packages/*/package.json` **no se toca** (compat upstream).
El alias `happy-*` se resuelve por `tsconfig.base.json` → `paths`
(ver `happy/aliases.json` como fuente máquina). Cuando se quiera renombre
físico, crear `packages/happy-X/` como shim que re-exporte `twenty-X`.

| Legacy (real, no tocar) | Alias Happy (público) | Notas |
|---|---|---|
| `twenty-front` | `happy-front` | app React, ya con título/manifest Happy |
| `twenty-server` | `happy-server` | NestJS, `dist` intacto |
| `twenty-shared` | `happy-shared` | isomórfico, base de 5.882+3.810 imports |
| `twenty-ui` | `happy-ui` | theme/tokens, `happy-theme.css` hace override |
| `twenty-sdk` | `happy-sdk` | `twenty-sdk/define`, `logic-function` |
| `twenty-client-sdk` | `happy-client-sdk` | `core/metadata/rest` |
| `twenty-emails` | `happy-emails` | remitente ya `Happy CRM` |
| `twenty-utils` | `happy-utils` | scripts dev |
| `twenty-zapier` | `happy-zapier` | integración |
| `twenty-docs` | `happy-docs` | docs |
| `twenty-e2e-testing` | `happy-e2e-testing` | Playwright |
| `twenty-front-component-renderer` | `happy-front-component-renderer` | renderer |
| `twenty` (packages/twenty-cli) | `happy-cli` | ¡ojo! el CLI se llama `twenty` a secas |
| `create-twenty-app` | `create-happy-app` | scaffolder |
| `twenty-agent-skills` | `happy-agent-skills` | skills agente |
| `twenty-claude-skills` | `happy-claude-skills` | skills claude |
| `twenty-oxlint-rules` | `happy-oxlint-rules` | lint |
| `@twentyhq/companion` | `@happy-crm/companion` | única excepción con scope |
| `twenty-website` | `happy-website` | fuera de `workspaces`, no se instala |
| root `crm_happy` (antes `twenty-monorepo`) | — | ya renombrado en fase 1 |

Imports: `from 'twenty-shared/utils'` etc. **no se reescriben**.
Para usar el alias nuevo: `from 'happy-shared/utils'` → resuelve al mismo archivo
vía `tsconfig.base.json`. Los 14.819 archivos con `twenty-` quedan intactos.

## 2. Variables de entorno

Solo **1** env real con prefijo `TWENTY_` en `twenty-config`:
- `ALLOW_REQUESTS_TO_TWENTY_ICONS` (default `true`)

El resto `TWENTY_*` son constantes (`TWENTY_CURRENT_VERSION`, `TWENTY_APP_*`,
`TWENTY_STANDARD_*`, etc.), no se leen de `process.env`. Por eso **no se renombra
ningún env existente**: cambiarlos rompería `ConfigVariables` + validación
`class-validator` + tests.

Compat Happy: `happy/happy-env-compat.sh` exporta duales —
si defines `HAPPY_*`, se propaga al legacy y viceversa. Las nuevas variables
Happy (`HAPPY_EDITION`, `HAPPY_LICENSE_KEY`, `HAPPY_MAX_USERS`,
`HAPPY_MAX_WORKSPACES`, `HAPPY_LICENSE_SECRET`) viven en `happy/.env.happy.example`.

## 3. Docker / deploy

| Legacy | Happy | Compat |
|---|---|---|
| `name: twenty` (compose) | `name: crm_happy` | ya aplicado fase 1, sin volumen roto |
| `image: twentycrm/twenty:${TAG}` | `${DOCKER_IMAGE:-happy/crm_happy}:${TAG:-latest}` | si `DOCKER_IMAGE` no se define, usa Happy; la imagen base Twenty sigue pullable como fallback documentado |
| `volumes: server-local-data:/app/packages/twenty-server/.local-storage` | sin cambio | **no renombrar** o se pierden datos locales |
| `yarn workspaces focus twenty-monorepo ...` (Dockerfile) | `crm_happy` | `yarn.config.cjs` también exigía `twenty-monorepo` y fallaba con root `crm_happy` — ambos corregidos aquí |
| `yarn.lock: twenty-monorepo@workspace:.` | se regenera con `yarn install` (requiere Node 24.5) | no se edita a mano |

## 4. Dominios / URLs / marcas

| Legacy | Happy | Estado |
|---|---|---|
| `twenty.com`, `docs.twenty.com` | `happy.local` (dev) / tu dominio | solo docs y `og:image`; el runtime usa `SERVER_URL` |
| `github.com/twentyhq/twenty` | `github.com/AndreSierraM/crm_happy` | README header ya apunta al fork |
| `twentycrm/twenty` (Docker Hub) | `happy/crm_happy` | compose usa Happy por defecto |
| `Felix from Twenty`, `(via Twenty)` | `Happy CRM`, `(via Happy CRM)` | ya aplicado fase 1 |
| `og:image ...twentyhq/twenty...social-card.png` | `/images/happy/logo.svg` local | corregido aquí (evita brand ajeno + tracking) |
| `id="twenty-env-config"` | se **mantiene** + `data-happy-env-config` | el server (`render-frontend-html.util.ts`) y `inject-runtime-env.sh` buscan ese id; renombrarlo rompe el boot. Se aceptan ambos comentarios `BEGIN: Happy CRM Config` / `BEGIN: Twenty Config` |

## 5. Qué NO se toca (a propósito)

- Carpetas `packages/twenty-*`, imports `twenty-*/@twenty/*`, `src/engine/twenty-orm/*`,
  `src/engine/workspace-manager/twenty-standard-application/*`, tablas/columnas,
  GraphQL, migraciones, catálogos Lingui.
- `HAPPY_LICENSES.md` / `HAPPY_REBRAND.md` / `LICENSE`: borrados en `HEAD`, no se
  restauran por decisión explícita del usuario. Referencias a `HAPPY_LICENSES.md`
  en `.env.example` quedan como deuda (el archivo no existe).
- `twenty-website`: fuera de `workspaces` (fase 2), no se renombra.

## 6. Cómo usar los aliases desde hoy

```ts
// legacy (siempre funciona)
import { isDefined } from 'twenty-shared/utils';
// alias Happy (mismo archivo, vía tsconfig paths)
import { isDefined } from 'happy-shared/utils';
```

```bash
# env dual (legacy sigue mandando si ambos definidos, salvo que uses el script)
source happy/happy-env-compat.sh
node happy/scripts/happy-license.mjs status --key "$HAPPY_LICENSE_KEY"

# docker Happy por defecto, fallback Twenty si lo necesitas
DOCKER_IMAGE=twentycrm/twenty TAG=latest docker compose -f packages/twenty-docker/docker-compose.yml up -d
```

## 7. Deuda y próximos pasos (fork duro)

1. Sin `LICENSE` no hay base AGPL válida — restaurar desde `a1088902:LICENSE`
   antes de distribuir imagen o binario.
2. `yarn install` pendiente (requiere Node `^24.5`, local tiene 22.x) para regenerar
   `yarn.lock` (`twenty-monorepo@workspace:.` → `crm_happy@workspace:.`).
3. Si algún día quieres renombre físico: `git mv packages/twenty-X packages/happy-X`,
   codemod `twenty-` → `happy-` en 14.819 archivos, regenerar GraphQL/Lingui,
   migraciones de renombre, y congelar upstream para siempre.
