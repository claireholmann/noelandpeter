import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="home-title">
          Noel <span className="amp-symbol">&</span> Peter
        </h1>
        <p className="home-subtitle">We're getting married!</p>
        
        <div className="home-nav">
          <Link to="/rsvp" className="nav-button rsvp-btn">
            RSVP
          </Link>
          <Link to="/registry" className="nav-button registry-btn">
            Registry
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;
