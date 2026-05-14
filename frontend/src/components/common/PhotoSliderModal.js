import React, { useState, useEffect, useCallback } from 'react';
import photo0 from '../../assets/photo.jpeg';
import photo1 from '../../assets/photo1.jpg';
import photo2 from '../../assets/photo2.jpg';
import photo3 from '../../assets/photo3.jpg';
import photo4 from '../../assets/photo4.jpg';
import photo5 from '../../assets/photo5.jpg';
import photo6 from '../../assets/photo6.jpg';

const ALL_PHOTOS = [photo0, photo1, photo2, photo3, photo4, photo5, photo6];

export default function PhotoSliderModal({ isOpen, onClose, startIndex = 0 }) {
  const [current, setCurrent] = useState(startIndex);
  const [direction, setDirection] = useState(null); // 'left' | 'right'
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) setCurrent(startIndex);
  }, [isOpen, startIndex]);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, current, animating]);

  const animate = (dir, nextIndex) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(nextIndex);
      setDirection(null);
      setAnimating(false);
    }, 350);
  };

  const goNext = useCallback(() => {
    const next = (current + 1) % ALL_PHOTOS.length;
    animate('right', next);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, animating]);

  const goPrev = useCallback(() => {
    const prev = (current - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length;
    animate('left', prev);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, animating]);

  if (!isOpen) return null;

  const slideClass = animating
    ? direction === 'right'
      ? 'slide-out-left'
      : 'slide-out-right'
    : 'slide-in';

  return (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(80px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-80px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0);    opacity: 1; }
          to   { transform: translateX(-80px); opacity: 0; }
        }
        @keyframes slideOutToRight {
          from { transform: translateX(0);   opacity: 1; }
          to   { transform: translateX(80px); opacity: 0; }
        }
        .ps-img.slide-in      { animation: slideInFromRight 0.35s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.slide-in-left { animation: slideInFromLeft  0.35s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.slide-out-left  { animation: slideOutToLeft  0.35s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.slide-out-right { animation: slideOutToRight 0.35s cubic-bezier(.4,0,.2,1) forwards; }

        .ps-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.88);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .ps-box {
          position: relative;
          display: flex; flex-direction: column; align-items: center;
          max-width: 520px; width: 92vw;
        }
        .ps-img-wrap {
          width: 100%; aspect-ratio: 3/4;
          max-height: 72vh;
          overflow: hidden; border-radius: 20px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.7);
          background: #111;
          position: relative;
        }
        .ps-img {
          width: 100%; height: 100%; object-fit: cover;
          border-radius: 20px;
          display: block;
        }
        .ps-arrow {
          position: absolute; top: 50%; transform: translateY(-50%);
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255,255,255,0.3);
          color: #fff; border-radius: 50%;
          width: 48px; height: 48px;
          font-size: 22px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.2s;
          z-index: 2; outline: none;
        }
        .ps-arrow:hover {
          background: rgba(108,99,255,0.7);
          border-color: rgba(108,99,255,0.8);
          transform: translateY(-50%) scale(1.12);
        }
        .ps-arrow.left  { left:  -24px; }
        .ps-arrow.right { right: -24px; }

        .ps-close {
          position: absolute; top: -16px; right: -16px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 2px solid rgba(255,255,255,0.3);
          color: #fff; border-radius: 50%;
          width: 40px; height: 40px; font-size: 20px;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.2s;
          z-index: 3; outline: none;
        }
        .ps-close:hover {
          background: rgba(255,80,80,0.7);
          border-color: rgba(255,80,80,0.8);
          transform: scale(1.12);
        }
        .ps-dots {
          display: flex; gap: 8px; margin-top: 18px;
        }
        .ps-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.3);
          cursor: pointer; transition: background 0.2s, transform 0.2s;
          border: none; outline: none; padding: 0;
        }
        .ps-dot.active {
          background: #6c63ff; transform: scale(1.4);
        }
        .ps-dot:hover:not(.active) {
          background: rgba(255,255,255,0.6);
        }
        .ps-counter {
          margin-top: 10px;
          color: rgba(255,255,255,0.5);
          font-size: 12px;
          letter-spacing: 1px;
        }
      `}</style>

      {/* Backdrop */}
      <div className="ps-overlay" onClick={onClose}>
        <div className="ps-box" onClick={e => e.stopPropagation()}>

          {/* Close */}
          <button className="ps-close" onClick={onClose} title="Close">✕</button>

          {/* Image */}
          <div className="ps-img-wrap">
            <img
              key={current}
              src={ALL_PHOTOS[current]}
              alt={`Photo ${current + 1}`}
              className={`ps-img ${slideClass}`}
            />

            {/* Left Arrow */}
            <button className="ps-arrow left" onClick={goPrev} title="Previous">&#8592;</button>
            {/* Right Arrow */}
            <button className="ps-arrow right" onClick={goNext} title="Next">&#8594;</button>
          </div>

          {/* Dot indicators */}
          <div className="ps-dots">
            {ALL_PHOTOS.map((_, i) => (
              <button
                key={i}
                className={`ps-dot${i === current ? ' active' : ''}`}
                onClick={() => {
                  if (i === current) return;
                  animate(i > current ? 'right' : 'left', i);
                }}
              />
            ))}
          </div>

          <div className="ps-counter">{current + 1} / {ALL_PHOTOS.length}</div>
        </div>
      </div>
    </>
  );
}
