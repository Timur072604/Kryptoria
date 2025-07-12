package com.cryptolearn.backend.service;

import com.cryptolearn.backend.exception.ResourceNotFoundException;
import com.cryptolearn.backend.exception.TokenRefreshException;
import com.cryptolearn.backend.model.PasswordResetToken;
import com.cryptolearn.backend.model.User;
import com.cryptolearn.backend.repository.PasswordResetTokenRepository;
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
import java.util.UUID;

@Service
public class PasswordResetTokenService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetTokenService.class);

    @Value("${app.password-reset.token-expiration-ms}")
    private Long tokenDurationMs;

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final MessageSource messageSource;

    @Autowired
    public PasswordResetTokenService(PasswordResetTokenRepository passwordResetTokenRepository,
                                     MessageSource messageSource) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.messageSource = messageSource;
    }

    @Transactional
    public PasswordResetToken createPasswordResetToken(User user) {
        int deletedCount = passwordResetTokenRepository.deleteByUser(user);
        if (deletedCount > 0) {
            logger.debug("Удалено {} старых токенов сброса пароля для пользователя {}", deletedCount, user.getUsername());
        }

        String tokenValue = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiryDate = now.plusMillis(tokenDurationMs);

        PasswordResetToken passwordResetToken = new PasswordResetToken(user, tokenValue, expiryDate);
        passwordResetToken = passwordResetTokenRepository.save(passwordResetToken);
        logger.info("Создан токен сброса пароля для пользователя {} с ID {}", user.getUsername(), passwordResetToken.getId());
        return passwordResetToken;
    }

    @Transactional(readOnly = true)
    public User validatePasswordResetToken(String token) {
        PasswordResetToken passToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new ResourceNotFoundException(
                        getLocalizedMessage("error.password.reset.token.notfound")));

        if (passToken.getExpiryDate().compareTo(Instant.now()) < 0) {
            logger.warn("Токен сброса пароля {} истек.", passToken.getId());
            throw new TokenRefreshException(token, getLocalizedMessage("error.password.reset.token.expired"));
        }

        return passToken.getUser();
    }

    @Transactional
    public void deleteToken(PasswordResetToken token) {
        if (token != null) {
            passwordResetTokenRepository.delete(token);
            logger.debug("Токен сброса пароля с ID {} удален.", token.getId());
        }
    }

    @Transactional
    public void deleteTokenByValue(String token) {
         Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository.findByToken(token);
         tokenOpt.ifPresent(this::deleteToken);
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