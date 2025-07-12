package com.cryptolearn.backend.controller;

import com.cryptolearn.backend.dto.MessageResponse;
import com.cryptolearn.backend.dto.user.ChangePasswordRequestDTO;
import com.cryptolearn.backend.dto.user.UpdateProfileRequestDTO;
import com.cryptolearn.backend.dto.user.UserProfileDTO;
import com.cryptolearn.backend.exception.ResourceNotFoundException;
import com.cryptolearn.backend.security.UserDetailsImpl;
import com.cryptolearn.backend.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    private final UserService userService;
    private final MessageSource messageSource;

    @Autowired
    public UserController(UserService userService, MessageSource messageSource) {
        this.userService = userService;
        this.messageSource = messageSource;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) authentication.getPrincipal()).getId();
        }
        throw new IllegalStateException(getLocalizedMessage("error.user.fetch.failed"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileDTO> getCurrentUserProfile() {
        Long userId = getCurrentUserId();
        UserProfileDTO userProfile = userService.getUserProfile(userId);
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateUserProfile(@Valid @RequestBody UpdateProfileRequestDTO updateDto) {
        Long userId = getCurrentUserId();
        try {
            UserProfileDTO updatedProfile = userService.updateUserProfile(userId, updateDto);
            return ResponseEntity.ok(Map.of(
                "message", getLocalizedMessage("success.profile.updated"),
                "profile", updatedProfile
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @PostMapping("/me/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequestDTO changePasswordDto) {
        Long userId = getCurrentUserId();
        try {
            userService.changePassword(userId, changePasswordDto);
            return ResponseEntity.ok(new MessageResponse(getLocalizedMessage("success.password.changed")));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
        }
    }

    @DeleteMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> deleteCurrentUserAccount() {
        Long userId = getCurrentUserId();
        String username = "unknown";
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            username = ((UserDetailsImpl) authentication.getPrincipal()).getUsername();
        }
        
        logger.info("Пользователь '{}' (ID: {}) запросил удаление своего аккаунта.", username, userId);

        try {
            userService.deleteUserAccount(userId);
            return ResponseEntity.ok(new MessageResponse(getLocalizedMessage("success.profile.deleted")));
        } catch (ResourceNotFoundException e) {
            logger.warn("Попытка удалить несуществующего пользователя с ID: {}. Сообщение: {}", userId, e.getMessage());
            throw e;
        } catch (Exception e) {
            logger.error("Ошибка при удалении аккаунта пользователя ID {}: {}", userId, e.getMessage(), e);
            throw e;
        }
    }

    private String getLocalizedMessage(String messageKey, Object... args) {
        try {
            return messageSource.getMessage(messageKey, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            logger.error("Не удалось получить локализованное сообщение для ключа '{}'", messageKey, e);
            return messageKey;
        }
    }
}