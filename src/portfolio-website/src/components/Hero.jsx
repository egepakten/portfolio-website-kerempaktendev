import { motion } from "framer-motion";

const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center px-6 lg:px-20 relative py-20"
    >
      <div className="max-w-4xl w-full text-left">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Content */}
          <div className="w-full">
            <p className="text-primary font-mono text-lg mb-6">
              Hi, my name is
            </p>

            <h1 className="text-5xl lg:text-7xl font-bold mb-6 text-foreground">
              Kerem Ege Pakten
            </h1>

            <h2 className="text-2xl lg:text-3xl font-bold text-muted-foreground mb-8">
              Junior Software Engineer | Cloud & DevOps Enthusiast
            </h2>

            <p className="text-muted-foreground text-lg lg:text-xl max-w-2xl mb-12 leading-relaxed">
              Computer Science graduate from King's College London specializing in
              cloud engineering and full-stack development. Experienced with AWS,
              React, and TypeScript. Currently building Individual Cloud & AI
              Project - while preparing for AWS Developer Associate certification.
            </p>

            <div className="flex flex-wrap gap-6 justify-left">
              <motion.a
                href="#projects"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-primary text-white rounded-lg font-mono font-semibold hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                View My Work
              </motion.a>

              <motion.a
                href="#contact"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 border-2 border-primary text-primary rounded-lg font-mono font-semibold hover:bg-primary/10 transition-all duration-300"
              >
                Get In Touch
              </motion.a>
            </div>
          </div>

    
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;