# SmartMess Java Web Application

A pure Java Web application running on standard Java Servlets:
- **Language**: Java 17+ / Java 22
- **Web Interface**: Rendered dynamically by `WebPortalServlet` (extending `javax.servlet.http.HttpServlet`)
- **Database Engine**: PostgreSQL SQL Database (Neon Cloud)
- **Database Connector**: Pure JDBC (`java.sql.Connection`, `PreparedStatement`, ACID transactions)
- **Zero JavaScript**: No Node.js, no React, no npm packages. Pure Java Servlets serving HTML5 & CSS.

## How to Build & Run
```bash
# Compile Java Web Application
bash build.sh

# Start Web Server on port 8080
bash run.sh
```
Then open [http://localhost:8080/](http://localhost:8080/) in any browser (Chrome, Safari, Edge).
