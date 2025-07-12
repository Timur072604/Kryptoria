import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PaginationControls from '../../../components/common/PaginationControls';
import { allowOnlyNumericInputOnKeyDown, sanitizeNumericInput } from '../../../utils/inputUtils';
import { useTranslation, Trans } from 'react-i18next';
import { useLocalStorage } from '../../../hooks/useLocalStorage';

const EXAMPLE_STEPS_PER_PAGE_KEY = 'caesarExampleStepsPerPage';

const CaesarExamplePage = () => {
  const { t, i18n } = useTranslation();

  const LANGUAGE_NAMES = useMemo(() => ({
    RU: t('alphabet_russian'),
    EN: t('alphabet_english')
  }), [t]);

  const EXAMPLE_DATA = useMemo(() => {
    const currentLang = i18n.resolvedLanguage || i18n.language.split('-')[0];
    const isRussian = currentLang === 'ru';

    const textParam = t('caesarExamplePage_exampleWord');
    const keyParam = 3;
    const alphabetKey = isRussian ? 'RU' : 'EN';
    const currentAlphabet = t(isRussian ? 'ALPHABETS_RU' : 'ALPHABETS_EN');
    const encryptOperationText = t('visualization_operation_encrypt', { count: keyParam });
    
    const currentLanguageName = LANGUAGE_NAMES[alphabetKey];

    let steps = [];
    let resultText = "";
    if (currentAlphabet && textParam) {
        for (let i = 0; i < textParam.length; i++) {
            const originalChar = textParam[i];
            const upperOriginalChar = originalChar.toUpperCase();
            const originalCharIndexInAlphabet = currentAlphabet.indexOf(upperOriginalChar);
            let processedChar = originalChar;
            let explanationKey = "visualization_explanation_nonalphabetic_trans";
            let params = { val0: originalChar, val1: currentLanguageName };
            let skipped = true;

            if (originalCharIndexInAlphabet !== -1) {
                skipped = false;
                const newIndex = (originalCharIndexInAlphabet + keyParam) % currentAlphabet.length;
                const newUpperChar = currentAlphabet[newIndex];
                processedChar = originalChar === upperOriginalChar ? newUpperChar : newUpperChar.toLowerCase();
                
                explanationKey = "visualization_explanation_alphabetic_trans";
                params = {
                    val0: originalChar,
                    val1: originalCharIndexInAlphabet + 1,
                    val2: encryptOperationText,
                    val3: processedChar,
                    val4: newIndex + 1
                };
            }
            resultText += processedChar;
            steps.push({
                stepIndex: i,
                originalChar,
                processedChar,
                explanationKey,
                params,
                skipped
            });
        }
    }
    
    return {
      alphabetKey,
      text: textParam,
      key: keyParam,
      alphabet: currentAlphabet,
      steps,
      result: resultText,
      languageName: currentLanguageName
    };
  }, [t, i18n.resolvedLanguage, i18n.language, LANGUAGE_NAMES]);

  const [currentPage, setCurrentPage] = useState(0);
  const MIN_STEPS_PER_PAGE = 1;
  const MAX_STEPS_PER_PAGE = 10;
  const DEFAULT_STEPS_PER_PAGE = 3;
  
  const [stepsPerPage, setStepsPerPageInLocalStorage] = useLocalStorage(EXAMPLE_STEPS_PER_PAGE_KEY, DEFAULT_STEPS_PER_PAGE);
  const [stepsPerPageInput, setStepsPerPageInput] = useState(String(stepsPerPage));
  
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      setStepsPerPageInput(String(stepsPerPage));
      isInitialMount.current = false;
    } else {
      if (parseInt(stepsPerPageInput, 10) !== stepsPerPage) {
        setStepsPerPageInput(String(stepsPerPage));
      }
    }
  }, [stepsPerPage]);

  const shiftedAlphabet = useMemo(() => {
    const alphabet = EXAMPLE_DATA.alphabet;
    const key = EXAMPLE_DATA.key;
    const len = alphabet.length;
    if (len === 0) return "";
    let newShiftedAlphabet = "";
    for (let i = 0; i < len; i++) {
      newShiftedAlphabet += alphabet[(i + key % len + len) % len];
    }
    return newShiftedAlphabet;
  }, [EXAMPLE_DATA.alphabet, EXAMPLE_DATA.key]);

  const totalSteps = EXAMPLE_DATA.steps.length;

  const totalPages = useMemo(() => {
    if (totalSteps === 0 || stepsPerPage === 0) return 0;
    return Math.ceil(totalSteps / stepsPerPage);
  }, [totalSteps, stepsPerPage]);

  useEffect(() => {
    setCurrentPage(0);
  }, [EXAMPLE_DATA, stepsPerPage]);

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    } else if (totalPages === 0 && currentPage !== 0) {
      setCurrentPage(0);
    } else if (totalPages > 0 && currentPage < 0) {
      setCurrentPage(0);
    }
  }, [totalPages, currentPage]);

  const displayedSteps = useMemo(() => EXAMPLE_DATA.steps.slice(
    currentPage * stepsPerPage,
    (currentPage + 1) * stepsPerPage
  ), [EXAMPLE_DATA.steps, currentPage, stepsPerPage]);

  const currentStepsStart = useMemo(() => {
    if (totalSteps === 0) return 0;
    return currentPage * stepsPerPage + 1;
  }, [currentPage, stepsPerPage, totalSteps]);

  const currentStepsEnd = useMemo(() => {
    if (totalSteps === 0) return 0;
    return Math.min((currentPage + 1) * stepsPerPage, totalSteps);
  }, [currentPage, stepsPerPage, totalSteps]);

  const handlePageChange = useCallback((pageIndex) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPage(pageIndex);
    }
  }, [totalPages]);

  const applyStepsPerPageChange = useCallback(() => {
    let newSize = parseInt(stepsPerPageInput, 10);
    if (isNaN(newSize) || newSize < MIN_STEPS_PER_PAGE) {
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
    }
  }, [stepsPerPageInput, stepsPerPage, setStepsPerPageInLocalStorage, MIN_STEPS_PER_PAGE, MAX_STEPS_PER_PAGE]);

  const handleStepsPerPageInputChange = useCallback((e) => {
    const rawValue = e.target.value;
    const sanitizedValue = sanitizeNumericInput(rawValue);

    if (sanitizedValue === '') {
        setStepsPerPageInput('');
        return;
    }

    let numValue = parseInt(sanitizedValue, 10);

    if (isNaN(numValue)) {
        setStepsPerPageInput('');
        return;
    }

    if (numValue > MAX_STEPS_PER_PAGE) {
        numValue = MAX_STEPS_PER_PAGE;
    }
    setStepsPerPageInput(numValue.toString());
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

  return (
    <>
      <div className="visualizer-layout">
        <div className="visualizer-column">
          <section
            className="tool-card"
            id="example-explanation-card"
            aria-labelledby="example-explanation-title"
          >
            <header className="tool-card-header">
              <h2 id="example-explanation-title">
                <span role="img" aria-hidden="true" className="icon-mr-0_5em">💡</span>
                {t('caesarExamplePage_explanationTitle')}
              </h2>
            </header>
            <div className="tool-card-body">
              <p className="explanation-paragraph">
                <Trans
                  i18nKey="caesarExamplePage_explanation_p1_trans"
                  values={{ text: EXAMPLE_DATA.text, key: EXAMPLE_DATA.key, alphabetName: EXAMPLE_DATA.languageName }}
                  components={{ 1: <strong /> }}
                />
                <br /><br />
                {t('caesarExamplePage_explanation_p2')}
                <br /><br />
                <Trans
                  i18nKey="caesarExamplePage_explanation_p3_trans"
                  values={{ text: EXAMPLE_DATA.text }}
                  components={{ 1: <strong />, 3: <strong /> }}
                />
              </p>
            </div>
          </section>

          <section className="tool-card" aria-labelledby="example-result-title">
            <header className="tool-card-header">
              <h2 id="example-result-title">
                <span role="img" aria-hidden="true" className="icon-mr-0_5em">🏁</span>
                {t('caesarExamplePage_resultTitle')}
              </h2>
            </header>
            <div className="tool-card-body">
              <p className="result-label-paragraph">
                <Trans
                  i18nKey="caesarExamplePage_resultLabel_trans"
                  values={{ text: EXAMPLE_DATA.text, key: EXAMPLE_DATA.key }}
                  components={{ 1: <strong /> }}
                />
              </p>
              <div
                  id="example-result-text-output"
                  className="example-result-output"
                  aria-label={t('caesarExamplePage_resultTextAriaLabel')}
              >
                {EXAMPLE_DATA.result}
              </div>
            </div>
          </section>
        </div>

        <div className="visualizer-column">
          <section className="tool-card visualization-card-wrapper" aria-labelledby="example-step-by-step-title">
            <header className="tool-card-header">
              <h2 id="example-step-by-step-title">
                <span role="img" aria-hidden="true" className="icon-mr-0_5em">📊</span>
                {t('caesarExamplePage_stepByStepTitle')}
              </h2>
            </header>
            <div className="tool-card-body tool-card-body-flex-column">
                <div className="visualization-content-scrollable">
                    <div className="alphabet-display alphabet-grid mb-3">
                        <strong className="alphabet-label">{t('caesarExamplePage_alphabetLengthLabel')}</strong>
                        <code className="alphabet-value">{EXAMPLE_DATA.alphabet.length}</code>
                        
                        <strong className="alphabet-label">{t('caesarVisualizerPage_alphabetLabel')}</strong>
                        <code className="alphabet-value">{EXAMPLE_DATA.languageName}</code>

                        <strong className="alphabet-label">{t('caesarVisualizerPage_keyLabel')}</strong>
                        <code className="alphabet-value">{EXAMPLE_DATA.key}</code>
                        
                        <strong className="alphabet-label">{t('caesarExamplePage_sourceAlphabetLabel_short')}</strong>
                        <code className="alphabet-value alphabet-string">{EXAMPLE_DATA.alphabet}</code>
                        
                        <strong className="alphabet-label">{t('caesarExamplePage_shiftedAlphabetLabel_short')}</strong>
                        <code className="alphabet-value alphabet-string">{shiftedAlphabet}</code>
                    </div>
                    <p className="mb-3 visualizer-intro-text">
                        {t('caesarExamplePage_introText')}
                    </p>

                    <div id="example-steps-container">
                        {displayedSteps.map((step) => (
                            <div
                                key={step.stepIndex}
                                className="step-explanation step-explanation-custom-padding"
                            >
                                <p className="step-number-paragraph">
                                    <strong>{t('caesarExamplePage_stepLabel', { stepNumber: step.stepIndex + 1 })}</strong>{' '}
                                    <Trans
                                      i18nKey="caesarExamplePage_processingChar_trans"
                                      values={{ charType: step.skipped ? t('caesarExamplePage_charType_symbol') : t('caesarExamplePage_charType_letter'), charValue: step.originalChar }}
                                      components={{ 1: <strong />}}
                                    />
                                </p>
                                <p
                                    className="explanation-text step-details-paragraph"
                                >
                                  <Trans
                                    i18nKey={step.explanationKey}
                                    values={step.params}
                                    components={{ 1: <strong />, 3: <strong /> }}
                                  />
                                </p>
                            </div>
                        ))}
                         {totalSteps === 0 && (
                            <p className="text-secondary text-center-mt-lg">
                                {t('caesarExamplePage_noSteps')}
                            </p>
                        )}
                    </div>
                </div>
                <div className="pagination-footer pagination-footer-auto-margin">
                  {totalSteps > 0 && (
                    <div className="pagination-footer-left">
                      <div className="admin-page-size-control">
                        <label htmlFor="example-steps-per-page-input">{t('caesarExamplePage_stepsPerPageLabel')}</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          id="example-steps-per-page-input"
                          value={stepsPerPageInput}
                          onChange={handleStepsPerPageInputChange}
                          onBlur={handleStepsPerPageInputBlur}
                          onKeyDown={handleStepsPerPageInputKeyDown}
                          className="steps-per-page-input-custom"
                          title={t('caesarExamplePage_stepsPerPageTitle')}
                        />
                      </div>
                    </div>
                  )}

                  {totalPages > 0 && (
                    <div className="pagination-footer-center" style={{ paddingTop: totalSteps > 0 ? '0' : 'var(--spacing-md)' }}>
                      <label id="example-visualization-info" className="pagination-info">
                        {totalSteps > 0 ?
                          t('caesarExamplePage_stepsInfo', { start: currentStepsStart, end: currentStepsEnd, total: totalSteps }) :
                          ''
                        }
                      </label>
                      <PaginationControls
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        maxVisiblePageButtons={5}
                      />
                    </div>
                  )}
                  {totalPages === 0 && totalSteps === 0 && <div className="flex-grow-spacer" />}
                  {totalPages === 0 && totalSteps > 0 && <div className="flex-grow-spacer" />}
                </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default CaesarExamplePage;