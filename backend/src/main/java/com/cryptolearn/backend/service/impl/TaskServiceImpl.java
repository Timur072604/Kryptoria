package com.cryptolearn.backend.service.impl;

import com.cryptolearn.backend.dto.task.*;
import com.cryptolearn.backend.model.CaesarTaskType;
import com.cryptolearn.backend.model.Language;
import com.cryptolearn.backend.model.TaskDifficulty;
import com.cryptolearn.backend.service.CipherService;
import com.cryptolearn.backend.service.TaskService;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    private static final Logger logger = LoggerFactory.getLogger(TaskServiceImpl.class);

    private final CipherService cipherService;
    private final MessageSource messageSource;

    private final Map<String, Object> taskCorrectAnswers = new ConcurrentHashMap<>();
    private final Map<Language, List<String>> wordLists = new ConcurrentHashMap<>();

    private static final String RU_WORDS_FILE_PATH = "textgen/ru_words.txt";
    private static final String EN_WORDS_FILE_PATH = "textgen/en_words.txt";

    private static final int MAX_GENERATED_TEXT_LENGTH = 100;
    private static final int MIN_GENERATED_TEXT_LENGTH = 1;
    private static final int MIN_RANDOM_SUFFIX_LENGTH = 3;


    @Autowired
    public TaskServiceImpl(CipherService cipherService, MessageSource messageSource) {
        this.cipherService = cipherService;
        this.messageSource = messageSource;
    }

    @PostConstruct
    public void initializeWordLists() {
        logger.info("Инициализация списков слов для генерации заданий...");
        loadWordsForLanguage(Language.RU, RU_WORDS_FILE_PATH);
        loadWordsForLanguage(Language.EN, EN_WORDS_FILE_PATH);
        if (wordLists.isEmpty()) {
            logger.warn("Не удалось загрузить слова ни для одного языка. Генерация текста будет основана на случайных буквах.");
        } else {
            wordLists.forEach((lang, list) -> logger.info("Загружено {} слов для языка {}", list.size(), lang));
        }
    }

    private void loadWordsForLanguage(Language language, String filePath) {
        try {
            ClassPathResource resource = new ClassPathResource(filePath);
            if (!resource.exists()) {
                logger.warn("Файл со словами не найден для языка {}: {}", language, filePath);
                wordLists.put(language, Collections.emptyList());
                return;
            }
            try (InputStream inputStream = resource.getInputStream();
                 BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {

                List<String> words = reader.lines()
                        .map(String::trim)
                        .filter(line -> !line.isEmpty())
                        .map(String::toUpperCase)
                        .collect(Collectors.toList());

                if (words.isEmpty()) {
                    logger.warn("Файл со словами для языка {} пуст: {}", language, filePath);
                    wordLists.put(language, Collections.emptyList());
                } else {
                    wordLists.put(language, Collections.unmodifiableList(words));
                    logger.debug("Успешно загружено {} слов для языка {} из файла {}", words.size(), language, filePath);
                }
            }
        } catch (IOException e) {
            logger.error("Ошибка при загрузке слов для языка {} из файла {}: {}", language, filePath, e.getMessage(), e);
            wordLists.put(language, Collections.emptyList());
        }
    }

    @Override
    public Object generateCaesarTask(CaesarTaskType taskType, TaskGenerationRequestDTO request) {
        String taskId = UUID.randomUUID().toString();
        Language lang = request.getLanguage();
        TaskDifficulty difficulty = request.getDifficulty();
        Locale currentLocale = LocaleContextHolder.getLocale();

        int textLength;
        int key;

        String alphabet = getAlphabetForLanguage(lang);
        int alphabetLength = alphabet.length();
        int maxPossibleKey = (alphabetLength > 1) ? alphabetLength - 1 : 1;

        if (difficulty == TaskDifficulty.CUSTOM) {
            Integer minLenParam = request.getCustomMinTextLength();
            Integer maxLenParam = request.getCustomMaxTextLength();
            Integer minKeyParam = request.getCustomMinKey();
            Integer maxKeyParam = request.getCustomMaxKey();

            int defaultMinLen = MIN_GENERATED_TEXT_LENGTH;
            int defaultMaxLen = MAX_GENERATED_TEXT_LENGTH;

            int minLen = (minLenParam == null || minLenParam < defaultMinLen) ? defaultMinLen : Math.min(minLenParam, defaultMaxLen);
            int maxLen = (maxLenParam == null || maxLenParam > defaultMaxLen) ? defaultMaxLen : Math.max(minLen, Math.min(maxLenParam, defaultMaxLen));
            if (minLen > maxLen) minLen = maxLen;
            textLength = ThreadLocalRandom.current().nextInt(minLen, maxLen + 1);

            int defaultMinKey = 1;
            int defaultMaxKey = maxPossibleKey;

            int minK = (minKeyParam == null || minKeyParam < defaultMinKey) ? defaultMinKey : Math.min(minKeyParam, defaultMaxKey);
            int maxK = (maxKeyParam == null || maxKeyParam > defaultMaxKey) ? defaultMaxKey : Math.max(minK, Math.min(maxKeyParam, defaultMaxKey));

            if (minK > maxK && defaultMaxKey > 0) minK = maxK;
            else if (minK > maxK && defaultMaxKey <= 0) {
                minK = 1; maxK = 1;
            }

            if (defaultMaxKey > 0) {
                 key = (minK == maxK) ? minK : ThreadLocalRandom.current().nextInt(minK, maxK + 1);
            } else {
                 key = 1;
            }
        } else {
            textLength = getTextLengthForStandardDifficulty(difficulty);
            key = getKeyForStandardDifficulty(difficulty, maxPossibleKey);
        }

        if (key == 0 && maxPossibleKey > 0) {
            key = 1;
        } else if (maxPossibleKey <= 0) {
            key = 1;
        }

        String sourceText = generateRandomTextFromFile(lang, textLength);
        taskCorrectAnswers.remove(taskId);

        switch (taskType) {
            case FIND_KEY:
                String encryptedTextForKey = cipherService.caesarEncrypt(sourceText, key, lang);
                taskCorrectAnswers.put(taskId, key);
                logger.info("Сгенерировано задание FIND_KEY (ID: {}). Язык: {}, Сложность: {}, Длина текста: {}, Ключ: {}", taskId, lang, difficulty, textLength, key);
                return CaesarFindKeyTaskDataDTO.builder()
                        .taskId(taskId)
                        .language(lang)
                        .sourceText(sourceText)
                        .encryptedText(encryptedTextForKey)
                        .description(getLocalizedMessage(currentLocale, "task.caesar.findkey.description"))
                        .actualKey(key)
                        .build();
            case ENCRYPT_TEXT:
                String expectedEncryptedText = cipherService.caesarEncrypt(sourceText, key, lang);
                taskCorrectAnswers.put(taskId, expectedEncryptedText);
                logger.info("Сгенерировано задание ENCRYPT_TEXT (ID: {}). Язык: {}, Сложность: {}, Длина текста: {}, Ключ: {}", taskId, lang, difficulty, textLength, key);
                return CaesarEncryptTaskDataDTO.builder()
                        .taskId(taskId)
                        .language(lang)
                        .sourceText(sourceText)
                        .key(key)
                        .description(getLocalizedMessage(currentLocale, "task.caesar.encrypt.description"))
                        .build();
            case DECRYPT_TEXT:
                String encryptedTextForDecrypt = cipherService.caesarEncrypt(sourceText, key, lang);
                taskCorrectAnswers.put(taskId, sourceText);
                logger.info("Сгенерировано задание DECRYPT_TEXT (ID: {}). Язык: {}, Сложность: {}, Длина текста: {}, Использованный ключ шифрования: {}", taskId, lang, difficulty, textLength, key);
                return CaesarDecryptTaskDataDTO.builder()
                        .taskId(taskId)
                        .language(lang)
                        .encryptedText(encryptedTextForDecrypt)
                        .description(getLocalizedMessage(currentLocale, "task.caesar.decrypt.description"))
                        .actualKey(key)
                        .build();
            default:
                logger.warn(getLocalizedMessage(currentLocale, "task.type.unsupported.log", taskType));
                throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "task.type.unsupported"));
        }
    }

    @Override
    public TaskVerificationResultDTO verifyCaesarTaskSolution(CaesarTaskType taskType, TaskSolutionDTO solution) {
        Object correctAnswerRaw = taskCorrectAnswers.get(solution.getTaskId());
        Locale currentLocale = LocaleContextHolder.getLocale();

        if (correctAnswerRaw == null) {
            logger.warn(getLocalizedMessage(currentLocale, "task.verification.error.notfound.log", solution.getTaskId()));
            return TaskVerificationResultDTO.builder()
                    .correct(false)
                    .message(getLocalizedMessage(currentLocale, "task.verification.error.notfound"))
                    .build();
        }

        String correctAnswerString;
        try {
            switch (taskType) {
                case FIND_KEY:
                    correctAnswerString = String.valueOf((Integer) correctAnswerRaw);
                    break;
                case ENCRYPT_TEXT:
                case DECRYPT_TEXT:
                    correctAnswerString = (String) correctAnswerRaw;
                    break;
                default:
                    throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "task.type.unsupported"));
            }
        } catch (ClassCastException e) {
            logger.error(getLocalizedMessage(currentLocale, "task.verification.error.typemismatch.log", solution.getTaskId(), taskType, e.getMessage()), e);
            return TaskVerificationResultDTO.builder()
                    .correct(false)
                    .message(getLocalizedMessage(currentLocale, "task.verification.error.internal"))
                    .build();
        }

        if (Boolean.TRUE.equals(solution.getRequestCorrectAnswerOnly())) {
            logger.info("Пользователь запросил правильный ответ для taskId: {}", solution.getTaskId());
            String messageWithPrefix = getLocalizedMessage(currentLocale, "task.answer.prefix.correct_answer") + " " + correctAnswerString;
            return TaskVerificationResultDTO.builder()
                    .correct(false)
                    .message(messageWithPrefix)
                    .correctAnswer(correctAnswerString)
                    .build();
        }

        boolean isCorrect = false;
        String solutionMessageKey;

        try {
            switch (taskType) {
                case FIND_KEY:
                    if (solution.getKeySolution() == null) {
                        throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "validation.task.solution.key.missing"));
                    }
                    isCorrect = solution.getKeySolution().equals(Integer.parseInt(correctAnswerString));
                    break;
                case ENCRYPT_TEXT:
                case DECRYPT_TEXT:
                    if (solution.getTextSolution() == null || solution.getTextSolution().trim().isEmpty()) {
                         throw new IllegalArgumentException(getLocalizedMessage(currentLocale, "validation.task.solution.text.missing"));
                    }
                    isCorrect = solution.getTextSolution().trim().equalsIgnoreCase(correctAnswerString.trim());
                    break;
            }
        } catch (IllegalArgumentException e) {
            logger.warn("Некорректная отправка решения для taskId: {}. Ошибка: {}", solution.getTaskId(), e.getMessage());
            return TaskVerificationResultDTO.builder()
                    .correct(false)
                    .message(e.getMessage())
                    .correctAnswer(null)
                    .build();
        }

        if (isCorrect) {
            logger.info("Правильное решение для taskId: {}. Ответ останется доступным.", solution.getTaskId());
            solutionMessageKey = "task.answer.correct";
            return TaskVerificationResultDTO.builder()
                    .correct(true)
                    .message(getLocalizedMessage(currentLocale, solutionMessageKey))
                    .build();
        } else {
            logger.info("Неправильное решение для taskId: {}", solution.getTaskId());
            solutionMessageKey = "task.answer.incorrect";
            return TaskVerificationResultDTO.builder()
                    .correct(false)
                    .message(getLocalizedMessage(currentLocale, solutionMessageKey))
                    .correctAnswer(null)
                    .build();
        }
    }

    private String getAlphabetForLanguage(Language language) {
        return (language == Language.RU) ? "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    }

    private int getTextLengthForStandardDifficulty(TaskDifficulty difficulty) {
        int minLen, maxLen;
        int totalRange = MAX_GENERATED_TEXT_LENGTH - MIN_GENERATED_TEXT_LENGTH + 1;
        int partSize = Math.max(1, totalRange / 3);

        switch (difficulty) {
            case EASY:
                minLen = MIN_GENERATED_TEXT_LENGTH;
                maxLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + partSize - 1);
                break;
            case MEDIUM:
                minLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + partSize);
                maxLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + 2 * partSize - 1);
                break;
            case HARD:
                minLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + 2 * partSize);
                maxLen = MAX_GENERATED_TEXT_LENGTH;
                break;
            default:
                minLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + partSize);
                maxLen = Math.min(MAX_GENERATED_TEXT_LENGTH, MIN_GENERATED_TEXT_LENGTH + 2 * partSize - 1);
                break;
        }
        if (minLen > maxLen) minLen = maxLen;
        if (minLen == maxLen) return minLen;

        return ThreadLocalRandom.current().nextInt(minLen, maxLen + 1);
    }

    private int getKeyForStandardDifficulty(TaskDifficulty difficulty, int maxPossibleKeyValue) {
        if (maxPossibleKeyValue <= 0) return 1;

        int minK, maxK;
        int totalKeyRange = maxPossibleKeyValue;
        int keyPartSize = Math.max(1, totalKeyRange / 3);

        switch (difficulty) {
            case EASY:
                minK = 1;
                maxK = Math.min(maxPossibleKeyValue, keyPartSize);
                break;
            case MEDIUM:
                minK = Math.min(maxPossibleKeyValue, keyPartSize + 1);
                maxK = Math.min(maxPossibleKeyValue, 2 * keyPartSize);
                break;
            case HARD:
                minK = Math.min(maxPossibleKeyValue, 2 * keyPartSize + 1);
                maxK = maxPossibleKeyValue;
                break;
            default:
                minK = Math.min(maxPossibleKeyValue, keyPartSize + 1);
                maxK = Math.min(maxPossibleKeyValue, 2 * keyPartSize);
                break;
        }

        minK = Math.max(1, minK);
        maxK = Math.max(minK, maxK);
        if (minK > maxPossibleKeyValue) minK = maxPossibleKeyValue;
        if (maxK > maxPossibleKeyValue) maxK = maxPossibleKeyValue;
        if (minK > maxK) minK = maxK;

        if (minK == maxK) return minK;
        return ThreadLocalRandom.current().nextInt(minK, maxK + 1);
    }

    private String generateRandomTextFromFile(Language language, int length) {
        if (length <= 0) {
            return "";
        }

        List<String> words = wordLists.get(language);
        String alphabet = getAlphabetForLanguage(language);

        if (words == null || words.isEmpty() || alphabet.isEmpty()) {
            if (alphabet.isEmpty()) {
                logger.error("Невозможно сгенерировать текст: алфавит для языка {} пуст.", language);
                return "";
            }
            logger.warn("Список слов для языка {} пуст или не загружен. Генерируется текст из случайных букв.", language);
            StringBuilder randomTextBuilder = new StringBuilder(length);
            for (int i = 0; i < length; i++) {
                randomTextBuilder.append(alphabet.charAt(ThreadLocalRandom.current().nextInt(alphabet.length())));
            }
            return randomTextBuilder.toString();
        }

        StringBuilder textBuilder = new StringBuilder(length + 5);

        while (textBuilder.length() < length) {
            String word = words.get(ThreadLocalRandom.current().nextInt(words.size()));
            boolean needsSpace = !textBuilder.isEmpty();
            int spaceLength = needsSpace ? 1 : 0;

            if (textBuilder.length() + spaceLength + word.length() <= length) {
                if (needsSpace) {
                    textBuilder.append(" ");
                }
                textBuilder.append(word);
            } else {
                int remainingSpace = length - textBuilder.length();
                if (needsSpace && remainingSpace > 1) {
                    textBuilder.append(" ");
                    remainingSpace--;
                }

                if (remainingSpace > 0) {
                    if (remainingSpace >= MIN_RANDOM_SUFFIX_LENGTH || textBuilder.isEmpty()) {
                        textBuilder.append(word, 0, Math.min(word.length(), remainingSpace));
                    }
                }
                break;
            }
        }

        if (textBuilder.length() < length) {
            int deficit = length - textBuilder.length();
            if (deficit >= MIN_RANDOM_SUFFIX_LENGTH || textBuilder.isEmpty()) {
                if (!textBuilder.isEmpty() && textBuilder.charAt(textBuilder.length() - 1) != ' ') {
                    if (textBuilder.length() + 1 <= length) {
                        textBuilder.append(" ");
                        deficit--;
                    }
                }
                for (int i = 0; i < deficit && textBuilder.length() < length; i++) {
                    textBuilder.append(alphabet.charAt(ThreadLocalRandom.current().nextInt(alphabet.length())));
                }
            }
        }

        String result = textBuilder.toString();

        if (result.length() > length) {
            result = result.substring(0, length);
        }
        return result.trim();
    }
    
    private String getLocalizedMessage(Locale locale, String messageKey, Object... args) {
        try {
            return messageSource.getMessage(messageKey, args, locale);
        } catch (Exception e) {
            logger.warn("Не удалось получить локализованное сообщение для ключа '{}' и локали '{}': {}. Возвращаем ключ.",
                        messageKey, locale, e.getMessage());
            if (args != null && args.length > 0) {
                StringBuilder sb = new StringBuilder(messageKey);
                sb.append(" (Args: ");
                for (int i = 0; i < args.length; i++) {
                    sb.append(args[i]);
                    if (i < args.length - 1) {
                        sb.append(", ");
                    }
                }
                sb.append(")");
                return sb.toString();
            }
            return messageKey;
        }
    }
}