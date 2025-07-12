package com.cryptolearn.backend.converter;

import com.cryptolearn.backend.model.TaskDifficulty;
import org.springframework.core.convert.converter.Converter;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;

@Component
public class StringToTaskDifficultyConverter implements Converter<String, TaskDifficulty> {

    @Override
    public TaskDifficulty convert(@NonNull String source) {
        try {
            return TaskDifficulty.valueOf(source.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Неподдерживаемое значение сложности: '" + source + "'. Допустимые значения: EASY, MEDIUM, HARD, CUSTOM.");
        }
    }
}