package com.cryptolearn.backend.converter;

import com.cryptolearn.backend.model.CaesarTaskType;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

@Component
public class StringToCaesarTaskTypeConverter implements Converter<String, CaesarTaskType> {

    @Override
    public CaesarTaskType convert(@NonNull String source) {
        String upperSource = source.trim().toUpperCase();
        
        try {
            return CaesarTaskType.valueOf(upperSource);
        } catch (IllegalArgumentException e) {
            switch (source.trim().toLowerCase()) {
                case "find-key":
                    return CaesarTaskType.FIND_KEY;
                case "encrypt-text":
                    return CaesarTaskType.ENCRYPT_TEXT;
                case "decrypt-text":
                    return CaesarTaskType.DECRYPT_TEXT;
                default:
                    throw new IllegalArgumentException("Неподдерживаемый тип задания Цезаря: '" + source +
                            "'. Допустимые значения: FIND_KEY, ENCRYPT_TEXT, DECRYPT_TEXT (или find-key, encrypt-text, decrypt-text).");
            }
        }
    }
}