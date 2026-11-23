import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import lamp from '../assets/lamp.jpg';
import belle from '../assets/belle.jpg';
import fam from '../assets/fam.jpg';
import hug from '../assets/hug.jpg';
import look from '../assets/look.JPG';
import armhold from '../assets/armhold.JPG';
import './Home.css';

const PHOTOS = [
  { src: fam, alt: 'Noel, Peter and Belle' },
  { src: hug, alt: 'Noel and Peter hugging' },
  { src: armhold, alt: 'Noel and Peter holding arms' },
  { src: lamp, alt: 'Noel and Peter at their engagement spot' },
  { src: belle, alt: 'Noel, Peter and Belle' },
  { src: look, alt: 'Noel and Peter looking at each other' },
];

const LOOP_COPIES = 4;

function PhotoCarousel() {
  // Photos are repeated so the scrolling track can loop seamlessly, even on wide screens
  const loopedPhotos = Array.from({ length: LOOP_COPIES }, () => PHOTOS).flat();
  const [loadedCount, setLoadedCount] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  // The scroll distance is a percentage of the track width, which is only correct once the
  // images have loaded. Starting the animation earlier makes it stall on mobile first loads.
  const ready = timedOut || loadedCount >= loopedPhotos.length;
  const markLoaded = () => setLoadedCount((count) => count + 1);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="photo-carousel" role="region" aria-label="Photos of Noel and Peter">
      <div className={`photo-track${ready ? ' is-ready' : ''}`}>
        {loopedPhotos.map((photo, i) => (
          <img
            key={i}
            src={photo.src}
            alt={i < PHOTOS.length ? photo.alt : ''}
            aria-hidden={i >= PHOTOS.length}
            className="photo-slide"
            onLoad={markLoaded}
            onError={markLoaded}
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
