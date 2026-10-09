# Happy CRM — fork de Twenty (`crm_happy`)

Fork de `twentyhq/twenty` adaptado como **Happy CRM**.
Estrategia: branding visual sin renombre profundo, para no romper upgrades desde upstream.

## Qué se cambió (fase 1)

- `package.json`: `twenty-monorepo` → `crm_happy`
- `packages/twenty-front/index.html`: `<title>Twenty` → `Happy CRM`, `og:title`/`twitter:title`, comentario config
- `packages/twenty-front/public/manifest.json`: `name`/`short_name` → `Happy CRM`
- `packages/twenty-docker/docker-compose.yml`: `name: twenty` → `crm_happy` + comentarios (imagen base intacta `twentycrm/twenty`)
- `packages/twenty-server/.../config-variables.ts`: `EMAIL_FROM_NAME = 'Felix from Twenty'` → `'Happy CRM'`
- `approved-access-domain.service.ts`: `(via Twenty)` → `(via Happy CRM)`
- `README.md`: header de fork + referencia a este archivo
- Licencia AGPL-3.0 intacta (obligatorio por fork Twenty)

## Qué NO se tocó a propósito

- Nombres de carpetas `packages/twenty-*`, imports `twenty-*/@twenty/*`, IDs `twenty-env-config`, variables `TWENTY_*`, tablas/GraphQL.
- Motivo: renombrar eso rompe `nx`, i18n, migraciones y hace imposible mergear upstream.
- Si quieres renombre profundo, hacerlo en fase 2 con codemod + freeze de upstream.

## Cómo correrlo

```bash
# Dev (requiere Postgres + Redis):
bash packages/twenty-utils/setup-dev-env.sh
yarn start

# Docker (self-host):
cd packages/twenty-docker
cp .env.example .env
# editar SERVER_URL, ENCRYPTION_KEY, APP_SECRET, STORAGE_TYPE
docker compose up -d
```

Front: http://localhost:3001 (dev) / Server: http://localhost:3000

## Env Happy recomendado

```env
SERVER_URL=http://localhost:3000
STORAGE_TYPE=local
EMAIL_FROM_ADDRESS=noreply@happy.local
EMAIL_FROM_NAME="Happy CRM"
```

## Próximos pasos propuestos

1. Logo/favicon Happy en `twenty-front/public/images/icons/*` + `twenty-website/public/images/core/logo.svg`
2. Colores/tema Happy en `twenty-ui` theme tokens
3. Textos login/onboarding: `welcome`, `create workspace` vía Lingui (sin tocar catálogos generados a mano)
4. `twenty-website` → landing Happy o desactivar paquete de `workspaces`
5. CI: build propio + publicar imagen `happy/crm_happy`
6. Sync upstream: `git remote add upstream https://github.com/twentyhq/twenty.git && git fetch upstream`

Upstream: https://github.com/twentyhq/twenty
Fork: https://github.com/AndreSierraM/crm_happy
