package com.cryptolearn.backend.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUpdateUserRequestDTO {

    @Size(min = 1, max = 50, message = "{validation.username.length}")
    private String username;

    @Email(message = "Некорректный формат email")
    @Size(max = 100, message = "Email не может превышать 100 символов")
    private String email;

    private Set<String> roles;
    
    private Boolean enabled;

    @Size(min = 8, max = 128, groups = AdminUpdateUserRequestDTO.PasswordUpdate.class, message = "{validation.password.length}")
    private String newPassword;

    public interface PasswordUpdate {}
}