package com.cryptolearn.backend.controller;

import com.cryptolearn.backend.dto.MessageResponse;
import com.cryptolearn.backend.dto.admin.AdminUpdateUserRequestDTO;
import com.cryptolearn.backend.dto.user.UserProfileDTO;
import com.cryptolearn.backend.service.UserService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final UserService userService;

    @Autowired
    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public ResponseEntity<Page<UserProfileDTO>> getAllUsers(
            @PageableDefault(size = 10, sort = "username") Pageable pageable) {
        Pageable effectivePageable = pageable;
        List<Sort.Order> orders = new ArrayList<>();
        boolean rolesSortRequested = false;

        for (Sort.Order order : pageable.getSort()) {
            if ("roles".equalsIgnoreCase(order.getProperty())) {
                logger.warn("Сортировка по полю 'roles' не поддерживается напрямую. Вместо этого будет применена сортировка по 'username'.");
                orders.add(new Sort.Order(order.getDirection(), "username"));
                rolesSortRequested = true;
            } else {
                orders.add(order);
            }
        }
        if (rolesSortRequested || !pageable.getSort().isSorted()) {
            if (orders.isEmpty()) {
                 orders.add(Sort.Order.asc("username"));
            }
            effectivePageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), Sort.by(orders));
        }
        logger.info("Администратор запросил список пользователей. Pageable: {}", effectivePageable);
        Page<UserProfileDTO> users = userService.getAllUsers(effectivePageable);
        return ResponseEntity.ok(users);
    }

    @PutMapping("/users/{userId}")
    public ResponseEntity<UserProfileDTO> updateUserByAdmin(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUpdateUserRequestDTO updateUserRequest) {
        logger.info("Администратор запросил обновление данных для пользователя ID: {}. Данные: {}", userId, updateUserRequest);
        UserProfileDTO updatedUserProfile = userService.updateUserByAdmin(userId, updateUserRequest);
        return ResponseEntity.ok(updatedUserProfile);
    }


    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUserByAdmin(@PathVariable Long userId) {
        logger.info("Администратор запросил удаление пользователя с ID: {}", userId);
        try {
            userService.deleteUserAccount(userId);
            logger.info("Пользователь с ID: {} успешно удален администратором.", userId);
            return ResponseEntity.ok(new MessageResponse("Пользователь успешно удален."));
        } catch (Exception e) {
            logger.error("Ошибка при удалении пользователя с ID: {} администратором. Ошибка: {}", userId, e.getMessage(), e);
            throw e;
        }
    }
}