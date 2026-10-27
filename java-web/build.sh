#!/bin/bash
# ==============================================================================
# SmartMess Java Web Module Build Script (Servlets Web Application)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Resolve Java & Javac executable
if [ -n "$JAVA_HOME" ] && [ -x "$JAVA_HOME/bin/javac" ]; then
    JAVAC="$JAVA_HOME/bin/javac"
elif command -v /usr/libexec/java_home >/dev/null 2>&1; then
    JH="$(/usr/libexec/java_home 2>/dev/null || true)"
    if [ -n "$JH" ] && [ -x "$JH/bin/javac" ]; then
        JAVAC="$JH/bin/javac"
    else
        JAVAC="$(which javac || true)"
    fi
elif [ -x "/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/javac" ]; then
    JAVAC="/Library/Java/JavaVirtualMachines/jdk-22.jdk/Contents/Home/bin/javac"
else
    JAVAC="$(which javac || true)"
fi

if [ -z "$JAVAC" ]; then
    echo "❌ Error: javac not found. Please ensure JDK 17+ is installed."
    exit 1
fi

echo "======================================================================"
echo "🔨 COMPILING SMARTMESS JAVA WEB MODULE"
echo "   Compiler: $JAVAC"
echo "======================================================================"

mkdir -p target/classes exports

find src/main/java -name "*.java" > sources.txt
CP="lib/postgresql-42.7.3.jar:lib/javax.servlet-api-4.0.1.jar:lib/gson-2.10.1.jar"

"$JAVAC" -cp "$CP" -d target/classes -sourcepath src/main/java @sources.txt
rm -f sources.txt

echo "✅ Java Web compilation successful! Classes located in: $DIR/target/classes"
