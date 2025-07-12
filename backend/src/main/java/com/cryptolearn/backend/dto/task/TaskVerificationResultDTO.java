package com.cryptolearn.backend.dto.task;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskVerificationResultDTO {
    private boolean correct;
    private String message;
    private String correctAnswer;
}