# Respuesta al Informe de Vulnerabilidades — CRM Dev (2026-10-26)

| Campo | Valor |
|---|---|
| Para | Equipo de Seguridad de la Información — Happy BPO |
| Referencia | `Informe_Vulnerabilidades_CRM_Dev_2026-10-26.pdf` |
| Fecha de respuesta | 2026-11-06 |
| Código evaluado | `main @ 546b8dc665` + rama de trabajo (cambios pendientes de commit, detallados abajo) |
| Base upstream | `twentyhq/twenty @ ba29ee4f5b` (2026-10-26) + 33 commits locales |
| Build desplegado en el host auditado | No verificable desde código — se requiere el TAG de imagen en Dokploy (ver §5) |

> Criterio de estados: **Corregido en fuente** = cambio implementado y verificado en código con tests, pendiente de despliegue a dev y retest en runtime. Ningún estado de este documento sustituye el retest del equipo auditor.

## 1. Resumen de estado

| ID | Severidad (informe) | Estado | Responsable siguiente paso |
|---|---|---|---|
| DEV-01 CORS con credenciales | Crítica | **No reproduce en fuente** — se requiere verificar el despliegue (§2.1) | Desarrollo + Infra |
| DEV-02 HTTP plano puerto 3100 | Alta | **Pendiente** — cambio especificado en el repo, pendiente aplicar en Dokploy | Infra |
| DEV-03 Dokploy expuesto | Media | **Pendiente** — fuera del repositorio de la app | Infra |
| DEV-04 Certificado Traefik por defecto | Media | **Pendiente** — configuración Dokploy/Traefik | Infra |
| DEV-05 `X-Powered-By` | Baja | **Corregido en fuente**, pendiente despliegue + retest | Desarrollo |
| DEV-06 Health checks públicos | Baja | **Mitigado por diseño** — sin detalle sensible; exposición externa se cierra con DEV-02 | — |
| CVEs Twenty CRM (5) | Varias | 2 con evidencia de remediación en fuente; 3 pendientes de mapeo de versión / fase 2 | Desarrollo + Auditoría |
| CVEs Dokploy (5) | Varias | **Pendiente** — se requiere versión instalada | Infra |

## 2. Detalle por hallazgo

### 2.1 DEV-01 — CORS: no reproduce en el código fuente actual

**Análisis.** El middleware CORS (`packages/twenty-server/src/engine/core-modules/user-session/utils/apply-credentialed-cors.util.ts`, vigente desde el 2026-08-04, commit `997b2c38de`) implementa exactamente lo recomendado: allowlist explícita construida solo desde `SERVER_URL`, `FRONTEND_URL` y `AUTH_COOKIE_ALLOWED_ORIGINS` (`resolve-allowed-credentialed-origins.util.ts`), sin valores derivados del request y rechazando esquemas opacos. Solo los orígenes de la allowlist se reflejan; cualquier otro recibe literalmente `*`, que con `credentials: true` el navegador bloquea por especificación Fetch (el propio código lo documenta y lo registra en logs). No existe ruta de reflejo dinámico en el fuente actual ni en su historial desde agosto.

**Discrepancia con el PoC.** Dado lo anterior, el reflejo de `https://evil-attacker.com` observado el 26-oct no puede provenir de este código. Hipótesis, en orden de probabilidad: (1) el build desplegado en el puerto 3100 es anterior al 2026-08-04; (2) valores de entorno inesperados en Dokploy (aunque ningún valor puede inyectar un comodín: `*` no parsea como URL y se descarta); (3) lectura de `/healthz` (endpoint público por diseño, donde `*` es correcto) interpretada como lectura autenticada. Nota: un PoC basado en curl no prueba lectura cross-origin con credenciales, porque curl no aplica la política del navegador; solo una prueba en navegador con `credentials: include` es concluyente.

**Acciones requeridas.**
1. Confirmar TAG/commit de la imagen desplegada el 26-oct (ver §5).
2. Auditar `SERVER_URL`, `FRONTEND_URL` y `AUTH_COOKIE_ALLOWED_ORIGINS` del environment Dokploy.
3. Redesplegar desde la rama actual y repetir el PoC en navegador.

