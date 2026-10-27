#!/bin/bash
# ==============================================================================
# SmartMess Java Web Module Runner Script
# Launches the pure Java Servlets Web Application on port 8080 (or custom port)
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

PORT="${1:-8080}"
echo "======================================================================"
echo "🌐 STARTING SMARTMESS JAVA WEB PORTAL ON PORT $PORT"
echo "   URL: http://localhost:$PORT/"
echo "   Powered 100% by Java Servlets & PostgreSQL JDBC"
echo "======================================================================"

"$JAVA" $JAVA_OPTS -cp "$CP" com.smartmess.web.EmbeddedWebContainer "$PORT"
