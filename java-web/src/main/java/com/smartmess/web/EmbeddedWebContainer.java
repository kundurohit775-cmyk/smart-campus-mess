package com.smartmess.web;

import com.smartmess.server.EmbeddedServletServer;
import com.smartmess.service.IMessService;
import com.smartmess.service.MessServiceImpl;

/**
 * Entry point to launch the SmartMess Java Web Application.
 * Boots the embedded Java Servlet container on port 8080.
 */
public class EmbeddedWebContainer {

    public static void main(String[] args) {
        int port = 8080;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (Exception ignored) {}
        }

        try {
            IMessService service = new MessServiceImpl();
            EmbeddedServletServer server = new EmbeddedServletServer(port, service);
            server.start();

            System.out.println("======================================================================");
            System.out.printf("🌐 SMARTMESS JAVA WEB PORTAL RUNNING AT: http://localhost:%d/%n", port);
            System.out.println("   Open this URL in any browser (Chrome, Safari, Edge) to view the portal.");
            System.out.println("   Powered 100% by Java Servlets & PostgreSQL JDBC (Zero JavaScript).");
            System.out.println("======================================================================");

            Thread.currentThread().join();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
