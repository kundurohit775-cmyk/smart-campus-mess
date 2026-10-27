#!/bin/bash
# ==============================================================================
# SmartMess Backend Runner Script (Core Java & Servlets)
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
elif [ -x "/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/java" ]; then
    JAVA="/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/java"
else
    JAVA="$(which java || true)"
fi

if [ ! -d "target/classes" ]; then
    echo "Class files not found. Running build.sh first..."
    bash ./build.sh
fi

CP="target/classes:lib/*"
JAVA_OPTS="--add-opens java.base/java.time=ALL-UNNAMED --add-opens java.base/java.lang=ALL-UNNAMED"

if [ "$1" = "test" ] || [ "$1" = "demo" ]; then
    echo "======================================================================"
    echo "🧪 RUNNING SMARTMESS JAVA BACKEND VERIFICATION SUITE"
    echo "======================================================================"
    "$JAVA" $JAVA_OPTS -cp "$CP" com.smartmess.SmartMessApp "${@:2}"
else
    PORT="${1:-8080}"
    echo "======================================================================"
    echo "🚀 STARTING SMARTMESS JAVA SERVLET CONTAINER ON PORT $PORT"
    echo "   Endpoints: /api/java/menu, /api/java/order, /api/java/kitchen, /api/java/history"
    echo "======================================================================"
    "$JAVA" $JAVA_OPTS -cp "$CP" com.smartmess.server.EmbeddedServletServer "$PORT"
fi
