package com.cryptolearn.backend.config;

import com.cryptolearn.backend.model.Role;
import com.cryptolearn.backend.repository.RoleRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;

    @Autowired
    public DataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        logger.info("Запуск инициализации данных...");
        initializeRoles();
        logger.info("Инициализация данных завершена.");
    }

    private void initializeRoles() {
        List<String> roleNames = Arrays.asList(Role.USER, Role.ADMIN);

        for (String roleName : roleNames) {
            if (roleRepository.findByName(roleName).isEmpty()) {
                Role role = new Role();
                role.setName(roleName);
                roleRepository.save(role);
                logger.info("Создана роль: {}", roleName);
            } else {
                logger.debug("Роль {} уже существует.", roleName);
            }
        }
    }
}