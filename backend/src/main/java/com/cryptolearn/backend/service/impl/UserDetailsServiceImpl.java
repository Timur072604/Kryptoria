package com.cryptolearn.backend.service.impl;

import com.cryptolearn.backend.model.User;
import com.cryptolearn.backend.repository.UserRepository;
import com.cryptolearn.backend.security.UserDetailsImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private static final Logger logger = LoggerFactory.getLogger(UserDetailsServiceImpl.class);

    private final UserRepository userRepository;
    private final MessageSource messageSource;

    @Autowired
    public UserDetailsServiceImpl(UserRepository userRepository,
                                  MessageSource messageSource) {
        this.userRepository = userRepository;
        this.messageSource = messageSource;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        logger.debug("Попытка загрузки пользователя по идентификатору (username/email): {}", usernameOrEmail);

        Optional<User> userOptional = userRepository.findByUsername(usernameOrEmail);

        if (userOptional.isPresent()) {
            logger.info("Пользователь найден по имени пользователя: {}", usernameOrEmail);
            return UserDetailsImpl.build(userOptional.get());
        }

        logger.debug("Пользователь не найден по имени пользователя '{}', попытка поиска по email.", usernameOrEmail);
        userOptional = userRepository.findByEmail(usernameOrEmail);

        if (userOptional.isPresent()) {
            logger.info("Пользователь найден по email: {}", usernameOrEmail);
            return UserDetailsImpl.build(userOptional.get());
        }

        String errorMessage = getLocalizedMessage("error.user.notfound.identifier", usernameOrEmail);
        logger.warn(errorMessage);
        throw new UsernameNotFoundException(errorMessage);
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserById(Long id) throws UsernameNotFoundException {
        logger.debug("Попытка загрузки пользователя по ID: {}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> {
                    String errorMessage = getLocalizedMessage("error.user.notfound.id", id);
                    logger.warn(errorMessage);
                    return new UsernameNotFoundException(errorMessage);
                });
        logger.info("Пользователь найден по ID: {}. Имя пользователя: {}", id, user.getUsername());
        return UserDetailsImpl.build(user);
    }

    private String getLocalizedMessage(String messageKey, Object... args) {
        try {
            return messageSource.getMessage(messageKey, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            logger.error("Не удалось получить локализованное сообщение для ключа '{}'", messageKey, e);
            return "Error resolving message for key: " + messageKey;
        }
    }
}