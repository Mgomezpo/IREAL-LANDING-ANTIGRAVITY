# Scrolling Motion Bundle

This folder contains the notebook scrolling motion section ready to copy into another project.

Contents:
- components/NotebookScroll.tsx
- public/notebook-frames
- styles/scrolling-motion.css

Quick install (Next.js / React + Tailwind):
1. Copy components/NotebookScroll.tsx into your project (same path or wherever you keep components).
2. Copy public/notebook-frames into your project's public/ folder.
3. Ensure framer-motion is installed: npm i framer-motion
4. Import and render <NotebookScroll /> in your page.
5. Add styles/scrolling-motion.css to your global CSS (optional but recommended).

Notes:
- This component uses Tailwind utility classes. Keep Tailwind or replace the classes with your own CSS.
- The image path is /notebook-frames and expects frame_1.jpg..frame_300.jpg.
- The component dispatches a "nav-visibility" CustomEvent while scrolling. If your project does not listen to it, it is safe to ignore.
