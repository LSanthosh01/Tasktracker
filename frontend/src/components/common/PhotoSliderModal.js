import React, { useEffect } from 'react';
import photo from '../../assets/ph1.jpeg';

export default function PhotoSliderModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes psFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes psScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .ps-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          animation: psFadeIn 0.25s ease-out;
        }

        .ps-card {
          background: #ffffff;
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 100%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 36px 28px;
          animation: psScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Custom Scrollbar for premium feel */
        .ps-card::-webkit-scrollbar {
          width: 6px;
        }
        .ps-card::-webkit-scrollbar-track {
          background: transparent;
        }
        .ps-card::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .ps-card::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .ps-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #f1f5f9;
          border: none;
          color: #64748b;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          outline: none;
        }
        .ps-close-btn:hover {
          background: #fee2e2;
          color: #ef4444;
          transform: rotate(90deg);
        }

        .ps-photo-wrapper {
          width: 260px;
          height: 260px;
          border-radius: 20px;
          overflow: hidden;
          border: 4px solid #ffffff;
          box-shadow: 0 10px 25px -5px rgba(79, 70, 229, 0.3), 0 8px 10px -6px rgba(79, 70, 229, 0.3);
          margin-bottom: 20px;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .ps-photo-wrapper:hover {
          transform: scale(1.05);
        }

        .ps-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .ps-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          text-align: center;
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
        }

        .ps-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #4f46e5;
          margin-bottom: 24px;
          text-align: center;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          letter-spacing: 0.5px;
        }

        .ps-divider {
          width: 100%;
          height: 1px;
          background: #e2e8f0;
          margin-bottom: 24px;
        }

        .ps-about-heading {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          align-self: flex-start;
          margin: 0 0 12px 0;
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          position: relative;
          display: inline-block;
        }
        .ps-about-heading::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: -4px;
          width: 28px;
          height: 3px;
          background: #4f46e5;
          border-radius: 2px;
        }

        .ps-bio {
          font-size: 14.5px;
          line-height: 1.65;
          color: #475569;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          text-align: justify;
          margin: 0 0 16px 0;
        }
        .ps-bio:last-of-type {
          margin-bottom: 0;
        }
      `}</style>

      <div className="ps-overlay" onClick={onClose}>
        <div className="ps-card" onClick={e => e.stopPropagation()}>
          <button className="ps-close-btn" onClick={onClose} title="Close">✕</button>
          
          <div className="ps-photo-wrapper">
            <img src={photo} alt="Naveen Lawrence" className="ps-photo" />
          </div>

          <h2 className="ps-title">Naveen Lawrence</h2>
          <div className="ps-subtitle">Technical Trainer &mdash; Magic Bus India Organisation</div>
          
          <div className="ps-divider" />

          <h3 className="ps-about-heading">About</h3>
          
          <p className="ps-bio">
            AI Trainer with hands-on experience in Generative AI, Large Language Models (LLMs), Prompt Engineering, AI-powered automation, and technology training. Experienced in conducting workshops, developing learning content, mentoring learners, and implementing AI solutions for productivity and workflow optimization. Skilled in translating complex AI concepts into practical, business-focused applications and driving technology adoption through interactive training programs.
          </p>

          <p className="ps-bio">
            Successfully trained more than 5000+ students and job seekers across various domains, helping them develop industry-relevant digital and AI skills. Contributed to the career advancement of over 1000 learners through training, mentorship, employability enhancement, and placement support initiatives.
          </p>

          <p className="ps-bio">
            Additionally involved in developing AI-based applications and digital solutions, including the NAV Task Tracker platform, to streamline task management, workflow automation, employee productivity tracking, and organizational reporting. Passionate about leveraging AI and emerging technologies to create scalable learning experiences and drive digital transformation and also a speaker at leading tech spaces and tech fest.
          </p>
        </div>
      </div>
    </>
  );
}
