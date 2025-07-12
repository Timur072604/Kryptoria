import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import taskService from '../../../services/taskService';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';
import { allowOnlyNumericInputOnKeyDown, sanitizeNumericInput } from '../../../utils/inputUtils';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const MAX_TEXT_INPUT_LENGTH_TASK_SOLUTION = 150;
const TASK_STATE_STORAGE_KEY_PREFIX = 'caesarTaskState_';

const DIFFICULTY_LEVELS = {
  EASY: { value: 'EASY', labelKey: 'caesarTaskPage_difficulty_easy' },
  MEDIUM: { value: 'MEDIUM', labelKey: 'caesarTaskPage_difficulty_medium' },
  HARD: { value: 'HARD', labelKey: 'caesarTaskPage_difficulty_hard' },
  CUSTOM: { value: 'CUSTOM', labelKey: 'caesarTaskPage_difficulty_custom' },
};

const DifficultySelectorOnly = React.memo(({
  difficulty, setDifficulty, taskType, disabled
}) => {
  const { t } = useTranslation();
  return (
    <div className="difficulty-selector-group-content">
      <label htmlFor={`difficulty-selector-${taskType || 'task'}`}>{t('caesarTaskPage_difficultyLabel')}</label>
      <select id={`difficulty-selector-${taskType || 'task'}`} name="difficulty" value={difficulty}
        onChange={(e) => setDifficulty(e.target.value)} disabled={disabled}
      >
        {Object.values(DIFFICULTY_LEVELS).map(level => (
          <option key={level.value} value={level.value}>{t(level.labelKey)}</option>
        ))}
      </select>
    </div>
  );
});
DifficultySelectorOnly.displayName = 'DifficultySelectorOnly';

const SolutionInputComponent = React.memo(({
  taskType, currentKeySolution, onKeySolutionChange,
  currentSolutionText, onSolutionTextChange, isInputDisabled
}) => {
  const { t } = useTranslation();
  let textareaPlaceholderKey = "caesarTaskPage_textSolutionPlaceholder_default";
  let labelTextKey = "caesarTaskPage_textSolutionLabel_default";
  if (taskType === 'decrypt-text') {
    textareaPlaceholderKey = "caesarTaskPage_textSolutionPlaceholder_decrypt";
    labelTextKey = "caesarTaskPage_textSolutionLabel_decrypt";
  } else if (taskType === 'encrypt-text') {
    textareaPlaceholderKey = "caesarTaskPage_textSolutionPlaceholder_encrypt";
    labelTextKey = "caesarTaskPage_textSolutionLabel_encrypt";
  }
  if (taskType === 'find-key') {
    return (
      <div className="form-group">
        <label htmlFor="user-key-input">{t('caesarTaskPage_keySolutionLabel')}</label>
        <input type="text"
               inputMode="numeric"
               id="user-key-input" name="user_key" value={currentKeySolution}
               onChange={onKeySolutionChange}
               onKeyDown={allowOnlyNumericInputOnKeyDown}
               disabled={isInputDisabled}
               placeholder={t('caesarTaskPage_keySolutionPlaceholder')}
        />
      </div>
    );
  } else {
    return (
      <div className="form-group">
        <label htmlFor="user-text-input">{t(labelTextKey)}</label>
        <textarea id="user-text-input" name="user_text" rows="3" value={currentSolutionText}
          onChange={onSolutionTextChange} disabled={isInputDisabled} placeholder={t(textareaPlaceholderKey)}
          maxLength={MAX_TEXT_INPUT_LENGTH_TASK_SOLUTION}
        />
      </div>
    );
  }
});
SolutionInputComponent.displayName = 'SolutionInputComponent';

const TaskDescription = React.memo(({ taskType }) => {
  const { t } = useTranslation();
  let descriptionKey = "caesarTaskPage_taskDescriptionNotFound";
  if (taskType === 'find-key') descriptionKey = "caesarTaskPage_taskDesc_findKey";
  else if (taskType === 'encrypt-text') descriptionKey = "caesarTaskPage_taskDesc_encryptText";
  else if (taskType === 'decrypt-text') descriptionKey = "caesarTaskPage_taskDesc_decryptText";
  return <p>{t(descriptionKey)}</p>;
});
TaskDescription.displayName = 'TaskDescription';

