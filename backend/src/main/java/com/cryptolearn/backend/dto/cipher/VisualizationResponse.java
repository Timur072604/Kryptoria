package com.cryptolearn.backend.dto.cipher;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisualizationResponse {

    private List<VisualizationStep> steps;

    private String resultText;

}