**Endurecimiento adicional aplicado.** Fallo cerrado: se omite `Access-Control-Allow-Origin` para orígenes no permitidos (antes `*`). En navegador el observable no cambia (ambos bloquean con credenciales), pero en runtime ya no hay ninguna cabecera que un escáner pueda interpretar como aprobación.

Retest sugerido tras el redespliegue:

```bash
curl -s -o /dev/null -D - -H "Origin: https://evil.example" \
  http://HOST:3100/graphql | grep -i "access-control-allow-origin"
# Esperado: sin salida (ninguna cabecera ACAO = denegado)
```

### 2.2 DEV-02 — HTTP plano en puerto 3100: pendiente de infraestructura

El puerto 3100 es el publish directo del servidor (`HOST_PORT=3100`, `packages/twenty-docker/docker-compose.dokploy.yml`). El propio compose documenta la remediación pendiente:

> “En prod con dominio: quitar este publish y rutear solo vía Traefik/443. Un puerto publicado sigue alcanzable por HTTP plano desde Internet.”

**Cambio requerido (bloqueante para producción):** eliminar el bloque `ports:` del servicio `server`, servir solo vía Traefik con TLS válido y redirección a HTTPS (+HSTS). No se aplicó en esta pasada por tratarse de un cambio de despliegue, no de código.

### 2.3 DEV-03 — Panel Dokploy expuesto: pendiente de infraestructura

Fuera del repositorio de la aplicación. Se aceptan las tres recomendaciones (restringir por VPN/allowlist de IPs, confirmar versión y parchear según §4 del informe, activar MFA). Verificamos en el informe que las APIs probadas devuelven 401 sin autenticación, lo cual es correcto pero no sustituye la restricción de red.

### 2.4 DEV-04 — Certificado Traefik por defecto: pendiente de infraestructura

