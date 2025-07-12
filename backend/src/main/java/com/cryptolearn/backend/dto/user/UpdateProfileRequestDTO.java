package com.cryptolearn.backend.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequestDTO {

    @Size(min = 1, max = 50, message = "Имя пользователя должно содержать от 1 до 50 символов")
    private String username;

    @Email(message = "Некорректный формат email")
    @Size(max = 100, message = "Email не может превышать 100 символов")
    private String email;
}