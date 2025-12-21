# Portfolio Website

A modern, artistic portfolio website built with React and Tailwind CSS featuring stunning animations and interactive elements.

## Features

- 🎨 **Animated Spotlight Effect** - Cursor-following gradient spotlight
- 💎 **Glassmorphic Cards** - Beautiful glass-effect cards with 3D tilt on hover
- 🖥️ **Terminal-Style About** - Bio section with typewriter effect
- ⏱️ **Interactive Timeline** - Expandable experience timeline
- 🎯 **3D Project Cards** - Hover effects with technology overlays
- 📊 **Tech Stack Visualization** - Animated progress bars showing proficiency
- ✉️ **Modern Contact Form** - Floating send button with status feedback
- 🎭 **Dark Theme** - Navy background with cyan/teal accents

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Framer Motion
- Modern JavaScript (ES6+)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and visit \`http://localhost:5173\`

### Build for Production

\`\`\`bash
npm run build
\`\`\`

## Customization

### Color Scheme

The main colors can be customized in \`tailwind.config.js\`:

- Navy Dark: #0a192f
- Navy Light: #112240
- Accent Cyan: #64ffda
- Accent Teal: #00d9ff

### Content

Update the following components with your own content:

- \`src/components/Hero.jsx\` - Your name and intro
- \`src/components/About.jsx\` - Your bio and stats
- \`src/components/Experience.jsx\` - Your work experience
- \`src/components/Projects.jsx\` - Your projects
- \`src/components/TechStack.jsx\` - Your technical skills
- \`src/components/Contact.jsx\` - Your contact information

## Project Structure

\`\`\`
portfolio-website/
├── src/
│ ├── components/
│ │ ├── Sidebar.jsx
│ │ ├── Hero.jsx
│ │ ├── About.jsx
│ │ ├── Experience.jsx
│ │ ├── Projects.jsx
│ │ ├── TechStack.jsx
│ │ └── Contact.jsx
│ ├── App.jsx
│ ├── main.jsx
│ └── index.css
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
\`\`\`

## License

MIT License - feel free to use this template for your own portfolio!

## Credits

Created with ❤️ using React and Tailwind CSS
