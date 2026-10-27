package com.smartmess.collections;

import com.smartmess.model.MenuItem;
import com.smartmess.exception.MenuItemNotFoundException;

import java.util.*;

/**
 * Demonstrates Collections Framework:
 * 1. ArrayList<MenuItem> for indexed listing and sequential iteration.
 * 2. HashMap<Integer, MenuItem> for high-performance O(1) ID lookups.
 * 3. HashSet<String> for deduplicated category aggregation.
 */
public class MenuCatalog {
    // List for ordered menu display
    private final List<MenuItem> menuList;
    // Map for O(1) fast item lookup by ID
    private final Map<Integer, MenuItem> itemMap;
    // Set for unique category collection
    private final Set<String> categories;

    public MenuCatalog() {
        this.menuList = new ArrayList<>();
        this.itemMap = new HashMap<>();
        this.categories = new HashSet<>();
    }

    /**
     * Adds an item to all collection structures atomically.
     */
    public synchronized void addItem(MenuItem item) {
        if (item == null) return;
        
        // If already present, update
        if (itemMap.containsKey(item.getItemId())) {
            MenuItem old = itemMap.get(item.getItemId());
            menuList.remove(old);
        }
        
        menuList.add(item);
        itemMap.put(item.getItemId(), item);
        if (item.getCategory() != null && !item.getCategory().trim().isEmpty()) {
            categories.add(item.getCategory().trim());
        }
    }

    /**
     * O(1) Lookup using HashMap.
     */
    public MenuItem getItemById(int itemId) throws MenuItemNotFoundException {
        MenuItem item = itemMap.get(itemId);
        if (item == null) {
            throw new MenuItemNotFoundException(itemId);
        }
        return item;
    }

    public MenuItem findById(int itemId) {
        return itemMap.get(itemId);
    }

    public synchronized void reduceStock(int itemId, int quantity) {
        MenuItem item = itemMap.get(itemId);
        if (item != null) {
            item.setAvailableQuantity(Math.max(0, item.getAvailableQuantity() - quantity));
        }
    }

    public synchronized void increaseStock(int itemId, int quantity) {
        MenuItem item = itemMap.get(itemId);
        if (item != null) {
            item.setAvailableQuantity(item.getAvailableQuantity() + quantity);
        }
    }

    public boolean containsItem(int itemId) {
        return itemMap.containsKey(itemId);
    }

    /**
     * Returns a copy of the ordered ArrayList.
     */
    public List<MenuItem> getAllItems() {
        return new ArrayList<>(menuList);
    }

    /**
     * Filter dishes by category using Collections and Streams.
     */
    public List<MenuItem> getItemsByCategory(String category) {
        if (category == null || category.equalsIgnoreCase("All")) {
            return getAllItems();
        }
        List<MenuItem> filtered = new ArrayList<>();
        for (MenuItem item : menuList) {
            if (category.equalsIgnoreCase(item.getCategory())) {
                filtered.add(item);
            }
        }
        return filtered;
    }

    /**
     * Filter healthy diet-friendly dishes (calories <= 400).
     */
    public List<MenuItem> getHealthyItems() {
        List<MenuItem> healthyList = new ArrayList<>();
        for (MenuItem item : menuList) {
            if (item.isHealthy()) {
                healthyList.add(item);
            }
        }
        return healthyList;
    }

    /**
     * Returns the HashSet of unique categories.
     */
    public Set<String> getUniqueCategories() {
        return Collections.unmodifiableSet(categories);
    }

    public int size() {
        return menuList.size();
    }
}
