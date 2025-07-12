package com.cryptolearn.backend.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequestDTO {

    @NotBlank(message = "Текущий пароль не может быть пустым")
    private String currentPassword;

    @NotBlank(message = "Новый пароль не может быть пустым")
    @Size(min = 8, max = 128, message = "Новый пароль должен содержать от 8 до 128 символов")
    private String newPassword;
}