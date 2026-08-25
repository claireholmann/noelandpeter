import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import RSVP from './pages/RSVP';
import Registry from './pages/Registry';
import './App.css';

function AppHeader() {
  return (
    <header className="app-header">
      <nav className="app-nav" aria-label="Main navigation">
        <NavLink to="/" end className="app-nav-link">Home</NavLink>
        <NavLink to="/rsvp" className="app-nav-link">RSVP</NavLink>
        <NavLink to="/registry" className="app-nav-link">Registry</NavLink>
      </nav>
    </header>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/rsvp" element={<RSVP />} />
        <Route path="/registry" element={<Registry />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
