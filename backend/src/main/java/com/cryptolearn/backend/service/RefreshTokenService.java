package com.cryptolearn.backend.service;

import com.cryptolearn.backend.exception.ResourceNotFoundException;
import com.cryptolearn.backend.exception.TokenRefreshException;
import com.cryptolearn.backend.model.RefreshToken;
import com.cryptolearn.backend.model.User;
import com.cryptolearn.backend.repository.RefreshTokenRepository;
import com.cryptolearn.backend.repository.UserRepository;
import com.cryptolearn.backend.security.jwt.JwtUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;

@Service
public class RefreshTokenService {

    private static final Logger logger = LoggerFactory.getLogger(RefreshTokenService.class);

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;
    private final MessageSource messageSource;

    @Autowired
    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository,
                               JwtUtils jwtUtils,
                               MessageSource messageSource) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtUtils = jwtUtils;
        this.messageSource = messageSource;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createOrUpdateRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        getLocalizedMessage("error.resource.notfound", "User", "id", userId)));

        Optional<RefreshToken> existingTokenOpt = refreshTokenRepository.findByUser(user);
        if (existingTokenOpt.isPresent()) {
            RefreshToken tokenToDelete = existingTokenOpt.get();
            refreshTokenRepository.delete(tokenToDelete);
            refreshTokenRepository.flush();
            logger.debug("Старый refresh token для пользователя {} (ID токена: {}) удален и изменения синхронизированы.", user.getUsername(), tokenToDelete.getId());
        } else {
            logger.debug("Старый refresh token для пользователя {} не найден, удаление не требуется.", user.getUsername());
        }

        Instant now = Instant.now();
        Instant expiryDate = now.plusMillis(refreshTokenDurationMs);
        String tokenValue = jwtUtils.generateRefreshToken(user.getUsername(), user.getId());

        RefreshToken refreshToken = new RefreshToken(user, tokenValue, expiryDate);
        refreshToken = refreshTokenRepository.save(refreshToken);
        logger.info("Новый refresh token для пользователя {} создан с ID {}.", user.getUsername(), refreshToken.getId());
        return refreshToken;
    }

    @Transactional
    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            logger.warn("Refresh token {} (ID: {}) истек и будет удален.", token.getToken(), token.getId());
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(), getLocalizedMessage("error.token.refresh.expired"));
        }
        return token;
    }

    @Transactional
    public int deleteByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        getLocalizedMessage("error.resource.notfound", "User", "id", userId)));

        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByUser(user);
        if (tokenOpt.isPresent()) {
            refreshTokenRepository.delete(tokenOpt.get());
            logger.info("Refresh token для пользователя {} (ID: {}) удален при выходе из системы.", user.getUsername(), userId);
            return 1;
        }
        logger.info("Refresh token для пользователя {} (ID: {}) не найден для удаления при выходе из системы.", user.getUsername(), userId);
        return 0;
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