const TaskDataDisplay = React.memo(({ currentTaskData, taskType }) => {
    const { t } = useTranslation();
    
    const sourceText = currentTaskData?.sourceText ?? '';
    const encryptedText = currentTaskData?.encryptedText ?? '';
    const taskKey = currentTaskData?.key ?? '';

    const fieldsToDisplay = [];
    if (taskType === 'find-key') {
        fieldsToDisplay.push({ labelKey: 'caesarTaskPage_sourceTextLabel', value: sourceText, id: 'task-source-text' });
        fieldsToDisplay.push({ labelKey: 'caesarTaskPage_encryptedTextLabel', value: encryptedText, id: 'task-cipher-text' });
    } else if (taskType === 'decrypt-text') {
        fieldsToDisplay.push({ labelKey: 'caesarTaskPage_encryptedTextLabel', value: encryptedText, id: 'task-decrypt-cipher-text' });
    } else if (taskType === 'encrypt-text') {
        fieldsToDisplay.push({ labelKey: 'caesarTaskPage_sourceTextLabel', value: sourceText, id: 'task-encrypt-source-text' });
        fieldsToDisplay.push({ labelKey: 'caesarTaskPage_keyLabel', value: taskKey, id: 'task-encrypt-key' });
    }

    return (
      <div className="alphabet-display alphabet-grid mb-3">
        {fieldsToDisplay.map(field => (
          <React.Fragment key={field.id}>
            <strong className="alphabet-label">{t(field.labelKey)}</strong>
            <code className="alphabet-value" id={field.id}>{field.value}</code>
          </React.Fragment>
        ))}
        {fieldsToDisplay.length === 0 && currentTaskData === null && (
            <>
              <strong className="alphabet-label">
                {taskType === 'find-key' || taskType === 'encrypt-text' ? t('caesarTaskPage_sourceTextLabel') : t('caesarTaskPage_encryptedTextLabel')}
              </strong>
              <code className="alphabet-value"></code>
              {(taskType === 'find-key' || taskType === 'encrypt-text') && (
                <>
                  <strong className="alphabet-label">
                    {taskType === 'find-key' ? t('caesarTaskPage_encryptedTextLabel') : t('caesarTaskPage_keyLabel')}
                  </strong>
                  <code className="alphabet-value"></code>
                </>
              )}
            </>
        )}
      </div>
    );
  });
TaskDataDisplay.displayName = 'TaskDataDisplay';


