package com.cryptolearn.backend.dto.cipher;

import com.cryptolearn.backend.model.Language;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CipherRequest {

    @NotBlank(message = "Текст не может быть пустым")
    @Size(max = 500, message = "Длина текста не может превышать 500 символов")
    private String text;

    @NotNull(message = "Сдвиг не может быть null")
    @Min(value = 1, message = "Сдвиг должен быть не менее 1")
    private Integer shift;

    @NotNull(message = "Язык не может быть null")
    private Language language;

    @NotNull(message = "Флаг encrypt не может быть null")
    private Boolean encrypt;

}