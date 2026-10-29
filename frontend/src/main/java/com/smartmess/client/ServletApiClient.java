package com.smartmess.client;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.smartmess.model.MenuItem;
import com.smartmess.model.OrderItem;
import com.smartmess.util.GsonHelper;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * JavaFX Frontend HTTP Client for SmartMess Java Servlets.
 * Connects the JavaFX Desktop GUI to the backend Java Servlets via HTTP:
 * - GET  /api/java/menu       (MenuServlet)
 * - POST /api/java/order      (OrderServlet)
 * - GET  /api/java/kitchen    (KitchenQueueServlet)
 * - POST /api/java/kitchen    (KitchenQueueServlet)
 * - GET  /api/java/history    (OrderHistoryServlet)
 */
public class ServletApiClient {

    private final String baseUrl;
    private final HttpClient httpClient;
    private final Gson gson;

    public ServletApiClient() {
        this("http://localhost:8080");
    }

    public ServletApiClient(String baseUrl) {
        this.baseUrl = baseUrl.replaceAll("/+$", "");
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        this.gson = GsonHelper.getGson();
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    /**
     * Checks if the Java Servlet server is active and responding.
     */
    public boolean isServerAvailable() {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/java/menu"))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Calls MenuServlet: GET /api/java/menu
     */
    public List<MenuItem> fetchMenu(String category, boolean healthyOnly) throws IOException, InterruptedException {
        StringBuilder query = new StringBuilder("?");
        if (category != null && !category.isEmpty() && !"All".equalsIgnoreCase(category)) {
            query.append("category=").append(URLEncoder.encode(category, StandardCharsets.UTF_8)).append("&");
        }
        if (healthyOnly) {
            query.append("healthy=true&");
        }

        String url = baseUrl + "/api/java/menu" + (query.length() > 1 ? query.substring(0, query.length() - 1) : "");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("Failed to fetch menu from servlet. HTTP Status: " + response.statusCode());
        }

        JsonObject root = gson.fromJson(response.body(), JsonObject.class);
        List<MenuItem> items = new ArrayList<>();
        if (root.has("items")) {
            JsonArray arr = root.getAsJsonArray("items");
            for (JsonElement el : arr) {
                MenuItem item = gson.fromJson(el, MenuItem.class);
                items.add(item);
            }
        }
        return items;
    }

    /**
     * Calls OrderServlet: POST /api/java/order
     */
    public JsonObject placeOrder(int studentId, List<OrderItem> items, boolean isRoomDelivery, String deliveryAddress)
            throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("studentId", studentId);
        payload.addProperty("deliveryType", isRoomDelivery ? "hostel-delivery" : "self-pickup");
        if (isRoomDelivery && deliveryAddress != null) {
            payload.addProperty("deliveryAddress", deliveryAddress);
        }

        JsonArray itemsArray = new JsonArray();
        for (OrderItem item : items) {
            JsonObject itemObj = new JsonObject();
            itemObj.addProperty("itemId", item.getItemId());
            itemObj.addProperty("itemName", item.getItemName());
            itemObj.addProperty("quantity", item.getQuantity());
            itemObj.addProperty("price", item.getPrice());
            itemsArray.add(itemObj);
        }
        payload.add("items", itemsArray);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/order"))
                .timeout(Duration.ofSeconds(8))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls KitchenQueueServlet: GET /api/java/kitchen
     */
    public JsonObject fetchKitchenQueue() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/kitchen"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls KitchenQueueServlet: POST /api/java/kitchen
     * Advances the FIFO queue to prepare the next meal ticket.
     */
    public JsonObject advanceKitchenQueue() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/kitchen"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls OrderHistoryServlet: GET /api/java/history?studentId=...
     */
    public JsonObject fetchOrderHistory(int studentId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/history?studentId=" + studentId))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls OrderHistoryServlet: GET /api/java/history?studentId=...&format=csv
     * Retrieves the downloadable CSV report directly from the servlet.
     */
    public String downloadOrderHistoryCsv(int studentId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/history?studentId=" + studentId + "&format=csv"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "text/csv")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return response.body();
    }

    /**
     * Calls OrderServlet: POST /api/java/order with action="cancel"
     */
    public JsonObject cancelOrder(int orderId, int studentId) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "cancel");
        payload.addProperty("orderId", orderId);
        payload.addProperty("studentId", studentId);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/order"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls OrderServlet: POST /api/java/order with action="status_update"
     */
    public JsonObject updateOrderStatus(int orderId, String newStatus) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "status_update");
        payload.addProperty("orderId", orderId);
        payload.addProperty("status", newStatus);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/order"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls MenuServlet: POST /api/java/menu with action="toggle_stock"
     */
    public JsonObject toggleStock(int itemId, boolean inStock) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "toggle_stock");
        payload.addProperty("itemId", itemId);
        payload.addProperty("inStock", inStock);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/menu"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls PreOrderServlet: GET /api/java/preorders?studentId=...
     */
    public JsonObject fetchPreOrders(int studentId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/preorders?studentId=" + studentId))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls PreOrderServlet: POST /api/java/preorders
     */
    public JsonObject placePreOrder(int studentId, String studentName, int itemId, String itemName,
                                    String mealType, String pickupSlot) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("studentId", studentId);
        payload.addProperty("studentName", studentName);
        payload.addProperty("itemId", itemId);
        payload.addProperty("itemName", itemName);
        payload.addProperty("mealType", mealType);
        payload.addProperty("pickupSlot", pickupSlot);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/preorders"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls SickLeaveServlet: GET /api/java/sickleave
     */
    public JsonObject fetchSickLeaveRequests() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/sickleave"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls SickLeaveServlet: POST /api/java/sickleave (Submit request)
     */
    public JsonObject submitSickLeaveRequest(int studentId, String studentName, String hostelRoom,
                                             String reason, String mealType) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "submit");
        payload.addProperty("studentId", studentId);
        payload.addProperty("studentName", studentName);
        payload.addProperty("hostelRoom", hostelRoom);
        payload.addProperty("reason", reason);
        payload.addProperty("mealType", mealType);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/sickleave"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls SickLeaveServlet: POST /api/java/sickleave (Warden Review)
     */
    public JsonObject reviewSickLeaveRequest(int requestId, String decision, String reviewedBy)
            throws IOException, InterruptedException {
        return reviewSickLeaveRequest(requestId, decision, reviewedBy, "");
    }

    public JsonObject reviewSickLeaveRequest(int requestId, String decision, String reviewedBy, String rejectionReason)
            throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "review");
        payload.addProperty("requestId", requestId);
        payload.addProperty("decision", decision);
        payload.addProperty("reviewedBy", reviewedBy);
        payload.addProperty("rejectionReason", rejectionReason != null ? rejectionReason : "");

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/sickleave"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls OrderServlet: POST /api/java/order with action="set_prep_time"
     */
    public JsonObject updateOrderPrepTime(int orderId, int minutes, String activity) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "set_prep_time");
        payload.addProperty("orderId", orderId);
        payload.addProperty("prepMinutes", minutes);
        payload.addProperty("chefActivity", activity);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/order"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls CreditServlet: GET /api/java/credits?studentId=...
     */
    public JsonObject fetchCredits(int studentId) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/credits?studentId=" + studentId))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls CreditServlet: POST /api/java/credits (Razorpay Top-up)
     */
    public JsonObject topUpCredits(int studentId, double amount, String paymentId) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("studentId", studentId);
        payload.addProperty("amount", amount);
        payload.addProperty("paymentId", paymentId);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/credits"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls AdminServlet: GET /api/java/admin (Analytics & Top 5 Dishes)
     */
    public JsonObject fetchAdminAnalytics() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/admin"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls AdminServlet: POST /api/java/admin (Reset Credits)
     */
    public JsonObject resetStudentCredits(double amount) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("action", "reset_credits");
        payload.addProperty("amount", amount);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/admin"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls SustainabilityServlet: GET /api/java/impact
     */
    public JsonObject fetchSustainabilityMetrics() throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/impact"))
                .timeout(Duration.ofSeconds(5))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }

    /**
     * Calls AuthServlet: POST /api/java/auth (Dual Auth + VIT domain check)
     */
    public JsonObject authenticate(String email, String password, String otp) throws IOException, InterruptedException {
        JsonObject payload = new JsonObject();
        payload.addProperty("email", email);
        payload.addProperty("password", password);
        payload.addProperty("otp", otp);

        String jsonBody = gson.toJson(payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/java/auth"))
                .timeout(Duration.ofSeconds(6))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        return gson.fromJson(response.body(), JsonObject.class);
    }
}
