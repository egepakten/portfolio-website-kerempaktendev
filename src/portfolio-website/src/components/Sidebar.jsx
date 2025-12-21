import { useState, useEffect } from "react";

const Sidebar = () => {
  const [activeSection, setActiveSection] = useState("home");

  const navItems = [
    { id: "home", icon: "◆", label: "Home" },
    { id: "about", icon: "◇", label: "About" },
    { id: "experience", icon: "◈", label: "Experience" },
    { id: "projects", icon: "◉", label: "Projects" },
    { id: "tech", icon: "◊", label: "Tech" },
    { id: "contact", icon: "◐", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => document.getElementById(item.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(navItems[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed left-0 top-0 h-screen w-20 bg-navy-light/50 backdrop-blur-lg border-r border-accent-cyan/10 z-50 hidden lg:flex flex-col items-center justify-center">
      <div className="flex flex-col gap-8">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={`group relative flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-300 ${
              activeSection === item.id
                ? "bg-accent-cyan/20 text-accent-cyan scale-110"
                : "text-gray-600 hover:text-accent-cyan hover:bg-accent-cyan/10"
            }`}
            aria-label={item.label}
          >
            <span className="text-2xl">{item.icon}</span>
            <div className="absolute left-full ml-4 px-3 py-1 bg-navy-light border border-accent-cyan/20 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* Decorative Line */}
      <div className="absolute bottom-8 w-[2px] h-20 bg-gradient-to-t from-accent-cyan to-transparent" />
    </nav>
  );
};

export default Sidebar;
