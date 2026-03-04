import { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useI18n } from '../hooks/useI18n';
import './Onboarding.css';

const STORAGE_KEY = 'watch10-onboarding-done';

const STEP_ICONS = ['\uD83D\uDD0D', '\u23F1\uFE0F', '\u25B6\uFE0F'];
const STEP_KEYS = [
  { title: 'onboard.step1.title', desc: 'onboard.step1.desc' },
  { title: 'onboard.step2.title', desc: 'onboard.step2.desc' },
  { title: 'onboard.step3.title', desc: 'onboard.step3.desc' },
];

export default function Onboarding() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const cardRef = useRef(null);
  useFocusTrap(cardRef);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const handleNext = () => {
    if (step < STEP_KEYS.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  if (!visible) return null;

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Welcome guide">
      <div className="onboarding__card" ref={cardRef}>
        <button className="onboarding__skip" onClick={handleDismiss}>{t('onboard.skip')}</button>
        <div className="onboarding__step">
          <span className="onboarding__icon">{STEP_ICONS[step]}</span>
          <h3 className="onboarding__title">{t(STEP_KEYS[step].title)}</h3>
          <p className="onboarding__desc">{t(STEP_KEYS[step].desc)}</p>
        </div>
        <div className="onboarding__dots">
          {STEP_KEYS.map((_, i) => (
            <span key={i} className={`onboarding__dot ${i === step ? 'onboarding__dot--active' : ''}`} />
          ))}
        </div>
        <button className="onboarding__next" onClick={handleNext}>
          {step < STEP_KEYS.length - 1 ? t('onboard.next') : t('onboard.getStarted')}
        </button>
      </div>
    </div>
  );
}
