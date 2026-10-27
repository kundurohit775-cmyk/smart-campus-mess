package com.smartmess.server;

import com.smartmess.service.IMessService;
import com.smartmess.service.MessServiceImpl;
import com.smartmess.servlet.AdminServlet;
import com.smartmess.servlet.AuthServlet;
import com.smartmess.servlet.CreditServlet;
import com.smartmess.servlet.KitchenQueueServlet;
import com.smartmess.servlet.MenuServlet;
import com.smartmess.servlet.OrderHistoryServlet;
import com.smartmess.servlet.OrderServlet;
import com.smartmess.servlet.PreOrderServlet;
import com.smartmess.servlet.SickLeaveServlet;
import com.smartmess.servlet.SustainabilityServlet;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import javax.servlet.ServletConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

/**
 * Demonstrates Java Servlets Runtime & Deployment:
 * Provides an embedded, zero-dependency HTTP server that mounts and routes HTTP requests
 * directly to standard Java HttpServlet instances:
 * - /                      -> WebPortalServlet (Dynamic HTML5/CSS Pure Java Web UI)
 * - /api/java/auth         -> AuthServlet (VIT email check & dual auth)
 * - /api/java/menu         -> MenuServlet (digital menu & stock toggles)
 * - /api/java/order        -> OrderServlet (atomic checkout, cancel, stepper update)
 * - /api/java/history      -> OrderHistoryServlet (student & campus ledger)
 * - /api/java/kitchen      -> KitchenQueueServlet (chef live FIFO queue)
 * - /api/java/preorders    -> PreOrderServlet (next-day special pre-orders)
 * - /api/java/sickleave    -> SickLeaveServlet (warden sick-leave delivery requests)
 * - /api/java/credits      -> CreditServlet (student wallet balance & Razorpay topup)
 * - /api/java/admin        -> AdminServlet (analytics, top 5 dishes, 9k reset)
 * - /api/java/impact       -> SustainabilityServlet (live food waste avoidance)
 * 
 * Enables immediate demonstration during Review 2 without requiring an external Apache Tomcat installation.
 */
public class EmbeddedServletServer {

    private final int port;
    private final IMessService messService;
    private HttpServer server;
    private java.util.concurrent.ExecutorService executor;

    public EmbeddedServletServer(int port, IMessService messService) {
        this.port = port;
        this.messService = messService;
    }

