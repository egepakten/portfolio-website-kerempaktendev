import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const [currentProjectIndex, setCurrentProjectIndex] = useState(0);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectLanguages, setProjectLanguages] = useState({});
  const [isImageExpanded, setIsImageExpanded] = useState(false);

  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_visible', true)
        .order('initial_commit_date', { ascending: false, nullsFirst: false });

      if (!error && data) {
        // Sort: ongoing first, then by initial_commit_date
        const sortedData = [...data].sort((a, b) => {
          if (a.is_ongoing && !b.is_ongoing) return -1;
          if (!a.is_ongoing && b.is_ongoing) return 1;
          const dateA = a.initial_commit_date || a.created_at;
          const dateB = b.initial_commit_date || b.created_at;
          return new Date(dateB) - new Date(dateA);
        });

        const transformedProjects = sortedData.map(project => ({
          id: project.id,
          title: project.repo_name,
          description: project.custom_description || project.github_description || '',
          technologies: project.hashtags || [],
          githubLink: project.repo_url,
          liveLink: null,
          status: project.status === 'deployed' ? 'PRODUCTION' :
                  project.status === 'in_progress' ? 'IN DEVELOPMENT' :
                  project.status === 'testing' ? 'BETA' : 'PRODUCTION',
          year: project.initial_commit_date
            ? new Date(project.initial_commit_date).getFullYear().toString()
            : new Date(project.created_at).getFullYear().toString(),
          isOngoing: project.is_ongoing,
          category: project.category,
          repoOwner: project.repo_owner,
          repoName: project.repo_name,
          githubRepoId: project.github_repo_id,
        }));
        setProjects(transformedProjects);
      }
      setIsLoading(false);
    };

    fetchProjects();
  }, []);

  // Fetch languages for projects
  useEffect(() => {
    const fetchLanguages = async () => {
      if (projects.length === 0) return;

      const { data: tokenData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'github_token')
        .maybeSingle();

      if (!tokenData?.value) return;

      const newLanguages = {};
      const languageColors = {
        JavaScript: '#f1e05a',
        TypeScript: '#3178c6',
        Python: '#3572A5',
        CSS: '#563d7c',
        HTML: '#e34c26',
        Shell: '#89e051',
        Java: '#b07219',
        Go: '#00ADD8',
        Rust: '#dea584',
        Ruby: '#701516',
        Swift: '#ffac45',
        Kotlin: '#A97BFF',
        PHP: '#4F5D95',
        C: '#555555',
        'C++': '#f34b7d',
        'C#': '#178600',
      };

      for (const project of projects) {
        if (!project.githubRepoId) continue;
        try {
          const { data } = await supabase.functions.invoke('github-api', {
            body: {
              action: 'get_languages',
              token: tokenData.value,
              owner: project.repoOwner,
              repo: project.repoName,
              repoId: project.githubRepoId,
            },
          });

          if (data?.languages) {
            const total = Object.values(data.languages).reduce((a, b) => a + b, 0);
            newLanguages[project.id] = Object.entries(data.languages)
              .map(([name, bytes]) => ({
                name,
                percentage: Math.round((bytes / total) * 1000) / 10,
                color: languageColors[name] || '#888888',
              }))
              .sort((a, b) => b.percentage - a.percentage);
          }
        } catch (err) {
          console.error('Error fetching languages for', project.repoName, err);
        }
      }

      setProjectLanguages(newLanguages);
    };

    fetchLanguages();
  }, [projects]);

  // Get all unique technologies from real projects
  const allTechnologies = useMemo(() => {
    const techSet = new Set();
    projects.forEach((project) => {
      project.technologies.forEach((tech) => techSet.add(tech));
    });
    return Array.from(techSet).sort();
  }, [projects]);

  // Filter projects based on selected tags
  const filteredProjects = useMemo(() => {
    if (selectedFilters.length === 0) return projects;
    return projects.filter((project) =>
      selectedFilters.every((filter) => project.technologies.includes(filter))
    );
  }, [projects, selectedFilters]);

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
    setIsImageExpanded(false);
  };

  const prevProject = () => {
    setCurrentProjectIndex((prev) =>
      prev === 0 ? filteredProjects.length - 1 : prev - 1
    );
    setIsImageExpanded(false);
  };

  // Reset index when filters change
  useEffect(() => {
    setCurrentProjectIndex(0);
    setIsImageExpanded(false);
  }, [selectedFilters]);

  const currentProject = filteredProjects[currentProjectIndex];
  const currentLanguages = currentProject ? projectLanguages[currentProject.id] : [];

  if (isLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20" id="projects">
        <div className="max-w-6xl w-full">
          <h2 className="text-4xl lg:text-5xl font-bold mb-12 flex items-center">
            <span className="text-primary font-mono mr-4">03.</span>
            Projects
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

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
          {allTechnologies.length > 0 && (
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
                  Clear All
                </button>
              )}
            </motion.div>
          )}

          {/* Project Carousel */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-gray-600 text-lg mb-4">
                {projects.length === 0
                  ? "No projects available yet"
                  : "No projects found with the selected technologies"}
              </p>
              {selectedFilters.length > 0 && (
                <button
                  onClick={() => setSelectedFilters([])}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Clear Filters
                </button>
              )}
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
                      {/* Project Content */}
                      <div className="flex flex-col">
                        {/* Project Header */}
                        <div className="p-6 lg:p-8 border-b border-gray-100">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                                  {currentProject.title}
                                </h3>
                                {currentProject.isOngoing && (
                                  <span className="px-2 py-1 bg-cyan-500/20 text-cyan-700 rounded text-xs font-semibold">
                                    ONGOING
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 leading-relaxed">
                                {currentProject.description || 'No description available'}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <span className="text-sm text-primary font-mono bg-primary/10 px-3 py-1 rounded-full whitespace-nowrap">
                                {currentProject.year}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-bold ${
                                  currentProject.status === "PRODUCTION"
                                    ? "bg-primary text-white"
                                    : currentProject.status === "IN DEVELOPMENT"
                                    ? "bg-orange-500 text-white"
                                    : "bg-yellow-500 text-white"
                                }`}
                              >
                                {currentProject.status === "PRODUCTION" ? "PROD" : currentProject.status === "IN DEVELOPMENT" ? "DEV" : "BETA"}
                              </span>
                            </div>
                          </div>

                          {/* Tech Tags */}
                          {currentProject.technologies.length > 0 && (
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
                          )}
                        </div>

                        {/* Language Bar */}
                        {currentLanguages && currentLanguages.length > 0 && (
                          <div className="px-6 lg:px-8 py-4 bg-gray-50 border-b border-gray-100">
                            <div className="mb-3">
                              <div className="h-3 rounded-full overflow-hidden flex bg-gray-200">
                                {currentLanguages.map((lang, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      width: `${lang.percentage}%`,
                                      backgroundColor: lang.color,
                                    }}
                                    title={`${lang.name}: ${lang.percentage}%`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-4">
                              {currentLanguages.slice(0, 5).map((lang, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: lang.color }}
                                  />
                                  <span className="text-gray-700 font-medium">{lang.name}</span>
                                  <span className="text-gray-400">{lang.percentage}%</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Collapsible Image Section */}
                        <div className="border-b border-gray-100">
                          <button
                            onClick={() => setIsImageExpanded(!isImageExpanded)}
                            className="w-full px-6 lg:px-8 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-600">
                              {isImageExpanded ? 'Hide Preview' : 'Show Preview'}
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isImageExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          <AnimatePresence>
                            {isImageExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="p-6 lg:p-8 bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center min-h-[300px]">
                                  <div className="text-center text-gray-400">
                                    <div className="text-6xl mb-4">🚀</div>
                                    <p className="text-sm">Project preview coming soon</p>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 lg:p-8 flex items-center justify-between bg-gray-50">
                          <div className="flex items-center gap-3">
                            <a
                              href={currentProject.githubLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                              </svg>
                              View on GitHub
                            </a>
                            {currentProject.liveLink && (
                              <a
                                href={currentProject.liveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Live Demo
                              </a>
                            )}
                          </div>
                          {currentProject.category && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">
                              {currentProject.category}
                            </span>
                          )}
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
                        onClick={() => {
                          setCurrentProjectIndex(index);
                          setIsImageExpanded(false);
                        }}
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
