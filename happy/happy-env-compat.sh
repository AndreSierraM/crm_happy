#!/bin/sh
# Happy CRM — compat dual HAPPY_* <-> legacy.
# Uso: source happy/happy-env-compat.sh
# Regla: si ambos definidos, gana el legacy (no rompe deploys existentes).
# Solo mapea el único env TWENTY_* real + las vars propias Happy.

# Único env TWENTY_* real en twenty-config
if [ -z "${ALLOW_REQUESTS_TO_TWENTY_ICONS:-}" ] && [ -n "${HAPPY_ALLOW_REQUESTS_TO_HAPPY_ICONS:-}" ]; then
  export ALLOW_REQUESTS_TO_TWENTY_ICONS="$HAPPY_ALLOW_REQUESTS_TO_HAPPY_ICONS"
fi
if [ -z "${HAPPY_ALLOW_REQUESTS_TO_HAPPY_ICONS:-}" ] && [ -n "${ALLOW_REQUESTS_TO_TWENTY_ICONS:-}" ]; then
  export HAPPY_ALLOW_REQUESTS_TO_HAPPY_ICONS="$ALLOW_REQUESTS_TO_TWENTY_ICONS"
fi

# Docker image: Happy por defecto, legacy como fallback explícito
if [ -z "${DOCKER_IMAGE:-}" ]; then
  export DOCKER_IMAGE="happy/crm_happy"
fi

# Licencias Happy: valores por defecto community (ver happy/.env.happy.example)
if [ -z "${HAPPY_EDITION:-}" ]; then
  export HAPPY_EDITION="community"
fi
