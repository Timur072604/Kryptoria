package com.cryptolearn.backend.controller;

import com.cryptolearn.backend.dto.task.TaskGenerationRequestDTO;
import com.cryptolearn.backend.dto.task.TaskSolutionDTO;
import com.cryptolearn.backend.dto.task.TaskVerificationResultDTO;
import com.cryptolearn.backend.model.CaesarTaskType;
import com.cryptolearn.backend.service.TaskService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/tasks/caesar")
@PreAuthorize("isAuthenticated()")
public class TaskController {

    private static final Logger logger = LoggerFactory.getLogger(TaskController.class);

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping("/generate/{taskType}")
    public ResponseEntity<?> generateCaesarTask(
            @PathVariable CaesarTaskType taskType,
            @Valid @RequestBody TaskGenerationRequestDTO request) {
        logger.info("Запрос на генерацию задания Цезаря типа: {}, сложность: {}", taskType, request.getDifficulty());
        Object taskData = taskService.generateCaesarTask(taskType, request);
        return ResponseEntity.ok(taskData);
    }

    @PostMapping("/verify/{taskType}")
    public ResponseEntity<TaskVerificationResultDTO> verifyCaesarTaskSolution(
            @PathVariable CaesarTaskType taskType,
            @Valid @RequestBody TaskSolutionDTO solution) {
        logger.info("Запрос на проверку ответа для задания Цезаря типа: {}, taskId: {}", taskType, solution.getTaskId());
        TaskVerificationResultDTO result = taskService.verifyCaesarTaskSolution(taskType, solution);
        return ResponseEntity.ok(result);
    }
}