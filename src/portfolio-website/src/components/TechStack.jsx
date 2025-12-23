import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const TechStack = () => {
  const [selectedTech, setSelectedTech] = useState(null);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectLanguages, setProjectLanguages] = useState({});

  // Technology metadata (icons and categories)
  const techMetadata = {
    React: { icon: "⚛️", category: "Frontend" },
    TypeScript: { icon: "📘", category: "Language" },
    "Node.js": { icon: "🟢", category: "Backend" },
    Python: { icon: "🐍", category: "Language" },
    "Next.js": { icon: "▲", category: "Framework" },
    "Tailwind CSS": { icon: "🎨", category: "Styling" },
    PostgreSQL: { icon: "🐘", category: "Database" },
    MongoDB: { icon: "🍃", category: "Database" },
    AWS: { icon: "☁️", category: "Cloud" },
    "AWS Lambda": { icon: "λ", category: "Cloud" },
    DynamoDB: { icon: "🗄️", category: "Database" },
    "API Gateway": { icon: "🚪", category: "Cloud" },
    Serverless: { icon: "⚡", category: "Architecture" },
    Docker: { icon: "🐳", category: "DevOps" },
    Git: { icon: "📦", category: "Tools" },
    GraphQL: { icon: "◈", category: "API" },
    Flask: { icon: "🧪", category: "Backend" },
    "Machine Learning": { icon: "🤖", category: "AI" },
    "Q-Learning": { icon: "🎓", category: "AI" },
    "Reinforcement Learning": { icon: "🧠", category: "AI" },
    AST: { icon: "🌳", category: "Tools" },
    "AWS Cognito": { icon: "🔐", category: "Cloud" },
    S3: { icon: "📦", category: "Cloud" },
    IAM: { icon: "🔑", category: "Cloud" },
    JavaScript: { icon: "📒", category: "Language" },
    CSS: { icon: "🎨", category: "Styling" },
    HTML: { icon: "📄", category: "Frontend" },
    Supabase: { icon: "⚡", category: "Database" },
    Vercel: { icon: "▲", category: "Cloud" },
    "shadcn/ui": { icon: "🧩", category: "UI" },
    Vite: { icon: "⚡", category: "Tools" },
  };

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

  // Fetch projects from Supabase
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_visible', true);

      if (!error && data) {
        const transformedProjects = data.map(project => ({
          id: project.id,
          title: project.repo_name,
          technologies: project.hashtags || [],
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

  // Dynamically generate technologies from projects
  const technologies = useMemo(() => {
    const techMap = new Map();

    projects.forEach((project) => {
      project.technologies.forEach((tech) => {
        if (!techMap.has(tech)) {
          techMap.set(tech, {
            name: tech,
            icon: techMetadata[tech]?.icon || "💻",
            category: techMetadata[tech]?.category || "Other",
            projectCount: 0,
          });
        }
        const techData = techMap.get(tech);
        techData.projectCount += 1;
      });
    });

    return Array.from(techMap.values()).sort((a, b) => b.projectCount - a.projectCount);
  }, [projects]);

  // Dynamically generate project-technology mapping with languages
  const projectTechUsage = useMemo(() => {
    const techProjects = {};

    projects.forEach((project) => {
      project.technologies.forEach((tech) => {
        if (!techProjects[tech]) {
          techProjects[tech] = [];
        }

        techProjects[tech].push({
          project: project.title,
          languages: projectLanguages[project.id] || [],
        });
      });
    });

    return techProjects;
  }, [projects, projectLanguages]);

  const categories = [...new Set(technologies.map((tech) => tech.category))];

  if (isLoading) {
    return (
      <section id="tech" className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20">
        <div className="max-w-6xl w-full">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 flex items-center">
            <span className="text-primary font-mono mr-4">04.</span>
            Tech Stack
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
    <section
      id="tech"
      className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20"
    >
      <div className="max-w-6xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Section Header */}
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 flex items-center">
            <span className="text-primary font-mono mr-4">04.</span>
            Tech Stack
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>

          {/* Hint */}
          <p className="text-gray-500 text-center mb-12 text-sm font-mono">
            Click on any technology to see which projects use it
          </p>

          {/* Tech Grid */}
          {technologies.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
              <div className="text-5xl mb-4">🔧</div>
              <p className="text-gray-600 text-lg">
                No technologies found. Add hashtags to your projects.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {technologies.map((tech, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedTech(tech.name)}
                  className="bg-white rounded-xl p-6 text-center cursor-pointer shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary/40 group"
                >
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {tech.icon}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">
                    {tech.name}
                  </h3>
                  <span className="text-xs text-primary font-medium block mb-4">
                    {tech.category}
                  </span>
                  <div className="pt-4 border-t border-gray-100">
                    <span className="text-3xl font-bold text-gray-900">
                      {tech.projectCount}
                    </span>
                    <p className="text-sm text-gray-500">
                      Project{tech.projectCount > 1 ? "s" : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Category Legend */}
          {categories.length > 0 && (
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {categories.map((category, index) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  viewport={{ once: true }}
                  className="px-3 py-1.5 bg-white rounded-full text-xs border border-gray-200 text-gray-600"
                >
                  <span className="text-primary mr-1">●</span> {category}
                </motion.div>
              ))}
            </div>
          )}

          {/* Project Usage Modal */}
          <AnimatePresence>
            {selectedTech && projectTechUsage[selectedTech] && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTech(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  zIndex: 9999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px',
                }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '32px',
                    maxWidth: '600px',
                    width: '100%',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  }}
                >
                  {/* Modal Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e5e7eb',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: '#dcfce7',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '28px',
                      }}>
                        {techMetadata[selectedTech]?.icon || "💻"}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#111827',
                          margin: 0,
                        }}>
                          {selectedTech}
                        </h3>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '14px',
                          margin: '4px 0 0 0',
                        }}>
                          {projectTechUsage[selectedTech]?.length || 0} project
                          {projectTechUsage[selectedTech]?.length !== 1 ? "s" : ""}{" "}
                          using this technology
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTech(null)}
                      style={{
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#f3f4f6',
                        cursor: 'pointer',
                      }}
                    >
                      <svg
                        style={{ width: '24px', height: '24px', color: '#6b7280' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Projects List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {projectTechUsage[selectedTech].map((item, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        style={{
                          backgroundColor: '#f9fafb',
                          borderRadius: '12px',
                          padding: '24px',
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        {/* Project Name */}
                        <h4 style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          color: '#111827',
                          marginBottom: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}>
                          <span style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#22c55e',
                            borderRadius: '50%',
                          }}></span>
                          {item.project}
                        </h4>

                        {/* Language Bar */}
                        {item.languages && item.languages.length > 0 && (
                          <>
                            <div style={{ marginBottom: '16px' }}>
                              <div style={{
                                height: '12px',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                display: 'flex',
                                backgroundColor: '#e5e7eb',
                              }}>
                                {item.languages.map((lang, i) => (
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

                            {/* Language List */}
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '16px',
                            }}>
                              {item.languages.map((lang, i) => (
                                <div key={i} style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  fontSize: '14px',
                                }}>
                                  <div
                                    style={{
                                      width: '12px',
                                      height: '12px',
                                      borderRadius: '50%',
                                      backgroundColor: lang.color,
                                    }}
                                  />
                                  <span style={{ color: '#374151', fontWeight: '500' }}>
                                    {lang.name}
                                  </span>
                                  <span style={{ color: '#9ca3af' }}>
                                    {lang.percentage}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}>
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                      Click outside to close • Language data from GitHub
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default TechStack;