const CaesarTaskPage = () => {
  const { t, i18n } = useTranslation();
  const { taskType } = useParams();
  const { accessToken, isLoading: authIsLoading } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();

  const taskStorageKey = `${TASK_STATE_STORAGE_KEY_PREFIX}${taskType}`;
  const [persistedTaskState, setPersistedTaskState] = useLocalStorage(taskStorageKey, null);

  const [taskData, setTaskData] = useState(null);
  const [cachedTasks, setCachedTasks] = useState({});

  const [solution, setSolution] = useState('');
  const [keySolution, setKeySolution] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);

  const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS.EASY.value);
  const [language, setLanguage] = useState(() => {
    const currentAppLang = i18n.resolvedLanguage || i18n.language.split('-')[0];
    return currentAppLang === 'en' ? 'EN' : 'RU';
  });

  const DEFAULT_CUSTOM_MIN_TEXT_LENGTH = 1;
  const DEFAULT_CUSTOM_MAX_TEXT_LENGTH = 100;
  const DEFAULT_CUSTOM_MIN_KEY = 1;

  const getMaxPossibleKey = useCallback((currentLanguage) => {
    const alphabetLength = currentLanguage === 'RU' ? 33 : 26;
    return alphabetLength > 1 ? alphabetLength - 1 : 1;
  }, []);

  const [customParams, setCustomParams] = useState({
    minTextLength: DEFAULT_CUSTOM_MIN_TEXT_LENGTH.toString(),
    maxTextLength: DEFAULT_CUSTOM_MAX_TEXT_LENGTH.toString(),
    minKey: DEFAULT_CUSTOM_MIN_KEY.toString(),
    maxKey: getMaxPossibleKey(language).toString(),
  });

  const prevTaskTypeRef = useRef(taskType);
  const prevTaskIdRef = useRef(null);
  const lastVerificationRef = useRef(null);
  const isMountedRef = useRef(false);
  const isRestoringRef = useRef(false);

  const isActionDisabled = authIsLoading;
  const isSolutionInputDisabled = authIsLoading || !taskData;

  useEffect(() => {
    isRestoringRef.current = true;
    if (persistedTaskState) {
      setSolution(persistedTaskState.solution || '');
      setKeySolution(persistedTaskState.keySolution || '');
      setVerificationResult(persistedTaskState.verificationResult || null);
      if (persistedTaskState.lastVerification) {
        lastVerificationRef.current = persistedTaskState.lastVerification;
      }
    } else {
      setSolution('');
      setKeySolution('');
      setVerificationResult(null);
      lastVerificationRef.current = null;
    }
    isMountedRef.current = true;
    const timer = setTimeout(() => { isRestoringRef.current = false; }, 0);
    return () => clearTimeout(timer);
  }, [taskType, persistedTaskState]);

  useEffect(() => {
    if (!isMountedRef.current || isRestoringRef.current) return;
    const answerStateToPersist = {
      solution,
      keySolution,
      verificationResult,
      lastVerification: lastVerificationRef.current,
      associatedTaskId: taskData?.taskId
    };
    setPersistedTaskState(answerStateToPersist);
  }, [solution, keySolution, verificationResult, taskData?.taskId, setPersistedTaskState]);

  useEffect(() => {
    if (taskData?.taskId && prevTaskIdRef.current !== taskData.taskId) {
      if (persistedTaskState?.associatedTaskId !== taskData.taskId) {
        setVerificationResult(null);
        lastVerificationRef.current = null;
      }
      prevTaskIdRef.current = taskData.taskId;
    } else if (!taskData && prevTaskIdRef.current !== null) {
      setVerificationResult(null);
      lastVerificationRef.current = null;
      prevTaskIdRef.current = null;
    }
  }, [taskData, persistedTaskState]);


  const handleCustomParamChange = useCallback((paramName, rawValue) => {
    setCustomParams(prevParams => {
      const newParams = { ...prevParams };
      let numValue = parseInt(rawValue, 10);
      if (rawValue === '') { newParams[paramName] = ''; return newParams; }
      if (isNaN(numValue)) {
        if (paramName.includes('min')) numValue = paramName.includes('TextLength') ? DEFAULT_CUSTOM_MIN_TEXT_LENGTH : DEFAULT_CUSTOM_MIN_KEY;
        else numValue = paramName.includes('TextLength') ? DEFAULT_CUSTOM_MAX_TEXT_LENGTH : getMaxPossibleKey(language);
      }
      const maxKeyForCurrentLang = getMaxPossibleKey(language);
      if (paramName === 'minTextLength') {
        numValue = Math.max(DEFAULT_CUSTOM_MIN_TEXT_LENGTH, Math.min(numValue, DEFAULT_CUSTOM_MAX_TEXT_LENGTH));
        if (newParams.maxTextLength !== '' && numValue > parseInt(newParams.maxTextLength, 10)) newParams.maxTextLength = numValue.toString();
      } else if (paramName === 'maxTextLength') {
        numValue = Math.max(DEFAULT_CUSTOM_MIN_TEXT_LENGTH, Math.min(numValue, DEFAULT_CUSTOM_MAX_TEXT_LENGTH));
        if (newParams.minTextLength !== '' && numValue < parseInt(newParams.minTextLength, 10)) newParams.minTextLength = numValue.toString();
      } else if (paramName === 'minKey') {
        numValue = Math.max(DEFAULT_CUSTOM_MIN_KEY, Math.min(numValue, maxKeyForCurrentLang));
        if (newParams.maxKey !== '' && numValue > parseInt(newParams.maxKey, 10)) newParams.maxKey = numValue.toString();
      } else if (paramName === 'maxKey') {
        numValue = Math.max(DEFAULT_CUSTOM_MIN_KEY, Math.min(numValue, maxKeyForCurrentLang));
        if (newParams.minKey !== '' && numValue < parseInt(newParams.minKey, 10)) newParams.minKey = numValue.toString();
      }
      newParams[paramName] = numValue.toString();
      return newParams;
    });
  }, [language, getMaxPossibleKey]);

  useEffect(() => {
    const maxKeyForNewLang = getMaxPossibleKey(language);
    setCustomParams(prev => {
        let currentMinKey = parseInt(prev.minKey, 10);
        let currentMaxKey = parseInt(prev.maxKey, 10);
        if (isNaN(currentMinKey)) currentMinKey = DEFAULT_CUSTOM_MIN_KEY;
        if (isNaN(currentMaxKey)) currentMaxKey = maxKeyForNewLang;
        let newMinKey = Math.max(DEFAULT_CUSTOM_MIN_KEY, Math.min(currentMinKey, maxKeyForNewLang));
        let newMaxKey = Math.max(DEFAULT_CUSTOM_MIN_KEY, Math.min(currentMaxKey, maxKeyForNewLang));
        if (newMinKey > newMaxKey) newMinKey = newMaxKey;
        return { ...prev, minKey: newMinKey.toString(), maxKey: newMaxKey.toString() };
    });
  }, [language, getMaxPossibleKey]);

  const getEffectiveMaxKey = useCallback(() => {
    const langToUse = taskData?.language || language;
    return getMaxPossibleKey(langToUse);
  }, [taskData, language, getMaxPossibleKey]);

  const generateNewTaskInternal = useCallback(async (currentTaskType, currentLanguage, currentDifficulty, currentCustomParams, isUserTriggered = false) => {
    if (authIsLoading || !accessToken) {
        if (!authIsLoading) addNotification({ key: "auth_userNotAuthenticated" }, 'error');
        setTaskData(null);
        return null;
    }

    isRestoringRef.current = true;
    setSolution('');
    setKeySolution('');
    setVerificationResult(null);
    lastVerificationRef.current = null;
    if (isUserTriggered) {
        setPersistedTaskState(null);
    }
    const timer = setTimeout(() => { isRestoringRef.current = false; }, 0);

    try {
        const paramsToSend = { language: currentLanguage, difficulty: currentDifficulty };
        if (currentDifficulty === DIFFICULTY_LEVELS.CUSTOM.value) {
            let { minTextLength, maxTextLength, minKey, maxKey } = currentCustomParams;
            const parsedMinTL = parseInt(minTextLength, 10);
            const parsedMaxTL = parseInt(maxTextLength, 10);
            const parsedMinK = parseInt(minKey, 10);
            const parsedMaxK = parseInt(maxKey, 10);
            const maxPossibleKeyVal = getMaxPossibleKey(currentLanguage);
            paramsToSend.customMinTextLength = (isNaN(parsedMinTL) || parsedMinTL < DEFAULT_CUSTOM_MIN_TEXT_LENGTH) ? DEFAULT_CUSTOM_MIN_TEXT_LENGTH : Math.min(parsedMinTL, DEFAULT_CUSTOM_MAX_TEXT_LENGTH);
            paramsToSend.customMaxTextLength = (isNaN(parsedMaxTL) || parsedMaxTL < paramsToSend.customMinTextLength) ? Math.max(paramsToSend.customMinTextLength, DEFAULT_CUSTOM_MAX_TEXT_LENGTH) : Math.min(parsedMaxTL, DEFAULT_CUSTOM_MAX_TEXT_LENGTH);
            if (paramsToSend.customMinTextLength > paramsToSend.customMaxTextLength) paramsToSend.customMaxTextLength = paramsToSend.customMinTextLength;
            if (currentTaskType === 'find-key' || currentTaskType === 'encrypt-text' || currentTaskType === 'decrypt-text') {
                paramsToSend.customMinKey = (isNaN(parsedMinK) || parsedMinK < DEFAULT_CUSTOM_MIN_KEY) ? DEFAULT_CUSTOM_MIN_KEY : Math.min(parsedMinK, maxPossibleKeyVal);
                paramsToSend.customMaxKey = (isNaN(parsedMaxK) || parsedMaxK < paramsToSend.customMinKey) ? Math.max(paramsToSend.customMinKey, maxPossibleKeyVal) : Math.min(parsedMaxK, maxPossibleKeyVal);
                if (paramsToSend.customMinKey > paramsToSend.customMaxKey) paramsToSend.customMaxKey = paramsToSend.customMinKey;
            }
        }
        const response = await taskService.generateCaesarTask(currentTaskType, paramsToSend);
        const newTaskData = response.data;
        setTaskData(newTaskData);
        setCachedTasks(prevCachedTasks => ({ ...prevCachedTasks, [currentTaskType]: newTaskData }));
        if (isUserTriggered) {
            addNotification({ key: "caesarTaskPage_successTaskGenerated" }, 'success', 1500);
        }
        return () => clearTimeout(timer);
    } catch (err) {
        let messageContent;
        if (err.message === 'Network Error' || !err.response) { messageContent = { key: 'networkError' }; }
        else if (err.response?.data?.message) { messageContent = err.response.data.message; }
        else { messageContent = { key: 'caesarTaskPage_errorGeneratingTask' }; }
        addNotification(messageContent, 'error');
        setTaskData(null);
        setCachedTasks(prevCachedTasks => { const nc = {...prevCachedTasks}; delete nc[currentTaskType]; return nc; });
        return () => clearTimeout(timer);
    }
  }, [authIsLoading, accessToken, addNotification, getMaxPossibleKey, setPersistedTaskState, DEFAULT_CUSTOM_MIN_TEXT_LENGTH, DEFAULT_CUSTOM_MAX_TEXT_LENGTH, DEFAULT_CUSTOM_MIN_KEY]);

  useEffect(() => {
    const manageTaskState = async () => {
        if (authIsLoading || !isMountedRef.current) return;
        if (!accessToken) {
            addNotification({ key: "auth_userNotAuthenticated" }, 'error');
            setTaskData(null); setCachedTasks({}); return;
        }
        if (taskType !== prevTaskTypeRef.current) {
            prevTaskTypeRef.current = taskType;
        }

        if (cachedTasks[taskType]) {
            if (taskData?.taskId !== cachedTasks[taskType].taskId) {
                setTaskData(cachedTasks[taskType]);
            }
        } else {
            await generateNewTaskInternal(taskType, language, difficulty, customParams, false);
        }
    };
    manageTaskState();
  }, [taskType, accessToken, authIsLoading, cachedTasks, language, difficulty, customParams, addNotification, generateNewTaskInternal, taskData?.taskId]);

  const handleNewVariantClick = () => {
    generateNewTaskInternal(taskType, language, difficulty, customParams, true);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskData?.taskId || !accessToken) {
        addNotification({ key: "caesarTaskPage_infoNoActiveTaskOrNotAuth" }, 'error'); return;
    }
    let currentSubmittedKey = null; let currentSubmittedText = null;
    if (taskType === 'find-key') {
        const trimmedKey = String(keySolution).trim();
        if (trimmedKey === '') { addNotification({ key: 'caesarTaskPage_infoEnterKey' }, 'info'); return; }
        let numKey = parseInt(trimmedKey, 10);
        if (isNaN(numKey)) { addNotification({ key: 'caesarTaskPage_infoKeyMustBeNumber' }, 'error'); return; }
        const maxPossibleKey = getEffectiveMaxKey();
        if (numKey < 1) { numKey = 1; setKeySolution('1'); }
        else if (numKey > maxPossibleKey) { numKey = maxPossibleKey; setKeySolution(maxPossibleKey.toString()); }
        currentSubmittedKey = numKey;
    } else if (taskType === 'encrypt-text' || taskType === 'decrypt-text') {
        if (solution.trim() === '') { addNotification({ key: 'caesarTaskPage_infoEnterText' }, 'info'); return; }
        currentSubmittedText = solution.toUpperCase().trim();
    }

    if (taskData && lastVerificationRef.current?.taskId === taskData.taskId &&
        lastVerificationRef.current.actionType === 'verify' &&
        ((taskType === 'find-key' && lastVerificationRef.current.submittedKeySolution === currentSubmittedKey) ||
         ((taskType === 'encrypt-text' || taskType === 'decrypt-text') && lastVerificationRef.current.submittedTextSolution === currentSubmittedText))
    ) {
        const cachedResultWithFlag = { ...lastVerificationRef.current.result, wasAnswerRequested: false };
        if (JSON.stringify(verificationResult) !== JSON.stringify(cachedResultWithFlag)) setVerificationResult(cachedResultWithFlag);
        return;
    }
    try {
      const solutionPayload = {
        taskId: taskData.taskId, requestCorrectAnswerOnly: false,
        ...(taskType === 'find-key' ? { keySolution: currentSubmittedKey } : { textSolution: currentSubmittedText }),
      };
      const response = await taskService.verifyCaesarTaskSolution(taskType, solutionPayload);
      const newResult = { correct: response.data.correct, message: response.data.message, correctAnswer: response.data.correctAnswer, wasAnswerRequested: false };
      setVerificationResult(newResult);
      lastVerificationRef.current = { taskId: taskData.taskId, actionType: 'verify', submittedKeySolution: currentSubmittedKey, submittedTextSolution: currentSubmittedText, result: newResult };
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) { messageContent = { key: 'networkError' }; }
      else if (err.response?.data?.message) { messageContent = err.response.data.message; }
      else { messageContent = { key: 'caesarTaskPage_errorVerifyingSolution' }; }
      addNotification(messageContent, 'error');
      setVerificationResult(null);
    }
  };
  
  const handleRequestCorrectAnswer = async () => {
    if (!taskData?.taskId || !accessToken) {
        addNotification({ key: "caesarTaskPage_infoNoActiveTaskOrNotAuth" }, 'error'); return;
    }
    if (taskData && lastVerificationRef.current?.taskId === taskData.taskId && lastVerificationRef.current.actionType === 'requestAnswer') {
        const cachedResultWithFlag = { ...lastVerificationRef.current.result, wasAnswerRequested: true };
        if (JSON.stringify(verificationResult) !== JSON.stringify(cachedResultWithFlag)) setVerificationResult(cachedResultWithFlag);
        return;
    }
    try {
        const solutionPayload = { taskId: taskData.taskId, requestCorrectAnswerOnly: true };
        const response = await taskService.verifyCaesarTaskSolution(taskType, solutionPayload);
        const newResult = { correct: response.data.correct, message: response.data.message, correctAnswer: response.data.correctAnswer, wasAnswerRequested: true };
        setVerificationResult(newResult);
        lastVerificationRef.current = { taskId: taskData.taskId, actionType: 'requestAnswer', result: newResult };
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) { messageContent = { key: 'networkError' }; }
      else if (err.response?.data?.message) { messageContent = err.response.data.message; }
      else { messageContent = { key: 'caesarTaskPage_errorRequestingAnswer' }; }
      addNotification(messageContent, 'error');
      setVerificationResult(null);
    }
  };

  const handleVisualize = () => {
    if (!taskData) { addNotification({ key: "infoTaskDataNotLoadedForVisualization" }, 'info'); return; }
    const params = new URLSearchParams();
    params.append('alphabet', taskData.language || language);
    let textToVisualize = ''; let keyForVisualizer = ''; let modeForVisualizer = 'encrypt';
    if (taskType === 'encrypt-text') {
      textToVisualize = taskData.sourceText; keyForVisualizer = String(taskData.key); modeForVisualizer = 'encrypt';
    } else if (taskType === 'find-key') {
      textToVisualize = taskData.sourceText; modeForVisualizer = 'encrypt';
      if (taskData.actualKey) keyForVisualizer = String(taskData.actualKey);
      else { addNotification({ key: 'infoDefaultKeyUsedForVisualization' }, 'info'); keyForVisualizer = '3'; }
    } else if (taskType === 'decrypt-text') {
      textToVisualize = taskData.encryptedText; modeForVisualizer = 'decrypt';
      if (taskData.actualKey) keyForVisualizer = String(taskData.actualKey);
      else { addNotification({ key: 'infoDefaultKeyUsedForVisualization' }, 'info'); keyForVisualizer = '3'; }
    }
    if (textToVisualize) params.append('text', textToVisualize);
    if (keyForVisualizer) params.append('key', keyForVisualizer);
    params.append('mode', modeForVisualizer);
    navigate(`/ciphers/caesar/visualizer?${params.toString()}`);
  };

  const handleKeySolutionChange = useCallback((e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeNumericInput(rawValue);
    if (sanitizedValue === '') { setKeySolution(''); return; }
    let numValue = parseInt(sanitizedValue, 10);
    if (isNaN(numValue)) { setKeySolution(sanitizedValue); return; }
    const maxPossibleKey = getEffectiveMaxKey();
    if (numValue < 1 && sanitizedValue !== "0") { numValue = 1; }
    else if (numValue > maxPossibleKey) { numValue = maxPossibleKey; }
    setKeySolution(numValue.toString());
  }, [getEffectiveMaxKey]);

  const handleSolutionTextChange = useCallback((e) => {
    const inputText = e.target.value;
    if (inputText.length <= MAX_TEXT_INPUT_LENGTH_TASK_SOLUTION) { setSolution(inputText); }
    else { setSolution(inputText.substring(0, MAX_TEXT_INPUT_LENGTH_TASK_SOLUTION)); }
  }, []);

  const showCustomTextLengthRange = difficulty === DIFFICULTY_LEVELS.CUSTOM.value;
  const showCustomKeyRange = difficulty === DIFFICULTY_LEVELS.CUSTOM.value &&
                             (taskType === 'find-key' || taskType === 'encrypt-text' || taskType === 'decrypt-text');

  let resultMessageClass = '';
  let resultMessageContent = '';
  if (verificationResult && taskData && persistedTaskState?.associatedTaskId === taskData.taskId) {
    if (verificationResult.wasAnswerRequested) {
        resultMessageClass = 'info';
    } else {
        resultMessageClass = verificationResult.correct ? 'success' : 'error';
    }
    resultMessageContent = verificationResult.message || '';
  }

  return (
    <div className="settings-layout-horizontal">
      <div className="content-card task-condition-card settings-card" aria-labelledby="task-condition-title">
        <div className="content-card-header">
          <h2 id="task-condition-title">
            <span role="img" aria-hidden="true" style={{ marginRight: '0.5em' }}>📝</span>
            {t('caesarTaskPage_conditionTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <div className="task-setup-controls-grid">
            <div className="control-group language-group">
              <label htmlFor="language-select-task">{t('caesarTaskPage_languageLabel')}</label>
              <select id="language-select-task" value={language}
                onChange={(e) => { setLanguage(e.target.value); }}
                disabled={isActionDisabled}
              >
                  <option value="RU">{t('alphabet_russian')}</option>
                  <option value="EN">{t('alphabet_english')}</option>
              </select>
            </div>
            <div className="control-group difficulty-group">
              <DifficultySelectorOnly difficulty={difficulty} setDifficulty={setDifficulty} taskType={taskType} disabled={isActionDisabled} />
            </div>
          </div>
          {(showCustomTextLengthRange || showCustomKeyRange) && (
            <div className="custom-params-row">
              {showCustomTextLengthRange && (
                <div className="control-group custom-text-length-group">
                  <label htmlFor={`custom-${taskType}-min-length`}>{t('caesarTaskPage_customTextLengthRangeLabel')}</label>
                  <div className="custom-difficulty-input">
                    <input type="text" inputMode="numeric" id={`custom-${taskType}-min-length`} value={customParams.minTextLength}
                      onChange={(e) => handleCustomParamChange('minTextLength', sanitizeNumericInput(e.target.value))}
                      onKeyDown={allowOnlyNumericInputOnKeyDown} disabled={isActionDisabled} placeholder={t('caesarTaskPage_customMinPlaceholder')} />
                    <input type="text" inputMode="numeric" id={`custom-${taskType}-max-length`} value={customParams.maxTextLength}
                      onChange={(e) => handleCustomParamChange('maxTextLength', sanitizeNumericInput(e.target.value))}
                      onKeyDown={allowOnlyNumericInputOnKeyDown} disabled={isActionDisabled} placeholder={t('caesarTaskPage_customMaxPlaceholder')} />
                  </div>
                </div>
              )}
              {showCustomKeyRange && (
                <div className="control-group custom-key-range-group">
                  <label htmlFor={`custom-${taskType}-min-key`}>{t('caesarTaskPage_customKeyRangeLabel')}</label>
                  <div className="custom-difficulty-input">
                    <input type="text" inputMode="numeric" id={`custom-${taskType}-min-key`} value={customParams.minKey}
                      onChange={(e) => handleCustomParamChange('minKey', sanitizeNumericInput(e.target.value))}
                      onKeyDown={allowOnlyNumericInputOnKeyDown} disabled={isActionDisabled} placeholder={t('caesarTaskPage_customMinPlaceholder')} />
                    <input type="text" inputMode="numeric" id={`custom-${taskType}-max-key`} value={customParams.maxKey}
                      onChange={(e) => handleCustomParamChange('maxKey', sanitizeNumericInput(e.target.value))}
                      onKeyDown={allowOnlyNumericInputOnKeyDown} disabled={isActionDisabled} placeholder={t('caesarTaskPage_customMaxPlaceholder')} />
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="task-specifics-content">
            <TaskDescription taskType={taskType} />
            <TaskDataDisplay currentTaskData={taskData} taskType={taskType} />
          </div>
        </div>
      </div>

      <div className="tool-card settings-card" aria-labelledby="task-answer-title">
        <div className="content-card-header">
          <h2 id="task-answer-title">
            <span role="img" aria-hidden="true" style={{ marginRight: '0.5em' }}>💬</span>
            {t('caesarTaskPage_answerTitle')}
          </h2>
        </div>
        <div className="content-card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="solution-input-wrapper">
              <SolutionInputComponent
                taskType={taskType}
                currentKeySolution={keySolution}
                onKeySolutionChange={handleKeySolutionChange}
                currentSolutionText={solution}
                onSolutionTextChange={handleSolutionTextChange}
                isInputDisabled={isSolutionInputDisabled}
              />
            </div>
            <div className="action-buttons">
              <button type="submit" className="btn btn-primary" disabled={isActionDisabled || !taskData}>
                {t('caesarTaskPage_btn_verify')}
              </button>
              {!authIsLoading && (
                <button type="button" className="btn btn-secondary" onClick={handleRequestCorrectAnswer} disabled={isActionDisabled || !taskData}>
                  {t('caesarTaskPage_btn_getAnswer')}
                </button>
              )}
              <button type="button" className="btn btn-secondary" onClick={handleVisualize} disabled={isActionDisabled || !taskData}>
                {t('caesarTaskPage_btn_visualize')}
              </button>
              <button type="button" className="btn btn-tertiary" onClick={handleNewVariantClick} disabled={isActionDisabled}>
                {t('caesarTaskPage_btn_newTask')}
              </button>
            </div>
          </form>
          {verificationResult && taskData && persistedTaskState?.associatedTaskId === taskData.taskId && (
            <div className="task-result-message-container">
              <p className={`result-message ${resultMessageClass}`}>{resultMessageContent}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaesarTaskPage;