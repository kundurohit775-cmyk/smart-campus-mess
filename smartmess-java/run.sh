#!/bin/bash
# ==============================================================================
# SmartMess Java Module Runner Script
# Runs the full Review 2 Demonstration Suite or Embedded Servlet Server
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Resolve Java executable
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA="$JAVA_HOME/bin/java"
elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JH="$(/usr/libexec/java_home 2>/dev/null || true)"
    if [ -n "$JH" ] && [ -x "$JH/bin/java" ]; then
        JAVA="$JH/bin/java"
    else
        JAVA="$(which java || true)"
    fi
else
    JAVA="$(which java || true)"
fi

if [ ! -d "target/classes" ]; then
    echo "Class files not found. Running build.sh first..."
    bash ./build.sh
fi

CP="target/classes:lib/postgresql-42.7.3.jar:lib/javax.servlet-api-4.0.1.jar:lib/gson-2.10.1.jar"
JAVA_OPTS="--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED"

if [ "$1" = "server" ] || [ "$1" = "servlets" ]; then
    PORT="${2:-8080}"
    echo "Starting Embedded SmartMess Java Servlet Container on port $PORT..."
    "$JAVA" $JAVA_OPTS -cp "$CP" com.smartmess.server.EmbeddedServletServer "$PORT"
else
    "$JAVA" $JAVA_OPTS -cp "$CP" com.smartmess.SmartMessApp "$@"
fi
