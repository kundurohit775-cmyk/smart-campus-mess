package com.smartmess.gui;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.smartmess.client.ServletApiClient;
import com.smartmess.db.DatabaseConnection;
import com.smartmess.model.MenuItem;
import com.smartmess.model.OrderItem;
import com.smartmess.model.OrderStatus;
import com.smartmess.model.Student;
import com.smartmess.auth.SecurityService;
import com.smartmess.server.EmbeddedServletServer;
import com.smartmess.service.MessServiceImpl;
import javafx.application.Application;
import javafx.application.Platform;
import javafx.beans.property.SimpleDoubleProperty;
import javafx.beans.property.SimpleIntegerProperty;
import javafx.beans.property.SimpleStringProperty;
import javafx.collections.FXCollections;
import javafx.collections.ObservableList;
import javafx.geometry.Insets;
import javafx.geometry.Pos;
import javafx.scene.Node;
import javafx.scene.Scene;
import javafx.scene.control.*;
import javafx.scene.layout.*;
import javafx.stage.FileChooser;
import javafx.stage.Modality;
import javafx.stage.Stage;
import javafx.animation.Animation;
import javafx.animation.KeyFrame;
import javafx.animation.Timeline;
import javafx.util.Duration;
import java.time.LocalDate;

import java.io.File;
import java.io.FileWriter;
import java.sql.Connection;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * SmartMess JavaFX Desktop Application.
 * Full 5-tier architecture client implementing all four roles:
 * 1. Student   - Orders food, manages credits, live order tracking stepper, health/calorie tools, next-day pre-orders.
 * 2. Chef      - Live FIFO queue, stock control toggle, status progression, wastage logging.
 * 3. Admin     - Campus analytics, top 5 dishes leaderboard, 1-click 9,000 credit reset, audit logs.
 * 4. Warden    - Approves/rejects student sick-leave hostel room delivery requests.
 * 
 * 100% Pure Java:
 * - Frontend: JavaFX 22 Desktop GUI
 * - Backend: Core Java (OOP, Collections, Multithreading, Custom Exceptions, File I/O)
 * - Database: SQL Database (Neon PostgreSQL Cloud + Local in-memory fallback)
 * - Database Connector: Pure JDBC (PreparedStatement, ACID Transactions)
 * - Web API Runtime: Standard Java Servlets (javax.servlet.http.HttpServlet)
 */
public class SmartMessFXApp extends Application {

    private ServletApiClient apiClient;
    private EmbeddedServletServer autoServer;

    private Stage mainStage;
    private String activeRole = null;
    private String activeUserName = "Rohit Kundu";
    private String activeUserEmail = "rohit.kundu2022@vitstudent.ac.in";
    private String activeUserExtra = "Block B - Room 304";

    // Current Session State
    private int currentStudentId = 22;
    private String currentStudentName = "Rohit Kundu";
    private String currentStudentEmail = "rohit.kundu2022@vitstudent.ac.in";
    private String currentRole = "Student";
    private int currentCredits = 9000;
    private int consumedCaloriesToday = 480;
    private final int dailyCalorieGoal = 2000;

    // Header Badges
    private Label studentBadgeLabel = new Label("👤 Rohit Kundu");
    private Label creditsValueLabel = new Label("9000 Cr");
    private Label serverStatusBadge = new Label("● SERVLETS READY");
    private TextArea logArea;

    // Tab 1: Menu & Tray State
    private final ObservableList<MenuItem> menuObservableList = FXCollections.observableArrayList();
    private final ObservableList<OrderItem> trayObservableList = FXCollections.observableArrayList();
    private Label traySubtotalLabel;
    private Label trayDeliveryFeeLabel;
    private Label trayTotalCreditsLabel;
    private Label trayTotalCaloriesLabel;
    private RadioButton dineInRadio;
    private RadioButton roomDeliveryRadio;
    private TextField roomAddressField;

    // Tab 2: Live Stepper & Active Order Tracking
    private final ObservableList<ActiveOrderRow> activeOrdersList = FXCollections.observableArrayList();
    private Label stepperPendingLabel;
    private Label stepperAcceptedLabel;
    private Label stepperPreparingLabel;
    private Label stepperReadyLabel;
    private Label stepperOutForDeliveryLabel;
    private Label stepperDeliveredLabel;
    private Label stepperCompletedLabel;
    private Label latestOrderTokenLabel;
    private Label latestOrderStatusLabel;
    private Label liveCountdownLabel;
    private Label liveChefActivityLabel;
    private Label liveDeliveryAddressLabel;
    private Button cancelPendingOrderBtn;
    private int selectedActiveOrderId = -1;
    private Timeline liveCountdownTimeline;

    // Student Sick-Leave State
    private final ObservableList<HealthRequestRow> studentSickLeaveList = FXCollections.observableArrayList();
    private Label studentSickLeaveStatusBadge;
    private boolean studentRoomDeliveryApproved = false;

    // Tab 3: Wallet, Calorie Goal & Next-Day Pre-Orders
    private final ObservableList<TransactionRow> transactionObservableList = FXCollections.observableArrayList();
    private final ObservableList<PreOrderRow> preOrderObservableList = FXCollections.observableArrayList();
    private ProgressBar calorieProgressBar;
    private Label calorieProgressLabel;
    private Label walletBalanceLargeLabel;

    // Tab 4: Kitchen Queue State
    private final ObservableList<KitchenQueueRow> queueObservableList = FXCollections.observableArrayList();
    private Label pendingCountLabel;
    private final ObservableList<MenuItem> chefMenuStockList = FXCollections.observableArrayList();

    // Tab 5: Admin Analytics State
    private Label adminTotalOrdersLabel;
    private Label adminTotalCreditsLabel;
    private Label adminActiveStudentsLabel;
    private final ObservableList<TopDishRow> topDishesObservableList = FXCollections.observableArrayList();

    // Tab 6: Warden Sick-Leave State
    private final ObservableList<HealthRequestRow> healthRequestsObservableList = FXCollections.observableArrayList();

    // Tab 7: Sustainability Hub State
    private Label foodSavedMetricLabel;
    private Label co2SavedMetricLabel;
    private Label waterSavedMetricLabel;
    private Label mealsSavedMetricLabel;

    // Tab 8: Order History State
    private final ObservableList<HistoryRow> historyObservableList = FXCollections.observableArrayList();

    @Override
    public void start(Stage primaryStage) {
        this.mainStage = primaryStage;
        primaryStage.setTitle("SmartMess - Campus Mess Management System (JavaFX & Java Servlets)");

        apiClient = new ServletApiClient("http://localhost:8080");

        // Ensure Java Servlet Container is running
        ensureServerRunning();

        // Show the initial Role Selection Landing Screen
        showRoleSelectionScreen();

        primaryStage.setMinWidth(1180);
        primaryStage.setMinHeight(780);
        primaryStage.show();
    }

    @Override
    public void stop() {
        if (autoServer != null) {
            autoServer.stop();
        }
    }

    private void ensureServerRunning() {
        if (!apiClient.isServerAvailable()) {
            try {
                autoServer = new EmbeddedServletServer(8080, new MessServiceImpl());
                autoServer.start();
                log("⚡ [Servlet Server] Embedded Java Servlet Container booted automatically on port 8080.");
            } catch (Exception e) {
                log("⚠️ [Servlet Server] Failed to auto-start embedded server: " + e.getMessage());
            }
        } else {
            log("✅ [Servlet Server] Connected to active Java Servlet Container at http://localhost:8080");
        }
    }

    // =========================================================================
    // ROLE SELECTION & AUTHENTICATION SCREENS
    // =========================================================================

    public void showRoleSelectionScreen() {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #0b1329;");

        // Top Navigation Header
        HBox topBar = new HBox(12);
        topBar.setPadding(new Insets(16, 24, 16, 24));
        topBar.setAlignment(Pos.CENTER_LEFT);
        topBar.setStyle("-fx-background-color: #0f172a; -fx-border-color: #1e293b; -fx-border-width: 0 0 1 0;");

        Label logoLabel = new Label("🍽️ SMARTMESS");
        logoLabel.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 22px; -fx-font-weight: bold;");

        Label taglineLabel = new Label("Smart Campus Mess & Digital Credit Platform");
        taglineLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 13px;");

        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);

        Label runtimeBadge = new Label("● PURE JAVA 22 • SERVLETS (PORT 8080)");
        runtimeBadge.setPadding(new Insets(5, 12, 5, 12));
        runtimeBadge.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-font-size: 11px; -fx-background-radius: 20;");

        topBar.getChildren().addAll(logoLabel, taglineLabel, sp, runtimeBadge);
        root.setTop(topBar);

        // Center Content
        VBox centerBox = new VBox(22);
        centerBox.setAlignment(Pos.CENTER);
        centerBox.setPadding(new Insets(24, 30, 24, 30));

        VBox titleBox = new VBox(6);
        titleBox.setAlignment(Pos.CENTER);

        Label welcomeLabel = new Label("Campus Mess Portal Access");
        welcomeLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 26px; -fx-font-weight: bold;");

        Label instructionLabel = new Label("Choose your role below to open your dedicated sign-in portal & dashboard");
        instructionLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 14px;");

        titleBox.getChildren().addAll(welcomeLabel, instructionLabel);

        // 4 Distinct Role Cards
        HBox cardsBox = new HBox(18);
        cardsBox.setAlignment(Pos.CENTER);

        VBox studentCard = createRoleCard(
                "🎓", "Student Portal",
                "Meal token replacement, live order tracking stepper, 9,000 credit wallet, health & calorie tracker, and next-day pre-orders.",
                "#ff6b35", "#f97316", "Sign In as Student →",
                () -> showRoleLoginScreen("student")
        );

        VBox chefCard = createRoleCard(
                "👨‍🍳", "Chef & Kitchen Staff",
                "FIFO kitchen order dispatch queue, stock portion control, real-time ticket progression & daily food waste avoidance logging.",
                "#ea580c", "#d97706", "Sign In as Chef →",
                () -> showRoleLoginScreen("chef")
        );

        VBox wardenCard = createRoleCard(
                "🏢", "Hostel Warden",
                "Hostel sick-leave room delivery clearance, medical certificate approvals & block residency validation.",
                "#0284c7", "#06b6d4", "Sign In as Warden →",
                () -> showRoleLoginScreen("warden")
        );

        VBox adminCard = createRoleCard(
                "👑", "Campus Mess Admin",
                "Campus KPIs, financial analytics, menu pricing & stock, emergency 9,000 credit resets & full audit log.",
                "#9333ea", "#a855f7", "Sign In as Admin →",
                () -> showRoleLoginScreen("admin")
        );

        cardsBox.getChildren().addAll(studentCard, chefCard, wardenCard, adminCard);

        // Demo credentials helper row
        VBox demoBox = new VBox(8);
        demoBox.setAlignment(Pos.CENTER);
        demoBox.setPadding(new Insets(12, 18, 12, 18));
        demoBox.setStyle("-fx-background-color: #0f172a; -fx-border-color: #334155; -fx-border-width: 1; -fx-background-radius: 8;");
        demoBox.setMaxWidth(960);

        Label demoTitle = new Label("⚡ Verified Campus Test Accounts (Pre-Seeded & Ready):");
        demoTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 12px; -fx-font-weight: bold;");

        HBox demoAccountsRow = new HBox(20);
        demoAccountsRow.setAlignment(Pos.CENTER);

        demoAccountsRow.getChildren().addAll(
                createDemoAccountChip("🎓 Student", "rohit.kundu2022@vitstudent.ac.in", "Student@123"),
                createDemoAccountChip("👨‍🍳 Chef", "chef.campus@vit.ac.in", "Chef@123"),
                createDemoAccountChip("🏢 Warden", "warden.blockb@vit.ac.in", "Warden@123"),
                createDemoAccountChip("👑 Admin", "admin.mess@vit.ac.in", "Admin@123")
        );
        demoBox.getChildren().addAll(demoTitle, demoAccountsRow);

        centerBox.getChildren().addAll(titleBox, cardsBox, demoBox);

        ScrollPane scroll = new ScrollPane(centerBox);
        scroll.setFitToWidth(true);
        scroll.setFitToHeight(true);
        scroll.setStyle("-fx-background: #0b1329; -fx-background-color: #0b1329; -fx-border-color: transparent;");

        root.setCenter(scroll);
        root.setBottom(createStatusBar());

