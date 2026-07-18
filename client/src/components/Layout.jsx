import React from 'react';

import Navigation from './Navigation';

export default function Layout({ children }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Navigation />
        <div className="waveform" aria-hidden="true">
          <span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      </header>
      <main className="container py-4 py-lg-5">{children}</main>
      <footer className="site-footer">
        <div className="container">AmbiSense · IFT3225 · Phase 2</div>
      </footer>
    </div>
  );
}
