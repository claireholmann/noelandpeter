import { Link } from 'react-router-dom';
import './Registry.css';

function Registry() {
  const registries = [
    {
      name: 'Our Registry',
      url: 'https://www.myregistry.com/wedding-registry/noel-keen-and-peter-semprevivo-chicago-il/5503306/giftlist?utm_source=sendinblue&utm_campaign=TR-V+Shipping+Info+Request+A', 
    },
  ];

  return (
    <div className="registry-container">
      <div className="page-hero">
        <h1 className="page-hero-title">Our Registry</h1>
        <div className="page-hero-divider" />
        <div className="registry-content">
          <p className="registry-intro">
            Your presence at our wedding is the greatest gift, but if you'd like to give something, 
            here are a few items we love:
          </p>

          <div className="registry-grid">
            {registries.map((registry, idx) => (
              <a
                key={idx}
                href={registry.url}
                className="registry-card"
                target="_blank"
                rel="noopener noreferrer"
              >
                <p className="registry-cta">View Registry →</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Registry;
