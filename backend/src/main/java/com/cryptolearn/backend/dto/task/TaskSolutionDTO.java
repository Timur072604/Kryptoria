package com.cryptolearn.backend.dto.task;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskSolutionDTO {

    @NotBlank(message = "{validation.task.solution.taskid.notblank}")
    private String taskId;

    private Integer keySolution;
    private String textSolution;

    private Boolean requestCorrectAnswerOnly;

}