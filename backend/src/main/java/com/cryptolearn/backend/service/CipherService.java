package com.cryptolearn.backend.service;

import com.cryptolearn.backend.dto.cipher.VisualizationStep;
import com.cryptolearn.backend.model.Language;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class CipherService {

    private static final Logger logger = LoggerFactory.getLogger(CipherService.class);

    private static final String ALPHABET_EN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String ALPHABET_RU = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";

    private static final Map<Language, String> ALPHABETS = Map.of(
            Language.EN, ALPHABET_EN,
            Language.RU, ALPHABET_RU
    );

    private static final Map<Language, String> LANGUAGE_NAME_KEYS_FOR_PARAMS = Map.of(
        Language.RU, "alphabet_russian",
        Language.EN, "alphabet_english"
    );

    private final MessageSource messageSource;

    @Autowired
    public CipherService(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String caesarEncrypt(String text, int shift, Language language) {
        validateInput(text, shift, language);
        logger.debug("Шифрование текста (язык: {}, сдвиг: {}): '{}'", language, shift, text);
        return processTextInternal(text, shift, language, true);
    }

    public String caesarDecrypt(String text, int shift, Language language) {
        validateInput(text, shift, language);
        logger.debug("Дешифрование текста (язык: {}, сдвиг: {}): '{}'", language, shift, text);
        return processTextInternal(text, shift, language, false);
    }

    public List<VisualizationStep> getCaesarVisualizationSteps(String text, int shift, Language language, boolean encrypt) {
        validateInput(text, shift, language);
        logger.debug("Генерация шагов визуализации (язык: {}, сдвиг: {}, шифрование: {}): '{}'", language, shift, encrypt, text);

        List<VisualizationStep> steps = new ArrayList<>();
        String alphabet = getAlphabet(language);
        StringBuilder intermediateTextBuilder = new StringBuilder(text);
        
        String languageNameParamKey = LANGUAGE_NAME_KEYS_FOR_PARAMS.getOrDefault(language, language.toString());

        for (int i = 0; i < text.length(); i++) {
            char originalChar = text.charAt(i);
            char upperOriginalChar = Character.toUpperCase(originalChar);
            int originalCharIndexInAlphabet = alphabet.indexOf(upperOriginalChar);
            
            boolean isAlphabetic = originalCharIndexInAlphabet != -1;
            boolean skipped = !isAlphabetic;
            char processedChar;
            String explanationKey;
            Map<String, Object> params = new HashMap<>();

            if (isAlphabetic) {
                processedChar = processCharInternal(originalChar, shift, alphabet, encrypt);
                int processedCharIndexInAlphabet = alphabet.indexOf(Character.toUpperCase(processedChar));
                
                explanationKey = "visualization_explanation_alphabetic_trans";
                params.put("val0", String.valueOf(originalChar));
                params.put("val1", originalCharIndexInAlphabet + 1);
                params.put("val2_key", encrypt ? "visualization_operation_encrypt" : "visualization_operation_decrypt");
                params.put("val2_params_count", shift);
                params.put("val3", String.valueOf(processedChar));
                params.put("val4", processedCharIndexInAlphabet + 1);
            } else {
                processedChar = originalChar;
                explanationKey = "visualization_explanation_nonalphabetic_trans";
                params.put("val0", String.valueOf(originalChar));
                params.put("val1", languageNameParamKey);
            }

            intermediateTextBuilder.setCharAt(i, processedChar);
            
            steps.add(new VisualizationStep(
                    i,
                    i,
                    originalChar,
                    processedChar,
                    intermediateTextBuilder.toString(),
                    explanationKey,
                    params,
                    skipped
            ));
        }
        logger.debug("Сгенерировано {} шагов визуализации.", steps.size());
        return steps;
    }

    private String processTextInternal(String text, int shift, Language language, boolean encrypt) {
        String alphabet = getAlphabet(language);
        StringBuilder result = new StringBuilder(text.length());
        for (char originalChar : text.toCharArray()) {
            result.append(processCharInternal(originalChar, shift, alphabet, encrypt));
        }
        return result.toString();
    }

    private char processCharInternal(char originalChar, int shift, String alphabet, boolean encrypt) {
        char upperChar = Character.toUpperCase(originalChar);
        int originalIndex = alphabet.indexOf(upperChar);

        if (originalIndex == -1) {
            return originalChar;
        }

        int alphabetLength = alphabet.length();
        int effectiveShift = encrypt ? shift : -shift;
        
        int newIndex = (originalIndex + effectiveShift) % alphabetLength;
        if (newIndex < 0) {
            newIndex += alphabetLength;
        }
        
        char newUpperChar = alphabet.charAt(newIndex);
        return Character.isLowerCase(originalChar) ? Character.toLowerCase(newUpperChar) : newUpperChar;
    }

    private String getLocalizedMessage(Locale locale, String key, Object... args) {
        try {
            return messageSource.getMessage(key, args, locale);
        } catch (Exception e) {
            logger.warn("Не удалось получить локализованное сообщение для ключа '{}' и локали '{}': {}. Возвращаем ключ.",
                        key, locale, e.getMessage());
            return key;
        }
    }

    private void validateInput(String text, int shift, Language language) {
        Locale currentLocale = LocaleContextHolder.getLocale();
        if (text == null) {
            throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "error.cipher.text.null"));
        }
        if (language == null) {
            throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "error.cipher.language.null"));
        }
        String alphabet = getAlphabet(language);
        String localizedLanguageName = getLocalizedMessage(currentLocale,
            LANGUAGE_NAME_KEYS_FOR_PARAMS.getOrDefault(language, language.toString())
        );

        if (shift <= 0 || shift >= alphabet.length()) {
            throw new IllegalArgumentException(
                getLocalizedMessage(currentLocale, "error.cipher.shift.invalid",
                    shift,
                    alphabet.length(),
                    localizedLanguageName
                )
            );
        }
    }

    private String getAlphabet(Language language) {
        String alphabet = ALPHABETS.get(language);
        if (alphabet == null) {
            logger.error("Критическая ошибка: не найдена конфигурация алфавита для языка {}", language);
            throw new IllegalArgumentException("Unsupported language configuration: " + language);
        }
        return alphabet;
    }
}