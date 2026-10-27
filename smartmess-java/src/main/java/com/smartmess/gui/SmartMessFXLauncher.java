package com.smartmess.gui;

import javafx.application.Application;

/**
 * Entry point for launching the SmartMess JavaFX Application.
 * Prevents Java 11+ non-modular JavaFX runtime component errors.
 */
public class SmartMessFXLauncher {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("🚀 LAUNCHING SMARTMESS JAVAFX DESKTOP APPLICATION");
        System.out.println("   Frontend: JavaFX 22 Desktop GUI");
        System.out.println("   Backend: Java Core & Servlets");
        System.out.println("   Database: PostgreSQL & JDBC API Connector");
        System.out.println("======================================================================");
        Application.launch(SmartMessFXApp.class, args);
    }
}
