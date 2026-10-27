package com.smartmess.exception;

/**
 * Base checked exception for the SmartMess system.
 */
public class MessException extends Exception {
    public MessException(String message) {
        super(message);
    }

    public MessException(String message, Throwable cause) {
        super(message, cause);
    }
}
