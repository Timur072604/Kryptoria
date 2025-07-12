package com.cryptolearn.backend.exception.handler;

import com.cryptolearn.backend.dto.ErrorResponse;
import com.cryptolearn.backend.exception.InvalidSubmissionException;
import com.cryptolearn.backend.exception.ResourceNotFoundException;
import com.cryptolearn.backend.exception.TokenRefreshException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.validation.ObjectError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageSource messageSource;

    @Autowired
    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ErrorResponse.ValidationError> validationFieldErrors = new ArrayList<>();
        String firstFieldErrorMessage = null;

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            String fieldName = error.getField();
            String message = getLocalizedMessage(error.getDefaultMessage(), error.getArguments());
            
            validationFieldErrors.add(new ErrorResponse.ValidationError(fieldName, message));
            if (firstFieldErrorMessage == null) {
                firstFieldErrorMessage = message;
            }
        }

        for (ObjectError error : ex.getBindingResult().getGlobalErrors()) {
            String message = getLocalizedMessage(error.getDefaultMessage(), error.getArguments());
            if (firstFieldErrorMessage == null) {
                firstFieldErrorMessage = message;
            }
        }


        logger.warn("Ошибка валидации DTO. URI: {}. Ошибки: {}", request.getRequestURI(), validationFieldErrors);

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(firstFieldErrorMessage != null ? firstFieldErrorMessage : getLocalizedMessage("error.validation"))
                .path(request.getRequestURI())
                .validationErrors(validationFieldErrors.isEmpty() ? null : validationFieldErrors)
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFoundException(ResourceNotFoundException ex, HttpServletRequest request) {
        logger.warn("Ресурс не найден: URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(TokenRefreshException.class)
    public ResponseEntity<ErrorResponse> handleTokenRefreshException(TokenRefreshException ex, HttpServletRequest request) {
        logger.warn("Ошибка Refresh Token: URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidSubmissionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSubmissionException(InvalidSubmissionException ex, HttpServletRequest request) {
        logger.warn("Некорректный ответ на задание: URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentialsException(BadCredentialsException ex, HttpServletRequest request) {
        logger.warn("Ошибка аутентификации (неверные учетные данные): URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(getLocalizedMessage("error.authentication"))
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }


    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        logger.warn("Общая ошибка аутентификации: URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.getReasonPhrase())
                .message(getLocalizedMessage("error.authentication"))
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.UNAUTHORIZED);
    }

     @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        logger.warn("Доступ запрещен: URI: {}, Сообщение: {}", request.getRequestURI(), ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.getReasonPhrase())
                .message(getLocalizedMessage("error.accessDenied"))
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class, org.springframework.dao.DataIntegrityViolationException.class})
    public ResponseEntity<ErrorResponse> handleBadRequestTypeExceptions(RuntimeException ex, HttpServletRequest request) {
        String exceptionType = ex.getClass().getSimpleName();
        logger.warn("Ошибка в запросе или состоянии ({}): URI: {}, Сообщение: {}", exceptionType, request.getRequestURI(), ex.getMessage());
        
        String message = ex.getMessage();
        if (ex instanceof org.springframework.dao.DataIntegrityViolationException) {
            if (message != null && message.toLowerCase().contains("duplicate entry")) {
                message = getLocalizedMessage("error.database.constraintViolation");
            } else {
                message = getLocalizedMessage("error.database.constraintViolation");
            }
        }

        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.getReasonPhrase())
                .message(message)
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAllUncaughtException(Exception ex, HttpServletRequest request) {
        logger.error("Непредвиденная ошибка: URI: {}, Тип исключения: {}, Сообщение: {}",
            request.getRequestURI(), ex.getClass().getName(), ex.getMessage(), ex);
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase())
                .message(getLocalizedMessage("error.internalServer"))
                .path(request.getRequestURI())
                .build();
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }

     private String getLocalizedMessage(String messageKey, Object... args) {
        if (messageKey == null) {
            return "Произошла неизвестная ошибка.";
        }
        try {
            Locale locale = LocaleContextHolder.getLocale();
            return messageSource.getMessage(messageKey, args, locale);
        } catch (NoSuchMessageException e) {
            logger.trace("Локализованное сообщение для ключа '{}' не найдено, используется сам ключ/сообщение по умолчанию.", messageKey);
            return messageKey;
        } catch (Exception e) {
            logger.error("Не удалось получить локализованное сообщение для ключа '{}'. Ошибка: {}", messageKey, e.getMessage());
            return messageKey;
        }
    }
}