import { useI18n } from '../hooks/useI18n';
import './Footer.css';

export default function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <p>{t('footer.text')}</p>
    </footer>
  );
}