    public void start() throws IOException, ServletException {
        server = HttpServer.create(new InetSocketAddress(port), 0);

        // Instantiate Servlets
        AuthServlet authServlet = new AuthServlet(messService);
        MenuServlet menuServlet = new MenuServlet(messService);
        OrderServlet orderServlet = new OrderServlet(messService);
        OrderHistoryServlet historyServlet = new OrderHistoryServlet(messService);
        KitchenQueueServlet kitchenServlet = new KitchenQueueServlet(messService);
        PreOrderServlet preOrderServlet = new PreOrderServlet(messService);
        SickLeaveServlet sickLeaveServlet = new SickLeaveServlet(messService);
        CreditServlet creditServlet = new CreditServlet(messService);
        AdminServlet adminServlet = new AdminServlet(messService);
        SustainabilityServlet sustainabilityServlet = new SustainabilityServlet(messService);
        com.smartmess.web.WebPortalServlet webPortalServlet = new com.smartmess.web.WebPortalServlet(messService);

        // Mount Servlets on HTTP routes
        server.createContext("/", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/login", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/register", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/forgot-password", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/dashboard", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/logout", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/action", new ServletAdapterHandler(webPortalServlet));
        server.createContext("/api/java/auth", new ServletAdapterHandler(authServlet));
        server.createContext("/api/java/menu", new ServletAdapterHandler(menuServlet));
        server.createContext("/api/java/order", new ServletAdapterHandler(orderServlet));
        server.createContext("/api/java/history", new ServletAdapterHandler(historyServlet));
        server.createContext("/api/java/kitchen", new ServletAdapterHandler(kitchenServlet));
        server.createContext("/api/java/preorders", new ServletAdapterHandler(preOrderServlet));
        server.createContext("/api/java/sickleave", new ServletAdapterHandler(sickLeaveServlet));
        server.createContext("/api/java/credits", new ServletAdapterHandler(creditServlet));
        server.createContext("/api/java/admin", new ServletAdapterHandler(adminServlet));
        server.createContext("/api/java/impact", new ServletAdapterHandler(sustainabilityServlet));

        executor = java.util.concurrent.Executors.newFixedThreadPool(4, r -> {
            Thread t = new Thread(r, "EmbeddedServletWorker");
            t.setDaemon(true);
            return t;
        });
        server.setExecutor(executor);
        server.start();

        System.out.println("======================================================================");
        System.out.printf("🚀 SmartMess Java Servlet Container running at: http://localhost:%d%n", port);
        System.out.println("   Available Java Servlet Endpoints:");
        System.out.printf("   • GET  http://localhost:%d/                       (WebPortalServlet)%n", port);
        System.out.printf("   • POST http://localhost:%d/api/java/auth          (AuthServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/menu          (MenuServlet)%n", port);
        System.out.printf("   • POST http://localhost:%d/api/java/order         (OrderServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/history       (OrderHistoryServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/kitchen       (KitchenQueueServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/preorders     (PreOrderServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/sickleave     (SickLeaveServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/credits       (CreditServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/admin         (AdminServlet)%n", port);
        System.out.printf("   • GET  http://localhost:%d/api/java/impact        (SustainabilityServlet)%n", port);
        System.out.println("======================================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
        if (executor != null) {
            executor.shutdownNow();
        }
        System.out.println("SmartMess Java Servlet Container stopped.");
    }

    /**
     * Bridges Sun/Oracle HttpServer HttpExchange to standard javax.servlet.HttpServlet
     */
    private static class ServletAdapterHandler implements HttpHandler {
        private final HttpServlet servlet;

        public ServletAdapterHandler(HttpServlet servlet) {
            this.servlet = servlet;
        }

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            ByteArrayOutputStream responseBodyBuffer = new ByteArrayOutputStream();
            int[] statusCode = new int[]{200};
            Map<String, List<String>> responseHeaders = new HashMap<>();

            byte[] requestBodyBytes = exchange.getRequestBody().readAllBytes();

            // Parse Query Parameters
            Map<String, String[]> parameterMap = parseQueryParams(exchange.getRequestURI());

            // If POST form data, merge into parameterMap
            String contentTypeHeader = exchange.getRequestHeaders().getFirst("Content-Type");
            if (contentTypeHeader != null && contentTypeHeader.toLowerCase().contains("application/x-www-form-urlencoded")) {
                String formBody = new String(requestBodyBytes, StandardCharsets.UTF_8);
                mergeFormParameters(formBody, parameterMap);
            }

            // Build Proxy for HttpServletRequest
            HttpServletRequest requestProxy = (HttpServletRequest) Proxy.newProxyInstance(
                HttpServletRequest.class.getClassLoader(),
                new Class<?>[]{HttpServletRequest.class},
                new InvocationHandler() {
                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if (name.equals("getMethod")) return exchange.getRequestMethod();
                        if (name.equals("getRequestURI")) return exchange.getRequestURI().getPath();
                        if (name.equals("getRequestURL")) return new StringBuffer("http://localhost:" + exchange.getLocalAddress().getPort() + exchange.getRequestURI().getPath());
                        if (name.equals("getQueryString")) return exchange.getRequestURI().getQuery();
                        if (name.equals("getParameter")) {
                            String paramName = (String) args[0];
                            String[] vals = parameterMap.get(paramName);
                            return vals != null && vals.length > 0 ? vals[0] : null;
                        }
                        if (name.equals("getParameterMap")) return parameterMap;
                        if (name.equals("getParameterNames")) return Collections.enumeration(parameterMap.keySet());
                        if (name.equals("getParameterValues")) {
                            String paramName = (String) args[0];
                            return parameterMap.get(paramName);
                        }
                        if (name.equals("getHeader")) {
                            String headerName = (String) args[0];
                            return exchange.getRequestHeaders().getFirst(headerName);
                        }
                        if (name.equals("getHeaders")) {
                            String headerName = (String) args[0];
                            List<String> list = exchange.getRequestHeaders().get(headerName);
                            return list != null ? Collections.enumeration(list) : Collections.enumeration(Collections.emptyList());
                        }
                        if (name.equals("getHeaderNames")) {
                            return Collections.enumeration(exchange.getRequestHeaders().keySet());
                        }
                        if (name.equals("getCookies")) {
                            String cookieHeader = exchange.getRequestHeaders().getFirst("Cookie");
                            if (cookieHeader != null && !cookieHeader.isEmpty()) {
                                List<javax.servlet.http.Cookie> list = new ArrayList<>();
                                for (String pair : cookieHeader.split(";")) {
                                    String[] parts = pair.trim().split("=", 2);
                                    if (parts.length == 2) {
                                        list.add(new javax.servlet.http.Cookie(parts[0].trim(), parts[1].trim()));
                                    }
                                }
                                return list.toArray(new javax.servlet.http.Cookie[0]);
                            }
                            return new javax.servlet.http.Cookie[0];
                        }
                        if (name.equals("getReader")) {
                            return new BufferedReader(new InputStreamReader(new ByteArrayInputStream(requestBodyBytes), StandardCharsets.UTF_8));
                        }
                        if (name.equals("getInputStream")) {
                            return new javax.servlet.ServletInputStream() {
                                private final ByteArrayInputStream bais = new ByteArrayInputStream(requestBodyBytes);
                                @Override
                                public boolean isFinished() { return bais.available() == 0; }
                                @Override
                                public boolean isReady() { return true; }
                                @Override
                                public void setReadListener(javax.servlet.ReadListener readListener) {}
                                @Override
                                public int read() { return bais.read(); }
                            };
                        }
                        if (name.equals("getContentType")) return exchange.getRequestHeaders().getFirst("Content-Type");
                        if (name.equals("getCharacterEncoding")) return "UTF-8";
                        if (name.equals("getProtocol")) return "HTTP/1.1";
                        if (name.equals("getScheme")) return "http";
                        if (name.equals("getServerName")) return "localhost";
                        if (name.equals("getServerPort")) return exchange.getLocalAddress().getPort();
                        if (name.equals("getContextPath")) return "";
                        if (name.equals("getServletPath")) return exchange.getRequestURI().getPath();
                        if (name.equals("getPathInfo")) return null;
                        if (name.equals("getContentLength")) {
                            return requestBodyBytes.length;
                        }
                        if (name.equals("getContentLengthLong")) {
                            return (long) requestBodyBytes.length;
                        }

                        // Safeguard for any primitive return type to avoid NullPointerException unboxing
                        Class<?> returnType = method.getReturnType();
                        if (returnType.isPrimitive()) {
                            if (returnType == boolean.class) return false;
                            if (returnType == int.class) return 0;
                            if (returnType == long.class) return 0L;
                            if (returnType == double.class) return 0.0;
                            if (returnType == float.class) return 0.0f;
                            if (returnType == byte.class) return (byte) 0;
                            if (returnType == short.class) return (short) 0;
                            if (returnType == char.class) return '\0';
                        }
                        return null;
                    }
                }
            );

            // Build Proxy for HttpServletResponse
            HttpServletResponse responseProxy = (HttpServletResponse) Proxy.newProxyInstance(
                HttpServletResponse.class.getClassLoader(),
                new Class<?>[]{HttpServletResponse.class},
                new InvocationHandler() {
                    private PrintWriter writer;

                    @Override
                    public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
                        String name = method.getName();
                        if (name.equals("setStatus")) {
                            statusCode[0] = (int) args[0];
                            return null;
                        }
                        if (name.equals("getStatus")) return statusCode[0];
                        if (name.equals("setContentType")) {
                            responseHeaders.computeIfAbsent("Content-Type", k -> new ArrayList<>()).add((String) args[0]);
                            return null;
                        }
                        if (name.equals("setHeader")) {
                            List<String> list = new ArrayList<>();
                            list.add((String) args[1]);
                            responseHeaders.put((String) args[0], list);
                            return null;
                        }
                        if (name.equals("addHeader")) {
                            responseHeaders.computeIfAbsent((String) args[0], k -> new ArrayList<>()).add((String) args[1]);
                            return null;
                        }
                        if (name.equals("addCookie")) {
                            javax.servlet.http.Cookie c = (javax.servlet.http.Cookie) args[0];
                            StringBuilder sb = new StringBuilder();
                            sb.append(c.getName()).append("=").append(c.getValue()).append("; Path=/; HttpOnly");
                            if (c.getMaxAge() >= 0) {
                                sb.append("; Max-Age=").append(c.getMaxAge());
                            }
                            responseHeaders.computeIfAbsent("Set-Cookie", k -> new ArrayList<>()).add(sb.toString());
                            return null;
                        }
                        if (name.equals("sendRedirect")) {
                            statusCode[0] = 302;
                            List<String> list = new ArrayList<>();
                            list.add((String) args[0]);
                            responseHeaders.put("Location", list);
                            return null;
                        }
                        if (name.equals("getOutputStream")) {
                            return new javax.servlet.ServletOutputStream() {
                                @Override
                                public boolean isReady() { return true; }
                                @Override
                                public void setWriteListener(javax.servlet.WriteListener writeListener) {}
                                @Override
                                public void write(int b) { responseBodyBuffer.write(b); }
                            };
                        }
                        if (name.equals("getWriter")) {
                            if (writer == null) {
                                writer = new PrintWriter(new OutputStreamWriter(responseBodyBuffer, StandardCharsets.UTF_8), true);
                            }
                            return writer;
                        }
                        if (name.equals("setCharacterEncoding")) return null;
                        if (name.equals("flushBuffer")) {
                            if (writer != null) writer.flush();
                            return null;
                        }

                        Class<?> returnType = method.getReturnType();
                        if (returnType.isPrimitive()) {
                            if (returnType == boolean.class) return false;
                            if (returnType == int.class) return 0;
                            if (returnType == long.class) return 0L;
                        }
                        return null;
                    }
                }
            );

