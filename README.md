# Noel & Peter Wedding Website

A simple, elegant wedding website built with React and Vite.

## Features

- **Home Page**: Welcome screen with navigation to RSVP and Registry
- **RSVP Form**: Guest invitation lookup and RSVP submission
- **Registry Page**: Links to gift registries
- **Light Green Color Scheme**: Elegant, natural aesthetic

## Color Scheme

- **Primary Green**: #a8d5ba
- **Light Green**: #d4e8df
- **Pale Green**: #e8f3ed
- **Dark Green**: #5a8f6f

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Configuration

### RSVP Backend

The RSVP form is configured to use a Google Apps Script endpoint. You'll need to:

1. Create a Google Apps Script with a deployment that handles RSVP submissions
2. Update the `SCRIPT_URL` in `src/pages/RSVP.jsx` with your actual deployment URL
3. The script should handle:
   - `action=lookup&q=<name>` - Search for guest invitations
   - `action=submit` - Submit RSVP responses

### Registry Links

Update the registry URLs in `src/pages/Registry.jsx` with your actual registry links.

## Project Structure

```
src/
├── pages/
│   ├── Home.jsx      # Home page
│   ├── Home.css      # Home styles
│   ├── RSVP.jsx      # RSVP form
│   ├── RSVP.css      # RSVP styles
│   ├── Registry.jsx  # Registry page
│   └── Registry.css  # Registry styles
├── App.jsx           # Main app component with routing
├── App.css           # Global styles and color variables
└── main.jsx          # React entry point
```

## Customization

All colors are defined as CSS variables in `src/App.css`. Update the `:root` variables to change the color scheme.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive

## License

Private - For Noel & Peter's wedding use only
