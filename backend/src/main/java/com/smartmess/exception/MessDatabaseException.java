package com.smartmess.exception;

/**
 * Demonstrates Exception Handling: Custom Unchecked Exception.
 * Wraps low-level SQLExceptions or connection drops into a domain-specific runtime error.
 */
public class MessDatabaseException extends RuntimeException {
    public MessDatabaseException(String message) {
        super(message);
    }

    public MessDatabaseException(String message, Throwable cause) {
        super(message, cause);
    }
}
