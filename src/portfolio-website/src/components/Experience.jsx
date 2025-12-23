import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Experience = () => {
  const [expandedIndex, setExpandedIndex] = useState(0);

  const experiences = [
    {
      company: "Personal Projects & Certifications",
      position: "Individual Cloud & AI Projects",
      period: "2025 - Present",
      logo: "🚀",
      description:
        "Building individual cloud and AI projects to enhance my skills and prepare for AWS Developer Associate certification.",
      achievements: [
        "Building individual cloud and AI projects to enhance my skills and prepare for AWS Developer Associate certification. Currently working on a project to build a cloud and AI platform using AWS and Python.",
      ],
      technologies: [
        "React",
        "TypeScript",
        "AWS",
        "Node.js",
        "Python",
        "Git",
        "GitHub",
        "Docker",
        "CI/CD",
        "Agile",
        "Scrum",
        "Kanban",
        "Jira",
        "Confluence",
        "AWS Developer Associate (In Progress)",
        "S3",
        "SQS",
        "SNS",
        "Lambda",
        "EC2",
        "ECS",
        "EFS",
        "RDS",
        "Aurora",
        "DynamoDB",
        "Redshift",
        "Athena",
        "Glue",
        "AWS Step Functions",
        "CodePipeline",
        "CodeBuild",
        "CodeDeploy",
        "CodeCommit",
        "LangChain",
        "RAG",
        "JWT",
        "JSON",
        "REST",
        "API",
        "HTTP",
        "HTTPS",
        "TCP/IP",
        "IP",
        "DNS",
      ],
    },
    {
      company: "Strand Analytica",
      position: "Frontend Developer",
      period: "Oct 2024 - Jan 2025",
      location: "London, UK",
      logo: "💼",
      description:
        "Developed responsive web interfaces using React and TypeScript in an Agile environment.",
      achievements: [
        "Integrated frontend with AWS-hosted services and contributed to client-facing website deployment.",
        "Used Chakra UI for component styling and worked with Jira-based workflows.",
      ],
      technologies: [
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Chakra UI",
        "Jira",
        "AWS",
        "Git",
        "GitHub",
        "Docker",
        "CI/CD",
        "Agile",
        "Scrum",
      ],
    },
    {
      company: "King's College London",
      position: "Bachelor of Science in Computer Science",
      period: "Sep 2021 - Jun 2024",
      location: "London, UK",
      logo: "🎓",
      description:
        "Bachelor of Science in Computer Science with a focus on AI, Machine Learning, and Data Science.",
      achievements: [
        "Built full-stack application with React/TypeScript and Flask",
        "Implemented 10+ Projects in the field of AI, Python, and Machine Learning",
        "Team working in projects and group assignments",
      ],
      technologies: [
        "React",
        "TypeScript",
        "Flask",
        "Scala",
        "Java",
        "Python",
        "Machine Learning",
        "AI",
        "Computer Vision",
        "Natural Language Processing",
        "Data Science",
      ],
    },
  ];

  return (
    <section
      id="experience"
      className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20"
    >
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-12 flex items-center text-gray-900 dark:text-white">
            <span className="text-primary font-mono mr-4">02.</span>
            Experience
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-[18px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-green-400 to-primary/20 rounded-full" />

            <div className="space-y-6">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative pl-12"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute left-0 top-8 w-[38px] h-[38px] rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                    expandedIndex === index
                      ? "bg-primary shadow-lg shadow-primary/30"
                      : "bg-white dark:bg-gray-800 border-2 border-primary/30"
                  }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      expandedIndex === index ? "bg-white" : "bg-primary"
                    }`} />
                  </div>

                  <div
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md ${
                      expandedIndex === index
                        ? "border-l-4 border-l-primary border border-primary/20 shadow-lg"
                        : "border border-gray-100 dark:border-gray-700 hover:border-primary/30"
                    }`}
                    onClick={() =>
                      setExpandedIndex(expandedIndex === index ? -1 : index)
                    }
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl bg-primary/10 p-2 rounded-lg">{exp.logo}</div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {exp.position}
                          </h3>
                          <p className="text-primary font-medium">
                            {exp.company}
                          </p>
                        </div>
                      </div>
                      <span className="text-gray-500 dark:text-gray-400 text-sm font-mono bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full">
                        {exp.period}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{exp.description}</p>

                    <AnimatePresence>
                      {expandedIndex === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-gray-100 dark:border-gray-700 pt-4 mt-4">
                            <h4 className="text-primary font-semibold mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                              Key Achievements
                            </h4>
                            <ul className="space-y-2 mb-5">
                              {exp.achievements.map((achievement, i) => (
                                <li
                                  key={i}
                                  className="flex items-start gap-3 text-gray-700 dark:text-gray-300"
                                >
                                  <span className="text-primary mt-1.5 text-xs">▹</span>
                                  <span className="leading-relaxed">{achievement}</span>
                                </li>
                              ))}
                            </ul>

                            <h4 className="text-primary font-semibold mb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                              Technologies
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {exp.technologies.map((tech, i) => (
                                <span
                                  key={i}
                                  className="px-3 py-1.5 bg-primary/5 text-primary/80 rounded-lg text-sm font-medium hover:bg-primary/10 transition-colors"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 font-medium">
                      <span className={`transition-transform duration-300 ${expandedIndex === index ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                      {expandedIndex === index ? "Click to collapse" : "Click to expand"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Experience;