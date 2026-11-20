import { Link } from 'react-router-dom';
import banff from '../assets/banff.jpg';
import boston from '../assets/boston.jpg';
import bulls from '../assets/bulls.jpg';
import canada from '../assets/canada.jpg';
import './Home.css';

const PHOTOS = [
  { src: banff, alt: 'Noel and Peter in Banff' },
  { src: boston, alt: 'Noel and Peter in Boston' },
  { src: bulls, alt: 'Noel and Peter at a Bulls game' },
  { src: canada, alt: 'Noel and Peter in Canada' },
];

function PhotoCarousel() {
  // Photos are doubled so the scrolling track can loop seamlessly
  const loopedPhotos = [...PHOTOS, ...PHOTOS];

  return (
    <div className="photo-carousel" role="region" aria-label="Photos of Noel and Peter">
      <div className="photo-track">
        {loopedPhotos.map((photo, i) => (
          <img
            key={i}
            src={photo.src}
            alt={i < PHOTOS.length ? photo.alt : ''}
            aria-hidden={i >= PHOTOS.length}
            className="photo-slide"
          />
        ))}
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="home-page">
      <PhotoCarousel />
      <div className="home-container">
        <div className="home-content">
          <div className="title-block">
            <p className="invitation-kicker">You are cordially invited to the wedding of</p>
            <h1 className="home-title">
              <span className="home-name">Noel</span>{' '}
              <span className="amp-symbol">&amp;</span>{' '}
              <span className="home-name">Peter</span>
            </h1>
            <p className="home-subtitle">April 2, 2027 • Chicago, Illinois</p>
            <div className="home-divider" />
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
    </div>
  );
}

export default Home;
