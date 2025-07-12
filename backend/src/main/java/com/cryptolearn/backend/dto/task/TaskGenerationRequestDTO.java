package com.cryptolearn.backend.dto.task;

import com.cryptolearn.backend.model.Language;
import com.cryptolearn.backend.model.TaskDifficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskGenerationRequestDTO {

    @NotNull(message = "{validation.task.language.notnull}")
    private Language language;

    @NotNull(message = "{validation.task.difficulty.notnull}")
    private TaskDifficulty difficulty;

    @Min(value = 1, message = "{validation.task.textlength.min}")
    @Max(value = 100, message = "{validation.task.textlength.max}")
    private Integer customMinTextLength;

    @Min(value = 1, message = "{validation.task.textlength.min}")
    @Max(value = 100, message = "{validation.task.textlength.max}")
    private Integer customMaxTextLength;

    @Min(value = 1, message = "{validation.task.key.min}")
    private Integer customMinKey;

    @Min(value = 1, message = "{validation.task.key.min}")
    private Integer customMaxKey;
}