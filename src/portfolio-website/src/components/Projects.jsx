import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "../data/projects";

const Projects = () => {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState([]);

  // Get all unique technologies
  const allTechnologies = useMemo(() => {
    const techSet = new Set();
    projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort();
  }, []);

  // Filter projects based on selected tags
  const filteredProjects = useMemo(() => {
    if (selectedFilters.length === 0) return projects;
    return projects.filter((project) =>
      selectedFilters.every((filter) => project.technologies.includes(filter))
    );
  }, [selectedFilters]);

  // Toggle filter selection
  const toggleFilter = (tech) => {
    setSelectedFilters((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Navigation functions
  const nextProject = () => {
    setCurrentProjectIndex((prev) =>
      prev === filteredProjects.length - 1 ? 0 : prev + 1
    );
  };

  const prevProject = () => {
    setCurrentProjectIndex((prev) =>
      prev === 0 ? filteredProjects.length - 1 : prev - 1
    );
  };

  // Reset index when filters change
  useMemo(() => {
    setCurrentProjectIndex(0);
  }, [selectedFilters]);

  const currentProject = filteredProjects[currentProjectIndex];

  return (
    <section className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20" id="projects">
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Section Header */}
          <h2 className="text-4xl lg:text-5xl font-bold mb-12 flex items-center">
            <span className="text-primary font-mono mr-4">03.</span>
            Projects
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>

          {/* Technology Filter Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 mb-10"
          >
            {allTechnologies.map((tech) => (
              <button
                key={tech}
                onClick={() => toggleFilter(tech)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  selectedFilters.includes(tech)
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white text-gray-600 hover:bg-primary/10 hover:text-primary border border-gray-200 hover:border-primary/30"
                }`}
              >
                {tech}
              </button>
            ))}
            {selectedFilters.length > 0 && (
              <button
                onClick={() => setSelectedFilters([])}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
              >
                Clear All ✕
              </button>
            )}
          </motion.div>

          {/* Project Carousel */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 text-lg mb-4">
                No projects found with the selected technologies
              </p>
              <button
                onClick={() => setSelectedFilters([])}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="relative">
              {/* Project Counter */}
              <div className="text-center mb-6 mt-6">
                <span className="text-primary font-mono text-sm bg-primary/10 px-4 py-2 rounded-full">
                  Project {currentProjectIndex + 1} of {filteredProjects.length}
                </span>
              </div>

              {/* Carousel Container */}
            {/* Carousel Container - Added padding for buttons */}
            <div className="relative px-16 lg:px-20">
              {/* Navigation Buttons */}
              {filteredProjects.length > 1 && (
                <>
                  <button
                    onClick={prevProject}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group"
                    aria-label="Previous project"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={nextProject}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-100 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 group"
                    aria-label="Next project"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </>
              )}
                              
          

                {/* Project Card */}
                <AnimatePresence mode="wait">
                  {currentProject && (
                    <motion.div
                      key={currentProjectIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100"
                    >
                      {/* Two Column Layout */}
                      <div className="flex flex-col lg:flex-row">
                        {/* Left: Project Image */}
                        {/* Left: Project Image */}
                        <div className="lg:w-1/3 relative">
                          <a
                          href={currentProject.githubLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-48 lg:h-72 bg-gradient-to-br from-primary/5 to-primary/10 relative overflow-hidden group cursor-pointer"
                        >
                          {currentProject.demoImage ? (
                            <img
                              src={currentProject.demoImage}
                              alt={`${currentProject.title} screenshot`}
                              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-4xl">🚀</div>
                            </div>
                          )}
                          
                          {/* Hover Overlay - Now with green tint */}
                          <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <div className="text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                                <svg className="w-7 h-7 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-white text-sm font-semibold">
                                View on GitHub →
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3 z-10">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-lg ${
                                currentProject.status === "PRODUCTION"
                                  ? "bg-primary text-white"
                                  : currentProject.status === "IN DEVELOPMENT"
                                  ? "bg-orange-500 text-white animate-pulse"
                                  : "bg-yellow-500 text-white"
                              }`}
                            >
                              {currentProject.status}
                            </span>
                          </div>
                        </a>
                        </div>

                        {/* Right: Project Info */}
                        <div className="lg:w-3/5 flex flex-col">
                          {/* Project Header */}
                          <div className="p-6 lg:p-8 border-b border-gray-100">
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                  {currentProject.title}
                                </h3>
                                <p className="text-gray-600 leading-relaxed">
                                  {currentProject.description}
                                </p>
                              </div>
                              <span className="text-sm text-primary font-mono bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                                {currentProject.year}
                              </span>
                            </div>
                            
                            {/* Tech Tags */}
                            <div className="flex flex-wrap gap-2">
                              {currentProject.technologies.map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-sm font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Code Preview */}
                          <div className="flex-1 flex flex-col">
                            {/* Code Header */}
                            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1.5">
                                  <div className="w-3 h-3 rounded-full bg-red-500" />
                                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                  <div className="w-3 h-3 rounded-full bg-green-500" />
                                </div>
                                <span className="text-xs text-gray-400 font-mono">
                                  {currentProject.title.toLowerCase().replace(/\s+/g, "-")}.
                                  {currentProject.technologies.includes("Python") ? "py" : "js"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {currentProject.liveLink && (
                                  <a
                                    href={currentProject.liveLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    title="View Live"
                                  >
                                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                )}
                                <a
                                  href={currentProject.githubLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  title="View on GitHub"
                                >
                                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                                  </svg>
                                </a>
                              </div>
                            </div>
                            
                            {/* Code Content */}
                            <div className="flex-1 bg-gray-950 p-6 font-mono text-sm overflow-auto max-h-[300px]">
                              <pre className="text-gray-300 leading-relaxed">
                                <code>
                                  {currentProject.code && currentProject.code.split('\n').map((line, i) => (
                                    <div key={i} className="flex">
                                      <span className="text-gray-600 select-none w-8 text-right mr-4">{i + 1}</span>
                                      <span className="flex-1">
                                        {line.includes('def ') || line.includes('const ') || line.includes('function') ? (
                                          <span>
                                            <span className="text-purple-400">{line.split(' ')[0]} </span>
                                            <span className="text-primary">{line.split(' ').slice(1).join(' ')}</span>
                                          </span>
                                        ) : line.includes('return') ? (
                                          <span className="text-purple-400">{line}</span>
                                        ) : line.includes('#') || line.includes('//') ? (
                                          <span className="text-gray-500">{line}</span>
                                        ) : line.includes('"') || line.includes("'") ? (
                                          <span className="text-amber-400">{line}</span>
                                        ) : (
                                          <span>{line}</span>
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </code>
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pagination Dots */}
                {filteredProjects.length > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {filteredProjects.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentProjectIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentProjectIndex
                            ? "bg-primary w-8"
                            : "bg-gray-300 w-2 hover:bg-primary/50"
                        }`}
                        aria-label={`Go to project ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Projects;