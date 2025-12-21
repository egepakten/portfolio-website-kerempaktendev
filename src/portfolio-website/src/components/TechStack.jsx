import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { projects } from "../data/projects";

const TechStack = () => {
  const [selectedTech, setSelectedTech] = useState(null);

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
  };

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

    return Array.from(techMap.values());
  }, []);

  // Dynamically generate project-technology mapping
  const projectTechUsage = useMemo(() => {
    const techProjects = {};

    projects.forEach((project) => {
      project.technologies.forEach((tech) => {
        if (!techProjects[tech]) {
          techProjects[tech] = [];
        }

        const languages = project.languages || [];

        techProjects[tech].push({
          project: project.title,
          languages: languages,
        });
      });
    });

    return techProjects;
  }, []);

  const categories = [...new Set(technologies.map((tech) => tech.category))];

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

          {/* Category Legend */}
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

          {/* Project Usage Modal - LIGHT THEME */}
          {/* Project Usage Modal - FIXED */}
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