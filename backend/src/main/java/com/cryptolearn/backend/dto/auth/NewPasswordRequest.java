package com.cryptolearn.backend.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class NewPasswordRequest {

    @NotBlank(message = "Токен сброса не может быть пустым")
    private String resetToken;

    @NotBlank(message = "Новый пароль не может быть пустым")
    @Size(min = 8, max = 128, message = "Пароль должен содержать от 8 до 128 символов")
    private String newPassword;

}