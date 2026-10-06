import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="title-block">
          <svg
            className="skyline"
            viewBox="0 0 1000 260"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinejoin="round"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <g transform="translate(90,0) scale(0.8,1)">
            {/* birds */}
            <path d="M150,40 Q155,33 160,40 Q165,33 170,40" />
            <path d="M670,30 Q675,23 680,30 Q685,23 690,30" />
            {/* clouds */}
            <circle cx="340" cy="45" r="10" />
            <circle cx="355" cy="40" r="14" />
            <circle cx="370" cy="45" r="10" />
            <circle cx="810" cy="55" r="9" />
            <circle cx="824" cy="50" r="12" />
            <circle cx="838" cy="55" r="9" />

            {/* generic buildings, left side */}
            <path d="M10,210 L10,165 L38,165 L38,210 M18,172 L18,204 M30,172 L30,204" />
            <path d="M42,210 L42,140 L64,140 L64,210 M49,147 L49,204 M57,147 L57,204" />
            {/* domed building */}
            <path d="M68,210 L68,155 A18,18 0 0 1 104,155 L104,210 M76,162 L76,204 M96,162 L96,204" />
            <path d="M108,210 L108,125 L128,125 L128,210 M114,132 L114,204 M122,132 L122,204" />
            {/* Chicago Water Tower */}
            <path d="M132,210 L132,155 L148,155 L148,210 M132,155 L140,135 L148,155 M140,135 L140,128 M136,165 L144,165 M136,180 L144,180 M136,195 L144,195" />
            <path d="M152,210 L152,115 L178,115 L178,210 M158,122 L158,204 M166,122 L166,204 M172,122 L172,204" />
            <path d="M182,210 L182,95 L206,95 L206,210 M188,102 L188,204 M196,102 L196,204" />

            {/* Willis Tower — bundled setback towers + twin antennas + flagpole */}
            <path d="M212,210 L212,60 L277,60 L277,210 M222,60 L222,35 L267,35 L267,60 M232,35 L232,15 L257,15 L257,35 M240,15 L240,5 M252,15 L252,5 M218,67 L218,204 M226,67 L226,204 M263,67 L263,204 M271,67 L271,204 M207,20 L207,5 M207,5 L215,8" />

            <path d="M280,210 L280,120 L302,120 L302,210 M286,127 L286,204 M294,127 L294,204" />

            {/* John Hancock Center — tapered trapezoid + twin antennas + facade bracing */}
            <path d="M305,210 L360,210 L342,65 L323,65 Z M329,65 L329,42 M336,65 L336,42 M311,150 L354,95 M311,95 L354,150" />

            <path d="M365,210 L365,130 L389,130 L389,210 M371,137 L371,204 M383,137 L383,204" />
            <path d="M392,210 L392,110 L422,110 L422,210 M398,117 L398,204 M408,117 L408,204 M416,117 L416,204" />
            <path d="M426,210 L426,150 L448,150 L448,210 M432,157 L432,204 M442,157 L442,204" />

            {/* Ferris wheel (Navy Pier) */}
            <path d="M465,210 L500,150 L535,210" />
            <circle cx="500" cy="150" r="50" />
            <circle cx="500" cy="150" r="3" />
            <path d="M500,100 L500,200 M450,150 L550,150 M464,114 L536,186 M464,186 L536,114" />
            <circle cx="500" cy="100" r="4" />
            <circle cx="500" cy="200" r="4" />
            <circle cx="450" cy="150" r="4" />
            <circle cx="550" cy="150" r="4" />
            <circle cx="464" cy="114" r="4" />
            <circle cx="536" cy="186" r="4" />
            <circle cx="464" cy="186" r="4" />
            <circle cx="536" cy="114" r="4" />

            <path d="M565,210 L565,140 L591,140 L591,210 M571,147 L571,204 M579,147 L579,204" />
            <path d="M595,210 L595,120 L627,120 L627,210 M601,127 L601,204 M609,127 L609,204 M617,127 L617,204" />
            <path d="M632,210 L632,155 L656,155 L656,210 M638,162 L638,204 M646,162 L646,204" />
            <path d="M660,210 L660,135 L688,135 L688,210 M666,142 L666,204 M674,142 L674,204 M682,142 L682,204" />
            <path d="M692,210 L692,165 L714,165 L714,210 M698,172 L698,204" />
            <path d="M718,210 L718,110 L752,110 L752,210 M726,110 L726,98 L744,98 L744,110 M724,117 L724,204 M732,117 L732,204 M740,117 L740,204" />
            <path d="M756,210 L756,150 L780,150 L780,210 M762,157 L762,204" />
            <path d="M784,210 L784,170 L812,170 L812,210 M790,177 L790,204 M800,177 L800,204" />
            <path d="M816,210 L816,140 L838,140 L838,210 M822,147 L822,204" />
            <path d="M842,210 L842,155 L872,155 L872,210 M848,162 L848,204 M858,162 L858,204" />
            <path d="M876,210 L876,120 L900,120 L900,210 M882,127 L882,204 M890,127 L890,204" />
            <path d="M904,210 L904,145 L938,145 L938,210 M910,152 L910,204 M920,152 L920,204" />
            <path d="M942,210 L942,160 L968,160 L968,210 M948,167 L948,204" />

            {/* trees */}
            <path d="M250,210 L250,200 M258,210 L258,200" />
            <circle cx="254" cy="192" r="11" />
            <path d="M635,210 L635,200" />
            <circle cx="635" cy="192" r="11" />
            <path d="M800,210 L800,200" />
            <circle cx="800" cy="192" r="11" />

            {/* Cloud Gate "the Bean" */}
            <path d="M452,207 C452,198 462,195 470,197 C478,195 488,198 488,207 C488,213 478,210 470,209 C462,210 452,213 452,207" />
            </g>

            {/* ground line */}
            <path d="M0,210 L1000,210" />

            {/* bridge deck with railing ticks */}
            <path d="M60,222 L940,222" />
            <path d="M80,222 L80,230 M110,222 L110,230 M140,222 L140,230 M170,222 L170,230 M200,222 L200,230 M230,222 L230,230 M260,222 L260,230 M290,222 L290,230 M320,222 L320,230 M350,222 L350,230 M380,222 L380,230 M410,222 L410,230 M440,222 L440,230 M470,222 L470,230 M500,222 L500,230 M530,222 L530,230 M560,222 L560,230 M590,222 L590,230 M620,222 L620,230 M650,222 L650,230 M680,222 L680,230 M710,222 L710,230 M740,222 L740,230 M770,222 L770,230 M800,222 L800,230 M830,222 L830,230 M860,222 L860,230 M890,222 L890,230 M920,222 L920,230" />
            <path d="M118,222 L118,255 M134,222 L134,255 M118,230 L134,230 M118,240 L134,240 M110,222 L142,222 L142,210 L136,202 L116,202 L110,210 Z" />
            <path d="M846,222 L846,255 M862,222 L862,255 M846,230 L862,230 M846,240 L862,240 M838,222 L870,222 L870,210 L864,202 L844,202 L838,210 Z" />

            {/* water ripples */}
            <path d="M0,240 Q25,235 50,240 T100,240 T150,240 T200,240 T250,240 T300,240 T350,240 T400,240 T450,240 T500,240 T550,240 T600,240 T650,240 T700,240 T750,240 T800,240 T850,240 T900,240 T950,240 T1000,240" />
            <path d="M0,252 Q25,248 50,252 T100,252 T150,252 T200,252 T250,252 T300,252 T350,252 T400,252 T450,252 T500,252 T550,252 T600,252 T650,252 T700,252 T750,252 T800,252 T850,252 T900,252 T950,252 T1000,252" />
          </svg>
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
  );
}

export default Home;
