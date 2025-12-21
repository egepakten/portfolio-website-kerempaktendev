Redesign the Portfolio page with modern, cohesive styling. Fix the following issues and implement these improvements:

## Global Issues to Fix:
1. Inconsistent vertical spacing between sections - standardize to 80px between major sections
2. The grid background pattern is too prominent and distracting - make it more subtle (reduce opacity to 0.03)
3. Cards lack depth and feel flat - add subtle shadows and hover states

## Section 1: Hero Section
Current: Plain text with no visual hierarchy
Changes needed:
- Add a gradient text effect on the name "Kerem Ege Pakten" (use brand green #22c55e to #16a34a)
- Add a subtle animated typing effect or gradient border around the hero card
- Increase padding inside the hero card to 48px
- Add a professional headshot/avatar placeholder on the right side (circular, 150px)
- Make "View My Work" button filled with green (#22c55e), "Get In Touch" as outline
- Add subtle floating animation to the geometric shapes in background

## Section 2: About Me (Terminal)
Current: Terminal looks disconnected, skill bars are basic
Changes needed:
- Add proper terminal window chrome (three dots: red, yellow, green) with more realistic styling
- Add a subtle glow/shadow around the terminal (box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15))
- Make the terminal background slightly darker (#1a1a2e or #0d1117)
- Animate the skill bars on scroll (fill from 0% to target)
- Add monospace font for terminal text (use 'JetBrains Mono' or 'Fira Code')
- Add blinking cursor effect after the last line

## Section 3: Stats Cards
Current: Three separate plain cards stacked vertically
Changes needed:
- Change to horizontal layout (3 cards in a row on desktop)
- Add icons above each number (rocket for projects, calendar for years, target for commitment)
- Add count-up animation on scroll (numbers animate from 0)
- Add gradient border on hover
- Reduce card height, make them more compact
- Add subtle background pattern or gradient to each card

## Section 4: Experience Timeline
Current: Basic timeline with expandable sections
Changes needed:
- Add a visible vertical timeline line on the left (2px, gradient green)
- Add circular dots on the timeline for each entry (12px, filled green)
- Animate the line drawing on scroll
- Company logos should have consistent sizing (48px x 48px) with white background and subtle border
- Tech tags should have consistent padding (8px 16px) and subtle hover effect
- Add smooth expand/collapse animation (not instant)
- Date badges should be more prominent (pill shaped, light green background)

## Section 5: Featured Project
Current: Broken image, code snippet feels disconnected
Changes needed:
- Fix the image loading (add proper fallback/placeholder)
- Add a device mockup frame around the screenshot (browser window or phone frame)
- Code snippet should have syntax highlighting (use Prism.js or highlight.js theme)
- Add line numbers to code snippet
- Add "View Live" and "View Code" buttons below the project
- Status badge (PRODUCTION) should pulse subtly to draw attention

## Section 6: Tech Stack
Current: Hover state is broken (text overlapping), cards feel basic
Changes needed:
- FIX THE HOVER BUG: On hover, the "Click to see projects" text overlaps with existing text. Use proper state management - hide the count and category on hover, show the CTA instead
- Add smooth transition (transform: scale(1.02) on hover)
- Icons should be larger (48px) and centered
- Add subtle gradient background on hover
- Clicking should open a modal or expand to show project list, not navigate away
- Add tooltip showing project names on hover

## General Styling Tokens to Use:
- Border radius: 12px for cards, 8px for buttons, 6px for tags
- Shadows: 
  - Default: 0 1px 3px rgba(0,0,0,0.1)
  - Hover: 0 10px 40px rgba(0,0,0,0.12)
- Transitions: all 0.3s cubic-bezier(0.4, 0, 0.2, 1)
- Font sizes: Keep current but ensure line-height is 1.6 for body text
- Green accent: #22c55e (primary), #16a34a (hover), #dcfce7 (light bg)

## Animations to Add:
- Fade-in-up on scroll for each section (use Intersection Observer)
- Stagger animation for card grids (each card appears 100ms after previous)
- Smooth parallax on hero section background shapes

## Responsive Fixes:
- On mobile, stats cards should stack vertically with less padding
- Terminal should be full-width on mobile with horizontal scroll for long lines
- Tech stack grid should be 2 columns on tablet, 1 on mobile