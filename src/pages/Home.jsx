import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="paper-card">
          <div className="title-block">
            <p className="invitation-kicker">You are cordially invited to the wedding of</p>
            <h1 className="home-title">
              Noel <span className="amp-symbol">&amp;</span> Peter
            </h1>
            <p className="home-subtitle">April 2, 2027 • Chicago, Illinois</p>
          </div>
        </div>

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
