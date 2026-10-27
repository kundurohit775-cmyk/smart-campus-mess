package com.smartmess.servlet;

import com.google.gson.Gson;
import com.smartmess.model.SustainabilityMetrics;
import com.smartmess.service.IMessService;
import com.smartmess.util.GsonHelper;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * Demonstrates Java Servlets:
 * Public Sustainability and Food Waste Avoidance Hub API.
 * Tracks kg of food waste avoided, CO2 avoided, and water saved.
 */
public class SustainabilityServlet extends HttpServlet {

    private final IMessService messService;
    private final Gson gson = GsonHelper.getGson();

    public SustainabilityServlet(IMessService messService) {
        this.messService = messService;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        SustainabilityMetrics metrics = messService.getSustainabilityMetrics();

        Map<String, Object> data = new HashMap<>();
        data.put("success", true);
        data.put("metrics", metrics);
        data.put("headline", "Every pre-order matches kitchen production 1:1");

        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(data));
            out.flush();
        }
    }
}
