import { Link } from 'react-router-dom';
import dog from '../assets/dog.jpeg';
import lamp from '../assets/lamp.jpg';
import belle from '../assets/belle.jpg';
import fam from '../assets/fam.jpg';
import hug from '../assets/hug.jpg';
import './Home.css';

const PHOTOS = [
  { src: dog, alt: 'Noel and Peter with their dog' },
  { src: lamp, alt: 'Noel and Peter at their engagement spot' },
  { src: belle, alt: 'Noel, Peter and Belle' },
  { src: fam, alt: 'Noel, Peter and Belle' },
  { src: hug, alt: 'Noel and Peter hugging' },

];

const LOOP_COPIES = 4;

function PhotoCarousel() {
  // Photos are repeated so the scrolling track can loop seamlessly, even on wide screens
  const loopedPhotos = Array.from({ length: LOOP_COPIES }, () => PHOTOS).flat();

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
