package com.smartmess.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.TypeAdapter;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonToken;
import com.google.gson.stream.JsonWriter;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Utility helper providing a thread-safe, module-compatible Gson instance
 * configured with Java 8+ java.time (LocalDate and LocalDateTime) TypeAdapters.
 */
public class GsonHelper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final TypeAdapter<LocalDate> LOCAL_DATE_ADAPTER = new TypeAdapter<LocalDate>() {
        @Override
        public void write(JsonWriter out, LocalDate value) throws IOException {
            if (value == null) {
                out.nullValue();
            } else {
                out.value(value.format(DATE_FORMATTER));
            }
        }

        @Override
        public LocalDate read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            return LocalDate.parse(in.nextString(), DATE_FORMATTER);
        }
    }.nullSafe();

    private static final TypeAdapter<LocalDateTime> LOCAL_DATE_TIME_ADAPTER = new TypeAdapter<LocalDateTime>() {
        @Override
        public void write(JsonWriter out, LocalDateTime value) throws IOException {
            if (value == null) {
                out.nullValue();
            } else {
                out.value(value.format(DATE_TIME_FORMATTER));
            }
        }

        @Override
        public LocalDateTime read(JsonReader in) throws IOException {
            if (in.peek() == JsonToken.NULL) {
                in.nextNull();
                return null;
            }
            return LocalDateTime.parse(in.nextString(), DATE_TIME_FORMATTER);
        }
    }.nullSafe();

    private static final Gson GSON = new GsonBuilder()
            .registerTypeAdapter(LocalDate.class, LOCAL_DATE_ADAPTER)
            .registerTypeHierarchyAdapter(LocalDate.class, LOCAL_DATE_ADAPTER)
            .registerTypeAdapter(LocalDateTime.class, LOCAL_DATE_TIME_ADAPTER)
            .registerTypeHierarchyAdapter(LocalDateTime.class, LOCAL_DATE_TIME_ADAPTER)
            .serializeNulls()
            .setPrettyPrinting()
            .create();

    public static Gson getGson() {
        return GSON;
    }
}
