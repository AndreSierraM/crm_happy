# Happy CRM — licencias y desbloqueo self-host

## 1. Dos sistemas de licencia (no confundir)

| Sistema                 | Dueño  | Qué controla                                    | Tu control            |
| ----------------------- | ------ | ----------------------------------------------- | --------------------- |
| Twenty billing + EE key | Twenty | Stripe, trials, `SSO/RLS/audit/logs`, `USAGE_LIMIT` | Solo on/off vía env  |
| Happy licenses (`happy/`) | Tú   | Tus clientes: edición, max usuarios, workspaces, vigencia | Total (generar/revocar) |

## 2. Estado liberado por defecto (sin bloqueos)

- `IS_BILLING_ENABLED=false` (default en `config-variables.ts`): todos los guards de billing hacen bypass — `getSubscriptionInactiveReason` retorna `null`, Stripe services no-op, sin trial locks. Core CRM (contactos, empresas, deals, tareas, workflows base) funciona sin Stripe ni `ENTERPRISE_KEY`.
- `ENTERPRISE_KEY` es `@IsOptional()`: sin key el server arranca. `EnterprisePlanService.isValid()` = `false` → las 6 entitlements Enterprise quedan **desactivadas** (no error, solo gate en UI con `SettingsEnterpriseFeatureGateCard`).
- Funciones gateadas sin key EE: `SSO`, `CUSTOM_DOMAIN`, `RLS`, `RECORD_SHARING`, `AUDIT_LOGS`, `USAGE_LIMIT`.

## 3. Regla legal (importante)

- `LICENSE`: el repo es AGPL-3.0 **excepto** archivos con `/* @license Enterprise */` (~423 en `twenty-server`) bajo *Twenty.com Commercial License*: solo dev/test sin suscripción; **producción con esos archivos exige suscripción Twenty EE**.
- `.github/TRADEMARK.md`: los forks deben usar marca propia. Este fork ya lo cumple: **Happy CRM**, logo propio, sin logo Twenty.
- Si vendes hosting Happy a clientes en producción y quieres SSO/RLS/audit: opciones compliant (a) contratar Twenty EE, (b) reimplementar esos gates con código propio, (c) vender solo edición community sin esos features. No bypasseamos los checks Enterprise (sería violación de licencia).

## 4. Administrar TUS licencias Happy

```bash
export HAPPY_LICENSE_SECRET="un-secreto-largo-aleatorio"  # prod: openssl rand -hex 32

# Crear licencia cliente (1 año, 50 usuarios, 10 workspaces)
node happy/scripts/happy-license.mjs generate --client "Acme SA" --edition pro --max-users 50 --max-workspaces 10 --days 365

# Validar / estado (exit 0 = válida)
node happy/scripts/happy-license.mjs status --key "HAPPY-..."

# Listar / revocar
node happy/scripts/happy-license.mjs list
node happy/scripts/happy-license.mjs revoke --id <uuid>

# Auditoría licencias Twenty (cuenta archivos Enterprise, verifica billing off)
node happy/scripts/happy-license.mjs audit
```

`happy/licenses.json` es tu registro (versiónalo o muévelo a tu vault; cada key es HMAC-SHA256 verificable offline con el secreto).

## 5. Levantar sin errores

```bash
cd packages/twenty-docker
cp ../../happy/.env.happy.example .env
# editar SERVER_URL, ENCRYPTION_KEY (openssl rand -base64 32), HAPPY_* 
docker compose up -d
docker compose logs -f server
```

Chequeo rápido: `GET /healthz` → 200, login con email (sin pantalla de billing si `IS_BILLING_ENABLED=false`).

## 6. Branding aplicado fase 2

- Logo propio: `packages/twenty-front/public/images/happy/logo.svg` + `favicon.svg`; `index.html` apunta al favicon Happy; logo Twenty del website reemplazado (misma ruta, builds intactos).
- Título/tab: `Happy CRM` (fase 1). Acento Happy: `packages/twenty-front/src/happy-theme.css` importado en `index.tsx` después de los temas twenty-ui.
- `twenty-website` fuera de `workspaces` raíz (desactivado del install/build; código conservado).
- Textos login/onboarding vía Lingui: **no editados** a propósito (editar `t\`\`` exige `lingui extract/compile` y genera miles de líneas de churn). Ver `HAPPY_REBRAND.md` próximos pasos.

## 7. Sync con upstream

```bash
git remote add upstream https://github.com/twentyhq/twenty.git 2>/dev/null
git fetch upstream
git checkout happy-rebrand && git merge upstream/main  # resolver; Happy vive en archivos propios salvo los 8 base
```
