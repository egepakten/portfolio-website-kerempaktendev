import { motion } from "framer-motion";

const Contact = () => {
  const socialLinks = [
    { name: "GitHub", icon: "📦", url: "https://github.com/egepakten" },
    {
      name: "LinkedIn",
      icon: "💼",
      url: "https://www.linkedin.com/in/kerem-pakten/",
    },
    { name: "Email", icon: "📧", url: "mailto:egepakten@icloud.com" },
  ];

  const handleDownloadCV = () => {
    const link = document.createElement("a");
    link.href = "/CV_Kerem Ege Pakten.pdf";
    link.download = "CV_Kerem_Ege_Pakten.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section
      id="contact"
      className="min-h-screen flex items-center justify-center px-6 lg:px-20 py-20"
    >
      <div className="max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl lg:text-5xl font-bold mb-12 flex items-center text-foreground">
            <span className="text-primary font-mono mr-4">03.</span>
            Get In Touch
            <div className="ml-8 h-[1px] flex-1 bg-gradient-to-r from-primary/50 to-transparent" />
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <div>
              <h3 className="text-2xl font-bold mb-6 text-foreground">Let's Connect</h3>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                I'm always open to discussing new projects, creative ideas, or
                opportunities to be part of your visions. Whether you have a
                question or just want to say hi, feel free to reach out!
              </p>

              {/* Social Links */}
              <div className="space-y-4 mb-8">
                {socialLinks.map((link, index) => (
                  <motion.a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ x: 10 }}
                    className="flex items-center gap-4 bg-card rounded-lg p-4 hover:border-primary/50 transition-all duration-300 group border border-border shadow-sm hover:shadow-md"
                  >
                    <span className="text-3xl">{link.icon}</span>
                    <span className="font-mono text-primary group-hover:text-green-600 transition-colors">
                      {link.name}
                    </span>
                  </motion.a>
                ))}
              </div>

              {/* Decorative Element */}
              <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
                <p className="font-mono text-primary mb-2">$ status</p>
                <p className="text-muted-foreground">
                  <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2 animate-pulse" />
                  Available Immediately
                </p>
              </div>
            </div>

            {/* CV Download Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="bg-card rounded-xl p-8 flex flex-col items-center justify-center border border-border shadow-sm"
            >
              {/* CV Icon */}
              <div className="mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/30">
                  <svg
                    className="w-16 h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* CV Info */}
              <h3 className="text-2xl font-bold mb-3 text-center text-foreground">
                Download My Resume
              </h3>
              <p className="text-muted-foreground text-center mb-8 max-w-sm">
                Get a detailed overview of my experience, skills, and
                qualifications in PDF format.
              </p>

              {/* Download Button */}
              <motion.button
                onClick={handleDownloadCV}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-lg font-mono font-bold bg-primary text-white hover:bg-green-600 transition-all duration-300 flex items-center justify-center gap-3 group shadow-lg shadow-primary/25"
              >
                <svg
                  className="w-5 h-5 group-hover:animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Download CV
              </motion.button>

              {/* View Online Button */}
              <motion.a
                href="/CV_Kerem Ege Pakten.pdf"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full mt-4 py-4 rounded-lg font-mono font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all duration-300 flex items-center justify-center gap-3 group"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                View Online
              </motion.a>

              {/* File Info */}
              <div className="mt-6 text-center text-sm text-gray-500 font-mono">
                <p>📄 PDF Document</p>
                <p className="mt-1">Last updated: 2025</p>
              </div>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <p className="text-gray-400 font-mono">
              Designed & Built by{" "}
              <span className="text-primary">Kerem Ege Pakten</span>
            </p>
            <p className="text-gray-500 text-sm mt-2 mb-12">
              © 2025 All rights reserved
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;