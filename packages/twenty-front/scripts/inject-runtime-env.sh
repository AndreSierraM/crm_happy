#!/bin/sh

if [ -z "$REACT_APP_SERVER_BASE_URL" ]; then
  echo "Error: REACT_APP_SERVER_BASE_URL is not set."
  exit 1
fi

echo "Injecting runtime environment variables into index.html..."

CONFIG_BLOCK=$(cat << EOF
    <script id="twenty-env-config" data-happy-env-config="true">
      window._env_ = {
        REACT_APP_SERVER_BASE_URL: "$REACT_APP_SERVER_BASE_URL"
      };
    </script>
    <!-- END: Happy CRM Config (legacy alias: Twenty Config) -->
EOF
)
# Use sed to replace the config block in index.html
# Matches both BEGIN markers for Happy/legacy compat (any <!-- BEGIN: ... --> form)
echo "$CONFIG_BLOCK" | sed -i.bak '
  /<!-- BEGIN:/,/<!-- END:/{
    /<!-- BEGIN:/!{
      /<!-- END:/!d
    }
    /<!-- BEGIN:/r /dev/stdin
    /<!-- END:/d
  }
' build/index.html
rm -f build/index.html.bak
