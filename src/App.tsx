import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import DeviceAnimationPage from './pages/device-animation/page';
import MockupStudioPage from './pages/mockup-studio/page';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/device-animation" element={<DeviceAnimationPage />} />
        <Route path="/mockup-studio" element={<MockupStudioPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
