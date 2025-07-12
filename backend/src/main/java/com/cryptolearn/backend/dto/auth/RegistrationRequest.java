package com.cryptolearn.backend.dto.auth;

import com.cryptolearn.backend.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationRequest {

    @NotBlank(message = "Имя пользователя не может быть пустым")
    @Size(min = 1, max = 50, message = "Имя пользователя должно содержать от 1 до 50 символов")
    private String username;

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Некорректный формат email")
    @Size(max = 100, message = "Email не может превышать 100 символов")
    private String email;

    @NotBlank(message = "Пароль не может быть пустым")
    @ValidPassword(message = "{validation.password.requirements}")
    private String password;
}