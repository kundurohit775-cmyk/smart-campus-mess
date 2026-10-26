#!/bin/bash
# ==============================================================================
# SmartMess Java Module Build Script
# Compiles all Java source files using JDK and local library JARs
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Resolve Java & Javac executable
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    JAVAC="$JAVA_HOME/bin/javac"
    JAVA="$JAVA_HOME/bin/java"
elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JH="$(/usr/libexec/java_home 2>/dev/null || true)"
    if [ -n "$JH" ] && [ -x "$JH/bin/javac" ]; then
        JAVAC="$JH/bin/javac"
        JAVA="$JH/bin/java"
    else
        JAVAC="$(which javac || true)"
        JAVA="$(which java || true)"
    fi
else
    JAVAC="$(which javac || true)"
    JAVA="$(which java || true)"
fi

if [ -z "$JAVAC" ]; then
    echo "❌ Error: javac not found. Please ensure JDK 17+ is installed."
    exit 1
fi

echo "======================================================================"
echo "🔨 COMPILING SMARTMESS JAVA MODULE"
echo "   Compiler: $JAVAC"
echo "======================================================================"

# Prepare target directory
mkdir -p target/classes exports

# Find all Java source files
SOURCES=$(find src/main/java -name "*.java")
CP="lib/postgresql-42.7.3.jar:lib/javax.servlet-api-4.0.1.jar:lib/gson-2.10.1.jar"

"$JAVAC" -cp "$CP" -d target/classes -sourcepath src/main/java $SOURCES

echo "✅ Compilation successful! Class files compiled to: $DIR/target/classes"
