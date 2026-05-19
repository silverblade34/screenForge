import React from 'react';
import { Link } from 'react-router-dom';
import s from './LandingPage.module.css';

export default function LandingPage() {
  return (
    <div className={s.container}>
      <header className={s.header}>
        <div className={s.logo}>ScreenForge.studio</div>
      </header>
      
      <main className={s.main}>
        <section className={s.hero}>
          <h1 className={s.title}>Create Stunning App Visuals</h1>
          <p className={s.subtitle}>
            Professional mockup generation and cinematic device animations in your browser.
          </p>
          <div className={s.actions}>
            <Link to="/mockup-studio" className={s.primaryBtn}>
              Mockup Studio
            </Link>
            <Link to="/device-animation" className={s.secondaryBtn}>
              Device Animation
            </Link>
          </div>
        </section>

        <section className={s.preview}>
          <div className={s.previewCard}>
            {/* The user requested to add a screenshot here */}
            <img 
              src="/mockup-placeholder.png" 
              alt="ScreenForge Studio Interface" 
              className={s.previewImage}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
