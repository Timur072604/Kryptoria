package com.cryptolearn.backend.dto.task;

import com.cryptolearn.backend.model.Language;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CaesarEncryptTaskDataDTO {
    private String taskId;
    private Language language;
    private String sourceText;
    private int key;
    private String description;
}