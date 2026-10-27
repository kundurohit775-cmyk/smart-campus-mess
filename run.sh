#!/bin/bash
# ==============================================================================
# SmartMess - Universal Pure Java Runner Script
# Supports: JavaFX Desktop GUI, Java Servlets Container, or Full Build
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Resolve JDK 22 / Java executable
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/java" ]; then
    JAVA="$JAVA_HOME/bin/java"
elif [ -x "/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/java" ]; then
    export JAVA_HOME="/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home"
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

MODE="${1:-javafx}"

case "$MODE" in
    javafx|gui|desktop)
        echo "======================================================================"
        echo "🚀 Launching SmartMess JavaFX 22 Desktop Application..."
        echo "======================================================================"
        cd frontend
        bash ./run.sh
        ;;
    web|servlet|server)
        echo "======================================================================"
        echo "🌐 Launching SmartMess Java Servlet Container on http://localhost:8080..."
        echo "======================================================================"
        cd java-web
        bash ./run.sh
        ;;
    build|compile)
        echo "======================================================================"
        echo "🔨 Compiling all pure Java modules..."
        echo "======================================================================"
        bash backend/build.sh
        bash java-web/build.sh
        bash frontend/build.sh
        bash smartmess-java/build.sh
        echo "✅ All pure Java modules compiled successfully!"
        ;;
    *)
        echo "Usage: $0 [javafx | web | build]"
        echo "  javafx - Launch the JavaFX 22 Desktop GUI (Default)"
        echo "  web    - Launch the embedded Java Servlet Web Container (http://localhost:8080)"
        echo "  build  - Compile all Java modules"
        exit 1
        ;;
esac
