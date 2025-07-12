import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import cipherService from '../../../services/cipherService';
import { useAuth } from '../../../hooks/useAuth';
import { useNotification } from '../../../contexts/NotificationContext';
import PaginationControls from '../../../components/common/PaginationControls';
import { allowOnlyNumericInputOnKeyDown, sanitizeNumericInput } from '../../../utils/inputUtils';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const VISUALIZER_STORAGE_KEY = 'caesarVisualizerState';
const VISUALIZER_STEPS_PER_PAGE_KEY = `${VISUALIZER_STORAGE_KEY}_stepsPerPage`;

const CaesarVisualizerPage = () => {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isLoading: authIsLoading } = useAuth();
  const { addNotification } = useNotification();

  const getDefaultLanguage = useCallback(() => {
    const currentAppLang = i18n.resolvedLanguage || i18n.language.split('-')[0];
    return currentAppLang === 'en' ? 'EN' : 'RU';
  }, [i18n.resolvedLanguage, i18n.language]);

  const [persistedState, setPersistedState] = useLocalStorage(VISUALIZER_STORAGE_KEY, null);

  const [text, setText] = useState('');
  const [language, setLanguage] = useState(getDefaultLanguage());
  const [shift, setShift] = useState('');
  const [mode, setMode] = useState('encrypt');
  const [visualizationSteps, setVisualizationSteps] = useState([]);
  const [finalResultText, setFinalResultText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  
  const MIN_STEPS_PER_PAGE = 1;
  const MAX_STEPS_PER_PAGE = 10;
  const DEFAULT_STEPS_PER_PAGE = 3;
  
  const [stepsPerPage, setStepsPerPageInLocalStorage] = useLocalStorage(
    VISUALIZER_STEPS_PER_PAGE_KEY,
    DEFAULT_STEPS_PER_PAGE
  );
  const [stepsPerPageInput, setStepsPerPageInput] = useState(String(stepsPerPage));
  const isInitialMountRef = useRef(true);


  const ALPHABETS = useMemo(() => ({
    RU: t('ALPHABETS_RU', "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ"),
    EN: t('ALPHABETS_EN', "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
  }), [t]);

  const LANGUAGE_NAMES = useMemo(() => ({
    RU: t('alphabet_russian'),
    EN: t('alphabet_english')
  }), [t]);
  
  const [sourceAlphabet, setSourceAlphabet] = useState(ALPHABETS[language]);
  const [shiftedAlphabet, setShiftedAlphabet] = useState(ALPHABETS[language]);
  
  const lastProcessedDataRef = useRef(null);

  useEffect(() => {
    const spText = searchParams.get('text');
    const spLangParam = searchParams.get('alphabet');
    const spMode = searchParams.get('mode');
    const spKeyRaw = searchParams.get('key');

    if (spText !== null || spLangParam !== null || spMode !== null || spKeyRaw !== null) {
        setText(spText || '');
        const effectiveLangFromUrl = (spLangParam && ALPHABETS[spLangParam.toUpperCase()])
            ? spLangParam.toUpperCase()
            : getDefaultLanguage();
        setLanguage(effectiveLangFromUrl);
        setMode((spMode === 'decrypt' || spMode === 'encrypt') ? spMode : 'encrypt');
        
        let keyToSetFromUrl = '';
        if (spKeyRaw !== null) {
            const numericKey = parseInt(spKeyRaw, 10);
            const alphabetForValidation = ALPHABETS[effectiveLangFromUrl] || ALPHABETS.RU;
            const alphabetLength = alphabetForValidation.length;
            const maxValidKey = alphabetLength > 0 ? alphabetLength - 1 : 1;
            if (!isNaN(numericKey) && numericKey > 0 && numericKey <= maxValidKey) {
                keyToSetFromUrl = numericKey.toString();
            }
        }
        setShift(keyToSetFromUrl);
        setVisualizationSteps([]);
        setFinalResultText('');
        setCurrentPage(0);
        lastProcessedDataRef.current = null;
        
        const storedStepsPerPageItem = localStorage.getItem(VISUALIZER_STEPS_PER_PAGE_KEY);
        const storedStepsPerPage = storedStepsPerPageItem ? parseInt(JSON.parse(storedStepsPerPageItem), 10) : DEFAULT_STEPS_PER_PAGE;
        let validInitialStepsPerPage = Math.max(MIN_STEPS_PER_PAGE, Math.min(storedStepsPerPage, MAX_STEPS_PER_PAGE));
        setStepsPerPageInLocalStorage(validInitialStepsPerPage);

    } else if (persistedState) {
        setText(persistedState.text || '');
        setLanguage(persistedState.language || getDefaultLanguage());
        setShift(persistedState.shift || '');
        setMode(persistedState.mode || 'encrypt');
        setVisualizationSteps(persistedState.visualizationSteps || []);
        setFinalResultText(persistedState.finalResultText || '');
        setCurrentPage(persistedState.currentPage || 0);
        lastProcessedDataRef.current = persistedState.lastProcessed || null;
    } else {
        setLanguage(getDefaultLanguage());
        const storedStepsPerPageItem = localStorage.getItem(VISUALIZER_STEPS_PER_PAGE_KEY);
        const initialSteps = storedStepsPerPageItem ? parseInt(JSON.parse(storedStepsPerPageItem), 10) : DEFAULT_STEPS_PER_PAGE;
        let validInitialSteps = Math.max(MIN_STEPS_PER_PAGE, Math.min(initialSteps, MAX_STEPS_PER_PAGE));
        setStepsPerPageInLocalStorage(validInitialSteps);
    }
    isInitialMountRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, ALPHABETS, getDefaultLanguage]);

  useEffect(() => {
    if (!isInitialMountRef.current) {
        const stateToPersist = {
          text, language, shift, mode,
          visualizationSteps, finalResultText, currentPage,
          lastProcessed: lastProcessedDataRef.current
        };
        setPersistedState(stateToPersist);
    } else {
        const timer = setTimeout(() => { isInitialMountRef.current = false; }, 0);
        return () => clearTimeout(timer);
    }
  }, [
    text, language, shift, mode, visualizationSteps, finalResultText,
    currentPage, setPersistedState
  ]);

  useEffect(() => {
    let validSteps = stepsPerPage;
    if (typeof validSteps !== 'number' || isNaN(validSteps)) {
        validSteps = DEFAULT_STEPS_PER_PAGE;
    }
    if (validSteps < MIN_STEPS_PER_PAGE) {
        validSteps = MIN_STEPS_PER_PAGE;
    } else if (validSteps > MAX_STEPS_PER_PAGE) {
        validSteps = MAX_STEPS_PER_PAGE;
    }
    if (validSteps !== stepsPerPage) {
        setStepsPerPageInLocalStorage(validSteps);
    }
    if (String(validSteps) !== stepsPerPageInput) {
        setStepsPerPageInput(String(validSteps));
    }
  }, [stepsPerPage, setStepsPerPageInLocalStorage]);


  const totalPages = useMemo(() => {
    if (visualizationSteps.length === 0 || stepsPerPage === 0) return 0;
    return Math.ceil(visualizationSteps.length / stepsPerPage);
  }, [visualizationSteps.length, stepsPerPage]);

  const updateAlphabetDisplays = useCallback(() => {
    const currentAlphabetString = ALPHABETS[language] || ALPHABETS.RU;
    setSourceAlphabet(currentAlphabetString);
    const len = currentAlphabetString.length;
    if (len === 0) {
      setShiftedAlphabet('');
      return;
    }
    const effectiveShift = parseInt(shift, 10);
    const maxValidKey = len > 0 ? len - 1 : 1;
    if (shift === '' || isNaN(effectiveShift) || effectiveShift <= 0 || effectiveShift > maxValidKey) {
        setShiftedAlphabet(currentAlphabetString);
        return;
    }
    let newShiftedAlphabet = "";
    for (let i = 0; i < len; i++) {
      newShiftedAlphabet += currentAlphabetString[(i + (effectiveShift % len) + len) % len];
    }
    setShiftedAlphabet(newShiftedAlphabet);
  }, [language, shift, ALPHABETS]);

  useEffect(() => {
    updateAlphabetDisplays();
  }, [language, shift, updateAlphabetDisplays]);

  const handleProcessText = useCallback(async (isEncryptMode) => {
    const numericShift = parseInt(shift, 10);
    const currentAlphabet = ALPHABETS[language] || ALPHABETS.RU;
    const currentAlphabetLength = currentAlphabet.length;
    const maxValidKey = currentAlphabetLength > 0 ? currentAlphabetLength - 1 : 1;

    if (shift === '' || isNaN(numericShift) || numericShift <= 0 || numericShift > maxValidKey) {
        addNotification({ key: 'caesarVisualizerPage_infoKeyRange', params: { maxKey: maxValidKey } }, 'error');
        return;
    }
    
    if (currentPage !== 0) setCurrentPage(0);

    try {
      const response = await cipherService.getCaesarVisualization({
        text,
        shift: numericShift,
        language,
        encrypt: isEncryptMode,
      });
      const newSteps = response.data.steps || [];
      const newResultText = response.data.resultText || '';
      setVisualizationSteps(newSteps);
      setFinalResultText(newResultText);
      lastProcessedDataRef.current = {
        text, language, shift: numericShift, mode: isEncryptMode,
        resultText: newResultText, steps: newSteps,
      };
    } catch (err) {
      let messageContent;
      if (err.message === 'Network Error' || !err.response) {
        messageContent = { key: 'networkError' };
      } else if (err.response && err.response.data && err.response.data.message) {
        messageContent = err.response.data.message;
      } else {
        messageContent = { key: 'caesarVisualizerPage_errorProcessingRequest' };
      }
      addNotification(messageContent, 'error');
    }
  }, [text, shift, language, addNotification, currentPage, ALPHABETS]);

  const handleEncrypt = useCallback(() => {
    if (authIsLoading) return;
    if (!user) {
        addNotification({ key: "auth_userNotAuthenticated" }, 'error');
        return;
    }
    if (!text.trim()) {
        addNotification({ key: "caesarVisualizerPage_infoEnterTextToProcess" }, 'info');
        return;
    }
    const numericShift = parseInt(shift, 10);
    const currentAlphabet = ALPHABETS[language] || ALPHABETS.RU;
    const currentAlphabetLength = currentAlphabet.length;
    const maxValidKey = currentAlphabetLength > 0 ? currentAlphabetLength - 1 : 1;

    if (shift === '' || isNaN(numericShift) || numericShift <= 0 || numericShift > maxValidKey) {
        addNotification({ key: 'caesarVisualizerPage_infoKeyRange', params: { maxKey: maxValidKey } }, 'error');
        return;
    }
    const isEncryptMode = true;
    if (
      lastProcessedDataRef.current &&
      lastProcessedDataRef.current.text === text &&
      lastProcessedDataRef.current.language === language &&
      lastProcessedDataRef.current.shift === numericShift &&
      lastProcessedDataRef.current.mode === isEncryptMode
    ) {
      if (mode !== 'encrypt') setMode('encrypt');
      setVisualizationSteps(lastProcessedDataRef.current.steps || []);
      setFinalResultText(lastProcessedDataRef.current.resultText || '');
      return;
    }

    if (mode !== 'encrypt') setMode('encrypt');
    handleProcessText(isEncryptMode);
  }, [user, text, shift, language, mode, addNotification, handleProcessText, ALPHABETS, authIsLoading]);

  const handleDecrypt = useCallback(() => {
    if (authIsLoading) return;
    if (!user) {
        addNotification({ key: "auth_userNotAuthenticated" }, 'error');
        return;
    }
    if (!text.trim()) {
        addNotification({ key: "caesarVisualizerPage_infoEnterTextToProcess" }, 'info');
        return;
    }
    const numericShift = parseInt(shift, 10);
    const currentAlphabet = ALPHABETS[language] || ALPHABETS.RU;
    const currentAlphabetLength = currentAlphabet.length;
    const maxValidKey = currentAlphabetLength > 0 ? currentAlphabetLength - 1 : 1;

    if (shift === '' || isNaN(numericShift) || numericShift <= 0 || numericShift > maxValidKey) {
        addNotification({ key: 'caesarVisualizerPage_infoKeyRange', params: { maxKey: maxValidKey } }, 'error');
        return;
    }
    const isEncryptMode = false;
    if (
      lastProcessedDataRef.current &&
      lastProcessedDataRef.current.text === text &&
      lastProcessedDataRef.current.language === language &&
      lastProcessedDataRef.current.shift === numericShift &&
      lastProcessedDataRef.current.mode === isEncryptMode
    ) {
      if (mode !== 'decrypt') setMode('decrypt');
      setVisualizationSteps(lastProcessedDataRef.current.steps || []);
      setFinalResultText(lastProcessedDataRef.current.resultText || '');
      return;
    }
    if (mode !== 'decrypt') setMode('decrypt');
    handleProcessText(isEncryptMode);
  }, [user, text, shift, language, mode, addNotification, handleProcessText, ALPHABETS, authIsLoading]);

  const handleReset = useCallback(() => {
    const defaultLangForReset = getDefaultLanguage();
    
    setText('');
    setLanguage(defaultLangForReset);
    setShift('');
    setMode('encrypt');
    setVisualizationSteps([]);
    setFinalResultText('');
    setCurrentPage(0);
    
    setStepsPerPageInLocalStorage(DEFAULT_STEPS_PER_PAGE);

    if (searchParams.toString() !== "") setSearchParams({});
    lastProcessedDataRef.current = null;
    setPersistedState(null);
  }, [setPersistedState, setSearchParams, searchParams, getDefaultLanguage, setStepsPerPageInLocalStorage]);


  const handlePageChange = useCallback((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
    }
  }, [totalPages]);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    } else if (totalPages === 0 && currentPage !== 0) {
      setCurrentPage(0);
    } else if (totalPages > 0 && currentPage < 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const displayedSteps = useMemo(() => visualizationSteps.slice(
    currentPage * stepsPerPage,
    (currentPage + 1) * stepsPerPage
  ), [visualizationSteps, currentPage, stepsPerPage]);

  const currentStepsStart = useMemo(() => {
    if (visualizationSteps.length === 0) return 0;
    return currentPage * stepsPerPage + 1;
  }, [currentPage, stepsPerPage, visualizationSteps.length]);

  const currentStepsEnd = useMemo(() => {
    if (visualizationSteps.length === 0) return 0;
    return Math.min((currentPage + 1) * stepsPerPage, visualizationSteps.length);
  }, [currentPage, stepsPerPage, visualizationSteps.length]);

  const displayLanguageName = LANGUAGE_NAMES[language] || language;

  const handleShiftChange = useCallback((e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeNumericInput(rawValue);

    if (sanitizedValue === '') {
        setShift('');
        return;
    }
    let numValue = parseInt(sanitizedValue, 10);
    if (isNaN(numValue)) {
        setShift('');
        return;
    }
    const currentAlphabet = ALPHABETS[language] || ALPHABETS.RU;
    const alphabetLength = currentAlphabet.length;
    const maxValidKey = alphabetLength > 0 ? alphabetLength - 1 : 1;

    if (numValue <= 0) {
        numValue = 1;
    } else if (numValue > maxValidKey) {
        numValue = maxValidKey;
    }
    setShift(numValue.toString());
  }, [language, ALPHABETS]);
  
  const handleTextChange = useCallback((e) => {
    setText(e.target.value);
  }, []);

  const applyStepsPerPageChange = useCallback(() => {
    let newSize = parseInt(stepsPerPageInput, 10);
    if (stepsPerPageInput.trim() === '' || isNaN(newSize)) {
      newSize = MIN_STEPS_PER_PAGE;
    } else if (newSize < MIN_STEPS_PER_PAGE) {
      newSize = MIN_STEPS_PER_PAGE;
    } else if (newSize > MAX_STEPS_PER_PAGE) {
      newSize = MAX_STEPS_PER_PAGE;
    }
    
    const newSizeStr = String(newSize);
    if (stepsPerPageInput !== newSizeStr) {
      setStepsPerPageInput(newSizeStr);
    }
    if (newSize !== stepsPerPage) {
      setStepsPerPageInLocalStorage(newSize);
      setCurrentPage(0);
    }
  }, [stepsPerPageInput, stepsPerPage, setStepsPerPageInLocalStorage, MIN_STEPS_PER_PAGE, MAX_STEPS_PER_PAGE]);

  const handleStepsPerPageInputChange = useCallback((e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeNumericInput(rawValue);
    setStepsPerPageInput(sanitizedValue);

    if (sanitizedValue !== '') {
        let numValue = parseInt(sanitizedValue, 10);
        if (!isNaN(numValue)) {
            if (numValue > MAX_STEPS_PER_PAGE) {
                setStepsPerPageInput(String(MAX_STEPS_PER_PAGE));
            }
        }
    }
  }, [MAX_STEPS_PER_PAGE]);

  const handleStepsPerPageInputBlur = useCallback(() => {
    applyStepsPerPageChange();
  }, [applyStepsPerPageChange]);

  const handleStepsPerPageInputKeyDown = useCallback((e) => {
    allowOnlyNumericInputOnKeyDown(e);
    if (!e.defaultPrevented && e.key === 'Enter') {
      e.preventDefault();
      applyStepsPerPageChange();
    }
  }, [applyStepsPerPageChange]);

  const isButtonDisabled = authIsLoading;

  return (
    <div className="visualizer-layout">
      <div className="visualizer-column">
        <section className="tool-card" aria-labelledby="visualizer-parameters-title">
          <header className="tool-card-header">
            <h2 id="visualizer-parameters-title">
              <span role="img" aria-hidden="true" className="icon-mr-0_5em">⚙️</span>
              {t('caesarVisualizerPage_parametersTitle')}
            </h2>
          </header>
          <div className="tool-card-body">
            <div className="controls-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label htmlFor="alphabet-select">{t('caesarVisualizerPage_alphabetLabel')}</label>
                <select
                  id="alphabet-select" name="alphabet" value={language}
                  onChange={(e) => {
                    const newLang = e.target.value; setLanguage(newLang);
                    const currentShiftNum = parseInt(shift, 10);
                    if (!isNaN(currentShiftNum)) {
                        const newAlphabet = ALPHABETS[newLang] || ALPHABETS.RU;
                        const newMaxKey = newAlphabet.length > 0 ? newAlphabet.length - 1 : 1;
                        if (currentShiftNum > newMaxKey) {
                            setShift(newMaxKey.toString());
                        } else if (currentShiftNum <= 0 && newMaxKey >=1) {
                            setShift('1');
                        }
                    }
                  }}
                >
                  <option value="RU">{LANGUAGE_NAMES.RU}</option>
                  <option value="EN">{LANGUAGE_NAMES.EN}</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="caesar-key">{t('caesarVisualizerPage_keyLabel')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  id="caesar-key" name="key" value={shift}
                  onChange={handleShiftChange}
                  onKeyDown={allowOnlyNumericInputOnKeyDown}
                  placeholder={t('caesarVisualizerPage_keyPlaceholder')}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="input-text">{t('caesarVisualizerPage_textLabel')}</label>
              <textarea
                id="input-text" name="inputText" rows="4"
                placeholder={t('caesarVisualizerPage_textPlaceholder')}
                value={text} onChange={handleTextChange}
                className="shared-textarea-style"
              ></textarea>
            </div>
            <div className="action-buttons">
              <button className="btn btn-primary" onClick={handleEncrypt} disabled={isButtonDisabled}>
                {t('caesarVisualizerPage_btn_encrypt')}
              </button>
              <button className="btn btn-secondary" onClick={handleDecrypt} disabled={isButtonDisabled}>
                {t('caesarVisualizerPage_btn_decrypt')}
              </button>
              <button className="btn btn-tertiary" onClick={handleReset} disabled={isButtonDisabled}>
                {t('caesarVisualizerPage_btn_reset')}
              </button>
            </div>
          </div>
        </section>

        <section className="tool-card" aria-labelledby="visualizer-result-title">
          <header className="tool-card-header">
            <h2 id="visualizer-result-title">
              <span role="img" aria-hidden="true" className="icon-mr-0_5em">🏁</span>
              {t('caesarVisualizerPage_resultTitle')}
            </h2>
          </header>
          <div className="tool-card-body">
            <textarea
                id="result-text-output" readOnly value={finalResultText} rows="4"
                placeholder={!finalResultText ? t("caesarVisualizerPage_resultPlaceholder") : ""}
                className="shared-textarea-style"
                aria-label={t("caesarVisualizerPage_resultAriaLabel")}
            />
          </div>
        </section>
      </div>

      <div className="visualizer-column">
        <section className="tool-card visualization-card-wrapper" aria-labelledby="visualizer-steps-title">
          <header className="tool-card-header">
            <h2 id="visualizer-steps-title">
              <span role="img" aria-hidden="true" className="icon-mr-0_5em">📊</span>
              {t('caesarVisualizerPage_visualizationTitle')}
            </h2>
          </header>
          <div className="tool-card-body tool-card-body-flex-column">
            <div>
              <div className="alphabet-display alphabet-grid mb-3">
                <strong className="alphabet-label">{t('caesarVisualizerPage_alphabetLengthLabel')}</strong>
                <code className="alphabet-value">{sourceAlphabet.length}</code>

                <strong className="alphabet-label">{t('caesarVisualizerPage_alphabetLabel')}</strong>
                <code className="alphabet-value">{displayLanguageName}</code>
                
                <strong className="alphabet-label">{t('caesarVisualizerPage_keyLabel')}</strong>
                <code className="alphabet-value">{shift === '' || isNaN(parseInt(shift,10)) || parseInt(shift,10) <= 0 ? '?' : shift}</code>
                
                <strong className="alphabet-label">{t('caesarVisualizerPage_sourceAlphabetLabel_short')}</strong>
                <code className="alphabet-value alphabet-string">{sourceAlphabet}</code>
                
                <strong className="alphabet-label">{t('caesarVisualizerPage_shiftedAlphabetLabel_short')}</strong>
                <code className="alphabet-value alphabet-string">{shiftedAlphabet}</code>
              </div>
              <p className="visualizer-intro-text">
                {t('caesarVisualizerPage_introText')}
              </p>
            </div>
            
            {visualizationSteps.length === 0 && (
                <p className="no-steps-message">{t('caesarVisualizerPage_noSteps')}</p>
            )}


            {visualizationSteps.length > 0 && (
              <div className="visualization-dynamic-wrapper">
                <div className="visualization-content-scrollable">
                  <div id="visualization-steps-container">
                    {displayedSteps.map((step) => {
                      const transParams = { ...step.params };
                      if (step.params && step.params.val2_key) {
                        transParams.val2 = t(step.params.val2_key, { count: step.params.val2_params_count });
                      }
                      if (step.params && typeof step.params.val1 === 'string' && step.params.val1.startsWith('alphabet_')) {
                          transParams.val1 = t(step.params.val1);
                      }

                      return (
                        <div key={step.stepIndex} className="step-explanation step-explanation-custom-padding">
                          <p className="step-number-paragraph">
                              <strong>{t('caesarVisualizerPage_stepLabel', { stepNumber: step.stepIndex + 1 })}</strong>{' '}
                              <Trans
                                i18nKey="caesarVisualizerPage_processingChar_trans"
                                values={{
                                  charType: step.skipped ? t('caesarExamplePage_charType_symbol') : t('caesarExamplePage_charType_letter'),
                                  charValue: step.originalChar
                                }}
                                components={{ 1: <strong />}}
                              />
                          </p>
                          <p className="explanation-text step-details-paragraph">
                            <Trans
                                i18nKey={step.explanationKey}
                                values={transParams}
                                components={{ 1: <strong />, 3: <strong /> }}
                            />
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="pagination-footer pagination-footer-auto-margin">
                  <div className="pagination-footer-left">
                    <div className="admin-page-size-control">
                      <label htmlFor="visualizer-steps-per-page-input">{t('caesarVisualizerPage_stepsPerPageLabel')}</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        id="visualizer-steps-per-page-input"
                        value={stepsPerPageInput}
                        onChange={handleStepsPerPageInputChange}
                        onBlur={handleStepsPerPageInputBlur}
                        onKeyDown={handleStepsPerPageInputKeyDown}
                        className="steps-per-page-input-custom"
                        title={t('caesarVisualizerPage_stepsPerPageTitle')}
                      />
                    </div>
                  </div>

                  {totalPages > 0 && (
                    <div className="pagination-footer-center pagination-footer-no-top-padding">
                      <label className="pagination-info">
                        {t('caesarVisualizerPage_stepsInfo', { start: currentStepsStart, end: currentStepsEnd, total: visualizationSteps.length })}
                      </label>
                      <PaginationControls
                        currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange}
                        maxVisiblePageButtons={5} disabled={isButtonDisabled}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CaesarVisualizerPage;