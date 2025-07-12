package com.cryptolearn.backend.dto.cipher;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisualizationStep {

    private int stepIndex;
    private int charIndex;
    private char originalChar;
    private char processedChar;
    private String intermediateText;
    private String explanationKey;
    private Map<String, Object> params;
    private boolean skipped;
}