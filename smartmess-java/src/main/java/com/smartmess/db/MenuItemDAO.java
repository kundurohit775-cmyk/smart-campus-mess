package com.smartmess.db;

import com.smartmess.model.MenuItem;
import com.smartmess.model.SpecialMenuItem;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Demonstrates JDBC:
 * PreparedStatement, ResultSet mapping for MenuItems and SpecialMenuItems.
 */
public class MenuItemDAO {

    /**
     * Reads all active dishes from the PostgreSQL menu_items table.
     */
    public List<MenuItem> findAllActive(Connection conn) throws SQLException {
        List<MenuItem> items = new ArrayList<>();
        String sql = "SELECT item_id, item_name, category, price, calories, is_special, " +
                     "       special_stock_limit, special_available_date, portion_weight_kg, " +
                     "       available_quantity, is_active " +
                     "FROM menu_items " +
                     "WHERE is_active = 1 " +
                     "ORDER BY is_special DESC, category ASC, item_name ASC";

        try (PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                int itemId = rs.getInt("item_id");
                String name = rs.getString("item_name");
                String category = rs.getString("category");
                int price = rs.getInt("price");
                Integer calories = rs.getObject("calories") != null ? rs.getInt("calories") : null;
                boolean isSpecial = rs.getBoolean("is_special");
                int stock = rs.getInt("available_quantity");

                if (isSpecial) {
                    int limit = rs.getObject("special_stock_limit") != null ? rs.getInt("special_stock_limit") : stock;
                    LocalDate availDate = rs.getDate("special_available_date") != null 
                        ? rs.getDate("special_available_date").toLocalDate() 
                        : LocalDate.now().plusDays(1);

                    SpecialMenuItem special = new SpecialMenuItem(itemId, name, category, price, calories, limit, availDate);
                    special.setPortionWeightKg(rs.getDouble("portion_weight_kg"));
                    items.add(special);
                } else {
                    MenuItem item = new MenuItem(itemId, name, category, price, calories, stock);
                    item.setPortionWeightKg(rs.getDouble("portion_weight_kg"));
                    items.add(item);
                }
            }
        }
        return items;
    }

    /**
     * Decrements inventory quantity for an ordered item in an active transaction.
     */
    public void deductStock(Connection conn, int itemId, int quantity) throws SQLException {
        String sql = "UPDATE menu_items SET available_quantity = available_quantity - ? WHERE item_id = ?";
        try (PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setInt(1, quantity);
            stmt.setInt(2, itemId);
            stmt.executeUpdate();
        }
    }
}
