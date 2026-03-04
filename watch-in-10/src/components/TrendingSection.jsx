import { useState, useEffect, useRef } from 'react';
import VideoCard from './VideoCard';
import { searchByQuery } from '../services/youtube';
import { useI18n } from '../hooks/useI18n';
import './TrendingSection.css';

const CACHE_KEY = 'watch10-trending';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export default function TrendingSection({ onPlay, onToggleFavorite, isFavorite }) {
  const { t } = useI18n();
  const [videos, setVideos] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    // Check localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        setVideos(cached.items);
        return;
      }
    } catch { /* ignore */ }

    searchByQuery('trending now popular', 'any').then((items) => {
      if (items.length > 0) {
        setVideos(items);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ items, ts: Date.now() }));
      }
    });
  }, []);

  if (videos.length === 0) return null;

  const scrollLeft = () => {
    scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' });
  };

  return (
    <section className="trending">
      <h2 className="trending__title">{t('trending.title')}</h2>
      <p className="trending__subtitle">{t('trending.subtitle')}</p>
      <div className="trending__scroll-wrap">
        <button className="trending__arrow trending__arrow--left" onClick={scrollLeft} aria-label="Scroll left">
          &#8249;
        </button>
        <div className="trending__row" ref={scrollRef}>
          {videos.map((video) => (
            <div key={video.id} className="trending__card">
              <VideoCard
                video={video}
                onPlay={onPlay}
                onToggleFavorite={onToggleFavorite}
                isFavorited={isFavorite?.(video.id)}
              />
            </div>
          ))}
        </div>
        <button className="trending__arrow trending__arrow--right" onClick={scrollRight} aria-label="Scroll right">
          &#8250;
        </button>
      </div>
    </section>
  );
}
