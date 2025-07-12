package com.cryptolearn.backend.converter;

import com.cryptolearn.backend.model.Language;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

@Component
public class StringToLanguageConverter implements Converter<String, Language> {

    @Override
    public Language convert(@NonNull String source) {
        try {
            return Language.valueOf(source.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            if ("RUS".equalsIgnoreCase(source.trim())) {
                return Language.RU;
            } else if ("ENG".equalsIgnoreCase(source.trim())) {
                return Language.EN;
            }
            throw new IllegalArgumentException("Неподдерживаемое значение языка: '" + source + "'. Допустимые значения: RU, EN.");
        }
    }
}