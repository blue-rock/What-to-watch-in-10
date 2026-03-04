import { useState, useEffect } from 'react';
import { useI18n } from '../hooks/useI18n';
import './OfflineBanner.css';

export default function OfflineBanner() {
  const { t } = useI18n();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="alert">
      {t('offline.banner')}
    </div>
  );
}
