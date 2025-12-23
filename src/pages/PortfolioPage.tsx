import { Layout } from '@/components/layout/Layout';
import { useState, useEffect } from 'react';
import Sidebar from '@/portfolio-website/src/components/Sidebar';
import Hero from '@/portfolio-website/src/components/Hero';
import About from '@/portfolio-website/src/components/About';
import Experience from '@/portfolio-website/src/components/Experience';
import Contact from '@/portfolio-website/src/components/Contact';

const PortfolioPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Layout>
      <div className="relative min-h-screen bg-navy-dark text-gray-900 overflow-hidden">
        {/* Animated Spotlight Effect */}
        <div
          className="pointer-events-none fixed inset-0 z-30 transition duration-300"
          style={{
            background: `radial-gradient(600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(22, 163, 74, 0.1), transparent 80%)`,
          }}
        />

        {/* Background Pattern - Subtle */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0f2e0_1px,transparent_1px),linear-gradient(to_bottom,#e0f2e0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.03] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        </div>

        <Sidebar />

        <main className="relative z-10 ml-0 lg:ml-20 space-y-20">
          <Hero />
          <About />
          <Experience />
          <Contact />
        </main>
      </div>
    </Layout>
  );
};

export default PortfolioPage;

