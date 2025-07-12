package com.cryptolearn.backend.service;

import com.cryptolearn.backend.dto.task.*;
import com.cryptolearn.backend.model.CaesarTaskType;

public interface TaskService {

    Object generateCaesarTask(CaesarTaskType taskType, TaskGenerationRequestDTO request);

    TaskVerificationResultDTO verifyCaesarTaskSolution(CaesarTaskType taskType, TaskSolutionDTO solution);
}