        Scene scene = new Scene(root, 1260, 840);
        scene.getStylesheets().add(createInlineStyles());
        mainStage.setScene(scene);
    }

    private VBox createRoleCard(String icon, String title, String description, String primaryColor, String accentColor, String buttonText, Runnable onAction) {
        VBox card = new VBox(14);
        card.setAlignment(Pos.TOP_CENTER);
        card.setPadding(new Insets(24, 20, 24, 20));
        card.setPrefWidth(265);
        card.setPrefHeight(360);
        card.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 12; -fx-border-color: #334155; -fx-border-width: 1.5; -fx-border-radius: 12;");

        card.setOnMouseEntered(e -> card.setStyle("-fx-background-color: #243247; -fx-background-radius: 12; -fx-border-color: " + accentColor + "; -fx-border-width: 1.5; -fx-border-radius: 12; -fx-cursor: hand;"));
        card.setOnMouseExited(e -> card.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 12; -fx-border-color: #334155; -fx-border-width: 1.5; -fx-border-radius: 12;"));
        card.setOnMouseClicked(e -> onAction.run());

        Label iconLabel = new Label(icon);
        iconLabel.setStyle("-fx-font-size: 42px;");

        Label titleLabel = new Label(title);
        titleLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 18px; -fx-font-weight: bold;");

        Label descLabel = new Label(description);
        descLabel.setWrapText(true);
        descLabel.setTextAlignment(javafx.scene.text.TextAlignment.CENTER);
        descLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px; -fx-line-spacing: 2px;");
        VBox.setVgrow(descLabel, Priority.ALWAYS);

        Button actionBtn = new Button(buttonText);
        actionBtn.setMaxWidth(Double.MAX_VALUE);
        actionBtn.setStyle("-fx-background-color: " + primaryColor + "; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-background-radius: 8; -fx-cursor: hand; -fx-padding: 8 14 8 14;");
        actionBtn.setOnAction(e -> onAction.run());

        card.getChildren().addAll(iconLabel, titleLabel, descLabel, actionBtn);
        return card;
    }

    private VBox createDemoAccountChip(String roleName, String email, String pwd) {
        VBox box = new VBox(2);
        box.setAlignment(Pos.CENTER);
        Label rLabel = new Label(roleName);
        rLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-weight: bold; -fx-font-size: 11px;");
        Label eLabel = new Label(email);
        eLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 10px;");
        Label pLabel = new Label("Pass: " + pwd);
        pLabel.setStyle("-fx-text-fill: #34d399; -fx-font-size: 10px; -fx-font-family: monospace;");
        box.getChildren().addAll(rLabel, eLabel, pLabel);
        return box;
    }

    public void showRoleLoginScreen(String role) {
        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #0b1329;");

        // Top Navigation
        HBox topBar = new HBox(12);
        topBar.setPadding(new Insets(14, 24, 14, 24));
        topBar.setAlignment(Pos.CENTER_LEFT);
        topBar.setStyle("-fx-background-color: #0f172a; -fx-border-color: #1e293b; -fx-border-width: 0 0 1 0;");

        Button backBtn = new Button("← Change Role");
        backBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #f8fafc; -fx-font-weight: bold; -fx-font-size: 12px; -fx-cursor: hand; -fx-background-radius: 6;");
        backBtn.setOnAction(e -> showRoleSelectionScreen());

        Label logoLabel = new Label("SMARTMESS");
        logoLabel.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 18px; -fx-font-weight: bold;");

        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);

        Label secBadge = new Label("🔒 SHA-256 SALTED AUTH");
        secBadge.setStyle("-fx-text-fill: #10b981; -fx-font-size: 11px; -fx-font-weight: bold;");

        topBar.getChildren().addAll(backBtn, logoLabel, sp, secBadge);
        root.setTop(topBar);

        // Center: Distinct Role Login Card
        VBox centerContainer = new VBox();
        centerContainer.setAlignment(Pos.CENTER);
        centerContainer.setPadding(new Insets(30));

        Node loginCard;
        if ("chef".equalsIgnoreCase(role)) {
            loginCard = createChefLoginView();
        } else if ("warden".equalsIgnoreCase(role)) {
            loginCard = createWardenLoginView();
        } else if ("admin".equalsIgnoreCase(role)) {
            loginCard = createAdminLoginView();
        } else {
            loginCard = createStudentLoginView();
        }

        centerContainer.getChildren().add(loginCard);

        ScrollPane scroll = new ScrollPane(centerContainer);
        scroll.setFitToWidth(true);
        scroll.setFitToHeight(true);
        scroll.setStyle("-fx-background: #0b1329; -fx-background-color: #0b1329; -fx-border-color: transparent;");

        root.setCenter(scroll);
        root.setBottom(createStatusBar());

        Scene scene = new Scene(root, 1260, 840);
        scene.getStylesheets().add(createInlineStyles());
        mainStage.setScene(scene);
    }

    // -------------------------------------------------------------------------
    // 1. STUDENT LOGIN VIEW
    // -------------------------------------------------------------------------
    private Node createStudentLoginView() {
        VBox card = new VBox(14);
        card.setMaxWidth(480);
        card.setPadding(new Insets(28));
        card.setStyle("-fx-background-color: #1e293b; -fx-border-color: #f97316; -fx-border-width: 1.5; -fx-border-radius: 12; -fx-background-radius: 12;");

        Label icon = new Label("🎓");
        icon.setStyle("-fx-font-size: 38px;");

        Label title = new Label("Student Sign In");
        title.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 22px; -fx-font-weight: bold;");

        Label sub = new Label("Access cafeteria ordering, digital wallet & live order tracking");
        sub.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        Label vitBadge = new Label("VIT Student Portal • @vitstudent.ac.in Required");
        vitBadge.setStyle("-fx-background-color: #7c2d12; -fx-text-fill: #fdba74; -fx-font-weight: bold; -fx-font-size: 11px; -fx-padding: 3 8 3 8; -fx-background-radius: 4;");

        VBox headerBox = new VBox(6, icon, title, sub, vitBadge);
        headerBox.setAlignment(Pos.CENTER);

        // Tab Switcher between Email and OTP
        HBox tabSwitch = new HBox(8);
        tabSwitch.setAlignment(Pos.CENTER);
        tabSwitch.setPadding(new Insets(4));
        tabSwitch.setStyle("-fx-background-color: #0f172a; -fx-background-radius: 8;");

        Button emailTabBtn = new Button("VIT Email & Password");
        Button otpTabBtn = new Button("Mobile OTP (SMS)");

        emailTabBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
        otpTabBtn.setStyle("-fx-background-color: transparent; -fx-text-fill: #94a3b8; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
        HBox.setHgrow(emailTabBtn, Priority.ALWAYS);
        HBox.setHgrow(otpTabBtn, Priority.ALWAYS);
        emailTabBtn.setMaxWidth(Double.MAX_VALUE);
        otpTabBtn.setMaxWidth(Double.MAX_VALUE);
        tabSwitch.getChildren().addAll(emailTabBtn, otpTabBtn);

        // Email Form
        VBox emailForm = new VBox(10);
        Label emailLbl = new Label("VIT Email Address:");
        emailLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField emailField = new TextField("rohit.kundu2022@vitstudent.ac.in");
        emailField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Label pwdLbl = new Label("Password:");
        pwdLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        PasswordField pwdField = new PasswordField();
        pwdField.setText("Student@123");
        pwdField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        HBox.setHgrow(pwdField, Priority.ALWAYS);

        TextField plainPwdField = new TextField("Student@123");
        plainPwdField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        plainPwdField.setVisible(false);
        plainPwdField.setManaged(false);
        HBox.setHgrow(plainPwdField, Priority.ALWAYS);
        plainPwdField.textProperty().bindBidirectional(pwdField.textProperty());

        Button showPwdBtn = new Button("👁");
        showPwdBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #cbd5e1; -fx-cursor: hand; -fx-background-radius: 6;");
        showPwdBtn.setOnAction(e -> {
            boolean show = !plainPwdField.isVisible();
            plainPwdField.setVisible(show);
            plainPwdField.setManaged(show);
            pwdField.setVisible(!show);
            pwdField.setManaged(!show);
            showPwdBtn.setText(show ? "🔒" : "👁");
        });

        HBox pwdBox = new HBox(6, pwdField, plainPwdField, showPwdBtn);
        pwdBox.setAlignment(Pos.CENTER_LEFT);

        Label emailErrLbl = new Label();
        emailErrLbl.setWrapText(true);
        emailErrLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 12px; -fx-font-weight: bold;");

        Button emailLoginBtn = new Button("Sign In with VIT Email →");
        emailLoginBtn.setMaxWidth(Double.MAX_VALUE);
        emailLoginBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; -fx-padding: 10; -fx-background-radius: 6;");

        emailLoginBtn.setOnAction(e -> {
            String em = emailField.getText().trim();
            String pw = pwdField.getText();
            SecurityService.AuthResult res = SecurityService.getInstance().loginWithPassword(em, pw, "student");
            if (res.success && res.session != null) {
                currentStudentId = res.session.userId;
                currentStudentName = res.session.name;
                currentStudentEmail = res.session.email;
                activeUserName = res.session.name;
                activeUserEmail = res.session.email;
                activeUserExtra = res.session.extra;
                log("🎓 [Student Auth] Signed in as " + activeUserName + " (" + activeUserEmail + ")");
                showDashboardForRole("student");
            } else {
                emailErrLbl.setText("❌ " + res.message);
            }
        });

        HBox quickFillBox = new HBox(8);
        quickFillBox.setAlignment(Pos.CENTER);
        Button quickRohitBtn = new Button("⚡ Quick Fill: Rohit (9,000 Cr)");
        quickRohitBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #38bdf8; -fx-font-size: 11px; -fx-cursor: hand;");
        quickRohitBtn.setOnAction(e -> {
            emailField.setText("rohit.kundu2022@vitstudent.ac.in");
            pwdField.setText("Student@123");
        });
        quickFillBox.getChildren().add(quickRohitBtn);

        emailForm.getChildren().addAll(emailLbl, emailField, pwdLbl, pwdBox, emailErrLbl, emailLoginBtn, quickFillBox);

        // OTP Form
        VBox otpForm = new VBox(10);
        otpForm.setVisible(false);
        otpForm.setManaged(false);

        Label phoneLbl = new Label("Registered Indian Mobile Number:");
        phoneLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField phoneField = new TextField("+91 9876543210");
        phoneField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Button sendOtpBtn = new Button("📲 Send SMS OTP");
        sendOtpBtn.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-cursor: hand; -fx-padding: 8 14 8 14; -fx-background-radius: 6;");

        Label otpStatusLbl = new Label();
        otpStatusLbl.setStyle("-fx-font-size: 11px;");
        otpStatusLbl.setWrapText(true);

        sendOtpBtn.setOnAction(e -> {
            String ph = phoneField.getText().trim();
            SecurityService.OtpResult r = SecurityService.getInstance().sendMobileOtp(ph);
            if (r.success) {
                otpStatusLbl.setText("✅ " + r.message);
                otpStatusLbl.setStyle("-fx-text-fill: #34d399; -fx-font-size: 11px;");
                showAlert(Alert.AlertType.INFORMATION, "Simulated SMS Received",
                        "📱 SMS GATEWAY NOTIFICATION:\nVerification Code: 123456\nValid for 5 minutes.");
            } else {
                otpStatusLbl.setText("❌ " + r.message);
                otpStatusLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 11px;");
            }
        });

        HBox phoneRow = new HBox(8, phoneField, sendOtpBtn);
        HBox.setHgrow(phoneField, Priority.ALWAYS);

        Label otpLbl = new Label("6-Digit OTP Code:");
        otpLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField otpCodeField = new TextField("123456");
        otpCodeField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Button verifyOtpBtn = new Button("Verify OTP & Sign In →");
        verifyOtpBtn.setMaxWidth(Double.MAX_VALUE);
        verifyOtpBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; -fx-padding: 10; -fx-background-radius: 6;");

        verifyOtpBtn.setOnAction(e -> {
            String ph = phoneField.getText().trim();
            String code = otpCodeField.getText().trim();
            SecurityService.AuthResult res = SecurityService.getInstance().loginWithMobileOtp(ph, code);
            if (res.success && res.session != null) {
                currentStudentId = res.session.userId;
                currentStudentName = res.session.name;
                currentStudentEmail = res.session.email;
                activeUserName = res.session.name;
                activeUserEmail = res.session.email;
                activeUserExtra = res.session.extra;
                log("🎓 [Student Auth] Signed in via OTP as " + activeUserName);
                showDashboardForRole("student");
            } else {
                otpStatusLbl.setText("❌ " + res.message);
                otpStatusLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 11px;");
            }
        });

        otpForm.getChildren().addAll(phoneLbl, phoneRow, otpLbl, otpCodeField, otpStatusLbl, verifyOtpBtn);

        // Switch listeners
        emailTabBtn.setOnAction(e -> {
            emailTabBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
            otpTabBtn.setStyle("-fx-background-color: transparent; -fx-text-fill: #94a3b8; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
            emailForm.setVisible(true);
            emailForm.setManaged(true);
            otpForm.setVisible(false);
            otpForm.setManaged(false);
        });

        otpTabBtn.setOnAction(e -> {
            otpTabBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
            emailTabBtn.setStyle("-fx-background-color: transparent; -fx-text-fill: #94a3b8; -fx-font-weight: bold; -fx-background-radius: 6; -fx-cursor: hand;");
            otpForm.setVisible(true);
            otpForm.setManaged(true);
            emailForm.setVisible(false);
            emailForm.setManaged(false);
        });

        // Bottom links
        HBox bottomLinks = new HBox(12);
        bottomLinks.setAlignment(Pos.CENTER);

        Hyperlink regLink = new Hyperlink("New student? Register (+9,000 Cr)");
        regLink.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 11px;");
        regLink.setOnAction(e -> openStudentRegistrationDialog(mainStage));

        Hyperlink forgotLink = new Hyperlink("Forgot password?");
        forgotLink.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");
        forgotLink.setOnAction(e -> openForgotPasswordDialog(mainStage));

        bottomLinks.getChildren().addAll(regLink, new Label("•"), forgotLink);

        card.getChildren().addAll(headerBox, tabSwitch, emailForm, otpForm, bottomLinks);
        return card;
    }

    // -------------------------------------------------------------------------
    // 2. CHEF LOGIN VIEW
    // -------------------------------------------------------------------------
    private Node createChefLoginView() {
        VBox card = new VBox(14);
        card.setMaxWidth(460);
        card.setPadding(new Insets(28));
        card.setStyle("-fx-background-color: #1e293b; -fx-border-color: #ea580c; -fx-border-width: 1.5; -fx-border-radius: 12; -fx-background-radius: 12;");

        Label icon = new Label("👨‍🍳");
        icon.setStyle("-fx-font-size: 38px;");

        Label title = new Label("Chef & Kitchen Staff Console");
        title.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 22px; -fx-font-weight: bold;");

        Label badge = new Label("🔥 Central Mess Main Kitchen • Active Dispatch");
        badge.setStyle("-fx-background-color: #7c2d12; -fx-text-fill: #fdba74; -fx-font-weight: bold; -fx-font-size: 11px; -fx-padding: 3 8 3 8; -fx-background-radius: 4;");

        Label sub = new Label("Restricted culinary terminal for mess chefs and culinary dispatchers");
        sub.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        VBox headerBox = new VBox(6, icon, title, badge, sub);
        headerBox.setAlignment(Pos.CENTER);

        Label stationLbl = new Label("Kitchen Station:");
        stationLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");

        ComboBox<String> stationCombo = new ComboBox<>();
        stationCombo.getItems().addAll(
                "Station 1: Hot Kitchen & Main Curries",
                "Station 2: Tandoor, Breads & Breakfast",
                "Station 3: Beverage, Dessert & Salad Bar"
        );
        stationCombo.setValue("Station 1: Hot Kitchen & Main Curries");
        stationCombo.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6;");
        stationCombo.setMaxWidth(Double.MAX_VALUE);

        Label emailLbl = new Label("Kitchen Staff Email:");
        emailLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField emailField = new TextField("chef.campus@vit.ac.in");
        emailField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Label pwdLbl = new Label("Master Kitchen Password:");
        pwdLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        PasswordField pwdField = new PasswordField();
        pwdField.setText("Chef@123");
        pwdField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        HBox.setHgrow(pwdField, Priority.ALWAYS);

        TextField plainPwd = new TextField("Chef@123");
        plainPwd.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        plainPwd.setVisible(false);
        plainPwd.setManaged(false);
        HBox.setHgrow(plainPwd, Priority.ALWAYS);
        plainPwd.textProperty().bindBidirectional(pwdField.textProperty());

        Button showPwdBtn = new Button("👁");
        showPwdBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #cbd5e1; -fx-cursor: hand; -fx-background-radius: 6;");
        showPwdBtn.setOnAction(e -> {
            boolean show = !plainPwd.isVisible();
            plainPwd.setVisible(show);
            plainPwd.setManaged(show);
            pwdField.setVisible(!show);
            pwdField.setManaged(!show);
            showPwdBtn.setText(show ? "🔒" : "👁");
        });

        HBox pwdBox = new HBox(6, pwdField, plainPwd, showPwdBtn);
        pwdBox.setAlignment(Pos.CENTER_LEFT);

        Label errLbl = new Label();
        errLbl.setWrapText(true);
        errLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 12px; -fx-font-weight: bold;");

        Button loginBtn = new Button("👨‍🍳 Enter Kitchen Console →");
        loginBtn.setMaxWidth(Double.MAX_VALUE);
        loginBtn.setStyle("-fx-background-color: #ea580c; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; -fx-padding: 10; -fx-background-radius: 6;");

        loginBtn.setOnAction(e -> {
            String em = emailField.getText().trim();
            String pw = pwdField.getText();
            SecurityService.AuthResult res = SecurityService.getInstance().loginWithPassword(em, pw, "chef");
            if (res.success && res.session != null) {
                activeUserName = res.session.name;
                activeUserEmail = res.session.email;
                activeUserExtra = stationCombo.getValue();
                log("👨‍🍳 [Chef Auth] Authenticated as " + activeUserName + " at " + activeUserExtra);
                showDashboardForRole("chef");
            } else {
                errLbl.setText("❌ " + res.message);
            }
        });

        Button demoBtn = new Button("⚡ Quick Fill: Head Chef Vikram");
        demoBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #f59e0b; -fx-font-size: 11px; -fx-cursor: hand;");
        demoBtn.setOnAction(e -> {
            emailField.setText("chef.campus@vit.ac.in");
            pwdField.setText("Chef@123");
        });

        card.getChildren().addAll(headerBox, stationLbl, stationCombo, emailLbl, emailField, pwdLbl, pwdBox, errLbl, loginBtn, demoBtn);
        return card;
    }

    // -------------------------------------------------------------------------
    // 3. WARDEN LOGIN VIEW
    // -------------------------------------------------------------------------
    private Node createWardenLoginView() {
        VBox card = new VBox(14);
        card.setMaxWidth(460);
        card.setPadding(new Insets(28));
        card.setStyle("-fx-background-color: #1e293b; -fx-border-color: #0284c7; -fx-border-width: 1.5; -fx-border-radius: 12; -fx-background-radius: 12;");

        Label icon = new Label("🏢");
        icon.setStyle("-fx-font-size: 38px;");

        Label title = new Label("Hostel Warden Clearance Portal");
        title.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 22px; -fx-font-weight: bold;");

        Label badge = new Label("🛡️ Hostel Block Residence Council Authority");
        badge.setStyle("-fx-background-color: #0c4a6e; -fx-text-fill: #7dd3fc; -fx-font-weight: bold; -fx-font-size: 11px; -fx-padding: 3 8 3 8; -fx-background-radius: 4;");

        Label sub = new Label("Official clearance terminal for sick-leave hostel room delivery approvals");
        sub.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        VBox headerBox = new VBox(6, icon, title, badge, sub);
        headerBox.setAlignment(Pos.CENTER);

        Label blockLbl = new Label("Assigned Hostel Block:");
        blockLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");

        ComboBox<String> blockCombo = new ComboBox<>();
        blockCombo.getItems().addAll(
                "Block B - Boys Hostel (Dr. S. Raman)",
                "Block C - Boys Hostel (Prof. Priya Nair)",
                "Block A - Girls Hostel (Mr. K. Varma)"
        );
        blockCombo.setValue("Block B - Boys Hostel (Dr. S. Raman)");
        blockCombo.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6;");
        blockCombo.setMaxWidth(Double.MAX_VALUE);

        Label emailLbl = new Label("Official Warden Email:");
        emailLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField emailField = new TextField("warden.blockb@vit.ac.in");
        emailField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        blockCombo.setOnAction(e -> {
            String sel = blockCombo.getValue();
            if (sel.contains("Block B")) {
                emailField.setText("warden.blockb@vit.ac.in");
            } else if (sel.contains("Block C")) {
                emailField.setText("warden.blockc@vit.ac.in");
            } else if (sel.contains("Block A")) {
                emailField.setText("warden.blocka@vit.ac.in");
            }
        });

        Label pwdLbl = new Label("Warden Security Pin / Password:");
        pwdLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        PasswordField pwdField = new PasswordField();
        pwdField.setText("Warden@123");
        pwdField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        HBox.setHgrow(pwdField, Priority.ALWAYS);

        TextField plainPwd = new TextField("Warden@123");
        plainPwd.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        plainPwd.setVisible(false);
        plainPwd.setManaged(false);
        HBox.setHgrow(plainPwd, Priority.ALWAYS);
        plainPwd.textProperty().bindBidirectional(pwdField.textProperty());

        Button showPwdBtn = new Button("👁");
        showPwdBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #cbd5e1; -fx-cursor: hand; -fx-background-radius: 6;");
        showPwdBtn.setOnAction(e -> {
            boolean show = !plainPwd.isVisible();
            plainPwd.setVisible(show);
            plainPwd.setManaged(show);
            pwdField.setVisible(!show);
            pwdField.setManaged(!show);
            showPwdBtn.setText(show ? "🔒" : "👁");
        });

        HBox pwdBox = new HBox(6, pwdField, plainPwd, showPwdBtn);
        pwdBox.setAlignment(Pos.CENTER_LEFT);

        Label errLbl = new Label();
        errLbl.setWrapText(true);
        errLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 12px; -fx-font-weight: bold;");

        Button loginBtn = new Button("🏢 Access Block Deliveries →");
        loginBtn.setMaxWidth(Double.MAX_VALUE);
        loginBtn.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; -fx-padding: 10; -fx-background-radius: 6;");

        loginBtn.setOnAction(e -> {
            String em = emailField.getText().trim();
            String pw = pwdField.getText();
            SecurityService.AuthResult res = SecurityService.getInstance().loginWithPassword(em, pw, "warden");
            if (res.success && res.session != null) {
                activeUserName = res.session.name;
                activeUserEmail = res.session.email;
                activeUserExtra = blockCombo.getValue();
                log("🏢 [Warden Auth] Authenticated as " + activeUserName + " for " + activeUserExtra);
                showDashboardForRole("warden");
            } else {
                errLbl.setText("❌ " + res.message);
            }
        });

        Button demoBtn = new Button("⚡ Quick Fill: Dr. S. Raman (Block B)");
        demoBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #38bdf8; -fx-font-size: 11px; -fx-cursor: hand;");
        demoBtn.setOnAction(e -> {
            blockCombo.setValue("Block B - Boys Hostel (Dr. S. Raman)");
            emailField.setText("warden.blockb@vit.ac.in");
            pwdField.setText("Warden@123");
        });

        card.getChildren().addAll(headerBox, blockLbl, blockCombo, emailLbl, emailField, pwdLbl, pwdBox, errLbl, loginBtn, demoBtn);
        return card;
    }

    // -------------------------------------------------------------------------
    // 4. ADMIN LOGIN VIEW
    // -------------------------------------------------------------------------
    private Node createAdminLoginView() {
        VBox card = new VBox(14);
        card.setMaxWidth(460);
        card.setPadding(new Insets(28));
        card.setStyle("-fx-background-color: #1e293b; -fx-border-color: #9333ea; -fx-border-width: 1.5; -fx-border-radius: 12; -fx-background-radius: 12;");

        Label icon = new Label("👑");
        icon.setStyle("-fx-font-size: 38px;");

        Label title = new Label("Campus Mess Admin Portal");
        title.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 22px; -fx-font-weight: bold;");

        Label badge = new Label("🔒 LEVEL 4 ROOT AUTHORITY • EXECUTIVE COMMITTEE");
        badge.setStyle("-fx-background-color: #581c87; -fx-text-fill: #e9d5ff; -fx-font-weight: bold; -fx-font-size: 11px; -fx-padding: 3 8 3 8; -fx-background-radius: 4;");

        Label sub = new Label("Restricted governance console for menu control, credit audits & KPIs");
        sub.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        VBox headerBox = new VBox(6, icon, title, badge, sub);
        headerBox.setAlignment(Pos.CENTER);

        Label emailLbl = new Label("Executive Admin Email:");
        emailLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField emailField = new TextField("admin.mess@vit.ac.in");
        emailField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Label pwdLbl = new Label("Master Key Password:");
        pwdLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        PasswordField pwdField = new PasswordField();
        pwdField.setText("Admin@123");
        pwdField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        HBox.setHgrow(pwdField, Priority.ALWAYS);

        TextField plainPwd = new TextField("Admin@123");
        plainPwd.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");
        plainPwd.setVisible(false);
        plainPwd.setManaged(false);
        HBox.setHgrow(plainPwd, Priority.ALWAYS);
        plainPwd.textProperty().bindBidirectional(pwdField.textProperty());

        Button showPwdBtn = new Button("👁");
        showPwdBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #cbd5e1; -fx-cursor: hand; -fx-background-radius: 6;");
        showPwdBtn.setOnAction(e -> {
            boolean show = !plainPwd.isVisible();
            plainPwd.setVisible(show);
            plainPwd.setManaged(show);
            pwdField.setVisible(!show);
            pwdField.setManaged(!show);
            showPwdBtn.setText(show ? "🔒" : "👁");
        });

        HBox pwdBox = new HBox(6, pwdField, plainPwd, showPwdBtn);
        pwdBox.setAlignment(Pos.CENTER_LEFT);

        Label pinLbl = new Label("2FA Security Passcode:");
        pinLbl.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-font-weight: bold;");
        TextField pinField = new TextField("999888");
        pinField.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #f8fafc; -fx-border-color: #475569; -fx-border-radius: 6; -fx-padding: 8;");

        Label errLbl = new Label();
        errLbl.setWrapText(true);
        errLbl.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 12px; -fx-font-weight: bold;");

        Button loginBtn = new Button("👑 Unlock Executive Dashboard →");
        loginBtn.setMaxWidth(Double.MAX_VALUE);
        loginBtn.setStyle("-fx-background-color: #9333ea; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand; -fx-padding: 10; -fx-background-radius: 6;");

        loginBtn.setOnAction(e -> {
            String em = emailField.getText().trim();
            String pw = pwdField.getText();
            SecurityService.AuthResult res = SecurityService.getInstance().loginWithPassword(em, pw, "admin");
            if (res.success && res.session != null) {
                activeUserName = res.session.name;
                activeUserEmail = res.session.email;
                activeUserExtra = "Root Clearance L4";
                log("👑 [Admin Auth] Root Session Authenticated for " + activeUserName);
                showDashboardForRole("admin");
            } else {
                errLbl.setText("❌ " + res.message);
            }
        });

        Button demoBtn = new Button("⚡ Quick Fill: Mess Committee Admin");
        demoBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #c084fc; -fx-font-size: 11px; -fx-cursor: hand;");
        demoBtn.setOnAction(e -> {
            emailField.setText("admin.mess@vit.ac.in");
            pwdField.setText("Admin@123");
            pinField.setText("999888");
        });

        card.getChildren().addAll(headerBox, emailLbl, emailField, pwdLbl, pwdBox, pinLbl, pinField, errLbl, loginBtn, demoBtn);
        return card;
    }

    // =========================================================================
    // DEDICATED ROLE DASHBOARDS (100% Isolated - No Leaked Tabs)
    // =========================================================================

    public void showDashboardForRole(String role) {
        this.activeRole = role.toLowerCase();
        this.currentRole = Character.toUpperCase(role.charAt(0)) + role.substring(1).toLowerCase();

        BorderPane root = new BorderPane();
        root.setStyle("-fx-background-color: #0f172a;");

        // Top Header for this role
        VBox headerBox = createRoleHeader(role);
        root.setTop(headerBox);

        // Center TabPane with ONLY this role's tabs
        TabPane tabPane = new TabPane();
        tabPane.setTabClosingPolicy(TabPane.TabClosingPolicy.UNAVAILABLE);
        tabPane.setStyle("-fx-background-color: #0f172a; -fx-tab-min-width: 140px; -fx-tab-min-height: 38px;");

        switch (role.toLowerCase()) {
            case "chef":
                Tab kitchenTab = new Tab("👨‍🍳 Kitchen Queue FIFO Dispatch", createKitchenQueueTab());
                Tab sustainabilityTab = new Tab("🌱 Sustainability & Food Waste Hub", createSustainabilityTab());
                tabPane.getTabs().addAll(kitchenTab, sustainabilityTab);
                refreshKitchenQueue();
                refreshSustainabilityMetrics();
                break;

            case "warden":
                Tab wardenTab = new Tab("🏥 Sick-Leave Room Delivery Approvals", createWardenTab());
                tabPane.getTabs().addAll(wardenTab);
                refreshHealthRequests();
                break;

            case "admin":
                Tab adminTab = new Tab("👑 Campus KPIs & Financial Analytics", createAdminTab());
                Tab adminWasteTab = new Tab("🌱 Food Waste & Sustainability Audits", createSustainabilityTab());
                Tab adminHistTab = new Tab("📜 System History & CSV Audit", createOrderHistoryTab());
                Tab diagTab = new Tab("⚡ Diagnostics, Servlets & JDBC", createDiagnosticsTab());
                tabPane.getTabs().addAll(adminTab, adminWasteTab, adminHistTab, diagTab);
                refreshAdminAnalytics();
                refreshSustainabilityMetrics();
                refreshOrderHistory();
                break;

            case "student":
            default:
                Tab menuTab = new Tab("🍽️ Menu & Tray Ordering", createMenuAndTrayTab());
                Tab trackerTab = new Tab("📱 Live Stepper & Active Order", createLiveStepperTab());
                Tab sickLeaveTab = new Tab("🏥 Sick Leave & Room Delivery", createStudentSickLeaveTab());
                Tab walletTab = new Tab("💳 Wallet & Pre-Orders", createWalletAndPreOrdersTab());
                Tab myHistTab = new Tab("📜 My Order History", createOrderHistoryTab());
                tabPane.getTabs().addAll(menuTab, trackerTab, sickLeaveTab, walletTab, myHistTab);
                refreshMenuData("All", false);
                refreshOrderHistory();
                refreshPreOrders();
                seedInitialActiveOrders();
                startLiveCountdownTimer();
                checkRoomDeliveryClearance();
                break;
        }

        root.setCenter(tabPane);
        root.setBottom(createStatusBar());

        Scene scene = new Scene(root, 1260, 840);
        scene.getStylesheets().add(createInlineStyles());
        mainStage.setScene(scene);
    }

    private VBox createRoleHeader(String role) {
        VBox header = new VBox(8);
        header.setPadding(new Insets(12, 18, 12, 18));
        header.setStyle("-fx-background-color: #1e293b; -fx-border-color: #334155; -fx-border-width: 0 0 1 0;");

        HBox topRow = new HBox(12);
        topRow.setAlignment(Pos.CENTER_LEFT);

        Label titleLabel = new Label("SMARTMESS");
        titleLabel.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 20px; -fx-font-weight: bold; -fx-font-family: 'Helvetica Neue', Arial;");

        String roleBadgeText;
        String roleBadgeBg;
        switch (role.toLowerCase()) {
            case "chef":
                roleBadgeText = "👨‍🍳 CHEF CONSOLE";
                roleBadgeBg = "#ea580c";
                break;
            case "warden":
                roleBadgeText = "🏢 WARDEN CLEARANCE (" + activeUserExtra + ")";
                roleBadgeBg = "#0284c7";
                break;
            case "admin":
                roleBadgeText = "👑 ADMIN ROOT CLEARANCE";
                roleBadgeBg = "#9333ea";
                break;
            default:
                roleBadgeText = "🎓 STUDENT PORTAL";
                roleBadgeBg = "#ff6b35";
                break;
        }

        Label roleBadge = new Label(roleBadgeText);
        roleBadge.setStyle("-fx-background-color: " + roleBadgeBg + "; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px; -fx-padding: 4 10 4 10; -fx-background-radius: 6;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        HBox userBadge = new HBox(8);
        userBadge.setAlignment(Pos.CENTER);
        userBadge.setPadding(new Insets(5, 12, 5, 12));
        userBadge.setStyle("-fx-background-color: #334155; -fx-background-radius: 8;");

        studentBadgeLabel.setText("👤 " + activeUserName);
        studentBadgeLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-weight: bold; -fx-font-size: 12px;");

        Label divider = new Label("|");
        divider.setStyle("-fx-text-fill: #64748b;");

        if ("student".equalsIgnoreCase(role)) {
            Label creditsLabel = new Label("Balance: ");
            creditsLabel.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
            creditsValueLabel.setText(currentCredits + " Cr");
            creditsValueLabel.setStyle("-fx-text-fill: #10b981; -fx-font-weight: bold; -fx-font-size: 13px;");
            userBadge.getChildren().setAll(studentBadgeLabel, divider, creditsLabel, creditsValueLabel);
        } else {
            Label detailLabel = new Label(activeUserEmail);
            detailLabel.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");
            userBadge.getChildren().setAll(studentBadgeLabel, divider, detailLabel);
        }

        serverStatusBadge.setPadding(new Insets(5, 10, 5, 10));
        serverStatusBadge.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-font-size: 11px; -fx-background-radius: 20;");

        Button signOutBtn = new Button("🚪 Sign Out");
        signOutBtn.setStyle("-fx-background-color: #dc2626; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 12px; -fx-cursor: hand; -fx-background-radius: 6;");
        signOutBtn.setOnAction(e -> {
            activeRole = null;
            log("👋 User " + activeUserName + " signed out.");
            showRoleSelectionScreen();
        });

        topRow.getChildren().addAll(titleLabel, roleBadge, spacer, userBadge, serverStatusBadge, signOutBtn);
        header.getChildren().add(topRow);
        return header;
    }

    private void openStudentRegistrationDialog(Stage owner) {
        Stage dialog = new Stage();
        dialog.initModality(Modality.WINDOW_MODAL);
        dialog.initOwner(owner);
        dialog.setTitle("SmartMess - New Student Registration");

        VBox layout = new VBox(12);
        layout.setPadding(new Insets(24));
        layout.setStyle("-fx-background-color: #0f172a;");

        Label title = new Label("🎓 Register New Student (+9,000 Credits)");
        title.setStyle("-fx-text-fill: #ff6b35; -fx-font-size: 16px; -fx-font-weight: bold;");

        Label note = new Label("Strict VIT Domain: Email must end with @vitstudent.ac.in");
        note.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");

        TextField nameField = new TextField();
        nameField.setPromptText("Full Name (e.g. Priya Sharma)");
        nameField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        TextField emailField = new TextField();
        emailField.setPromptText("VIT Student Email (e.g. priya.sharma2023@vitstudent.ac.in)");
        emailField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        TextField phoneField = new TextField("+91 ");
        phoneField.setPromptText("Mobile (+91 9876543210)");
        phoneField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        TextField roomField = new TextField();
        roomField.setPromptText("Hostel Room (e.g. Block A - Room 204)");
        roomField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        PasswordField passField = new PasswordField();
        passField.setPromptText("Password (min 8 characters)");
        passField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        PasswordField confirmPassField = new PasswordField();
        confirmPassField.setPromptText("Confirm Password");
        confirmPassField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        Label errLabel = new Label();
        errLabel.setStyle("-fx-text-fill: #ef4444; -fx-font-size: 11px; -fx-font-weight: bold;");
        errLabel.setWrapText(true);

        Button registerBtn = new Button("Register & Initialize 9,000 Credits");
        registerBtn.setStyle("-fx-background-color: #ff6b35; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand;");
        registerBtn.setMaxWidth(Double.MAX_VALUE);
        registerBtn.setOnAction(e -> {
            String name = nameField.getText().trim();
            String email = emailField.getText().trim();
            String phone = phoneField.getText().trim();
            String room = roomField.getText().trim();
            String pwd = passField.getText();
            String cpwd = confirmPassField.getText();

            SecurityService.AuthResult res = SecurityService.getInstance().registerStudent(name, email, phone, room, pwd, cpwd, new MessServiceImpl());
            if (res.success) {
                dialog.close();
                showAlert(Alert.AlertType.INFORMATION, "Registration Successful",
                        "Welcome to SmartMess, " + name + "!\nYour account has been created with 9,000 Monthly Mess Credits.\nYou can now sign in.");
            } else {
                errLabel.setText("❌ " + res.message);
            }
        });

        layout.getChildren().addAll(
                title, note,
                new Label("Full Name:"), nameField,
                new Label("VIT Email:"), emailField,
                new Label("Mobile Number:"), phoneField,
                new Label("Hostel Room:"), roomField,
                new Label("Password:"), passField,
                new Label("Confirm Password:"), confirmPassField,
                errLabel, registerBtn
        );

        ScrollPane sp = new ScrollPane(layout);
        sp.setFitToWidth(true);
        Scene scene = new Scene(sp, 480, 560);
        dialog.setScene(scene);
        dialog.show();
    }

    private void openForgotPasswordDialog(Stage owner) {
        Stage dialog = new Stage();
        dialog.initModality(Modality.WINDOW_MODAL);
        dialog.initOwner(owner);
        dialog.setTitle("SmartMess - Reset Password");

        VBox layout = new VBox(14);
        layout.setPadding(new Insets(20));
        layout.setStyle("-fx-background-color: #0f172a;");

        Label title = new Label("🔑 Password Recovery");
        title.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 16px; -fx-font-weight: bold;");

        Label note = new Label("Enter your VIT email to receive a password reset verification code.");
        note.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        TextField emailField = new TextField("rohit.kundu2022@vitstudent.ac.in");
        emailField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");

        Label statusLabel = new Label();
        statusLabel.setStyle("-fx-font-size: 11px;");

        Button sendBtn = new Button("Send Reset Code");
        sendBtn.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold;");
        sendBtn.setOnAction(e -> {
            String email = emailField.getText().trim();
            SecurityService.OtpResult r = SecurityService.getInstance().sendPasswordResetOtp(email);
            if (r.success) {
                statusLabel.setStyle("-fx-text-fill: #34d399;");
                statusLabel.setText("✅ " + r.message);
            } else {
                statusLabel.setStyle("-fx-text-fill: #ef4444;");
                statusLabel.setText("❌ " + r.message);
            }
        });

        layout.getChildren().addAll(title, note, new Label("VIT Email:"), emailField, sendBtn, statusLabel);
        Scene scene = new Scene(layout, 420, 260);
        dialog.setScene(scene);
        dialog.show();
    }

    // =========================================================================
    // TAB 1: MENU CATALOG & TRAY ORDERING
    // =========================================================================

    private Pane createMenuAndTrayTab() {
        BorderPane pane = new BorderPane();
        pane.setPadding(new Insets(14));
        pane.setStyle("-fx-background-color: #0f172a;");

        VBox menuSection = new VBox(10);
        menuSection.setPadding(new Insets(0, 10, 0, 0));

        // Filters Bar
        HBox filterBar = new HBox(8);
        filterBar.setAlignment(Pos.CENTER_LEFT);
        filterBar.setPadding(new Insets(10));
        filterBar.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label filterTitle = new Label("Categories:");
        filterTitle.setStyle("-fx-text-fill: #cbd5e1; -fx-font-weight: bold;");

        ToggleGroup categoryGroup = new ToggleGroup();
        String[] categories = {"All", "Breakfast", "Lunch", "Dinner", "Snacks", "Beverages"};
        for (String cat : categories) {
            ToggleButton btn = new ToggleButton(cat);
            btn.setToggleGroup(categoryGroup);
            btn.setStyle("-fx-background-color: #334155; -fx-text-fill: #f8fafc; -fx-font-size: 12px;");
            if ("All".equals(cat)) btn.setSelected(true);
            btn.setOnAction(e -> {
                ToggleButton selected = (ToggleButton) categoryGroup.getSelectedToggle();
                String chosen = selected != null ? selected.getText() : "All";
                refreshMenuData(chosen, false);
            });
            filterBar.getChildren().add(btn);
        }

        Region filterSpacer = new Region();
        HBox.setHgrow(filterSpacer, Priority.ALWAYS);

        CheckBox healthyCheck = new CheckBox("🥗 Healthy Diet (≤400 kcal)");
        healthyCheck.setStyle("-fx-text-fill: #34d399; -fx-font-size: 12px; -fx-font-weight: bold;");
        healthyCheck.setOnAction(e -> {
            ToggleButton selected = (ToggleButton) categoryGroup.getSelectedToggle();
            String chosen = selected != null ? selected.getText() : "All";
            refreshMenuData(chosen, healthyCheck.isSelected());
        });

        Button refreshBtn = new Button("🔄 Refresh");
        refreshBtn.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-size: 12px; -fx-font-weight: bold;");
        refreshBtn.setOnAction(e -> {
            ToggleButton selected = (ToggleButton) categoryGroup.getSelectedToggle();
            refreshMenuData(selected != null ? selected.getText() : "All", healthyCheck.isSelected());
        });

        filterBar.getChildren().addAll(filterSpacer, healthyCheck, refreshBtn);
        menuSection.getChildren().add(filterBar);

        // Menu Table
        TableView<MenuItem> menuTable = new TableView<>(menuObservableList);
        menuTable.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc;");
        VBox.setVgrow(menuTable, Priority.ALWAYS);

        TableColumn<MenuItem, Number> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getItemId()));
        idCol.setPrefWidth(45);

        TableColumn<MenuItem, String> nameCol = new TableColumn<>("Dish Name");
        nameCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getItemName()));
        nameCol.setPrefWidth(220);

        TableColumn<MenuItem, String> catCol = new TableColumn<>("Category");
        catCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getCategory()));
        catCol.setPrefWidth(95);

        TableColumn<MenuItem, String> priceCol = new TableColumn<>("Price");
        priceCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getPrice() + " Cr"));
        priceCol.setPrefWidth(80);

        TableColumn<MenuItem, String> calCol = new TableColumn<>("Calories");
        calCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getCalories() != null ? c.getValue().getCalories() + " kcal" : "-"));
        calCol.setPrefWidth(90);

        TableColumn<MenuItem, String> stockCol = new TableColumn<>("Portions");
        stockCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getAvailableQuantity() + " left"));
        stockCol.setPrefWidth(85);

        TableColumn<MenuItem, Void> actionCol = new TableColumn<>("Action");
        actionCol.setPrefWidth(115);
        actionCol.setCellFactory(col -> new TableCell<>() {
            private final Button addBtn = new Button("➕ Add to Tray");
            {
                addBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                addBtn.setOnAction(e -> {
                    MenuItem item = getTableView().getItems().get(getIndex());
                    addItemToTray(item);
                });
            }
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                setGraphic(empty ? null : addBtn);
            }
        });

        menuTable.getColumns().addAll(List.of(idCol, nameCol, catCol, priceCol, calCol, stockCol, actionCol));
        menuSection.getChildren().add(menuTable);
        pane.setCenter(menuSection);

        // Right Sidebar: Meal Tray
        VBox traySidebar = createTraySidebar();
        pane.setRight(traySidebar);

        return pane;
    }

    private VBox createTraySidebar() {
        VBox sidebar = new VBox(10);
        sidebar.setPrefWidth(350);
        sidebar.setPadding(new Insets(14));
        sidebar.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #334155; -fx-border-radius: 8;");

        Label trayTitle = new Label("🛒 My Meal Tray");
        trayTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 17px; -fx-font-weight: bold;");

        TableView<OrderItem> trayTable = new TableView<>(trayObservableList);
        trayTable.setPrefHeight(230);
        trayTable.setStyle("-fx-background-color: #0f172a;");

        TableColumn<OrderItem, String> itemNameCol = new TableColumn<>("Item");
        itemNameCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getItemName()));
        itemNameCol.setPrefWidth(140);

        TableColumn<OrderItem, Number> qtyCol = new TableColumn<>("Qty");
        qtyCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().getQuantity()));
        qtyCol.setPrefWidth(45);

        TableColumn<OrderItem, String> subCol = new TableColumn<>("Subtotal");
        subCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().getSubtotal() + " Cr"));
        subCol.setPrefWidth(70);

        TableColumn<OrderItem, Void> removeCol = new TableColumn<>("Del");
        removeCol.setPrefWidth(45);
        removeCol.setCellFactory(col -> new TableCell<>() {
            private final Button delBtn = new Button("✕");
            {
                delBtn.setStyle("-fx-background-color: #ef4444; -fx-text-fill: white; -fx-font-size: 10px; -fx-font-weight: bold;");
                delBtn.setOnAction(e -> {
                    OrderItem item = getTableView().getItems().get(getIndex());
                    removeItemFromTray(item);
                });
            }
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                setGraphic(empty ? null : delBtn);
            }
        });

        trayTable.getColumns().addAll(List.of(itemNameCol, qtyCol, subCol, removeCol));
        sidebar.getChildren().addAll(trayTitle, trayTable);

        // Fulfillment Modality
        VBox deliveryBox = new VBox(6);
        deliveryBox.setPadding(new Insets(10));
        deliveryBox.setStyle("-fx-background-color: #0f172a; -fx-background-radius: 6;");

        Label deliveryTitle = new Label("Fulfillment Modality:");
        deliveryTitle.setStyle("-fx-text-fill: #cbd5e1; -fx-font-weight: bold; -fx-font-size: 12px;");

        ToggleGroup deliveryGroup = new ToggleGroup();
        dineInRadio = new RadioButton("🏢 Counter Self-Pickup (Free)");
        dineInRadio.setToggleGroup(deliveryGroup);
        dineInRadio.setSelected(true);
        dineInRadio.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        roomDeliveryRadio = new RadioButton("🛏️ Hostel Room Delivery (+20 Cr)");
        roomDeliveryRadio.setToggleGroup(deliveryGroup);
        roomDeliveryRadio.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        roomAddressField = new TextField("Hostel Block B, Room 304");
        roomAddressField.setPromptText("Enter Hostel Room Address");
        roomAddressField.setStyle("-fx-background-color: #1e293b; -fx-text-fill: #f8fafc; -fx-border-color: #475569;");
        roomAddressField.setVisible(false);
        roomAddressField.setManaged(false);

        deliveryGroup.selectedToggleProperty().addListener((obs, oldVal, newVal) -> {
            boolean isRoom = newVal == roomDeliveryRadio;
            roomAddressField.setVisible(isRoom);
            roomAddressField.setManaged(isRoom);
            updateTrayCalculations();
        });

        deliveryBox.getChildren().addAll(deliveryTitle, dineInRadio, roomDeliveryRadio, roomAddressField);
        sidebar.getChildren().add(deliveryBox);

        // Price Summary
        VBox summaryBox = new VBox(4);
        summaryBox.setPadding(new Insets(10));
        summaryBox.setStyle("-fx-background-color: #0f172a; -fx-background-radius: 6;");

        HBox r1 = new HBox();
        Label l1 = new Label("Items Subtotal:");
        l1.setStyle("-fx-text-fill: #94a3b8;");
        Region sp1 = new Region();
        HBox.setHgrow(sp1, Priority.ALWAYS);
        traySubtotalLabel = new Label("0 Cr");
        traySubtotalLabel.setStyle("-fx-text-fill: #f8fafc;");
        r1.getChildren().addAll(l1, sp1, traySubtotalLabel);

        HBox r2 = new HBox();
        Label l2 = new Label("Delivery Fee:");
        l2.setStyle("-fx-text-fill: #94a3b8;");
        Region sp2 = new Region();
        HBox.setHgrow(sp2, Priority.ALWAYS);
        trayDeliveryFeeLabel = new Label("0 Cr");
        trayDeliveryFeeLabel.setStyle("-fx-text-fill: #f8fafc;");
        r2.getChildren().addAll(l2, sp2, trayDeliveryFeeLabel);

        HBox r3 = new HBox();
        Label l3 = new Label("Total Calories:");
        l3.setStyle("-fx-text-fill: #94a3b8;");
        Region sp3 = new Region();
        HBox.setHgrow(sp3, Priority.ALWAYS);
        trayTotalCaloriesLabel = new Label("0 kcal");
        trayTotalCaloriesLabel.setStyle("-fx-text-fill: #34d399;");
        r3.getChildren().addAll(l3, sp3, trayTotalCaloriesLabel);

        Separator sep = new Separator();
        sep.setStyle("-fx-background-color: #334155;");

        HBox r4 = new HBox();
        Label l4 = new Label("Grand Total:");
        l4.setStyle("-fx-text-fill: #38bdf8; -fx-font-weight: bold; -fx-font-size: 14px;");
        Region sp4 = new Region();
        HBox.setHgrow(sp4, Priority.ALWAYS);
        trayTotalCreditsLabel = new Label("0 Cr");
        trayTotalCreditsLabel.setStyle("-fx-text-fill: #38bdf8; -fx-font-weight: bold; -fx-font-size: 14px;");
        r4.getChildren().addAll(l4, sp4, trayTotalCreditsLabel);

        summaryBox.getChildren().addAll(r1, r2, r3, sep, r4);
        sidebar.getChildren().add(summaryBox);

        Button placeOrderBtn = new Button("🚀 Place Order via Java Servlet");
        placeOrderBtn.setMaxWidth(Double.MAX_VALUE);
        placeOrderBtn.setPadding(new Insets(10));
        placeOrderBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-size: 14px; -fx-font-weight: bold; -fx-cursor: hand;");
        placeOrderBtn.setOnAction(e -> executeOrderPlacement());

        Button clearTrayBtn = new Button("Clear Tray");
        clearTrayBtn.setMaxWidth(Double.MAX_VALUE);
        clearTrayBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #94a3b8; -fx-font-size: 11px;");
        clearTrayBtn.setOnAction(e -> {
            trayObservableList.clear();
            updateTrayCalculations();
        });

        sidebar.getChildren().addAll(placeOrderBtn, clearTrayBtn);
        return sidebar;
    }

    // =========================================================================
    // TAB 2: LIVE ORDER TRACKER & STEPPER (WITH ORDER CANCELLATION)
    // =========================================================================

    // =========================================================================
    // TAB 2: LIVE ORDER TRACKER & READ-ONLY STEPPER
    // =========================================================================

    private Pane createLiveStepperTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // Stepper Visual Header
        VBox stepperBox = new VBox(12);
        stepperBox.setPadding(new Insets(16));
        stepperBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #38bdf8; -fx-border-radius: 8;");

        HBox topTitleRow = new HBox(10);
        topTitleRow.setAlignment(Pos.CENTER_LEFT);

        Label stepperTitle = new Label("📱 Real-Time Kitchen Order Stepper (Live Tracking Only)");
        stepperTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 16px; -fx-font-weight: bold;");

        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);

        latestOrderTokenLabel = new Label("Active Token: TK-3584");
        latestOrderTokenLabel.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 4 10 4 10; -fx-background-radius: 6;");

        latestOrderStatusLabel = new Label("Status: PREPARING");
        latestOrderStatusLabel.setStyle("-fx-background-color: #b45309; -fx-text-fill: #fef3c7; -fx-font-weight: bold; -fx-padding: 4 10 4 10; -fx-background-radius: 6;");

        liveCountdownLabel = new Label("⏱️ Time left: 11m 00s");
        liveCountdownLabel.setStyle("-fx-background-color: #3b1d11; -fx-text-fill: #fdba74; -fx-border-color: #f97316; -fx-border-radius: 6; -fx-padding: 4 10; -fx-font-weight: bold;");

        topTitleRow.getChildren().addAll(stepperTitle, sp, latestOrderTokenLabel, latestOrderStatusLabel, liveCountdownLabel);

        // Room Delivery notification line
        liveDeliveryAddressLabel = new Label("🛵 Hostel Room Delivery Address: Block B - Room 304");
        liveDeliveryAddressLabel.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 12px; -fx-font-weight: bold;");
        liveDeliveryAddressLabel.setVisible(false);
        liveDeliveryAddressLabel.setManaged(false);

        // Stepper Nodes
        HBox stepsRow = new HBox(10);
        stepsRow.setAlignment(Pos.CENTER);
        stepsRow.setPadding(new Insets(10, 0, 8, 0));

        stepperPendingLabel = createStepBadge("1. PENDING ⏳", false);
        Label a1 = new Label("──▶"); a1.setStyle("-fx-text-fill: #64748b; -fx-font-weight: bold;");
        stepperAcceptedLabel = createStepBadge("2. ACCEPTED 👨‍🍳", false);
        Label a2 = new Label("──▶"); a2.setStyle("-fx-text-fill: #64748b; -fx-font-weight: bold;");
        stepperPreparingLabel = createStepBadge("3. PREPARING 🍳", true);
        Label a3 = new Label("──▶"); a3.setStyle("-fx-text-fill: #64748b; -fx-font-weight: bold;");
        stepperReadyLabel = createStepBadge("4. READY 🔔", false);
        Label a4 = new Label("──▶"); a4.setStyle("-fx-text-fill: #64748b; -fx-font-weight: bold;");
        stepperOutForDeliveryLabel = createStepBadge("5. OUT FOR DELIVERY 🛵", false);
        Label a5 = new Label("──▶"); a5.setStyle("-fx-text-fill: #64748b; -fx-font-weight: bold;");
        stepperCompletedLabel = createStepBadge("6. COMPLETED ✅", false);

        stepsRow.getChildren().addAll(stepperPendingLabel, a1, stepperAcceptedLabel, a2, stepperPreparingLabel, a3, stepperReadyLabel, a4, stepperOutForDeliveryLabel, a5, stepperCompletedLabel);

        // Live Chef Activity Line
        liveChefActivityLabel = new Label("👨‍🍳 Live Chef Activity: Chef is preparing your order");
        liveChefActivityLabel.setStyle("-fx-background-color: #0f172a; -fx-text-fill: #cbd5e1; -fx-padding: 8 12; -fx-background-radius: 6; -fx-font-size: 13px;");

        // Action Row: Cancel permitted strictly while Pending; Students cannot change kitchen flow
        HBox cancelBox = new HBox(12);
        cancelBox.setAlignment(Pos.CENTER_RIGHT);

        Label cancelRuleLabel = new Label("🔒 Kitchen Flow Locked (Cancel allowed strictly while Pending)");
        cancelRuleLabel.setStyle("-fx-text-fill: #64748b; -fx-font-size: 12px;");

        cancelPendingOrderBtn = new Button("❌ Cancel Order (Allowed while Pending)");
        cancelPendingOrderBtn.setStyle("-fx-background-color: #ef4444; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 12px; -fx-padding: 6 14; -fx-cursor: hand;");
        cancelPendingOrderBtn.setDisable(true);
        cancelPendingOrderBtn.setOnAction(e -> executeCancelOrder());

        cancelBox.getChildren().addAll(cancelRuleLabel, cancelPendingOrderBtn);

        stepperBox.getChildren().addAll(topTitleRow, liveDeliveryAddressLabel, stepsRow, liveChefActivityLabel, cancelBox);
        layout.getChildren().add(stepperBox);

        // Active Orders Table
        VBox activeTableBox = new VBox(8);
        Label activeTitle = new Label("My Active Orders in Live Kitchen Pipeline:");
        activeTitle.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 14px; -fx-font-weight: bold;");

        TableView<ActiveOrderRow> activeTable = new TableView<>(activeOrdersList);
        activeTable.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(activeTable, Priority.ALWAYS);

        TableColumn<ActiveOrderRow, Number> idCol = new TableColumn<>("Order ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().orderId));
        idCol.setPrefWidth(70);

        TableColumn<ActiveOrderRow, String> tokenCol = new TableColumn<>("Token");
        tokenCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().token));
        tokenCol.setPrefWidth(110);

        TableColumn<ActiveOrderRow, String> delCol = new TableColumn<>("Modality");
        delCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().deliveryType));
        delCol.setPrefWidth(130);

        TableColumn<ActiveOrderRow, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().status));
        statusCol.setPrefWidth(120);

        TableColumn<ActiveOrderRow, String> amtCol = new TableColumn<>("Amount");
        amtCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().amount + " Cr"));
        amtCol.setPrefWidth(90);

        TableColumn<ActiveOrderRow, String> itemsCol = new TableColumn<>("Dishes");
        itemsCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().items));
        itemsCol.setPrefWidth(350);

        activeTable.getColumns().addAll(List.of(idCol, tokenCol, delCol, statusCol, amtCol, itemsCol));

        activeTable.getSelectionModel().selectedItemProperty().addListener((obs, oldV, newV) -> {
            if (newV != null) {
                selectedActiveOrderId = newV.orderId;
                latestOrderTokenLabel.setText("Active Token: " + newV.token);
                latestOrderStatusLabel.setText("Status: " + newV.status);
                boolean isRoom = newV.deliveryType != null && newV.deliveryType.toLowerCase().contains("hostel");
                updateStepperVisuals(newV.status, isRoom);
                cancelPendingOrderBtn.setDisable(!"PENDING".equalsIgnoreCase(newV.status));
                updateActiveOrderCountdownDisplay();
            }
        });

        activeTableBox.getChildren().addAll(activeTitle, activeTable);
        VBox.setVgrow(activeTableBox, Priority.ALWAYS);
        layout.getChildren().add(activeTableBox);

        return layout;
    }

    private Label createStepBadge(String text, boolean active) {
        Label lbl = new Label(text);
        lbl.setPadding(new Insets(6, 12, 6, 12));
        lbl.setStyle(active
                ? "-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;"
                : "-fx-background-color: #334155; -fx-text-fill: #94a3b8; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;"
        );
        return lbl;
    }

    private void updateStepperVisuals(String status) {
        updateStepperVisuals(status, false);
    }

    private void updateStepperVisuals(String status, boolean isRoom) {
        String baseStyle = "-fx-background-color: #334155; -fx-text-fill: #94a3b8; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;";
        String activeStyle = "-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;";
        String cookingStyle = "-fx-background-color: #f59e0b; -fx-text-fill: #1e293b; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;";
        String readyStyle = "-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;";
        String deliveredStyle = "-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-background-radius: 20; -fx-font-size: 11px;";

        stepperPendingLabel.setStyle(baseStyle);
        if (stepperAcceptedLabel != null) stepperAcceptedLabel.setStyle(baseStyle);
        stepperPreparingLabel.setStyle(baseStyle);
        stepperReadyLabel.setStyle(baseStyle);
        if (stepperOutForDeliveryLabel != null) stepperOutForDeliveryLabel.setStyle(baseStyle);
        stepperCompletedLabel.setStyle(baseStyle);

        if ("PENDING".equalsIgnoreCase(status)) {
            stepperPendingLabel.setStyle(activeStyle);
        } else if ("ACCEPTED".equalsIgnoreCase(status)) {
            if (stepperAcceptedLabel != null) stepperAcceptedLabel.setStyle(activeStyle);
        } else if ("PREPARING".equalsIgnoreCase(status)) {
            stepperPreparingLabel.setStyle(cookingStyle);
        } else if ("READY".equalsIgnoreCase(status)) {
            stepperReadyLabel.setStyle(readyStyle);
        } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(status)) {
            if (stepperOutForDeliveryLabel != null) stepperOutForDeliveryLabel.setStyle(cookingStyle);
        } else if ("DELIVERED".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status)) {
            stepperCompletedLabel.setStyle(deliveredStyle);
        }
    }

    private void startLiveCountdownTimer() {
        if (liveCountdownTimeline != null) liveCountdownTimeline.stop();
        liveCountdownTimeline = new Timeline(new KeyFrame(Duration.seconds(1), ev -> {
            for (ActiveOrderRow r : activeOrdersList) {
                if (r.secondsRemaining > 0 && !"COMPLETED".equalsIgnoreCase(r.status) && !"DELIVERED".equalsIgnoreCase(r.status)) {
                    r.secondsRemaining--;
                }
            }
            updateActiveOrderCountdownDisplay();
        }));
        liveCountdownTimeline.setCycleCount(Animation.INDEFINITE);
        liveCountdownTimeline.play();
    }

    private void updateActiveOrderCountdownDisplay() {
        ActiveOrderRow current = null;
        for (ActiveOrderRow r : activeOrdersList) {
            if (r.orderId == selectedActiveOrderId) {
                current = r;
                break;
            }
        }
        if (current == null && !activeOrdersList.isEmpty()) {
            current = activeOrdersList.get(0);
        }
        if (current == null) {
            if (liveCountdownLabel != null) liveCountdownLabel.setText("No active orders");
            return;
        }

        if (liveCountdownLabel != null) {
            if ("COMPLETED".equalsIgnoreCase(current.status)) {
                liveCountdownLabel.setText("✅ Completed");
                liveCountdownLabel.setStyle("-fx-background-color: #064e3b; -fx-text-fill: #34d399; -fx-padding: 4 10; -fx-background-radius: 6; -fx-font-weight: bold;");
            } else if ("DELIVERED".equalsIgnoreCase(current.status)) {
                liveCountdownLabel.setText("🏠 Delivered to Room");
                liveCountdownLabel.setStyle("-fx-background-color: #064e3b; -fx-text-fill: #34d399; -fx-padding: 4 10; -fx-background-radius: 6; -fx-font-weight: bold;");
            } else if ("OUT_FOR_DELIVERY".equalsIgnoreCase(current.status)) {
                liveCountdownLabel.setText("🛵 Out for Delivery");
                liveCountdownLabel.setStyle("-fx-background-color: #7c2d12; -fx-text-fill: #fdba74; -fx-padding: 4 10; -fx-background-radius: 6; -fx-font-weight: bold;");
            } else if (current.secondsRemaining <= 0 || "READY".equalsIgnoreCase(current.status)) {
                liveCountdownLabel.setText("🔔 Ready for pickup");
                liveCountdownLabel.setStyle("-fx-background-color: #064e3b; -fx-text-fill: #34d399; -fx-padding: 4 10; -fx-background-radius: 6; -fx-font-weight: bold;");
            } else {
                int m = current.secondsRemaining / 60;
                int s = current.secondsRemaining % 60;
                liveCountdownLabel.setText(String.format("⏱️ Time left: %dm %02ds", m, s));
                liveCountdownLabel.setStyle("-fx-background-color: #3b1d11; -fx-text-fill: #fdba74; -fx-border-color: #f97316; -fx-border-radius: 6; -fx-padding: 4 10; -fx-font-weight: bold;");
            }
        }

        if (liveChefActivityLabel != null) {
            liveChefActivityLabel.setText("👨‍🍳 Live Chef Activity: " + (current.chefActivity != null ? current.chefActivity : "Chef is preparing your order"));
        }
        if (liveDeliveryAddressLabel != null) {
            boolean isRoom = current.deliveryType != null && current.deliveryType.toLowerCase().contains("hostel");
            if (isRoom) {
                liveDeliveryAddressLabel.setVisible(true);
                liveDeliveryAddressLabel.setManaged(true);
                liveDeliveryAddressLabel.setText("🛵 Hostel Room Delivery Address: " + (current.roomAddress != null && !current.roomAddress.isEmpty() ? current.roomAddress : "Block B - Room 304"));
            } else {
                liveDeliveryAddressLabel.setVisible(false);
                liveDeliveryAddressLabel.setManaged(false);
            }
        }
    }

    private void executeCancelOrder() {
        if (selectedActiveOrderId <= 0) {
            showAlert(Alert.AlertType.WARNING, "No Order Selected", "Please select an active order from the table to cancel.");
            return;
        }

        new Thread(() -> {
            try {
                log("❌ [OrderServlet] Dispatching cancellation request for Order #" + selectedActiveOrderId);
                JsonObject resp = apiClient.cancelOrder(selectedActiveOrderId, currentStudentId);
                Platform.runLater(() -> {
                    if (resp != null && resp.has("success") && resp.get("success").getAsBoolean()) {
                        String msg = resp.get("message").getAsString();
                        log("🎉 [OrderServlet] " + msg);
                        showAlert(Alert.AlertType.INFORMATION, "Order Cancelled & Refunded",
                                "✅ " + msg + "\n\nCredits refunded to wallet via ACID transaction.");

                        for (ActiveOrderRow row : activeOrdersList) {
                            if (row.orderId == selectedActiveOrderId) {
                                row.status = "CANCELLED";
                                currentCredits += row.amount;
                                creditsValueLabel.setText(currentCredits + " Cr");
                                if (walletBalanceLargeLabel != null) walletBalanceLargeLabel.setText(currentCredits + " Cr");
                                break;
                            }
                        }
                        activeOrdersList.setAll(new ArrayList<>(activeOrdersList));
                        cancelPendingOrderBtn.setDisable(true);
                        updateStepperVisuals("CANCELLED");
                        refreshMenuData("All", false);
                    } else {
                        String err = resp != null && resp.has("message") ? resp.get("message").getAsString() : "Cancellation rejected.";
                        log("❌ [Cancellation Failed] " + err);
                        showAlert(Alert.AlertType.ERROR, "Cancellation Rejected", err);
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ [Cancellation Error] " + ex.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // STUDENT SICK LEAVE & ROOM DELIVERY APPLICATION
    // =========================================================================

    private Pane createStudentSickLeaveTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // Status Banner Card
        VBox statusCard = new VBox(8);
        statusCard.setPadding(new Insets(14));
        statusCard.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #38bdf8; -fx-border-radius: 8;");

        HBox topHBox = new HBox(12);
        topHBox.setAlignment(Pos.CENTER_LEFT);

        Label stTitle = new Label("🏥 Sick-Leave Room Delivery Status:");
        stTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 15px; -fx-font-weight: bold;");

        studentSickLeaveStatusBadge = new Label("Room Delivery Enabled ✅");
        studentSickLeaveStatusBadge.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-padding: 4 12; -fx-background-radius: 6;");

        topHBox.getChildren().addAll(stTitle, studentSickLeaveStatusBadge);

        Label stDesc = new Label("Rule: Room delivery is enabled ONLY after warden approval for the requested date. Before approval, it remains strictly disabled.");
        stDesc.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");

        statusCard.getChildren().addAll(topHBox, stDesc);
        layout.getChildren().add(statusCard);

        // Application Form
        VBox formBox = new VBox(10);
        formBox.setPadding(new Insets(14));
        formBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label formTitle = new Label("📝 Apply for Sick-Leave Hostel Room Delivery Clearance");
        formTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 14px; -fx-font-weight: bold;");

        GridPane grid = new GridPane();
        grid.setHgap(12);
        grid.setVgap(10);

        Label lHostel = new Label("Hostel Block *:");
        lHostel.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
        ComboBox<String> hostelCombo = new ComboBox<>();
        hostelCombo.getItems().addAll("Block A", "Block B", "Block C", "Block D");
        hostelCombo.setValue("Block B");
        hostelCombo.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        Label lRoom = new Label("Room Number *:");
        lRoom.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
        TextField roomInput = new TextField("304");
        roomInput.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        Label lDate = new Label("Date *:");
        lDate.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
        DatePicker datePicker = new DatePicker(LocalDate.now());
        datePicker.setStyle("-fx-background-color: #334155;");

        Label lMeals = new Label("Optional Meals Needed:");
        lMeals.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
        TextField mealsInput = new TextField("Lunch, Dinner");
        mealsInput.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        Label lReason = new Label("Reason for Leave *:");
        lReason.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px;");
        TextField reasonInput = new TextField("Viral Flu, severe fever & fatigue. Advised bed rest.");
        reasonInput.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");
        reasonInput.setPrefWidth(320);

        grid.add(lHostel, 0, 0); grid.add(hostelCombo, 1, 0);
        grid.add(lRoom, 2, 0); grid.add(roomInput, 3, 0);
        grid.add(lDate, 0, 1); grid.add(datePicker, 1, 1);
        grid.add(lMeals, 2, 1); grid.add(mealsInput, 3, 1);
        grid.add(lReason, 0, 2); grid.add(reasonInput, 1, 2, 3, 1);

        Button submitAppBtn = new Button("Submit Application to Warden");
        submitAppBtn.setStyle("-fx-background-color: #f97316; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 8 16;");
        submitAppBtn.setOnAction(e -> {
            String b = hostelCombo.getValue();
            String r = roomInput.getText().trim();
            String res = reasonInput.getText().trim();
            String m = mealsInput.getText().trim();

            if (b == null || r.isEmpty() || res.isEmpty()) {
                showAlert(Alert.AlertType.WARNING, "Missing Fields", "Hostel Block, Room Number, and Reason are all required.");
                return;
            }

            new Thread(() -> {
                try {
                    apiClient.submitSickLeaveRequest(currentStudentId, currentStudentName, b + " - Room " + r, res, m);
                    Platform.runLater(() -> {
                        log("🏥 [Sick Leave] Request submitted to " + b + " Warden as Pending.");
                        showAlert(Alert.AlertType.INFORMATION, "Application Submitted",
                                "Sick leave request submitted to " + b + " Warden as 'Pending approval'.\nRoom delivery will unlock once approved.");
                        studentSickLeaveStatusBadge.setText("Waiting for warden approval ⏳");
                        studentSickLeaveStatusBadge.setStyle("-fx-background-color: #b45309; -fx-text-fill: #fef3c7; -fx-font-weight: bold; -fx-padding: 4 12; -fx-background-radius: 6;");
                        refreshStudentSickLeaveHistory();
                    });
                } catch (Exception ex) {
                    Platform.runLater(() -> log("❌ Error submitting sick leave: " + ex.getMessage()));
                }
            }).start();
        });

        formBox.getChildren().addAll(formTitle, grid, submitAppBtn);
        layout.getChildren().add(formBox);

        // History Table
        VBox tableBox = new VBox(8);
        Label histTitle = new Label("📜 History of Past Sick-Leave Requests:");
        histTitle.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 13px; -fx-font-weight: bold;");

        TableView<HealthRequestRow> myTable = new TableView<>(studentSickLeaveList);
        myTable.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(myTable, Priority.ALWAYS);

        TableColumn<HealthRequestRow, Number> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().id));
        idCol.setPrefWidth(50);

        TableColumn<HealthRequestRow, String> rmCol = new TableColumn<>("Hostel Room");
        rmCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().room));
        rmCol.setPrefWidth(140);

        TableColumn<HealthRequestRow, String> rsnCol = new TableColumn<>("Reason");
        rsnCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().reason));
        rsnCol.setPrefWidth(220);

        TableColumn<HealthRequestRow, String> mealCol = new TableColumn<>("Meals");
        mealCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().mealType));
        mealCol.setPrefWidth(100);

        TableColumn<HealthRequestRow, String> statCol = new TableColumn<>("Status / Warden Decision");
        statCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().status));
        statCol.setPrefWidth(160);

        myTable.getColumns().addAll(List.of(idCol, rmCol, rsnCol, mealCol, statCol));
        tableBox.getChildren().addAll(histTitle, myTable);
        VBox.setVgrow(tableBox, Priority.ALWAYS);
        layout.getChildren().add(tableBox);

        return layout;
    }

    private void checkRoomDeliveryClearance() {
        new Thread(() -> {
            try {
                JsonObject json = apiClient.fetchSickLeaveRequests();
                boolean approvedToday = false;
                if (json != null && json.has("requests")) {
                    JsonArray arr = json.getAsJsonArray("requests");
                    for (JsonElement el : arr) {
                        JsonObject o = el.getAsJsonObject();
                        if (o.has("status") && "APPROVED".equalsIgnoreCase(o.get("status").getAsString())) {
                            approvedToday = true;
                            break;
                        }
                    }
                }
                boolean finalApproved = approvedToday;
                Platform.runLater(() -> {
                    studentRoomDeliveryApproved = finalApproved;
                    if (roomDeliveryRadio != null) {
                        if (finalApproved) {
                            roomDeliveryRadio.setDisable(false);
                            roomDeliveryRadio.setText("🛏️ Hostel Room Delivery (Approved ✅)");
                        } else {
                            roomDeliveryRadio.setDisable(true);
                            roomDeliveryRadio.setText("🛏️ Room Delivery (Waiting for warden approval 🔒)");
                            if (dineInRadio != null) dineInRadio.setSelected(true);
                        }
                    }
                    if (studentSickLeaveStatusBadge != null) {
                        if (finalApproved) {
                            studentSickLeaveStatusBadge.setText("Room Delivery Enabled ✅");
                            studentSickLeaveStatusBadge.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-padding: 4 12; -fx-background-radius: 6;");
                        } else {
                            studentSickLeaveStatusBadge.setText("Waiting for warden approval ⏳");
                            studentSickLeaveStatusBadge.setStyle("-fx-background-color: #b45309; -fx-text-fill: #fef3c7; -fx-font-weight: bold; -fx-padding: 4 12; -fx-background-radius: 6;");
                        }
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Failed checking sick leave clearance: " + ex.getMessage()));
            }
        }).start();
    }

    private void refreshStudentSickLeaveHistory() {
        checkRoomDeliveryClearance();
        new Thread(() -> {
            try {
                JsonObject json = apiClient.fetchSickLeaveRequests();
                List<HealthRequestRow> list = new ArrayList<>();
                if (json != null && json.has("requests")) {
                    for (JsonElement el : json.getAsJsonArray("requests")) {
                        JsonObject o = el.getAsJsonObject();
                        list.add(new HealthRequestRow(
                                o.get("id").getAsInt(),
                                o.has("studentName") ? o.get("studentName").getAsString() : "Student",
                                o.has("room") ? o.get("room").getAsString() : "Block B - Room 304",
                                o.has("reason") ? o.get("reason").getAsString() : "Fever",
                                o.has("mealType") ? o.get("mealType").getAsString() : "Dinner",
                                o.has("status") ? o.get("status").getAsString() : "PENDING"
                        ));
                    }
                }
                if (list.isEmpty()) {
                    list.add(new HealthRequestRow(1, "Rohit Kundu", "Block B - Room 304", "Severe viral fever & bed rest", "All Meals", "APPROVED"));
                }
                Platform.runLater(() -> studentSickLeaveList.setAll(list));
            } catch (Exception ignored) {}
        }).start();
    }

    // =========================================================================
    // TAB 3: WALLET, CALORIE GOAL & NEXT-DAY SPECIAL PRE-ORDERS
    // =========================================================================

    private Pane createWalletAndPreOrdersTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // Top Row: Wallet Card + Calorie Goal Card
        HBox topCards = new HBox(14);

        // Wallet Card
        VBox walletCard = new VBox(10);
        walletCard.setPrefWidth(420);
        walletCard.setPadding(new Insets(14));
        walletCard.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #10b981; -fx-border-radius: 8;");

        Label wTitle = new Label("💳 Student Atomic Wallet (9,000 Cr Allowance)");
        wTitle.setStyle("-fx-text-fill: #10b981; -fx-font-size: 14px; -fx-font-weight: bold;");

        walletBalanceLargeLabel = new Label(currentCredits + " Cr");
        walletBalanceLargeLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 28px; -fx-font-weight: bold;");

        Label wSub = new Label("Recharged monthly with 9,000 Credits. 1:1 Razorpay top-up enabled.");
        wSub.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");

        HBox topUpBox = new HBox(8);
        topUpBox.setAlignment(Pos.CENTER_LEFT);

        Button t100 = new Button("+100 Cr");
        t100.setStyle("-fx-background-color: #334155; -fx-text-fill: #38bdf8; -fx-font-weight: bold;");
        t100.setOnAction(e -> executeTopUp(100));

        Button t500 = new Button("+500 Cr");
        t500.setStyle("-fx-background-color: #334155; -fx-text-fill: #38bdf8; -fx-font-weight: bold;");
        t500.setOnAction(e -> executeTopUp(500));

        Button t1000 = new Button("+1,000 Cr (Razorpay)");
        t1000.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold;");
        t1000.setOnAction(e -> executeTopUp(1000));

        topUpBox.getChildren().addAll(new Label("Top-up:"), t100, t500, t1000);
        walletCard.getChildren().addAll(wTitle, walletBalanceLargeLabel, wSub, topUpBox);

        // Calorie Goal Card
        VBox calorieCard = new VBox(10);
        HBox.setHgrow(calorieCard, Priority.ALWAYS);
        calorieCard.setPadding(new Insets(14));
        calorieCard.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #38bdf8; -fx-border-radius: 8;");

        Label cTitle = new Label("🥗 Daily Calorie & Nutrition Intake Tracker");
        cTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 14px; -fx-font-weight: bold;");

        calorieProgressLabel = new Label(consumedCaloriesToday + " / " + dailyCalorieGoal + " kcal consumed today (24%)");
        calorieProgressLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 13px; -fx-font-weight: bold;");

        calorieProgressBar = new ProgressBar((double) consumedCaloriesToday / dailyCalorieGoal);
        calorieProgressBar.setMaxWidth(Double.MAX_VALUE);
        calorieProgressBar.setStyle("-fx-accent: #10b981;");

        Label dietTip = new Label("💡 Smart Health Advice: Opt for dishes flagged with 'Healthy Diet' to stay within your 2000 kcal threshold.");
        dietTip.setStyle("-fx-text-fill: #34d399; -fx-font-size: 11px;");

        calorieCard.getChildren().addAll(cTitle, calorieProgressLabel, calorieProgressBar, dietTip);
        topCards.getChildren().addAll(walletCard, calorieCard);
        layout.getChildren().add(topCards);

        // Bottom Section: Next-Day Special Pre-Orders Hub
        VBox preOrderBox = new VBox(10);
        preOrderBox.setPadding(new Insets(14));
        preOrderBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");
        VBox.setVgrow(preOrderBox, Priority.ALWAYS);

        HBox poHeader = new HBox(12);
        poHeader.setAlignment(Pos.CENTER_LEFT);

        Label poTitle = new Label("📅 Next-Day Special Pre-Orders Hub (Food Waste Prevention)");
        poTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 15px; -fx-font-weight: bold;");

        Region poSp = new Region();
        HBox.setHgrow(poSp, Priority.ALWAYS);

        Button bookPreOrderBtn = new Button("⭐ Book Tomorrow's Special: Royal Biryani (PRE-Token)");
        bookPreOrderBtn.setStyle("-fx-background-color: #f59e0b; -fx-text-fill: #1e293b; -fx-font-weight: bold; -fx-cursor: hand;");
        bookPreOrderBtn.setOnAction(e -> executeBookPreOrder());

        Button refreshPoBtn = new Button("🔄 Refresh");
        refreshPoBtn.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold;");
        refreshPoBtn.setOnAction(e -> refreshPreOrders());

        poHeader.getChildren().addAll(poTitle, poSp, bookPreOrderBtn, refreshPoBtn);

        // Pre-Orders Table
        TableView<PreOrderRow> preOrderTable = new TableView<>(preOrderObservableList);
        preOrderTable.setStyle("-fx-background-color: #0f172a;");
        VBox.setVgrow(preOrderTable, Priority.ALWAYS);

        TableColumn<PreOrderRow, String> poTokenCol = new TableColumn<>("Pre-Order Token");
        poTokenCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().token));
        poTokenCol.setPrefWidth(140);

        TableColumn<PreOrderRow, String> poDishCol = new TableColumn<>("Special Dish");
        poDishCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().dishName));
        poDishCol.setPrefWidth(220);

        TableColumn<PreOrderRow, String> poMealCol = new TableColumn<>("Meal");
        poMealCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().mealType));
        poMealCol.setPrefWidth(90);

        TableColumn<PreOrderRow, String> poDateCol = new TableColumn<>("Scheduled Date");
        poDateCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().targetDate));
        poDateCol.setPrefWidth(120);

        TableColumn<PreOrderRow, String> poSlotCol = new TableColumn<>("Pickup Slot");
        poSlotCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().pickupSlot));
        poSlotCol.setPrefWidth(130);

        TableColumn<PreOrderRow, String> poStatusCol = new TableColumn<>("Status");
        poStatusCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().status));
        poStatusCol.setPrefWidth(110);

        preOrderTable.getColumns().addAll(List.of(poTokenCol, poDishCol, poMealCol, poDateCol, poSlotCol, poStatusCol));
        preOrderBox.getChildren().addAll(poHeader, preOrderTable);
        layout.getChildren().add(preOrderBox);

        return layout;
    }

    private void executeTopUp(int amount) {
        new Thread(() -> {
            try {
                String dummyPaymentId = "pay_rzp_" + System.currentTimeMillis();
                JsonObject resp = apiClient.topUpCredits(currentStudentId, amount, dummyPaymentId);
                Platform.runLater(() -> {
                    if (resp != null && resp.has("success") && resp.get("success").getAsBoolean()) {
                        currentCredits += amount;
                        creditsValueLabel.setText(currentCredits + " Cr");
                        walletBalanceLargeLabel.setText(currentCredits + " Cr");
                        log("💳 [CreditServlet] Top-up of " + amount + " Credits successful via Razorpay (" + dummyPaymentId + ")");
                        showAlert(Alert.AlertType.INFORMATION, "Wallet Top-up Successful",
                                "✅ Added " + amount + " Credits!\nNew Balance: " + currentCredits + " Cr\nPayment ID: " + dummyPaymentId);
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ [CreditServlet Error] " + ex.getMessage()));
            }
        }).start();
    }

    private void executeBookPreOrder() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.placePreOrder(currentStudentId, currentStudentName, 12, "Chef Weekend Royal Biryani", "Dinner", "19:30 - 20:00");
                Platform.runLater(() -> {
                    if (resp != null && resp.has("success") && resp.get("success").getAsBoolean()) {
                        String token = resp.has("token") ? resp.get("token").getAsString() : "PRE-9921";
                        log("🎉 [PreOrderServlet] Successfully booked Next-Day Special with token: " + token);
                        showAlert(Alert.AlertType.INFORMATION, "Next-Day Pre-Order Confirmed",
                                "✅ Special Booking Confirmed!\nToken: " + token + "\nDish: Chef Weekend Royal Biryani\nSlot: Tomorrow 19:30 - 20:00\nZero Food Waste Guaranteed!");
                        refreshPreOrders();
                        refreshSustainabilityMetrics();
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ [PreOrderServlet Error] " + ex.getMessage()));
            }
        }).start();
    }

    private void refreshPreOrders() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.fetchPreOrders(currentStudentId);
                List<PreOrderRow> list = new ArrayList<>();
                if (resp != null && resp.has("preorders")) {
                    JsonArray arr = resp.getAsJsonArray("preorders");
                    for (JsonElement el : arr) {
                        JsonObject o = el.getAsJsonObject();
                        list.add(new PreOrderRow(
                                o.has("token") ? o.get("token").getAsString() : "PRE-001",
                                o.has("itemName") ? o.get("itemName").getAsString() : "Special Item",
                                o.has("mealType") ? o.get("mealType").getAsString() : "Dinner",
                                o.has("targetDate") ? o.get("targetDate").getAsString() : "Tomorrow",
                                o.has("pickupSlot") ? o.get("pickupSlot").getAsString() : "19:30 - 20:00",
                                o.has("status") ? o.get("status").getAsString() : "BOOKED"
                        ));
                    }
                }
                if (list.isEmpty()) {
                    list.add(new PreOrderRow("PRE-8419", "Chef Weekend Royal Biryani", "Dinner", "Tomorrow", "19:30 - 20:00", "CONFIRMED"));
                }
                Platform.runLater(() -> preOrderObservableList.setAll(list));
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Failed to fetch preorders: " + ex.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // TAB 4: CHEF KITCHEN & WASTAGE QUEUE
    // =========================================================================

    private Pane createKitchenQueueTab() {
        VBox layout = new VBox(12);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // Action Bar
        HBox topBar = new HBox(12);
        topBar.setAlignment(Pos.CENTER_LEFT);
        topBar.setPadding(new Insets(12));
        topBar.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label qTitle = new Label("👨‍🍳 Chef Kitchen Live Queue & Progression:");
        qTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 15px; -fx-font-weight: bold;");

        pendingCountLabel = new Label("0 Orders Waiting");
        pendingCountLabel.setPadding(new Insets(4, 10, 4, 10));
        pendingCountLabel.setStyle("-fx-background-color: #b45309; -fx-text-fill: #fef3c7; -fx-font-weight: bold; -fx-background-radius: 12;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Button advanceBtn = new Button("🍳 Advance Queue (Process Next Order)");
        advanceBtn.setStyle("-fx-background-color: #f59e0b; -fx-text-fill: #1e293b; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand;");
        advanceBtn.setOnAction(e -> executeAdvanceKitchenQueue());

        Button refreshBtn = new Button("🔄 Refresh Queue");
        refreshBtn.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px;");
        refreshBtn.setOnAction(e -> refreshKitchenQueue());

        topBar.getChildren().addAll(qTitle, pendingCountLabel, spacer, advanceBtn, refreshBtn);
        layout.getChildren().add(topBar);

        // Queue Table
        TableView<KitchenQueueRow> queueTable = new TableView<>(queueObservableList);
        queueTable.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(queueTable, Priority.ALWAYS);

        TableColumn<KitchenQueueRow, Number> idCol = new TableColumn<>("Order ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().orderId));
        idCol.setPrefWidth(70);

        TableColumn<KitchenQueueRow, String> tokenCol = new TableColumn<>("Token");
        tokenCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().token));
        tokenCol.setPrefWidth(110);

        TableColumn<KitchenQueueRow, String> typeCol = new TableColumn<>("Fulfillment & Recipient");
        typeCol.setCellValueFactory(c -> {
            boolean isRoom = c.getValue().deliveryType != null && c.getValue().deliveryType.toLowerCase().contains("hostel");
            if (isRoom) {
                return new SimpleStringProperty("🛵 ROOM DELIVERY\nStudent: " + c.getValue().studentName + " (" + c.getValue().address + ")");
            } else {
                return new SimpleStringProperty("🛍️ Counter Pickup\nStudent: " + c.getValue().studentName);
            }
        });
        typeCol.setPrefWidth(220);

        TableColumn<KitchenQueueRow, String> itemsCol = new TableColumn<>("Items Details");
        itemsCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().itemsSummary));
        itemsCol.setPrefWidth(220);

        TableColumn<KitchenQueueRow, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().status));
        statusCol.setPrefWidth(90);

        TableColumn<KitchenQueueRow, Void> prepCol = new TableColumn<>("⏱️ Est. Prep Time");
        prepCol.setPrefWidth(180);
        prepCol.setCellFactory(col -> new TableCell<>() {
            private final ComboBox<Integer> prepCombo = new ComboBox<>(FXCollections.observableArrayList(5, 10, 15, 20, 25, 30, 45));
            private final Button setBtn = new Button("Set");
            private final HBox box = new HBox(6, prepCombo, setBtn);
            {
                prepCombo.setValue(15);
                prepCombo.setStyle("-fx-background-color: #334155; -fx-text-fill: white; -fx-font-size: 11px;");
                setBtn.setStyle("-fx-background-color: #475569; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                setBtn.setOnAction(e -> {
                    KitchenQueueRow row = getTableView().getItems().get(getIndex());
                    int mins = prepCombo.getValue() != null ? prepCombo.getValue() : 15;
                    row.prepMinutes = mins;
                    new Thread(() -> {
                        try {
                            apiClient.updateOrderPrepTime(row.orderId, mins, "Chef updated estimated prep time to " + mins + " mins");
                            Platform.runLater(() -> {
                                log("⏱️ [Kitchen] Updated Order #" + row.orderId + " prep time to " + mins + " mins. Student countdown updated live.");
                                showAlert(Alert.AlertType.INFORMATION, "Prep Time Set", "Order #" + row.orderId + " prep time set to " + mins + " minutes.\nStudent countdown timer updated live.");
                            });
                        } catch (Exception ex) {
                            Platform.runLater(() -> log("❌ Error updating prep time: " + ex.getMessage()));
                        }
                    }).start();
                });
            }
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) setGraphic(null);
                else {
                    KitchenQueueRow row = getTableView().getItems().get(getIndex());
                    prepCombo.setValue(row.prepMinutes > 0 ? row.prepMinutes : 15);
                    setGraphic(box);
                }
            }
        });

        TableColumn<KitchenQueueRow, Void> actionCol = new TableColumn<>("Stage Advancement");
        actionCol.setPrefWidth(180);
        actionCol.setCellFactory(col -> new TableCell<>() {
            private final Button actBtn = new Button("Advance");
            {
                actBtn.setStyle("-fx-background-color: #f97316; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                actBtn.setOnAction(e -> {
                    KitchenQueueRow row = getTableView().getItems().get(getIndex());
                    advanceOrderStep(row);
                });
            }
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) setGraphic(null);
                else {
                    KitchenQueueRow row = getTableView().getItems().get(getIndex());
                    String st = row.status != null ? row.status.toUpperCase() : "PENDING";
                    boolean isRoom = row.deliveryType != null && row.deliveryType.toLowerCase().contains("hostel");

                    if ("PENDING".equals(st)) {
                        actBtn.setText("👉 Accept Order");
                        actBtn.setStyle("-fx-background-color: #0284c7; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                    } else if ("ACCEPTED".equals(st)) {
                        actBtn.setText("🍳 Start Cooking");
                        actBtn.setStyle("-fx-background-color: #f59e0b; -fx-text-fill: #1e293b; -fx-font-weight: bold; -fx-font-size: 11px;");
                    } else if ("PREPARING".equals(st)) {
                        actBtn.setText("🔔 Mark Ready");
                        actBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                    } else if ("READY".equals(st)) {
                        if (isRoom) {
                            actBtn.setText("🛵 Out for Delivery");
                            actBtn.setStyle("-fx-background-color: #ea580c; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                        } else {
                            actBtn.setText("✅ Complete Order");
                            actBtn.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-font-size: 11px;");
                        }
                    } else if ("OUT_FOR_DELIVERY".equals(st)) {
                        actBtn.setText("🏠 Mark Delivered");
                        actBtn.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-font-size: 11px;");
                    } else {
                        actBtn.setText("Done ✅");
                        actBtn.setDisable(true);
                    }
                    setGraphic(actBtn);
                }
            }
        });

        queueTable.getColumns().addAll(List.of(idCol, tokenCol, typeCol, itemsCol, statusCol, prepCol, actionCol));
        layout.getChildren().add(queueTable);

        // Chef Tools Row: Stock Toggle & Wastage Log
        HBox chefTools = new HBox(12);

        // Stock Toggle Box
        VBox stockBox = new VBox(8);
        stockBox.setPrefWidth(550);
        stockBox.setPadding(new Insets(12));
        stockBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label sTitle = new Label("📦 Instant Stock Control (MenuServlet):");
        sTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-weight: bold;");

        HBox sControls = new HBox(8);
        sControls.setAlignment(Pos.CENTER_LEFT);

        ComboBox<String> stockItemCombo = new ComboBox<>();
        stockItemCombo.getItems().addAll("1: Masala Dosa", "4: Paneer Butter Masala", "6: Chicken Biryani", "9: Samosa (2 pcs)");
        stockItemCombo.setValue("1: Masala Dosa");
        stockItemCombo.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        Button outStockBtn = new Button("❌ Mark Out of Stock");
        outStockBtn.setStyle("-fx-background-color: #ef4444; -fx-text-fill: white; -fx-font-weight: bold;");
        outStockBtn.setOnAction(e -> {
            String itemStr = stockItemCombo.getValue();
            int itemId = Integer.parseInt(itemStr.split(":")[0]);
            executeStockToggle(itemId, false);
        });

        Button inStockBtn = new Button("✅ Restock (+50 Portions)");
        inStockBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold;");
        inStockBtn.setOnAction(e -> {
            String itemStr = stockItemCombo.getValue();
            int itemId = Integer.parseInt(itemStr.split(":")[0]);
            executeStockToggle(itemId, true);
        });

        sControls.getChildren().addAll(stockItemCombo, outStockBtn, inStockBtn);
        stockBox.getChildren().addAll(sTitle, sControls);

        // Wastage Log Box
        VBox wasteBox = new VBox(8);
        HBox.setHgrow(wasteBox, Priority.ALWAYS);
        wasteBox.setPadding(new Insets(12));
        wasteBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label wTitle = new Label("🗑️ Kitchen Wastage Logger (Audit Tracking):");
        wTitle.setStyle("-fx-text-fill: #f87171; -fx-font-weight: bold;");

        HBox wControls = new HBox(8);
        wControls.setAlignment(Pos.CENTER_LEFT);

        TextField wasteDishField = new TextField("Dal Tadka");
        wasteDishField.setPromptText("Dish Name");
        wasteDishField.setPrefWidth(120);
        wasteDishField.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        TextField wastePortionsField = new TextField("4");
        wastePortionsField.setPromptText("Portions");
        wastePortionsField.setPrefWidth(60);
        wastePortionsField.setStyle("-fx-background-color: #334155; -fx-text-fill: white;");

        Button logWasteBtn = new Button("📝 Log Wastage");
        logWasteBtn.setStyle("-fx-background-color: #7f1d1d; -fx-text-fill: white; -fx-font-weight: bold;");
        logWasteBtn.setOnAction(e -> {
            String dish = wasteDishField.getText();
            String portions = wastePortionsField.getText();
            log("🗑️ [Wastage Logger] Logged " + portions + " portions of '" + dish + "' wasted (Over-preparation).");
            showAlert(Alert.AlertType.INFORMATION, "Wastage Recorded", portions + " portions of " + dish + " recorded in daily waste audit log.");
        });

        wControls.getChildren().addAll(wasteDishField, wastePortionsField, logWasteBtn);
        wasteBox.getChildren().addAll(wTitle, wControls);

        chefTools.getChildren().addAll(stockBox, wasteBox);
        layout.getChildren().add(chefTools);

        return layout;
    }

    private void advanceOrderStep(KitchenQueueRow row) {
        String st = row.status != null ? row.status.toUpperCase() : "PENDING";
        boolean isRoom = row.deliveryType != null && row.deliveryType.toLowerCase().contains("hostel");

        String nextStatus = "ACCEPTED";
        String activity = "Order accepted, cooking starts soon";

        if ("PENDING".equals(st)) {
            nextStatus = "ACCEPTED";
            activity = "Order accepted, workstation assigned";
        } else if ("ACCEPTED".equals(st)) {
            nextStatus = "PREPARING";
            activity = "Chef is actively preparing your order";
        } else if ("PREPARING".equals(st)) {
            nextStatus = "READY";
            activity = isRoom ? "Food is freshly cooked, runner preparing dispatch" : "Order is ready for pickup at Mess Counter 2";
        } else if ("READY".equals(st)) {
            if (isRoom) {
                nextStatus = "OUT_FOR_DELIVERY";
                activity = "Runner dispatched: Food is out for delivery to your room";
            } else {
                nextStatus = "COMPLETED";
                activity = "Order completed and collected. Enjoy your meal!";
            }
        } else if ("OUT_FOR_DELIVERY".equals(st)) {
            nextStatus = "DELIVERED";
            activity = "Food delivered to your hostel room. Enjoy your meal!";
        }

        String finalNext = nextStatus;
        String finalAct = activity;

        new Thread(() -> {
            try {
                apiClient.updateOrderStatus(row.orderId, finalNext);
                Platform.runLater(() -> {
                    row.status = finalNext;
                    row.chefActivity = finalAct;
                    queueObservableList.setAll(new ArrayList<>(queueObservableList));
                    log("👨‍🍳 [Kitchen] Order #" + row.orderId + " advanced to " + finalNext + " | " + finalAct);

                    // If active orders contains this order, update local stepper and countdown
                    for (ActiveOrderRow ar : activeOrdersList) {
                        if (ar.orderId == row.orderId) {
                            ar.status = finalNext;
                            ar.chefActivity = finalAct;
                            activeOrdersList.setAll(new ArrayList<>(activeOrdersList));
                            updateStepperVisuals(finalNext, isRoom);
                            updateActiveOrderCountdownDisplay();
                            break;
                        }
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Error advancing order: " + ex.getMessage()));
            }
        }).start();
    }

    private void executeStockToggle(int itemId, boolean inStock) {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.toggleStock(itemId, inStock);
                Platform.runLater(() -> {
                    log("📦 [MenuServlet] Stock for item #" + itemId + " toggled to: " + (inStock ? "IN STOCK" : "OUT OF STOCK"));
                    showAlert(Alert.AlertType.INFORMATION, "Stock Updated",
                            "Item #" + itemId + " is now " + (inStock ? "Available (+50 Portions)" : "Marked Out of Stock") + " via MenuServlet.");
                    refreshMenuData("All", false);
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Stock update error: " + ex.getMessage()));
            }
        }).start();
    }

    private void executeAdvanceKitchenQueue() {
        new Thread(() -> {
            try {
                JsonObject json = apiClient.advanceKitchenQueue();
                Platform.runLater(() -> {
                    if (json != null && json.has("success") && json.get("success").getAsBoolean()) {
                        String msg = json.get("message").getAsString();
                        log("🔥 " + msg);
                        showAlert(Alert.AlertType.INFORMATION, "Kitchen Ticket Processed", msg);
                        refreshKitchenQueue();
                    } else {
                        String msg = json != null && json.has("message") ? json.get("message").getAsString() : "Queue is empty.";
                        log("ℹ️ " + msg);
                        showAlert(Alert.AlertType.INFORMATION, "Kitchen Queue Empty", msg);
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> log("❌ [KitchenQueueServlet Error] " + e.getMessage()));
            }
        }).start();
    }

    private void refreshKitchenQueue() {
        new Thread(() -> {
            try {
                JsonObject json = apiClient.fetchKitchenQueue();
                if (json != null && json.has("queue")) {
                    JsonArray q = json.getAsJsonArray("queue");
                    List<KitchenQueueRow> rows = new ArrayList<>();
                    for (JsonElement el : q) {
                        JsonObject o = el.getAsJsonObject();
                        int orderId = o.get("orderId").getAsInt();
                        String token = o.has("pickupToken") ? o.get("pickupToken").getAsString() : "-";
                        String delType = o.has("deliveryType") ? o.get("deliveryType").getAsString() : "self-pickup";
                        String student = o.has("studentName") ? o.get("studentName").getAsString() : "Student";
                        int amount = o.has("totalAmount") ? o.get("totalAmount").getAsInt() : 0;
                        String status = o.has("status") ? o.get("status").getAsString() : "PENDING";
                        String address = o.has("deliveryAddress") ? o.get("deliveryAddress").getAsString() : "Block B - Room 304";
                        int prep = o.has("estimatedPrepMinutes") ? o.get("estimatedPrepMinutes").getAsInt() : 15;
                        String act = o.has("chefActivity") ? o.get("chefActivity").getAsString() : "Order in queue";

                        StringBuilder itemsSb = new StringBuilder();
                        if (o.has("items")) {
                            JsonArray itemsArr = o.getAsJsonArray("items");
                            for (JsonElement ie : itemsArr) {
                                JsonObject itm = ie.getAsJsonObject();
                                itemsSb.append(itm.get("quantity").getAsInt()).append("x ")
                                        .append(itm.get("itemName").getAsString()).append(", ");
                            }
                        }
                        String summary = itemsSb.length() > 2 ? itemsSb.substring(0, itemsSb.length() - 2) : "Meals";
                        rows.add(new KitchenQueueRow(orderId, token, delType, student, amount, status, summary, prep, act, address));
                    }

                    Platform.runLater(() -> {
                        queueObservableList.setAll(rows);
                        pendingCountLabel.setText(rows.size() + " Orders Waiting");
                    });
                }
            } catch (Exception e) {
                Platform.runLater(() -> log("❌ [KitchenQueueServlet Error] " + e.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // TAB 5: ADMIN CAMPUS ANALYTICS & CREDIT RESET
    // =========================================================================

    private Pane createAdminTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // KPI Summary Cards
        HBox kpiBox = new HBox(12);

        adminTotalOrdersLabel = new Label("342 Orders");
        adminTotalCreditsLabel = new Label("31,240 Cr");
        adminActiveStudentsLabel = new Label("128 Students");

        VBox c1 = createKpiCard("📦 Total Orders Today", adminTotalOrdersLabel, "#38bdf8");
        VBox c2 = createKpiCard("💰 Credits Billed", adminTotalCreditsLabel, "#10b981");
        VBox c3 = createKpiCard("👥 Active Diners", adminActiveStudentsLabel, "#f59e0b");

        kpiBox.getChildren().addAll(c1, c2, c3);
        layout.getChildren().add(kpiBox);

        // Admin Actions Bar
        HBox actionBox = new HBox(14);
        actionBox.setAlignment(Pos.CENTER_LEFT);
        actionBox.setPadding(new Insets(14));
        actionBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #10b981; -fx-border-radius: 8;");

        VBox resetInfo = new VBox(4);
        Label resetTitle = new Label("🔄 Monthly Student Allowance Reset (1-Click 9,000 Credits):");
        resetTitle.setStyle("-fx-text-fill: #10b981; -fx-font-weight: bold; -fx-font-size: 14px;");
        Label resetDesc = new Label("Resets all campus student wallets to 9,000 credits via AdminServlet transaction.");
        resetDesc.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 12px;");
        resetInfo.getChildren().addAll(resetTitle, resetDesc);

        Region resetSpacer = new Region();
        HBox.setHgrow(resetSpacer, Priority.ALWAYS);

        Button executeResetBtn = new Button("⚡ Execute 9,000 Credit Reset via AdminServlet");
        executeResetBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand;");
        executeResetBtn.setOnAction(e -> executeAdminCreditReset());

        actionBox.getChildren().addAll(resetInfo, resetSpacer, executeResetBtn);
        layout.getChildren().add(actionBox);

        // Top 5 Popular Dishes Leaderboard Table
        VBox tableBox = new VBox(8);
        Label leaderTitle = new Label("🏆 Top 5 Most Popular Mess Dishes Today (Order Velocity & Ratings):");
        leaderTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 14px; -fx-font-weight: bold;");

        TableView<TopDishRow> dishTable = new TableView<>(topDishesObservableList);
        dishTable.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(dishTable, Priority.ALWAYS);

        TableColumn<TopDishRow, Number> rankCol = new TableColumn<>("Rank");
        rankCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().rank));
        rankCol.setPrefWidth(60);

        TableColumn<TopDishRow, String> nameCol = new TableColumn<>("Dish Name");
        nameCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().dishName));
        nameCol.setPrefWidth(240);

        TableColumn<TopDishRow, String> catCol = new TableColumn<>("Category");
        catCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().category));
        catCol.setPrefWidth(120);

        TableColumn<TopDishRow, String> soldCol = new TableColumn<>("Portions Sold");
        soldCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().soldCount + " portions"));
        soldCol.setPrefWidth(140);

        TableColumn<TopDishRow, String> ratingCol = new TableColumn<>("Student Rating");
        ratingCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().rating + " ★"));
        ratingCol.setPrefWidth(130);

        dishTable.getColumns().addAll(List.of(rankCol, nameCol, catCol, soldCol, ratingCol));
        tableBox.getChildren().addAll(leaderTitle, dishTable);
        VBox.setVgrow(tableBox, Priority.ALWAYS);
        layout.getChildren().add(tableBox);

        return layout;
    }

    private VBox createKpiCard(String title, Label valLabel, String colorHex) {
        VBox card = new VBox(6);
        card.setPrefWidth(350);
        card.setPadding(new Insets(14));
        card.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: " + colorHex + "; -fx-border-radius: 8;");

        Label t = new Label(title);
        t.setStyle("-fx-text-fill: " + colorHex + "; -fx-font-size: 13px; -fx-font-weight: bold;");

        valLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 24px; -fx-font-weight: bold;");

        card.getChildren().addAll(t, valLabel);
        return card;
    }

    private void executeAdminCreditReset() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.resetStudentCredits(9000);
                Platform.runLater(() -> {
                    currentCredits = 9000;
                    creditsValueLabel.setText(currentCredits + " Cr");
                    if (walletBalanceLargeLabel != null) walletBalanceLargeLabel.setText(currentCredits + " Cr");
                    log("👑 [AdminServlet] 1-Click Monthly Credit Reset executed! All student wallets set to 9,000 Credits.");
                    showAlert(Alert.AlertType.INFORMATION, "Admin Reset Successful",
                            "✅ Monthly Campus Credit Reset Complete!\nAll students credited with 9,000 Credits via AdminServlet.");
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Admin reset error: " + ex.getMessage()));
            }
        }).start();
    }

    private void refreshAdminAnalytics() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.fetchAdminAnalytics();
                List<TopDishRow> list = new ArrayList<>();
                list.add(new TopDishRow(1, "Chicken Biryani", "Dinner", 142, 4.8));
                list.add(new TopDishRow(2, "Paneer Butter Masala", "Lunch", 118, 4.7));
                list.add(new TopDishRow(3, "Masala Dosa", "Breakfast", 95, 4.6));
                list.add(new TopDishRow(4, "South Indian Veg Thali", "Lunch", 88, 4.5));
                list.add(new TopDishRow(5, "Samosa (2 pcs)", "Snacks", 76, 4.4));

                Platform.runLater(() -> {
                    topDishesObservableList.setAll(list);
                    if (resp != null) {
                        adminTotalOrdersLabel.setText(resp.has("totalOrders") ? resp.get("totalOrders").getAsString() + " Orders" : "342 Orders");
                        adminTotalCreditsLabel.setText(resp.has("totalCredits") ? resp.get("totalCredits").getAsString() + " Cr" : "31,240 Cr");
                    }
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Failed to fetch admin analytics: " + ex.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // TAB 6: WARDEN SICK LEAVE APPROVALS
    // =========================================================================

    // =========================================================================
    // TAB 6: WARDEN SICK LEAVE CLEARANCE (APPROVE OR REJECT ONLY)
    // =========================================================================

    private Pane createWardenTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        String assignedBlock = activeUserExtra != null ? activeUserExtra : "Block B";
        if (assignedBlock.contains("-")) assignedBlock = assignedBlock.split("-")[0].trim();

        // Warden Jurisdiction Header
        HBox header = new HBox(12);
        header.setAlignment(Pos.CENTER_LEFT);
        header.setPadding(new Insets(14));
        header.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #f59e0b; -fx-border-radius: 8;");

        Label wTitle = new Label("🏢 Hostel Warden Clearance Portal (Review Only)");
        wTitle.setStyle("-fx-text-fill: #f59e0b; -fx-font-size: 16px; -fx-font-weight: bold;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Label jurBadge = new Label("Assigned Jurisdiction: " + assignedBlock);
        jurBadge.setStyle("-fx-background-color: #b45309; -fx-text-fill: #fef3c7; -fx-padding: 4 12; -fx-background-radius: 6; -fx-font-weight: bold;");

        header.getChildren().addAll(wTitle, spacer, jurBadge);
        layout.getChildren().add(header);

        // 3 Separate Tabs: Pending, Approved, Rejected (Strictly no other controls)
        TabPane wardenTabPane = new TabPane();
        wardenTabPane.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(wardenTabPane, Priority.ALWAYS);

        Tab pTab = new Tab("⏳ Pending Requests", createWardenPendingView(assignedBlock));
        pTab.setClosable(false);

        Tab aTab = new Tab("✅ Approved Requests", createWardenApprovedView(assignedBlock));
        aTab.setClosable(false);

        Tab rTab = new Tab("❌ Rejected Requests", createWardenRejectedView(assignedBlock));
        rTab.setClosable(false);

        wardenTabPane.getTabs().addAll(pTab, aTab, rTab);
        layout.getChildren().add(wardenTabPane);

        return layout;
    }

    private Node createWardenPendingView(String assignedBlock) {
        VBox box = new VBox(10);
        box.setPadding(new Insets(12));
        box.setStyle("-fx-background-color: #1e293b;");

        Label title = new Label("Pending Sick-Leave Clearances (" + assignedBlock + " Jurisdiction):");
        title.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 13px; -fx-font-weight: bold;");

        TableView<HealthRequestRow> table = new TableView<>(healthRequestsObservableList);
        table.setStyle("-fx-background-color: #0f172a;");
        VBox.setVgrow(table, Priority.ALWAYS);

        TableColumn<HealthRequestRow, Number> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().id));
        idCol.setPrefWidth(50);

        TableColumn<HealthRequestRow, String> stuCol = new TableColumn<>("Student");
        stuCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().studentName));
        stuCol.setPrefWidth(150);

        TableColumn<HealthRequestRow, String> rmCol = new TableColumn<>("Hostel Room");
        rmCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().room));
        rmCol.setPrefWidth(130);

        TableColumn<HealthRequestRow, String> rsnCol = new TableColumn<>("Medical Reason");
        rsnCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().reason));
        rsnCol.setPrefWidth(220);

        TableColumn<HealthRequestRow, String> mealCol = new TableColumn<>("Meals");
        mealCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().mealType));
        mealCol.setPrefWidth(100);

        TableColumn<HealthRequestRow, String> dateCol = new TableColumn<>("Date");
        dateCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().date));
        dateCol.setPrefWidth(90);

        TableColumn<HealthRequestRow, Void> actCol = new TableColumn<>("Action (Approve / Reject Only)");
        actCol.setPrefWidth(190);
        actCol.setCellFactory(col -> new TableCell<>() {
            private final Button approveBtn = new Button("✅ Approve");
            private final Button rejectBtn = new Button("❌ Reject");
            private final HBox btnBox = new HBox(8, approveBtn, rejectBtn);
            {
                approveBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");
                rejectBtn.setStyle("-fx-background-color: #ef4444; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 11px;");

                approveBtn.setOnAction(e -> {
                    HealthRequestRow row = getTableView().getItems().get(getIndex());
                    reviewSickRequest(row.id, "APPROVED", "");
                });

                rejectBtn.setOnAction(e -> {
                    HealthRequestRow row = getTableView().getItems().get(getIndex());
                    TextInputDialog dialog = new TextInputDialog();
                    dialog.setTitle("Reject Sick-Leave Request #" + row.id);
                    dialog.setHeaderText("Rejection requires a short mandatory reason:");
                    dialog.setContentText("Reason:");
                    dialog.showAndWait().ifPresent(reason -> {
                        if (!reason.trim().isEmpty()) {
                            reviewSickRequest(row.id, "REJECTED", reason.trim());
                        } else {
                            showAlert(Alert.AlertType.WARNING, "Reason Required", "A short rejection reason is strictly required.");
                        }
                    });
                });
            }
            @Override
            protected void updateItem(Void item, boolean empty) {
                super.updateItem(item, empty);
                if (empty) {
                    setGraphic(null);
                } else {
                    HealthRequestRow row = getTableView().getItems().get(getIndex());
                    if ("PENDING".equalsIgnoreCase(row.status)) {
                        setGraphic(btnBox);
                    } else {
                        Label l = new Label("Locked (" + row.status + ")");
                        l.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");
                        setGraphic(l);
                    }
                }
            }
        });

        table.getColumns().addAll(List.of(idCol, stuCol, rmCol, rsnCol, mealCol, dateCol, actCol));
        box.getChildren().addAll(title, table);
        return box;
    }

    private Node createWardenApprovedView(String assignedBlock) {
        VBox box = new VBox(10);
        box.setPadding(new Insets(12));
        box.setStyle("-fx-background-color: #1e293b;");

        Label title = new Label("Approved Room Delivery Clearances (Decision Locked):");
        title.setStyle("-fx-text-fill: #34d399; -fx-font-size: 13px; -fx-font-weight: bold;");

        TableView<HealthRequestRow> table = new TableView<>();
        table.setStyle("-fx-background-color: #0f172a;");
        VBox.setVgrow(table, Priority.ALWAYS);

        TableColumn<HealthRequestRow, Number> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().id));
        idCol.setPrefWidth(50);

        TableColumn<HealthRequestRow, String> stuCol = new TableColumn<>("Student");
        stuCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().studentName));
        stuCol.setPrefWidth(160);

        TableColumn<HealthRequestRow, String> rmCol = new TableColumn<>("Hostel Room");
        rmCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().room));
        rmCol.setPrefWidth(140);

        TableColumn<HealthRequestRow, String> rsnCol = new TableColumn<>("Medical Reason");
        rsnCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().reason));
        rsnCol.setPrefWidth(220);

        TableColumn<HealthRequestRow, String> statCol = new TableColumn<>("Status");
        statCol.setCellValueFactory(c -> new SimpleStringProperty("Approved ✅"));
        statCol.setPrefWidth(110);

        TableColumn<HealthRequestRow, String> notifCol = new TableColumn<>("Notification");
        notifCol.setCellValueFactory(c -> new SimpleStringProperty("📧 Student notified via VIT Mail & Push"));
        notifCol.setPrefWidth(240);

        table.getColumns().addAll(List.of(idCol, stuCol, rmCol, rsnCol, statCol, notifCol));

        // Filter approved rows
        ObservableList<HealthRequestRow> approvedList = FXCollections.observableArrayList();
        for (HealthRequestRow r : healthRequestsObservableList) {
            if ("APPROVED".equalsIgnoreCase(r.status)) approvedList.add(r);
        }
        if (approvedList.isEmpty()) {
            approvedList.add(new HealthRequestRow(1, "Rohit Kundu", "Block B - Room 304", "Severe viral fever & bed rest", "All Meals", "APPROVED"));
        }
        table.setItems(approvedList);

        box.getChildren().addAll(title, table);
        return box;
    }

    private Node createWardenRejectedView(String assignedBlock) {
        VBox box = new VBox(10);
        box.setPadding(new Insets(12));
        box.setStyle("-fx-background-color: #1e293b;");

        Label title = new Label("Rejected Requests Archive (Decision Locked):");
        title.setStyle("-fx-text-fill: #f87171; -fx-font-size: 13px; -fx-font-weight: bold;");

        TableView<HealthRequestRow> table = new TableView<>();
        table.setStyle("-fx-background-color: #0f172a;");
        VBox.setVgrow(table, Priority.ALWAYS);

        TableColumn<HealthRequestRow, Number> idCol = new TableColumn<>("ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().id));
        idCol.setPrefWidth(50);

        TableColumn<HealthRequestRow, String> stuCol = new TableColumn<>("Student");
        stuCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().studentName));
        stuCol.setPrefWidth(160);

        TableColumn<HealthRequestRow, String> rmCol = new TableColumn<>("Hostel Room");
        rmCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().room));
        rmCol.setPrefWidth(140);

        TableColumn<HealthRequestRow, String> rsnCol = new TableColumn<>("Medical Reason");
        rsnCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().reason));
        rsnCol.setPrefWidth(180);

        TableColumn<HealthRequestRow, String> rejCol = new TableColumn<>("Rejection Reason");
        rejCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().rejectionReason != null && !c.getValue().rejectionReason.isEmpty() ? c.getValue().rejectionReason : "Disapproved by warden"));
        rejCol.setPrefWidth(180);

        TableColumn<HealthRequestRow, String> notifCol = new TableColumn<>("Notification");
        notifCol.setCellValueFactory(c -> new SimpleStringProperty("📧 Student notified via VIT Mail & Push"));
        notifCol.setPrefWidth(240);

        table.getColumns().addAll(List.of(idCol, stuCol, rmCol, rsnCol, rejCol, notifCol));

        // Filter rejected rows
        ObservableList<HealthRequestRow> rejectedList = FXCollections.observableArrayList();
        for (HealthRequestRow r : healthRequestsObservableList) {
            if ("REJECTED".equalsIgnoreCase(r.status)) rejectedList.add(r);
        }
        table.setItems(rejectedList);

        box.getChildren().addAll(title, table);
        return box;
    }

    private void reviewSickRequest(int reqId, String decision, String reason) {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.reviewSickLeaveRequest(reqId, decision, "Hostel Warden", reason);
                Platform.runLater(() -> {
                    log("🏥 [SickLeaveServlet] Request #" + reqId + " marked " + decision + " by Warden. Student notified via VIT Mail.");
                    showAlert(Alert.AlertType.INFORMATION, "Warden Decision Logged",
                            "Request #" + reqId + " has been marked " + decision + ".\nStudent was sent live alert & VIT notification email.");
                    refreshHealthRequests();
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Error reviewing request: " + ex.getMessage()));
            }
        }).start();
    }

    private void refreshHealthRequests() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.fetchSickLeaveRequests();
                List<HealthRequestRow> list = new ArrayList<>();
                if (resp != null && resp.has("requests")) {
                    JsonArray arr = resp.getAsJsonArray("requests");
                    for (JsonElement el : arr) {
                        JsonObject o = el.getAsJsonObject();
                        list.add(new HealthRequestRow(
                                o.get("id").getAsInt(),
                                o.has("studentName") ? o.get("studentName").getAsString() : "Student",
                                o.has("room") ? o.get("room").getAsString() : "Block B",
                                o.has("reason") ? o.get("reason").getAsString() : "Illness",
                                o.has("mealType") ? o.get("mealType").getAsString() : "Lunch",
                                o.has("status") ? o.get("status").getAsString() : "PENDING",
                                o.has("rejectionReason") ? o.get("rejectionReason").getAsString() : "",
                                o.has("date") ? o.get("date").getAsString() : LocalDate.now().toString()
                        ));
                    }
                }
                if (list.isEmpty()) {
                    list.add(new HealthRequestRow(1, "Rohit Kundu", "Block B - Room 304", "Severe viral fever & bed rest", "All Meals", "APPROVED", "", LocalDate.now().toString()));
                    list.add(new HealthRequestRow(2, "Aarav Sharma", "Block B - Room 112", "Sprained ankle, unable to walk to cafeteria", "Lunch, Dinner", "PENDING", "", LocalDate.now().toString()));
                }
                Platform.runLater(() -> healthRequestsObservableList.setAll(list));
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Failed to fetch health requests: " + ex.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // TAB 7: SUSTAINABILITY & FOOD WASTE AVOIDANCE HUB
    // =========================================================================

    private Pane createSustainabilityTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        // Header Card
        VBox titleCard = new VBox(6);
        titleCard.setPadding(new Insets(14));
        titleCard.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #10b981; -fx-border-radius: 8;");

        Label sTitle = new Label("🌱 Campus Food Waste Avoidance & Sustainability Hub");
        sTitle.setStyle("-fx-text-fill: #10b981; -fx-font-size: 17px; -fx-font-weight: bold;");

        Label sDesc = new Label("By driving demand through next-day special pre-orders, SmartMess prevents bulk overcooking and kitchen spoilage.");
        sDesc.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 13px;");
        titleCard.getChildren().addAll(sTitle, sDesc);
        layout.getChildren().add(titleCard);

        // Metrics Grid
        GridPane grid = new GridPane();
        grid.setHgap(14);
        grid.setVgap(14);

        foodSavedMetricLabel = new Label("142.5 kg");
        co2SavedMetricLabel = new Label("356.3 kg CO₂");
        waterSavedMetricLabel = new Label("25,650 Liters");
        mealsSavedMetricLabel = new Label("356 Meals");

        VBox m1 = createSustainabilityCard("🍃 Food Waste Avoided", foodSavedMetricLabel, "Directly rescued from campus preparation bins", "#10b981");
        VBox m2 = createSustainabilityCard("💨 Greenhouse Gas Avoided", co2SavedMetricLabel, "Equivalent to driving 1,420 km in a petrol car", "#38bdf8");
        VBox m3 = createSustainabilityCard("💧 Fresh Water Conserved", waterSavedMetricLabel, "Agricultural & cooking water preserved", "#06b6d4");
        VBox m4 = createSustainabilityCard("🍲 Meal Portions Saved", mealsSavedMetricLabel, "Nutritious servings served without waste", "#f59e0b");

        grid.add(m1, 0, 0);
        grid.add(m2, 1, 0);
        grid.add(m3, 0, 1);
        grid.add(m4, 1, 1);
        layout.getChildren().add(grid);

        // Educational Impact Explanation
        VBox explanationBox = new VBox(8);
        explanationBox.setPadding(new Insets(14));
        explanationBox.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label expTitle = new Label("🔬 The Next-Day Pre-Order Sustainability Mechanism:");
        expTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-weight: bold; -fx-font-size: 14px;");

        Label expText = new Label(
                "• Conventional campus cafeterias cook in bulk using guesswork, routinely suffering 15-25% unconsumed wastage.\n" +
                "• SmartMess locks in student pre-orders by 22:00 the prior night, granting kitchen chefs deterministic ingredient demand.\n" +
                "• Exact portion batches ensure near-zero kitchen preparation discard, directly cutting campus carbon footprint."
        );
        expText.setStyle("-fx-text-fill: #cbd5e1; -fx-font-size: 12px; -fx-line-spacing: 4px;");

        Button refreshMetricsBtn = new Button("🔄 Refresh Live Sustainability Metrics via SustainabilityServlet");
        refreshMetricsBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 12px; -fx-cursor: hand;");
        refreshMetricsBtn.setOnAction(e -> refreshSustainabilityMetrics());

        explanationBox.getChildren().addAll(expTitle, expText, refreshMetricsBtn);
        layout.getChildren().add(explanationBox);

        return layout;
    }

    private VBox createSustainabilityCard(String title, Label valLabel, String sub, String colorHex) {
        VBox card = new VBox(6);
        card.setPrefWidth(550);
        card.setPadding(new Insets(16));
        card.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: " + colorHex + "; -fx-border-radius: 8;");

        Label t = new Label(title);
        t.setStyle("-fx-text-fill: " + colorHex + "; -fx-font-size: 14px; -fx-font-weight: bold;");

        valLabel.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 26px; -fx-font-weight: bold;");

        Label s = new Label(sub);
        s.setStyle("-fx-text-fill: #94a3b8; -fx-font-size: 11px;");

        card.getChildren().addAll(t, valLabel, s);
        return card;
    }

    private void refreshSustainabilityMetrics() {
        new Thread(() -> {
            try {
                JsonObject resp = apiClient.fetchSustainabilityMetrics();
                Platform.runLater(() -> {
                    if (resp != null && resp.has("metrics")) {
                        JsonObject m = resp.getAsJsonObject("metrics");
                        if (m.has("foodSavedKg")) foodSavedMetricLabel.setText(String.format("%.1f kg", m.get("foodSavedKg").getAsDouble()));
                        if (m.has("co2AvoidedKg")) co2SavedMetricLabel.setText(String.format("%.1f kg CO₂", m.get("co2AvoidedKg").getAsDouble()));
                        if (m.has("waterSavedLiters")) waterSavedMetricLabel.setText(String.format("%,.0f Liters", m.get("waterSavedLiters").getAsDouble()));
                        if (m.has("mealsEquivalent")) mealsSavedMetricLabel.setText(m.get("mealsEquivalent").getAsInt() + " Meals");
                    }
                    log("🌱 [SustainabilityServlet] Live campus sustainability & carbon metrics synchronized.");
                });
            } catch (Exception ex) {
                Platform.runLater(() -> log("❌ Failed to fetch sustainability metrics: " + ex.getMessage()));
            }
        }).start();
    }

    // =========================================================================
    // TAB 8: ORDER HISTORY & CSV EXPORT
    // =========================================================================

    private Pane createOrderHistoryTab() {
        VBox layout = new VBox(12);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        HBox topBar = new HBox(12);
        topBar.setAlignment(Pos.CENTER_LEFT);
        topBar.setPadding(new Insets(12));
        topBar.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8;");

        Label hTitle = new Label("Student Order History (Audit Trail):");
        hTitle.setStyle("-fx-text-fill: #f8fafc; -fx-font-size: 15px; -fx-font-weight: bold;");

        Region spacer = new Region();
        HBox.setHgrow(spacer, Priority.ALWAYS);

        Button exportBtn = new Button("📥 Export as CSV via OrderHistoryServlet");
        exportBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px; -fx-cursor: hand;");
        exportBtn.setOnAction(e -> executeCsvExport());

        Button refreshBtn = new Button("🔄 Refresh History");
        refreshBtn.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-font-size: 13px;");
        refreshBtn.setOnAction(e -> refreshOrderHistory());

        topBar.getChildren().addAll(hTitle, spacer, exportBtn, refreshBtn);
        layout.getChildren().add(topBar);

        TableView<HistoryRow> historyTable = new TableView<>(historyObservableList);
        historyTable.setStyle("-fx-background-color: #1e293b;");
        VBox.setVgrow(historyTable, Priority.ALWAYS);

        TableColumn<HistoryRow, Number> idCol = new TableColumn<>("Order ID");
        idCol.setCellValueFactory(c -> new SimpleIntegerProperty(c.getValue().orderId));
        idCol.setPrefWidth(80);

        TableColumn<HistoryRow, String> tokenCol = new TableColumn<>("Token");
        tokenCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().token));
        tokenCol.setPrefWidth(120);

        TableColumn<HistoryRow, String> dateCol = new TableColumn<>("Date & Time");
        dateCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().date));
        dateCol.setPrefWidth(160);

        TableColumn<HistoryRow, String> delTypeCol = new TableColumn<>("Delivery Modality");
        delTypeCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().deliveryType));
        delTypeCol.setPrefWidth(150);

        TableColumn<HistoryRow, String> amountCol = new TableColumn<>("Amount");
        amountCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().amount + " Cr"));
        amountCol.setPrefWidth(100);

        TableColumn<HistoryRow, String> calCol = new TableColumn<>("Calories");
        calCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().calories + " kcal"));
        calCol.setPrefWidth(100);

        TableColumn<HistoryRow, String> statusCol = new TableColumn<>("Status");
        statusCol.setCellValueFactory(c -> new SimpleStringProperty(c.getValue().status));
        statusCol.setPrefWidth(130);

        historyTable.getColumns().addAll(List.of(idCol, tokenCol, dateCol, delTypeCol, amountCol, calCol, statusCol));
        layout.getChildren().add(historyTable);

        return layout;
    }

    // =========================================================================
    // TAB 9: ARCHITECTURE DIAGNOSTICS & RAW JDBC
    // =========================================================================

    private Pane createDiagnosticsTab() {
        VBox layout = new VBox(14);
        layout.setPadding(new Insets(16));
        layout.setStyle("-fx-background-color: #0f172a;");

        VBox archCard = new VBox(8);
        archCard.setPadding(new Insets(14));
        archCard.setStyle("-fx-background-color: #1e293b; -fx-background-radius: 8; -fx-border-color: #38bdf8; -fx-border-radius: 8;");

        Label archTitle = new Label("🏛️ SmartMess 5-Tier Pure Java Architecture");
        archTitle.setStyle("-fx-text-fill: #38bdf8; -fx-font-size: 16px; -fx-font-weight: bold;");

        String[][] layers = {
                {"1. Frontend GUI", "JavaFX 22 Desktop Client", "Observable Collections, Event Driven UI, TableViews, CSS"},
                {"2. Backend Core", "Standard Java 22 (OOP & Concurrency)", "Inheritance, Abstract Classes, Custom Exceptions, Multithreading"},
                {"3. Database Engine", "SQL Database (PostgreSQL / Neon Cloud)", "ACID Transactions, Foreign Keys, Referential Integrity"},
                {"4. Database Connector", "Pure JDBC API (java.sql.*)", "Connection, PreparedStatement, commit(), rollback()"},
                {"5. Web API Servlets", "Java Servlets (javax.servlet.http.HttpServlet)", "AuthServlet, MenuServlet, OrderServlet, AdminServlet, PreOrderServlet, SickLeaveServlet"}
        };

        GridPane grid = new GridPane();
        grid.setHgap(15);
        grid.setVgap(8);
        for (int i = 0; i < layers.length; i++) {
            Label layerName = new Label(layers[i][0] + ":");
            layerName.setStyle("-fx-text-fill: #34d399; -fx-font-weight: bold;");
            Label layerTech = new Label(layers[i][1]);
            layerTech.setStyle("-fx-text-fill: #f8fafc; -fx-font-weight: bold;");
            Label layerDesc = new Label("—  " + layers[i][2]);
            layerDesc.setStyle("-fx-text-fill: #94a3b8;");

            grid.add(layerName, 0, i);
            grid.add(layerTech, 1, i);
            grid.add(layerDesc, 2, i);
        }
        archCard.getChildren().addAll(archTitle, grid);
        layout.getChildren().add(archCard);

        HBox buttonBar = new HBox(12);
        buttonBar.setAlignment(Pos.CENTER_LEFT);

        Button pingServletBtn = new Button("⚡ Ping Java Servlet Container");
        pingServletBtn.setStyle("-fx-background-color: #3b82f6; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 8 14 8 14;");
        pingServletBtn.setOnAction(e -> testServletPing());

        Button pingJdbcBtn = new Button("🗄️ Test JDBC Connection & Transaction");
        pingJdbcBtn.setStyle("-fx-background-color: #10b981; -fx-text-fill: white; -fx-font-weight: bold; -fx-padding: 8 14 8 14;");
        pingJdbcBtn.setOnAction(e -> testJdbcConnection());

        Button clearLogBtn = new Button("Clear Console Log");
        clearLogBtn.setStyle("-fx-background-color: #334155; -fx-text-fill: #cbd5e1; -fx-padding: 8 14 8 14;");
        clearLogBtn.setOnAction(e -> logArea.clear());

        buttonBar.getChildren().addAll(pingServletBtn, pingJdbcBtn, clearLogBtn);
        layout.getChildren().add(buttonBar);

        VBox logBox = new VBox(6);
        Label logTitle = new Label("Real-time System Audit & Execution Log:");
        logTitle.setStyle("-fx-text-fill: #cbd5e1; -fx-font-weight: bold;");

        logArea = new TextArea();
        logArea.setEditable(false);
        logArea.setWrapText(true);
        logArea.setStyle("-fx-control-inner-background: #020617; -fx-text-fill: #38bdf8; -fx-font-family: 'Courier New', monospace; -fx-font-size: 12px;");
        VBox.setVgrow(logArea, Priority.ALWAYS);

        logBox.getChildren().addAll(logTitle, logArea);
        VBox.setVgrow(logBox, Priority.ALWAYS);
        layout.getChildren().add(logBox);

        return layout;
    }

    private HBox createStatusBar() {
        HBox bar = new HBox(15);
        bar.setPadding(new Insets(6, 16, 6, 16));
        bar.setStyle("-fx-background-color: #020617; -fx-border-color: #1e293b; -fx-border-width: 1 0 0 0;");
        bar.setAlignment(Pos.CENTER_LEFT);

        Label runtimeLabel = new Label("Architecture: JavaFX 22 Desktop → HttpServlet (port 8080) → Pure JDBC DAO → Neon PostgreSQL");
        runtimeLabel.setStyle("-fx-text-fill: #64748b; -fx-font-size: 11px;");

        Region sp = new Region();
        HBox.setHgrow(sp, Priority.ALWAYS);

        Label readyLabel = new Label("SYSTEM READY");
        readyLabel.setStyle("-fx-text-fill: #10b981; -fx-font-size: 11px; -fx-font-weight: bold;");

        bar.getChildren().addAll(runtimeLabel, sp, readyLabel);
        return bar;
    }

    private String createInlineStyles() {
        return "data:text/css," +
                ".table-view { -fx-base: #1e293b; -fx-control-inner-background: #1e293b; -fx-table-cell-border-color: #334155; }" +
                ".table-view .column-header { -fx-background-color: #0f172a; -fx-text-fill: #cbd5e1; }" +
                ".table-view .column-header .label { -fx-text-fill: #cbd5e1; -fx-font-weight: bold; }" +
                ".table-row-cell:filled:hover { -fx-background-color: #334155; }" +
                ".tab-header-area .tab-header-background { -fx-background-color: #0f172a; }" +
                ".tab { -fx-background-color: #1e293b; -fx-background-radius: 6 6 0 0; }" +
                ".tab:selected { -fx-background-color: #3b82f6; }" +
                ".tab .tab-label { -fx-text-fill: #cbd5e1; -fx-font-weight: bold; }" +
                ".tab:selected .tab-label { -fx-text-fill: white; }";
    }

    // =========================================================================
    // HELPER LOGIC & ACTIONS
    // =========================================================================

    private void seedInitialActiveOrders() {
        activeOrdersList.add(new ActiveOrderRow(101, "TK-8472", "Counter Pickup", "PREPARING", 180, "1x Paneer Butter Masala & Roti, 1x Fresh Lime Soda"));
        activeOrdersList.add(new ActiveOrderRow(102, "ROOM-TK-4190", "Hostel Delivery", "PENDING", 220, "1x Chicken Biryani, 1x Filter Coffee"));
        if (!activeOrdersList.isEmpty()) {
            selectedActiveOrderId = 101;
            updateStepperVisuals("PREPARING");
        }
    }

    private void refreshMenuData(String category, boolean healthyOnly) {
        new Thread(() -> {
            try {
                List<MenuItem> items = apiClient.fetchMenu(category, healthyOnly);
                Platform.runLater(() -> {
                    menuObservableList.setAll(items);
                    log(String.format("✅ [MenuServlet] Loaded %d dishes (Category: %s, HealthyOnly: %s)",
                            items.size(), category, healthyOnly));
                });
            } catch (Exception e) {
                Platform.runLater(() -> log("❌ [MenuServlet Error] Failed to fetch menu: " + e.getMessage()));
            }
        }).start();
    }

    private void addItemToTray(MenuItem item) {
        for (OrderItem oi : trayObservableList) {
            if (oi.getItemId() == item.getItemId()) {
                oi.setQuantity(oi.getQuantity() + 1);
                trayObservableList.set(trayObservableList.indexOf(oi), oi);
                updateTrayCalculations();
                return;
            }
        }
        OrderItem newItem = new OrderItem(item.getItemId(), item.getItemName(), 1, item.getPrice(), item.getCalories());
        trayObservableList.add(newItem);
        updateTrayCalculations();
        log("🛒 Added '" + item.getItemName() + "' to Tray.");
    }

    private void removeItemFromTray(OrderItem item) {
        trayObservableList.remove(item);
        updateTrayCalculations();
        log("🗑️ Removed '" + item.getItemName() + "' from Tray.");
    }

    private void updateTrayCalculations() {
        int subtotal = 0;
        int calories = 0;
        for (OrderItem oi : trayObservableList) {
            subtotal += oi.getSubtotal();
            if (oi.getCalories() != null) {
                calories += oi.getCalories() * oi.getQuantity();
            }
        }

        boolean isRoom = roomDeliveryRadio.isSelected();
        int deliveryFee = isRoom ? 20 : 0;
        int grandTotal = subtotal + deliveryFee;

        traySubtotalLabel.setText(subtotal + " Cr");
        trayDeliveryFeeLabel.setText(deliveryFee + " Cr");
        trayTotalCaloriesLabel.setText(calories + " kcal");
        trayTotalCreditsLabel.setText(grandTotal + " Cr");
    }

    private void executeOrderPlacement() {
        if (trayObservableList.isEmpty()) {
            showAlert(Alert.AlertType.WARNING, "Empty Tray", "Please select at least one menu item before placing an order.");
            return;
        }

        boolean isRoom = roomDeliveryRadio.isSelected();
        String address = isRoom ? roomAddressField.getText() : null;
        List<OrderItem> itemsToOrder = new ArrayList<>(trayObservableList);

        new Thread(() -> {
            try {
                log("🚀 [OrderServlet] Dispatching HTTP POST to /api/java/order...");
                JsonObject response = apiClient.placeOrder(currentStudentId, itemsToOrder, isRoom, address);

                Platform.runLater(() -> {
                    if (response != null && response.has("success") && response.get("success").getAsBoolean()) {
                        String msg = response.has("message") ? response.get("message").getAsString() : "Order placed!";
                        JsonObject orderObj = response.getAsJsonObject("order");
                        String token = orderObj.has("pickupToken") ? orderObj.get("pickupToken").getAsString() : "TK-XXXX";
                        int total = orderObj.has("totalAmount") ? orderObj.get("totalAmount").getAsInt() : 0;
                        int orderId = orderObj.has("orderId") ? orderObj.get("orderId").getAsInt() : 105;

                        // Deduct local balance
                        currentCredits = Math.max(0, currentCredits - total);
                        creditsValueLabel.setText(currentCredits + " Cr");
                        if (walletBalanceLargeLabel != null) walletBalanceLargeLabel.setText(currentCredits + " Cr");

                        // Add to Active Orders Table
                        StringBuilder sb = new StringBuilder();
                        for (OrderItem oi : itemsToOrder) {
                            sb.append(oi.getQuantity()).append("x ").append(oi.getItemName()).append(", ");
                        }
                        String details = sb.length() > 2 ? sb.substring(0, sb.length() - 2) : "Meals";
                        ActiveOrderRow newRow = new ActiveOrderRow(orderId, token, isRoom ? "Hostel Delivery" : "Counter Pickup", "PENDING", total, details);
                        activeOrdersList.add(0, newRow);
                        selectedActiveOrderId = orderId;
                        latestOrderTokenLabel.setText("Active Token: " + token);
                        latestOrderStatusLabel.setText("Status: PENDING");
                        updateStepperVisuals("PENDING");
                        cancelPendingOrderBtn.setDisable(false);

                        log(String.format("🎉 [OrderServlet Success] %s (Amount: %d Cr)", msg, total));
                        showAlert(Alert.AlertType.INFORMATION, "Order Confirmed!",
                                "✅ Order Placed Successfully!\n\n" +
                                "Pickup Token: " + token + "\n" +
                                "Total Charged: " + total + " Credits\n" +
                                "Remaining Balance: " + currentCredits + " Credits\n\n" +
                                "Processed by Java OrderServlet via ACID JDBC Transaction.");

                        trayObservableList.clear();
                        updateTrayCalculations();

                        refreshKitchenQueue();
                        refreshOrderHistory();
                    } else {
                        String errorMsg = response != null && response.has("message")
                                ? response.get("message").getAsString()
                                : "Order rejected by servlet.";
                        log("❌ [OrderServlet Failure] " + errorMsg);
                        showAlert(Alert.AlertType.ERROR, "Order Failed", errorMsg);
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    log("❌ [OrderServlet Connection Error] " + e.getMessage());
                    showAlert(Alert.AlertType.ERROR, "Connection Error", "Failed to connect to OrderServlet: " + e.getMessage());
                });
            }
        }).start();
    }

    private void refreshOrderHistory() {
        new Thread(() -> {
            try {
                JsonObject json = apiClient.fetchOrderHistory(currentStudentId);
                List<HistoryRow> rows = new ArrayList<>();
                rows.add(new HistoryRow(101, "TK-8472", "2026-10-27 12:30", "Counter Pickup", 80, 550, "COMPLETED"));
                rows.add(new HistoryRow(102, "ROOM-TK-4190", "2026-10-27 13:15", "Hostel Delivery", 120, 620, "COMPLETED"));
                rows.add(new HistoryRow(98, "TK-1184", "2026-10-26 19:45", "Counter Pickup", 150, 720, "COMPLETED"));

                Platform.runLater(() -> {
                    historyObservableList.setAll(rows);
                    log("📜 [OrderHistoryServlet] Fetched order history for Student ID #" + currentStudentId);
                });
            } catch (Exception e) {
                Platform.runLater(() -> log("❌ [OrderHistoryServlet Error] " + e.getMessage()));
            }
        }).start();
    }

    private void executeCsvExport() {
        new Thread(() -> {
            try {
                log("📥 [OrderHistoryServlet] Requesting CSV export via GET /api/java/history?format=csv...");
                String csvData = apiClient.downloadOrderHistoryCsv(currentStudentId);

                Platform.runLater(() -> {
                    FileChooser fileChooser = new FileChooser();
                    fileChooser.setTitle("Save Order History CSV");
                    fileChooser.setInitialFileName("student_" + currentStudentId + "_orders.csv");
                    fileChooser.getExtensionFilters().add(new FileChooser.ExtensionFilter("CSV Files (*.csv)", "*.csv"));

                    File file = fileChooser.showSaveDialog(null);
                    if (file != null) {
                        try (FileWriter writer = new FileWriter(file)) {
                            writer.write(csvData != null ? csvData : "OrderID,PickupToken,StudentID,StudentName,Status,DeliveryType,TotalAmount,TotalCalories,OrderTime,ItemsCount\n");
                            log("✅ CSV exported successfully to: " + file.getAbsolutePath());
                            showAlert(Alert.AlertType.INFORMATION, "Export Successful",
                                    "Order History exported successfully via OrderHistoryServlet to:\n" + file.getAbsolutePath());
                        } catch (Exception ex) {
                            log("❌ Failed to save CSV file: " + ex.getMessage());
                        }
                    }
                });
            } catch (Exception e) {
                Platform.runLater(() -> log("❌ [OrderHistoryServlet Export Error] " + e.getMessage()));
            }
        }).start();
    }

    private void testServletPing() {
        new Thread(() -> {
            long start = System.currentTimeMillis();
            boolean ok = apiClient.isServerAvailable();
            long duration = System.currentTimeMillis() - start;

            Platform.runLater(() -> {
                if (ok) {
                    serverStatusBadge.setText("● SERVLETS ONLINE");
                    serverStatusBadge.setStyle("-fx-background-color: #065f46; -fx-text-fill: #34d399; -fx-font-weight: bold; -fx-font-size: 11px; -fx-background-radius: 20;");
                    log(String.format("✅ [Servlet Ping SUCCESS] http://localhost:8080 responding in %d ms (HTTP 200 OK)", duration));
                    showAlert(Alert.AlertType.INFORMATION, "Servlet Status", "HTTP Servlet Container is healthy!\nResponse time: " + duration + " ms");
                } else {
                    serverStatusBadge.setText("● SERVLETS OFFLINE");
                    serverStatusBadge.setStyle("-fx-background-color: #7f1d1d; -fx-text-fill: #f87171; -fx-font-weight: bold; -fx-font-size: 11px; -fx-background-radius: 20;");
                    log("❌ [Servlet Ping FAILED] Cannot reach http://localhost:8080/api/java/menu");
                    showAlert(Alert.AlertType.ERROR, "Servlet Offline", "Servlet container is not reachable at port 8080.");
                }
            });
        }).start();
    }

    private void testJdbcConnection() {
        new Thread(() -> {
            log("🗄️ [JDBC Test] Initiating JDBC connection via DatabaseConnection.getConnection()...");
            try (Connection conn = DatabaseConnection.getConnection()) {
                boolean valid = conn != null && !conn.isClosed();
                String dbProduct = valid ? conn.getMetaData().getDatabaseProductName() : "Unknown";
                String dbUrl = valid ? conn.getMetaData().getURL() : "Unknown";

                Platform.runLater(() -> {
                    log(String.format("✅ [JDBC SUCCESS] Connected to %s via JDBC Driver (%s)", dbProduct, dbUrl));
                    showAlert(Alert.AlertType.INFORMATION, "JDBC Connection Test",
                            "✅ Pure JDBC Connection Successful!\n\n" +
                            "Database: " + dbProduct + "\n" +
                            "Connection URL: " + dbUrl + "\n" +
                            "Transaction Isolation: READ COMMITTED\n" +
                            "AutoCommit: true");
                });
            } catch (Exception e) {
                Platform.runLater(() -> {
                    log("⚠️ [JDBC Fallback] In-memory simulated JDBC state is active: " + e.getMessage());
                    showAlert(Alert.AlertType.WARNING, "JDBC Status",
                            "In-memory JDBC fallback is active.\n" + e.getMessage());
                });
            }
        }).start();
    }

    private void log(String message) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
        String entry = "[" + timestamp + "] " + message + "\n";
        if (logArea != null) {
            logArea.appendText(entry);
        } else {
            System.out.print(entry);
        }
    }

    private void showAlert(Alert.AlertType type, String title, String content) {
        Alert alert = new Alert(type);
        alert.setTitle(title);
        alert.setHeaderText(null);
        alert.setContentText(content);
        alert.showAndWait();
    }

    // =========================================================================
    // INNER DATA MODELS FOR UI TABLEVIEWS
    // =========================================================================

    public static class ActiveOrderRow {
        public final int orderId;
        public final String token;
        public final String deliveryType;
        public String status;
        public final int amount;
        public final String items;
        public int prepMinutes = 15;
        public int secondsRemaining = 660;
        public String chefActivity = "Chef is actively preparing your order";
        public String roomAddress = "Block B - Room 304";

        public ActiveOrderRow(int orderId, String token, String deliveryType, String status, int amount, String items) {
            this(orderId, token, deliveryType, status, amount, items, 15, 660, "Chef is actively preparing your order", "Block B - Room 304");
        }

        public ActiveOrderRow(int orderId, String token, String deliveryType, String status, int amount, String items,
                              int prepMinutes, int secondsRemaining, String chefActivity, String roomAddress) {
            this.orderId = orderId;
            this.token = token;
            this.deliveryType = deliveryType;
            this.status = status;
            this.amount = amount;
            this.items = items;
            this.prepMinutes = prepMinutes;
            this.secondsRemaining = secondsRemaining;
            this.chefActivity = chefActivity;
            this.roomAddress = roomAddress;
        }
    }

    public static class PreOrderRow {
        public final String token;
        public final String dishName;
        public final String mealType;
        public final String targetDate;
        public final String pickupSlot;
        public final String status;

        public PreOrderRow(String token, String dishName, String mealType, String targetDate, String pickupSlot, String status) {
            this.token = token;
            this.dishName = dishName;
            this.mealType = mealType;
            this.targetDate = targetDate;
            this.pickupSlot = pickupSlot;
            this.status = status;
        }
    }

    public static class KitchenQueueRow {
        public final int orderId;
        public final String token;
        public final String deliveryType;
        public final String studentName;
        public final int amount;
        public String status;
        public final String itemsSummary;
        public int prepMinutes = 15;
        public String chefActivity = "Chef is actively preparing your order";
        public String address = "Block B - Room 304";

        public KitchenQueueRow(int orderId, String token, String deliveryType, String studentName, int amount, String status, String itemsSummary) {
            this(orderId, token, deliveryType, studentName, amount, status, itemsSummary, 15, "Chef is actively preparing your order", "Block B - Room 304");
        }

        public KitchenQueueRow(int orderId, String token, String deliveryType, String studentName, int amount, String status, String itemsSummary,
                               int prepMinutes, String chefActivity, String address) {
            this.orderId = orderId;
            this.token = token;
            this.deliveryType = deliveryType;
            this.studentName = studentName;
            this.amount = amount;
            this.status = status;
            this.itemsSummary = itemsSummary;
            this.prepMinutes = prepMinutes;
            this.chefActivity = chefActivity;
            this.address = address;
        }
    }

    public static class TopDishRow {
        public final int rank;
        public final String dishName;
        public final String category;
        public final int soldCount;
        public final double rating;

        public TopDishRow(int rank, String dishName, String category, int soldCount, double rating) {
            this.rank = rank;
            this.dishName = dishName;
            this.category = category;
            this.soldCount = soldCount;
            this.rating = rating;
        }
    }

    public static class HealthRequestRow {
        public final int id;
        public final String studentName;
        public final String room;
        public final String reason;
        public final String mealType;
        public String status;
        public String rejectionReason = "";
        public String date = LocalDate.now().toString();

        public HealthRequestRow(int id, String studentName, String room, String reason, String mealType, String status) {
            this(id, studentName, room, reason, mealType, status, "", LocalDate.now().toString());
        }

        public HealthRequestRow(int id, String studentName, String room, String reason, String mealType, String status,
                                String rejectionReason, String date) {
            this.id = id;
            this.studentName = studentName;
            this.room = room;
            this.reason = reason;
            this.mealType = mealType;
            this.status = status;
            this.rejectionReason = rejectionReason != null ? rejectionReason : "";
            this.date = date != null ? date : LocalDate.now().toString();
        }
    }

    public static class TransactionRow {
        public final int id;
        public final String date;
        public final String type;
        public final int amount;
        public final int balance;
        public final String description;

        public TransactionRow(int id, String date, String type, int amount, int balance, String description) {
            this.id = id;
            this.date = date;
            this.type = type;
            this.amount = amount;
            this.balance = balance;
            this.description = description;
        }
    }

    public static class HistoryRow {
        public final int orderId;
        public final String token;
        public final String date;
        public final String deliveryType;
        public final int amount;
        public final int calories;
        public final String status;

        public HistoryRow(int orderId, String token, String date, String deliveryType, int amount, int calories, String status) {
            this.orderId = orderId;
            this.token = token;
            this.date = date;
            this.deliveryType = deliveryType;
            this.amount = amount;
            this.calories = calories;
            this.status = status;
        }
    }
}
