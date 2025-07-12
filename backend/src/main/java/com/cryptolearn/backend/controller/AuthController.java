package com.cryptolearn.backend.controller;

import com.cryptolearn.backend.dto.MessageResponse;
import com.cryptolearn.backend.dto.auth.*;
import com.cryptolearn.backend.exception.TokenRefreshException;
import com.cryptolearn.backend.model.PasswordResetToken;
import com.cryptolearn.backend.model.RefreshToken;
import com.cryptolearn.backend.model.Role;
import com.cryptolearn.backend.model.User;
import com.cryptolearn.backend.repository.RoleRepository;
import com.cryptolearn.backend.repository.UserRepository;
import com.cryptolearn.backend.security.UserDetailsImpl;
import com.cryptolearn.backend.security.jwt.JwtUtils;
import com.cryptolearn.backend.service.EmailService;
import com.cryptolearn.backend.service.PasswordResetTokenService;
import com.cryptolearn.backend.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final RefreshTokenService refreshTokenService;
    private final PasswordResetTokenService passwordResetTokenService;
    private final MessageSource messageSource;
    private final EmailService emailService;

    @Autowired
    public AuthController(AuthenticationManager authenticationManager,
                          UserRepository userRepository,
                          RoleRepository roleRepository,
                          PasswordEncoder passwordEncoder,
                          JwtUtils jwtUtils,
                          RefreshTokenService refreshTokenService,
                          PasswordResetTokenService passwordResetTokenService,
                          MessageSource messageSource,
                          EmailService emailService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.refreshTokenService = refreshTokenService;
        this.passwordResetTokenService = passwordResetTokenService;
        this.messageSource = messageSource;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistrationRequest registrationRequest) {
        logger.info("Попытка регистрации пользователя: {}", registrationRequest.getUsername());

        if (userRepository.existsByUsername(registrationRequest.getUsername())) {
            logger.warn("Регистрация не удалась: имя пользователя {} уже занято.", registrationRequest.getUsername());
            return ResponseEntity.badRequest().body(new MessageResponse(getLocalizedMessage("error.username.taken")));
        }

        if (userRepository.existsByEmail(registrationRequest.getEmail())) {
            logger.warn("Регистрация не удалась: email {} уже занят.", registrationRequest.getEmail());
            return ResponseEntity.badRequest().body(new MessageResponse(getLocalizedMessage("error.email.taken")));
        }

        User user = new User();
        user.setUsername(registrationRequest.getUsername());
        user.setEmail(registrationRequest.getEmail());
        user.setPasswordHash(passwordEncoder.encode(registrationRequest.getPassword()));
        user.setEnabled(true);

        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(Role.USER)
                .orElseThrow(() -> new RuntimeException(getLocalizedMessage("error.role.notfound")));
        roles.add(userRole);
        user.setRoles(roles);

        userRepository.save(user);
        logger.info("Пользователь {} успешно зарегистрирован.", user.getUsername());

        return ResponseEntity.status(HttpStatus.CREATED)
                             .body(new MessageResponse(getLocalizedMessage("success.registration")));
    }

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        logger.info("Попытка входа пользователя: {}", loginRequest.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        User user = userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new RuntimeException(getLocalizedMessage("error.user.auth.notfound")));

        String accessToken = jwtUtils.generateAccessToken(authentication);
        RefreshToken refreshToken = refreshTokenService.createOrUpdateRefreshToken(user.getId());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        logger.info("Пользователь {} успешно вошел в систему.", userDetails.getUsername());

        return ResponseEntity.ok(new AuthResponse(
                accessToken,
                refreshToken.getToken(),
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles
        ));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        logger.debug("Попытка обновления токена с использованием refresh token: {}", requestRefreshToken);

        RefreshToken foundToken = refreshTokenService.findByToken(requestRefreshToken)
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken, getLocalizedMessage("error.token.refresh.notfound")));

        refreshTokenService.verifyExpiration(foundToken);
        User user = foundToken.getUser();

        if (user == null) {
             logger.error("Критическая ошибка: Refresh token {} не связан с пользователем.", foundToken.getId());
             throw new TokenRefreshException(requestRefreshToken, getLocalizedMessage("error.token.refresh.user.mismatch"));
        }

        String newAccessToken = jwtUtils.generateAccessTokenFromUsernameAndId(user.getUsername(), user.getId());
        logger.info("Access token для пользователя {} успешно обновлен.", user.getUsername());

        return ResponseEntity.ok(new AccessTokenResponse(newAccessToken));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Long userId = getCurrentUserId();
        String username = getCurrentUsername();
        if (username == null) {
             return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                                 .body(new MessageResponse(getLocalizedMessage("error.user.fetch.failed")));
        }
        logger.info("Попытка выхода пользователя: {}", username);

        refreshTokenService.deleteByUserId(userId);

        SecurityContextHolder.clearContext();
        return ResponseEntity.ok(new MessageResponse(getLocalizedMessage("success.logout")));
    }

    @PostMapping("/request-password-reset")
    public ResponseEntity<?> requestPasswordReset(@Valid @RequestBody PasswordResetRequest request) {
        String usernameOrEmail = request.getUsernameOrEmail();
        logger.info("Запрос на сброс пароля для: {}", usernameOrEmail);

        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElse(null);

        String successMessage = getLocalizedMessage("success.password.reset.request.sent");

        if (user != null) {
            try {
                PasswordResetToken resetToken = passwordResetTokenService.createPasswordResetToken(user);
                emailService.sendPasswordResetEmail(user, resetToken.getToken());
                logger.info("Запрос на сброс пароля обработан для пользователя {}", user.getUsername());
            } catch (Exception e) {
                logger.error("Ошибка при обработке запроса на сброс пароля для {}: {}", usernameOrEmail, e.getMessage(), e);
            }
        } else {
            logger.warn("Запрос на сброс пароля для несуществующего пользователя: {}", usernameOrEmail);
        }
        return ResponseEntity.ok(new MessageResponse(successMessage));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody NewPasswordRequest request) {
        String token = request.getResetToken();
        logger.info("Попытка сброса пароля с использованием токена: {}", token);

        User user = passwordResetTokenService.validatePasswordResetToken(token);
        logger.debug("Токен сброса пароля валиден для пользователя {}", user.getUsername());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Пароль для пользователя {} успешно сброшен.", user.getUsername());

        passwordResetTokenService.deleteTokenByValue(token);

        return ResponseEntity.ok(new MessageResponse(getLocalizedMessage("success.password.reset.success")));
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return ((UserDetailsImpl) principal).getUsername();
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                 return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else {
                return principal.toString();
            }
        }
        return null;
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return ((UserDetailsImpl) principal).getId();
            } else {
                 logger.error("Не удалось получить UserDetailsImpl из principal для извлечения ID пользователя. Principal type: {}", principal.getClass().getName());
                 throw new IllegalStateException(getLocalizedMessage("error.user.fetch.failed"));
            }
        }
        throw new IllegalStateException(getLocalizedMessage("error.user.fetch.failed"));
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