/**
 * Projects Data
 *
 * Centralized project data that can be imported across components
 * to ensure consistency and make the project count dynamic.
 */

export const projects = [
  {
    title: "Focalstreams - Social Feed",
    description:
      "A full-stack serverless social media platform similar to Twitter/X. Built with AWS Lambda, DynamoDB, and API Gateway for the backend, with a React TypeScript frontend. Features real-time post creation, likes, CRUD operations, and beautiful liquid glass morphism UI design.",
    code: `# Lambda handler for creating posts
@app.route('/posts', methods=['POST'])
def create_post():
  """Serverless post creation with DynamoDB"""
  data = app.current_event.json_body
  
  post = {
    'id': str(uuid.uuid4()),
    'content': data['content'],
    'author': data['author'],
    'created_at': datetime.utcnow().isoformat(),
    'likes': 0
  }
  
  table.put_item(Item=post)
  return {'statusCode': 200, 'body': post}`,
    demoImage: "screenshots/focalstreams.png",
    demoGradient: "from-gray-800 via-gray-900 to-black",
    demoType: "live-demo",
    demoUrl: "https://focalstreams.com/",
    technologies: [
      "AWS Lambda",
      "DynamoDB",
      "API Gateway",
      "Python",
      "React",
      "TypeScript",
      "Serverless",
    ],
    languages: [
      { name: "Python", percentage: 42.6, color: "#3572A5" },
      { name: "TypeScript", percentage: 25.3, color: "#3178c6" },
      { name: "CSS", percentage: 27.7, color: "#563d7c" },
      { name: "Makefile", percentage: 2.6, color: "#427819" },
      { name: "HTML", percentage: 1.8, color: "#e34c26" },
    ],
    liveLink: "https://focalstreams.com/",
    githubLink: "https://github.com/egepakten/focalstreams",
    status: "PRODUCTION",
    year: "2025",
  },
  {
    title: "Python Static Code Analyzer",
    description:
      "Advanced code quality analysis tool for Python developers. Kings College London Final Year Individual Project featuring drag-and-drop file upload, 13 analysis components, and comprehensive code quality reporting.",
    code: `# AST-based code analysis
def analyze_function_length(tree):
  """Analyzes functions for excessive length"""
  for node in ast.walk(tree):
    if isinstance(node, ast.FunctionDef):
      length = node.end_lineno - node.lineno
      if length > 50:
        yield {
          'function': node.name,
          'lines': length,
          'recommendation': 'Consider refactoring'
        }`,
    demoImage: "screenshots/static_code_analyser_screen_image.jpeg",
    demoGradient: "from-violet-600 via-purple-600 to-indigo-600",
    demoType: "live-demo",
    demoUrl: "https://static-code-analyser-iota.vercel.app",
    technologies: ["Python", "Flask", "React", "Next.js", "TypeScript", "AST"],
    languages: [
      { name: "Python", percentage: 98.7, color: "#3572A5" },
      { name: "TypeScript", percentage: 0.5, color: "#3178c6" },
      { name: "JavaScript", percentage: 0.3, color: "#f1e05a" },
      { name: "CSS", percentage: 0.2, color: "#563d7c" },
      { name: "PowerShell", percentage: 0.1, color: "#012456" },
      { name: "C", percentage: 0.1, color: "#555555" },
      { name: "Shell", percentage: 0.1, color: "#89e051" },
    ],
    liveLink: "https://static-code-analyser-iota.vercel.app",
    githubLink: "https://github.com/egepakten/static-code-analyser",
    status: "PRODUCTION",
    year: "2024",
  },
  {
    title: "WiseUni Student Registry",
    description:
      "AWS Cognito integration demo for student authentication and authorization. Features Hosted UI login, Lambda triggers for custom validation, Identity Pool for AWS resource access, and fine-grained S3/DynamoDB permissions using policy variables.",
    code: `# Lambda Pre-Signup Trigger
def lambda_handler(event, context):
  """Validates student email before signup"""
  email = event['request']['userAttributes']['email']
  
  # Only allow university emails
  if not email.endswith('@university.edu'):
    raise Exception('Only university emails allowed')
  
  # Auto-confirm university emails
  event['response']['autoConfirmUser'] = True
  event['response']['autoVerifyEmail'] = True
  
  return event`,
    demoImage: "screenshots/cognito_student_registry.png",
    demoGradient: "from-blue-600 via-indigo-600 to-purple-600",
    demoType: "in-development",
    demoUrl: null,
    technologies: [
      "AWS Cognito",
      "AWS Lambda",
      "DynamoDB",
      "S3",
      "TypeScript",
      "Python",
      "IAM",
      "Serverless",
    ],
    languages: [
      { name: "Python", percentage: 53.1, color: "#3572A5" },
      { name: "TypeScript", percentage: 34.7, color: "#3178c6" },
      { name: "CSS", percentage: 10.2, color: "#563d7c" },
      { name: "Other", percentage: 2.0, color: "#888888" },
    ],
    liveLink: null,
    githubLink: "https://github.com/egepakten/cognito-student-registry",
    status: "IN DEVELOPMENT",
    year: "2025",
  },
  {
    title: "Pacman Q-Learning Agent",
    description:
      "Reinforcement Learning implementation for Pacman game using Q-Learning algorithm. King's College London Machine Learning coursework featuring temporal difference learning, ε-greedy exploration, reward shaping, and adaptive learning rates to train an agent that learns optimal strategies through trial and error.",
    code: `# Q-Learning update implementation
def learn(self, state, action, reward, nextState):
  """Implements Q-learning update equation"""
  currentQ = self.getQValue(state, action)
  maxNextQ = self.maxQValue(nextState)
  
  # Q(s,a) ← Q(s,a) + α[r + γ·max Q(s',a') - Q(s,a)]
  newQ = currentQ + self.alpha * (
    reward + self.gamma * maxNextQ - currentQ
  )
  
  self.updateQValue(state, action, newQ)`,
    demoImage: "screenshots/pacman.png?v=2",
    demoGradient: "from-black to-black",
    demoType: "game",
    demoUrl: null,
    technologies: [
      "Python",
      "Machine Learning",
      "Q-Learning",
      "Reinforcement Learning",
    ],
    languages: [{ name: "Python", percentage: 100.0, color: "#3572A5" }],
    liveLink: null,
    githubLink: "https://github.com/egepakten/pacman-ai-qlearning",
    status: "PRODUCTION",
    year: "2024",
  },
];