El certificado `TRAEFIK DEFAULT CERT` proviene de la configuración TLS de Dokploy/Traefik, no del código. Acción: asociar dominio real con certificado válido (Let's Encrypt vía Dokploy) antes de producción. Bloqueante junto con DEV-02.

### 2.5 DEV-05 — `X-Powered-By`: corregido en fuente ✅

```ts
// packages/twenty-server/src/engine/utils/disable-powered-by-header.util.ts,
// wired in main.ts and the integration-test harness (create-app.ts)
export const disablePoweredByHeader = (app: INestApplication): void => {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
};
```

Verificado en fuente; pendiente de commit, despliegue a dev y retest:

```bash
curl -sI http://HOST:3100/healthz | grep -i "x-powered-by"
# Esperado: sin salida
```

### 2.6 DEV-06 — Health checks públicos: mitigado por diseño

El endpoint (`/healthz`, `ApiPath.Health`) ejecuta `health.check([])` — cero indicadores: devuelve estado `ok` sin detalle estructurado de dependencias o versiones. Debe permanecer sin autenticación porque lo consumen el `healthcheck` de Docker (definido en el compose) y las probes del balanceador. Quedó registrado en el inventario de endpoints públicos con su control documentado (ver §4). Su exposición a Internet desaparece automáticamente con la corrección de DEV-02. Riesgo residual aceptado para dev.

## 3. CVEs del software base (Sección 4 del informe)

**Determinación de versión.** El fork está al día con `upstream/main` al 2026-10-26 (`ba29ee4f5b`, la misma fecha de la auditoría) más 33 commits propios. Los tags públicos de upstream con esquema `v-prefijado` llegan hasta `v2.9.0` (verificado contra el remoto), por lo que las versiones de corrección citadas (`2.15.0`, `2.22.0`) no tienen correspondencia directa visible desde el repositorio. En el despliegue, `APP_VERSION` es el `TAG` de la imagen Dokploy. Se requiere ese TAG más la fuente de versión usada por el informe para cerrar el mapeo (ver §5).

**Evidencia en fuente (Twenty CRM):**

| CVE | Resultado de la revisión de fuente |
|---|---|
| CVE-2026-105763 (9.6, fuga de `connectedAccounts`) | **Patrón remediado presente.** La query GraphQL devuelve `ConnectedAccountPublicDTO`, que omite `connectionParameters` crudos (`OmitType`) y expone solo la forma pública construida por `buildPublicConnectionParameters`, que elimina `password` por protocolo (`const { password: _, ...publicParams }`). |
| CVE-2026-46624 (RCE vía `COPY TO PROGRAM`) | **Primitiva ausente.** No existe ningún `COPY TO` SQL en el código de la aplicación (búsqueda exhaustiva: solo coincidencias en comentarios de otro contexto). Sin esa primitiva, la cadena de RCE descrita no tiene punto de apoyo. |
| CVE-2026-73069 (SQLi vía metadata) | Sin verificación puntual en esta pasada — se propone validar en fase 2 autenticada. |
| CVE-2026-85055 (filtros ignoran permisos de campo) | Sin verificación puntual en esta pasada — candidato explícito para fase 2 (oráculo de datos). |
| CVE-2026-55583 (IDOR cross-workspace en chat IA) | Sin verificación puntual en esta pasada — candidato explícito para fase 2 (multi-tenant). |

**Dokploy (CVE-2026-24841, CVE-2026-72862, CVE-2026-72901, CVE-2026-24840, CVE-2025-53376/53375):** no verificables desde este repositorio. Acción: obtener la versión instalada (panel Dokploy o CLI en el host) y actualizar como mínimo a `≥0.29.13`. Dada la exposición pública (DEV-03), este punto es prioritario e independiente del código del CRM.

## 4. Endurecimientos adicionales aplicados (fuera del alcance del informe)

1. **Oráculo de enumeración de usuarios en login, eliminado.** Email inexistente y password incorrecta devolvían códigos distintos (`USER_NOT_FOUND` vs `FORBIDDEN`), visibles para el cliente en `extensions.subCode`. Ahora ambas rutas devuelven el error idéntico (`packages/twenty-server/src/engine/core-modules/auth/services/auth.service.ts`, `auth.resolver.ts`), sin nuevas cadenas i18n. Incluye 2 tests de regresión; suites `auth.service.spec` (7 tests) y `auth.resolver.spec` (11 tests) en verde, más `oxlint`, `oxfmt` y `tsgo --noEmit` limpios.
2. **Inventario obligatorio de endpoints públicos** (`packages/twenty-server/src/engine/guards/__tests__/public-endpoint-inventory.spec.ts`). Dado que `PublicEndpointGuard` es un marcador que siempre pasa, este test falla si aparece un endpoint público nuevo sin control compensatorio documentado. Superficie actual: 32 archivos, 16 con control verificado en esta pasada.
3. Verificado sin cambios necesarios: throttle existente en 2FA y tracking de campañas, tokens de verificación de 256 bits con expiración, firma de webhooks (Stripe/Svix/SNS delegada a drivers), y almacenamiento de archivos con doble validación de path.

## 5. Información solicitada para cerrar la verificación

1. TAG (o commit) de la imagen `happy/crm_happy` desplegada en el host auditado el 2026-10-26.
2. Valores de `SERVER_URL`, `FRONTEND_URL` y `AUTH_COOKIE_ALLOWED_ORIGINS` del environment Dokploy.
3. Versión instalada de Dokploy.
4. Confirmación y credenciales de prueba para la fase 2 autenticada (IDOR, multi-tenant, lógica de negocio), a ejecutar tras el redespliegue con DEV-01/DEV-02 atendidos.

## 6. Compromisos

- [ ] Commit + despliegue a dev de DEV-05 y los endurecimientos del §4, con retest en runtime.
- [x] Endurecimiento CORS fail-closed (omitir `Access-Control-Allow-Origin` en orígenes no permitidos), pendiente de commit + despliegue y retest.
- [x] Neutralización de branding extendida a `getPublicWorkspaceDataById` (misma clase de leak en DNS compartido), pendiente de commit + despliegue y retest.
- [ ] Cierre del puerto 3100 público + TLS válido + restricción de Dokploy **antes de producción** (bloqueantes, owner: infraestructura).
- [ ] Fase 2 autenticada con usuario de prueba (cubre CVE-2026-73069/85055/55583 pendientes).
