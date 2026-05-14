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
  const [direction, setDirection] = useState(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) setCurrent(startIndex);
  }, [isOpen, startIndex]);

  const animate = (dir, nextIndex) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrent(nextIndex);
      setDirection(null);
      setAnimating(false);
    }, 320);
  };

  const goNext = useCallback(() => {
    const next = (current + 1) % ALL_PHOTOS.length;
    animate('right', next);
  // eslint-disable-next-line
  }, [current, animating]);

  const goPrev = useCallback(() => {
    const prev = (current - 1 + ALL_PHOTOS.length) % ALL_PHOTOS.length;
    animate('left', prev);
  // eslint-disable-next-line
  }, [current, animating]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // eslint-disable-next-line
  }, [isOpen, goNext, goPrev]);

  if (!isOpen) return null;

  const slideClass = animating
    ? direction === 'right' ? 'ps-slide-out-left' : 'ps-slide-out-right'
    : 'ps-slide-in';

  return (
    <>
      <style>{`
        @keyframes psInRight  { from { transform: translateX(60px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes psInLeft   { from { transform: translateX(-60px);opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes psOutLeft  { from { transform: translateX(0); opacity:1; } to { transform: translateX(-60px);opacity:0; } }
        @keyframes psOutRight { from { transform: translateX(0); opacity:1; } to { transform: translateX(60px); opacity:0; } }
        @keyframes psFadeIn   { from { opacity:0; } to { opacity:1; } }

        .ps-img.ps-slide-in       { animation: psInRight  0.32s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.ps-slide-in-left  { animation: psInLeft   0.32s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.ps-slide-out-left { animation: psOutLeft  0.32s cubic-bezier(.4,0,.2,1) forwards; }
        .ps-img.ps-slide-out-right{ animation: psOutRight 0.32s cubic-bezier(.4,0,.2,1) forwards; }

        /* Overlay */
        .ps-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.85);
          display: flex; align-items: center; justify-content: center;
          animation: psFadeIn 0.2s ease;
        }

        /* Outer box — column layout */
        .ps-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: relative;
          max-width: 96vw;
        }

        /* Row containing left-arrow | image | right-arrow */
        .ps-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        /* Image wrapper — shrinks to fit the photo exactly */
        .ps-img-wrap {
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 70px rgba(0,0,0,0.75);
          line-height: 0; /* kills inline gap below img */
          flex-shrink: 0;
        }

        /* The actual photo */
        .ps-img {
          display: block;
          max-width: min(70vw, 460px);
          max-height: 78vh;
          width: auto;
          height: auto;
          border-radius: 18px;
        }

        /* Arrow buttons — always beside the image, fully visible */
        .ps-arrow {
          flex-shrink: 0;
          width: 52px; height: 52px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          color: #fff;
          font-size: 22px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s, transform 0.18s;
          outline: none;
        }
        .ps-arrow:hover {
          background: rgba(108,99,255,0.75);
          border-color: rgba(108,99,255,0.9);
          transform: scale(1.12);
        }
        .ps-arrow:active { transform: scale(0.96); }

        /* Close button — top-right corner of ps-box */
        .ps-close {
          position: absolute;
          top: -14px; right: -14px;
          width: 38px; height: 38px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(10px);
          color: #fff; font-size: 18px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, transform 0.18s;
          z-index: 10; outline: none;
        }
        .ps-close:hover {
          background: rgba(255,70,70,0.75);
          border-color: rgba(255,70,70,0.9);
          transform: scale(1.12);
        }

        /* Dot indicators */
        .ps-dots {
          display: flex; gap: 8px; align-items: center;
        }
        .ps-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: rgba(255,255,255,0.3);
          border: none; outline: none; padding: 0; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        .ps-dot.active {
          background: #6c63ff; transform: scale(1.45);
        }
        .ps-dot:hover:not(.active) { background: rgba(255,255,255,0.6); }

        /* Counter */
        .ps-counter {
          color: rgba(255,255,255,0.45);
          font-size: 12px;
          letter-spacing: 1px;
          margin-top: -4px;
        }
      `}</style>

      {/* Backdrop — click to close */}
      <div className="ps-overlay" onClick={onClose}>
        <div className="ps-box" onClick={e => e.stopPropagation()}>

          {/* Close ✕ */}
          <button className="ps-close" onClick={onClose} title="Close">✕</button>

          {/* ← Image → row */}
          <div className="ps-row">
            <button className="ps-arrow" onClick={goPrev} title="Previous">&#8592;</button>

            <div className="ps-img-wrap">
              <img
                key={current}
                src={ALL_PHOTOS[current]}
                alt={`Photo ${current + 1}`}
                className={`ps-img ${slideClass}`}
              />
            </div>

            <button className="ps-arrow" onClick={goNext} title="Next">&#8594;</button>
          </div>

          {/* Dots */}
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
