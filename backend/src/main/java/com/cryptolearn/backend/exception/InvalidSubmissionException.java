package com.cryptolearn.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class InvalidSubmissionException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public InvalidSubmissionException(String message) {
        super(message);
    }
}