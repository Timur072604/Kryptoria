package com.cryptolearn.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PasswordResetRequest {

    @NotBlank(message = "Имя пользователя или email не может быть пустым")
    private String usernameOrEmail;

}