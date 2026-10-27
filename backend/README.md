# SmartMess Java Backend

A pure Java backend implementation for the Smart Campus Mess Management System:
- **Language**: Java 17+ / Java 22
- **Web API Layer**: Standard Java Servlets (`javax.servlet.http.HttpServlet`)
- **Database Engine**: PostgreSQL SQL Database (Neon Cloud / Local)
- **Database API Connector**: Pure JDBC (`java.sql.Connection`, `PreparedStatement`, ACID transactions)
- **Architecture**:
  - `com.smartmess.model`: OOP hierarchy (`AbstractUser`, `Student`, `Chef`, `Admin`, `Warden`, `MenuItem`, `BaseOrder`, `DineInOrder`, `RoomDeliveryOrder`, `OrderItem`)
  - `com.smartmess.db`: JDBC DAOs (`StudentDAO`, `MenuItemDAO`, `OrderDAO`, `DatabaseConnection`)
  - `com.smartmess.servlet`: `MenuServlet`, `OrderServlet`, `KitchenQueueServlet`, `OrderHistoryServlet`, `AuthServlet`
  - `com.smartmess.server`: `EmbeddedServletServer` (port 8080)
  - `com.smartmess.service`: `IMessService`, `MessServiceImpl`
  - `com.smartmess.concurrency`: `KitchenWorkerThread`, `AsyncAuditLogger`
  - `com.smartmess.exception`: Custom checked exceptions (`OutOfStockException`, `InsufficientCreditsException`, etc.)

## How to Build & Run
```bash
# Compile backend
bash build.sh

# Start embedded Java Servlet container on port 8080
bash run.sh

# Or run automated demonstration test suite
bash run.sh test
```
