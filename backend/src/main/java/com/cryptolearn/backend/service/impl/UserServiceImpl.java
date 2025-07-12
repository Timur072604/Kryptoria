package com.cryptolearn.backend.service.impl;

import com.cryptolearn.backend.dto.admin.AdminUpdateUserRequestDTO;
import com.cryptolearn.backend.dto.user.ChangePasswordRequestDTO;
import com.cryptolearn.backend.dto.user.UpdateProfileRequestDTO;
import com.cryptolearn.backend.dto.user.UserProfileDTO;
import com.cryptolearn.backend.exception.ResourceNotFoundException;
import com.cryptolearn.backend.model.Role;
import com.cryptolearn.backend.model.User;
import com.cryptolearn.backend.repository.PasswordResetTokenRepository;
import com.cryptolearn.backend.repository.RefreshTokenRepository;
import com.cryptolearn.backend.repository.RoleRepository;
import com.cryptolearn.backend.repository.UserRepository;
import com.cryptolearn.backend.security.UserDetailsImpl;
import com.cryptolearn.backend.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MessageSource messageSource;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final RoleRepository roleRepository;

    private static final Pattern UPPERCASE_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE_PATTERN = Pattern.compile("[a-z]");
    private static final Pattern DIGIT_PATTERN = Pattern.compile("[0-9]");
    private static final Pattern SPECIAL_CHAR_PATTERN = Pattern.compile("[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>/?~`]");


    @Autowired
    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           MessageSource messageSource,
                           RefreshTokenRepository refreshTokenRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.messageSource = messageSource;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileDTO getUserProfile(Long userId) {
        User user = findUserByIdInternal(userId);
        return mapUserToProfileDTO(user);
    }

    @Override
    @Transactional(readOnly = true)
    public User findUserById(Long userId) {
        return findUserByIdInternal(userId);
    }

    private User findUserByIdInternal(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        getLocalizedMessage("error.resource.notfound", "User", "ID", userId)));
    }

    @Override
    @Transactional
    public UserProfileDTO updateUserProfile(Long userId, UpdateProfileRequestDTO dto) {
        User user = findUserByIdInternal(userId);
        boolean principalShouldBeRefreshed = false;

        if (StringUtils.hasText(dto.getUsername()) && !dto.getUsername().equals(user.getUsername())) {
            if (userRepository.existsByUsername(dto.getUsername())) {
                throw new IllegalArgumentException(getLocalizedMessage("error.username.taken"));
            }
            user.setUsername(dto.getUsername());
            principalShouldBeRefreshed = true;
            logger.info("Имя пользователя для ID {} будет изменено на '{}'", userId, dto.getUsername());
        }

        if (StringUtils.hasText(dto.getEmail()) && !dto.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(dto.getEmail())) {
                throw new IllegalArgumentException(getLocalizedMessage("error.email.taken"));
            }
            user.setEmail(dto.getEmail());
            principalShouldBeRefreshed = true;
            logger.info("Email для пользователя ID {} будет изменен на '{}'", userId, dto.getEmail());
        }

        boolean noChangesRequested = !StringUtils.hasText(dto.getUsername()) && !StringUtils.hasText(dto.getEmail());
        if (noChangesRequested || !principalShouldBeRefreshed) {
             logger.info("Обновление профиля для пользователя ID {}: нет фактических изменений или запроса на изменение.", userId);
             return mapUserToProfileDTO(user);
        }

        User updatedUser = userRepository.save(user);
        logger.info("Профиль пользователя ID {} сохранен в БД.", userId);

        if (principalShouldBeRefreshed) {
            Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
            if (currentAuth != null && currentAuth.getPrincipal() instanceof UserDetailsImpl) {
                UserDetailsImpl currentUserDetails = (UserDetailsImpl) currentAuth.getPrincipal();
                if (currentUserDetails.getId().equals(updatedUser.getId())) {
                    UserDetailsImpl newUserDetails = UserDetailsImpl.build(updatedUser);
                    UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
                            newUserDetails,
                            currentAuth.getCredentials(),
                            newUserDetails.getAuthorities()
                    );
                    newAuth.setDetails(currentAuth.getDetails());
                    SecurityContextHolder.getContext().setAuthentication(newAuth);
                    logger.info("Объект Authentication в SecurityContext обновлен для пользователя '{}' из-за изменения профиля.", updatedUser.getUsername());
                }
            } else {
                logger.warn("Не удалось обновить Authentication в SecurityContext: текущий principal не является UserDetailsImpl или отсутствует. Current auth: {}",
                        (currentAuth != null ? currentAuth.getClass().getName() : "null"));
            }
        }
        return mapUserToProfileDTO(updatedUser);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequestDTO dto) {
        User user = findUserByIdInternal(userId);

        if (!passwordEncoder.matches(dto.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException(getLocalizedMessage("error.password.current.mismatch"));
        }

        if (dto.getCurrentPassword().equals(dto.getNewPassword())) {
            throw new IllegalArgumentException(getLocalizedMessage("error.password.new.sameasold"));
        }
        if (!isPasswordComplexEnough(dto.getNewPassword())) {
            throw new IllegalArgumentException(getLocalizedMessage("validation.password.requirements"));
        }

        user.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);
        logger.info("Пароль для пользователя ID {} успешно изменен.", userId);
    }


    @Override
    @Transactional
    public void deleteUserAccount(Long userIdToDelete) {
        User userToDelete = findUserByIdInternal(userIdToDelete);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl performingUserDetails;

        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            performingUserDetails = (UserDetailsImpl) authentication.getPrincipal();
        } else {
            logger.error("Не удалось получить информацию о текущем аутентифицированном пользователе при попытке удаления аккаунта ID: {}", userIdToDelete);
            throw new IllegalStateException(getLocalizedMessage("error.user.fetch.failed"));
        }
        
        boolean isPerformingUserAdmin = performingUserDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(Role.ADMIN::equals);

        if (performingUserDetails.getId().equals(userIdToDelete)) {
            logger.info("Пользователь {} (ID: {}) удаляет свой собственный аккаунт.",
                    performingUserDetails.getUsername(), performingUserDetails.getId());
        }
        else if (isPerformingUserAdmin) {
            logger.info("Администратор {} (ID: {}) удаляет пользователя {} (ID: {}).",
                    performingUserDetails.getUsername(), performingUserDetails.getId(),
                    userToDelete.getUsername(), userToDelete.getId());

            boolean isTargetUserAdmin = userToDelete.getRoles().stream()
                    .map(Role::getName)
                    .anyMatch(Role.ADMIN::equals);

            if (isTargetUserAdmin) {
                logger.warn("Администратор {} (ID: {}) попытался удалить другого администратора {} (ID: {}). Действие запрещено.",
                        performingUserDetails.getUsername(), performingUserDetails.getId(),
                        userToDelete.getUsername(), userToDelete.getId());
                throw new AccessDeniedException(getLocalizedMessage("error.admin.delete.anotherAdmin"));
            }
        }
        else {
            logger.warn("Пользователь {} (ID: {}) попытался удалить аккаунт пользователя {} (ID: {}), не имея прав администратора. Действие запрещено.",
                    performingUserDetails.getUsername(), performingUserDetails.getId(),
                    userToDelete.getUsername(), userToDelete.getId());
            throw new AccessDeniedException(getLocalizedMessage("error.accessDenied"));
        }
        
        logger.info("Начало процесса удаления аккаунта для пользователя: {} (ID: {}) по запросу от {}",
                userToDelete.getUsername(), userIdToDelete, performingUserDetails.getUsername());

        int refreshTokensDeleted = refreshTokenRepository.deleteByUser(userToDelete);
        if (refreshTokensDeleted > 0) {
            logger.debug("Удалено {} refresh токенов для пользователя ID {}", refreshTokensDeleted, userIdToDelete);
        }

        int passwordResetTokensDeleted = passwordResetTokenRepository.deleteByUser(userToDelete);
        if (passwordResetTokensDeleted > 0) {
            logger.debug("Удалено {} токенов сброса пароля для пользователя ID {}", passwordResetTokensDeleted, userIdToDelete);
        }

        userRepository.delete(userToDelete);
        logger.info("Аккаунт пользователя: {} (ID: {}) успешно удален.", userToDelete.getUsername(), userIdToDelete);
    }

    @Override
    @Transactional
    public UserProfileDTO updateUserByAdmin(Long userIdToUpdate, AdminUpdateUserRequestDTO dto) {
        User userToUpdate = findUserByIdInternal(userIdToUpdate);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetailsImpl performingAdminDetails;
        if (authentication != null && authentication.getPrincipal() instanceof UserDetailsImpl) {
            performingAdminDetails = (UserDetailsImpl) authentication.getPrincipal();
        } else {
            logger.error("Не удалось получить информацию о текущем администраторе при попытке обновить пользователя ID: {}", userIdToUpdate);
            throw new IllegalStateException(getLocalizedMessage("error.user.fetch.failed"));
        }

        if (!performingAdminDetails.getAuthorities().stream().anyMatch(auth -> auth.getAuthority().equals(Role.ADMIN))) {
            throw new AccessDeniedException(getLocalizedMessage("error.accessDenied"));
        }

        boolean isTargetUserAdmin = userToUpdate.getRoles().stream()
                .map(Role::getName)
                .anyMatch(Role.ADMIN::equals);

        if (isTargetUserAdmin && !performingAdminDetails.getId().equals(userIdToUpdate)) {
            logger.warn("Администратор {} (ID: {}) попытался изменить данные другого администратора {} (ID: {}). Действие запрещено.",
                    performingAdminDetails.getUsername(), performingAdminDetails.getId(),
                    userToUpdate.getUsername(), userToUpdate.getId());
            throw new AccessDeniedException(getLocalizedMessage("error.admin.edit.anotherAdmin"));
        }
        
        if (performingAdminDetails.getId().equals(userIdToUpdate)) {
            if (dto.getRoles() != null) {
                 Set<String> currentUserRoleNames = userToUpdate.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
                 if (!currentUserRoleNames.equals(dto.getRoles())) {
                    logger.warn("Администратор {} (ID: {}) попытался изменить свои собственные роли через админ-панель. Это действие запрещено.",
                            performingAdminDetails.getUsername(), performingAdminDetails.getId());
                    throw new AccessDeniedException(getLocalizedMessage("error.admin.edit.selfRoles"));
                 }
            }
            if (dto.getEnabled() != null && !dto.getEnabled().equals(userToUpdate.isEnabled()) && !dto.getEnabled()) {
                 logger.warn("Администратор {} (ID: {}) попытался деактивировать свой собственный аккаунт через админ-панель. Действие запрещено.",
                            performingAdminDetails.getUsername(), performingAdminDetails.getId());
                throw new AccessDeniedException(getLocalizedMessage("error.admin.disable.self"));
            }
            if (StringUtils.hasText(dto.getNewPassword())) {
                logger.warn("Администратор {} (ID: {}) попытался изменить свой собственный пароль через интерфейс администрирования пользователей. Это действие запрещено.",
                        performingAdminDetails.getUsername(), performingAdminDetails.getId());
                throw new AccessDeniedException(getLocalizedMessage("error.admin.edit.selfPassword.via.admin.panel"));
            }
        }


        boolean changed = false;

        if (dto.getUsername() != null && !dto.getUsername().trim().isEmpty() && !dto.getUsername().equals(userToUpdate.getUsername())) {
            String newUsername = dto.getUsername().trim();
            if (userRepository.existsByUsername(newUsername)) {
                throw new IllegalArgumentException(getLocalizedMessage("error.username.taken"));
            }
            userToUpdate.setUsername(newUsername);
            changed = true;
            logger.info("Имя пользователя ID {} изменено администратором {} на '{}'", userIdToUpdate, performingAdminDetails.getUsername(), newUsername);
        }

        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty() && !dto.getEmail().equals(userToUpdate.getEmail())) {
            String newEmail = dto.getEmail().trim();
            if (userRepository.existsByEmail(newEmail)) {
                throw new IllegalArgumentException(getLocalizedMessage("error.email.taken"));
            }
            userToUpdate.setEmail(newEmail);
            changed = true;
            logger.info("Email пользователя ID {} изменен администратором {} на '{}'", userIdToUpdate, performingAdminDetails.getUsername(), newEmail);
        }

        if (dto.getRoles() != null) {
            Set<String> requestedRoleNames = dto.getRoles().stream().filter(StringUtils::hasText).collect(Collectors.toSet());
            if (requestedRoleNames.isEmpty()) {
                 throw new IllegalArgumentException(getLocalizedMessage("error.roles.mustNotBeEmpty"));
            }

            Set<Role> newRoles = new HashSet<>();
            for (String roleName : requestedRoleNames) {
                Role role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new ResourceNotFoundException(getLocalizedMessage("error.role.notfound.name", roleName)));
                newRoles.add(role);
            }

            if (!userToUpdate.getRoles().equals(newRoles)) {
                userToUpdate.setRoles(newRoles);
                changed = true;
                logger.info("Роли пользователя ID {} изменены администратором {} на: {}", userIdToUpdate, performingAdminDetails.getUsername(), requestedRoleNames);
            }
        }
        
        if (dto.getEnabled() != null && dto.getEnabled() != userToUpdate.isEnabled()) {
            userToUpdate.setEnabled(dto.getEnabled());
            changed = true;
            logger.info("Статус enabled пользователя ID {} изменен администратором {} на: {}", userIdToUpdate, performingAdminDetails.getUsername(), dto.getEnabled());
        }

        if (StringUtils.hasText(dto.getNewPassword())) {
            if (!isPasswordComplexEnough(dto.getNewPassword())) {
                throw new IllegalArgumentException(getLocalizedMessage("validation.password.requirements"));
            }
            userToUpdate.setPasswordHash(passwordEncoder.encode(dto.getNewPassword()));
            changed = true;
            logger.info("Пароль пользователя ID {} изменен администратором {}", userIdToUpdate, performingAdminDetails.getUsername());
        }


        if (changed) {
            User updatedUser = userRepository.save(userToUpdate);
            if (performingAdminDetails.getId().equals(userIdToUpdate) &&
                ( (dto.getUsername() != null && !dto.getUsername().trim().isEmpty() && !dto.getUsername().equals(performingAdminDetails.getUsername())) ||
                  (dto.getEmail() != null && !dto.getEmail().trim().isEmpty() && !dto.getEmail().equals(performingAdminDetails.getEmail())) ) ) {
                 Authentication currentAuth = SecurityContextHolder.getContext().getAuthentication();
                 UserDetailsImpl newUserDetails = UserDetailsImpl.build(updatedUser);
                 UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(
                         newUserDetails, currentAuth.getCredentials(), newUserDetails.getAuthorities());
                 newAuth.setDetails(currentAuth.getDetails());
                 SecurityContextHolder.getContext().setAuthentication(newAuth);
                 logger.info("Данные текущего администратора {} (ID: {}) были обновлены. Principal в SecurityContext обновлен.", updatedUser.getUsername(), updatedUser.getId());
            }
            return mapUserToProfileDTO(updatedUser);
        } else {
            logger.info("Для пользователя ID {} не было запрошено фактических изменений администратором {}.", userIdToUpdate, performingAdminDetails.getUsername());
            return mapUserToProfileDTO(userToUpdate);
        }
    }


    @Override
    @Transactional(readOnly = true)
    public Page<UserProfileDTO> getAllUsers(Pageable pageable) {
        logger.debug("Запрос на получение списка всех пользователей с пагинацией: {}", pageable);
        Page<User> usersPage = userRepository.findAll(pageable);
        return usersPage.map(this::mapUserToProfileDTO);
    }

    private UserProfileDTO mapUserToProfileDTO(User user) {
        if (user == null) {
            return null;
        }
        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toList()))
                .enabled(user.isEnabled())
                .build();
    }

    private String getLocalizedMessage(String messageKey, Object... args) {
        try {
            return messageSource.getMessage(messageKey, args, LocaleContextHolder.getLocale());
        } catch (Exception e) {
            logger.error("Не удалось получить локализованное сообщение для ключа '{}' с аргументами {}: {}", messageKey, args, e.getMessage());
            if (args != null && args.length > 0) {
                return messageKey + " " + String.join(", ", java.util.Arrays.stream(args).map(Object::toString).toArray(String[]::new));
            }
            return messageKey;
        }
    }

    private boolean isPasswordComplexEnough(String password) {
        if (password == null) {
            return false;
        }
        if (password.length() < 8 || password.length() > 128) {
            return false;
        }
        boolean hasUppercase = UPPERCASE_PATTERN.matcher(password).find();
        boolean hasLowercase = LOWERCASE_PATTERN.matcher(password).find();
        boolean hasDigit = DIGIT_PATTERN.matcher(password).find();
        boolean hasSpecialChar = SPECIAL_CHAR_PATTERN.matcher(password).find();
        return hasUppercase && hasLowercase && hasDigit && hasSpecialChar;
    }
}