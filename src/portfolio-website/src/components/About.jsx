import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { projects } from "../data/projects";

const About = () => {
  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);

  const terminalLines = [
    { text: "$ whoami", type: "command" },
    { text: "> Junior Software Engineer | Cloud & DevOps Enthusiast", type: "output" },
    { text: "", type: "empty" },
    { text: "$ cat bio.txt", type: "command" },
    { text: "> Computer Science graduate from King's College London specializing in cloud engineering.", type: "output" },
    { text: "> After working as a Frontend Developer at Strand Analytica,", type: "output" },
    { text: "> I discovered my passion for cloud architecture and DevOp.", type: "output" },
    { text: "> Currently building Personal Projects while preparing for AWS Developer Associate certification.", type: "output" },
    { text: "", type: "empty" },
    { text: "$ ls skills/", type: "command" },
    { text: "> Frontend Development    ████████████ 100%", type: "output" },
    { text: "> Backend Development    ██████████░░ 80%", type: "output" },
    { text: "> Cloud Infrastructure  ████████░░░░  65%", type: "output" },
    { text: "> DevOps Tools          █████████░░░  75%", type: "output" },
    { text: "", type: "empty" },
    { text: "$ echo $INTERESTS", type: "command" },
    { text: "> [ Full-Stack Development, AI/ML, Web3, Agentic RAG Systems ]", type: "output" },
  ];

  useEffect(() => {
    if (currentLineIndex >= terminalLines.length) return;

    const currentLine = terminalLines[currentLineIndex].text;

    // If empty line, move to next immediately
    if (currentLine === "") {
      setDisplayedLines(prev => [...prev, ""]);
      setCurrentLineIndex(prev => prev + 1);
      setCurrentCharIndex(0);
      return;
    }

    // Type out character by character
    if (currentCharIndex < currentLine.length) {
      const timeout = setTimeout(() => {
        setDisplayedLines(prev => {
          const newLines = [...prev];
          if (newLines.length === currentLineIndex) {
            newLines.push(currentLine.slice(0, currentCharIndex + 1));
          } else {
            newLines[currentLineIndex] = currentLine.slice(0, currentCharIndex + 1);
          }
          return newLines;
        });
        setCurrentCharIndex(prev => prev + 1);
      }, 20); // Speed of typing

      return () => clearTimeout(timeout);
    } else {
      // Move to next line
      const timeout = setTimeout(() => {
        setCurrentLineIndex(prev => prev + 1);
        setCurrentCharIndex(0);
      }, 100); // Pause between lines

      return () => clearTimeout(timeout);
    }
  }, [currentLineIndex, currentCharIndex]);

  const getLineColor = (type) => {
    switch (type) {
      case "command":
        return "text-primary font-semibold";
      case "output":
        return "text-gray-100";
      default:
        return "text-gray-400";
    }
  };

  return (
    <section
      id="about"
      className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20"
    >
      <div className="max-w-5xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          {/* Section Header */}
          <h2 className="text-4xl lg:text-5xl font-bold mb-12 flex items-center">
            <span className="text-primary font-mono mr-4">01.</span>
            About Me
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>

          {/* Terminal Card */}
          <div className="bg-gray-900 rounded-xl p-6 lg:p-8 shadow-2xl border border-gray-800 relative overflow-hidden">
            {/* Green glow effect */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
            
            {/* Terminal Header */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-700 relative z-10">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="ml-4 text-gray-400 text-sm font-mono">terminal — zsh</span>
            </div>

            {/* Terminal Content */}
            <div className="font-mono text-sm leading-loose relative z-10 min-h-[400px]">
              {displayedLines.map((line, index) => (
                <div key={index} className={`mb-1 ${getLineColor(terminalLines[index]?.type)}`}>
                  {line}
                </div>
              ))}
              {/* Blinking cursor */}
              {currentLineIndex < terminalLines.length && (
                <span className="inline-block w-2.5 h-5 bg-primary animate-pulse" />
              )}
            </div>
          </div>

          {/* Stats Cards - Added mt-8 for gap */}
          <div className="flex flex-col sm:flex-row gap-4 mt-12 w-full">
            {[
              { number: projects.length.toString(), label: "Projects Completed", icon: "🚀" },
              { number: "4+", label: "Years Experience", icon: "📅" },
              { number: "100%", label: "Commitment", icon: "🎯" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex-1 bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-primary/30 group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">
                  {stat.number}
                </div>
                <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;