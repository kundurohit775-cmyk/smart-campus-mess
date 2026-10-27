# SmartMess JavaFX Frontend

A pure Java desktop frontend GUI application for the Smart Campus Mess Management System:
- **GUI Toolkit**: JavaFX 22 (macOS Apple Silicon bundled JARs)
- **Architecture**:
  - `com.smartmess.gui`: `SmartMessFXApp`, `SmartMessFXLauncher`
  - `com.smartmess.client`: `ServletApiClient` (Java 11+ HttpClient communicating with Java Servlets over HTTP)
  - Interactive Tabs:
    1. 🍽️ **Menu & Tray Order**: Live menu from `MenuServlet`, category filter, healthy filter, meal tray, pickup vs room delivery, order placement via `OrderServlet`.
    2. 👨‍🍳 **Kitchen Live Queue**: Live FIFO queue from `KitchenQueueServlet`, advance cooking button.
    3. 📜 **Order History & CSV**: History table and 1-click CSV download via `OrderHistoryServlet`.
    4. ⚡ **Architecture & JDBC Diagnostics**: Live ping tests for servlets and PostgreSQL database.

## How to Build & Run
```bash
# Compile JavaFX frontend
bash build.sh

# Launch the desktop application
bash run.sh
```
