import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import RSVP from './pages/RSVP';
import Registry from './pages/Registry';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rsvp" element={<RSVP />} />
        <Route path="/registry" element={<Registry />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