            try {
                // Delegate to HttpServlet service() method
                servlet.service(requestProxy, responseProxy);
            } catch (Throwable e) {
                e.printStackTrace();
                statusCode[0] = 500;
                responseBodyBuffer.reset();
                responseBodyBuffer.write(("{\"error\":\"" + e.getMessage() + "\"}").getBytes(StandardCharsets.UTF_8));
            }

            // Transfer response headers to HttpExchange
            for (Map.Entry<String, List<String>> header : responseHeaders.entrySet()) {
                exchange.getResponseHeaders().put(header.getKey(), header.getValue());
            }

            // CORS headers for easy local testing
            exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
            exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");

            byte[] responseBytes = responseBodyBuffer.toByteArray();
            exchange.sendResponseHeaders(statusCode[0], responseBytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(responseBytes);
            }
        }

        private Map<String, String[]> parseQueryParams(URI uri) {
            Map<String, String[]> params = new HashMap<>();
            String query = uri.getQuery();
            if (query != null) {
                for (String param : query.split("&")) {
                    String[] pair = param.split("=", 2);
                    String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8);
                    String val = pair.length > 1 ? URLDecoder.decode(pair[1], StandardCharsets.UTF_8) : "";
                    params.put(key, new String[]{val});
                }
            }
            return params;
        }

        private void mergeFormParameters(String formBody, Map<String, String[]> params) {
            if (formBody != null && !formBody.trim().isEmpty()) {
                for (String param : formBody.split("&")) {
                    String[] pair = param.split("=", 2);
                    if (pair.length > 0 && !pair[0].isEmpty()) {
                        String key = URLDecoder.decode(pair[0], StandardCharsets.UTF_8);
                        String val = pair.length > 1 ? URLDecoder.decode(pair[1], StandardCharsets.UTF_8) : "";
                        params.put(key, new String[]{val});
                    }
                }
            }
        }
    }

    public static void main(String[] args) {
        try {
            int port = 8080;
            if (args.length > 0) {
                try { port = Integer.parseInt(args[0]); } catch (Exception ignored) {}
            }
            IMessService service = new MessServiceImpl();
            EmbeddedServletServer server = new EmbeddedServletServer(port, service);
            server.start();

            Runtime.getRuntime().addShutdownHook(new Thread(server::stop));
            System.out.println("Press Ctrl+C to terminate the servlet server.");
            Thread.currentThread().join();
        } catch (InterruptedException e) {
            System.out.println("Servlet server shutting down.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
