-- Create roadmaps table (for multiple roadmaps like DevOps, Frontend, etc.)
CREATE TABLE IF NOT EXISTS roadmaps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create roadmap_nodes table
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  node_type VARCHAR(50) DEFAULT 'topic', -- 'main', 'topic', 'subtopic', 'resource'
  color VARCHAR(50) DEFAULT 'yellow', -- 'yellow', 'purple', 'gray', 'green', 'blue', 'orange'
  icon VARCHAR(50),
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width INTEGER DEFAULT 200,
  height INTEGER DEFAULT 50,
  parent_id UUID REFERENCES roadmap_nodes(id) ON DELETE SET NULL,
  roadmap_id UUID REFERENCES roadmaps(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_optional BOOLEAN DEFAULT false,
  is_recommended BOOLEAN DEFAULT false,
  is_container BOOLEAN DEFAULT false, -- For group/container nodes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create node_connections table (for the lines between nodes)
CREATE TABLE IF NOT EXISTS node_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_node_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE NOT NULL,
  to_node_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE NOT NULL,
  connection_type VARCHAR(50) DEFAULT 'default', -- 'default', 'optional', 'recommended'
  label VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_node_id, to_node_id)
);

-- Link posts to roadmap nodes
CREATE TABLE IF NOT EXISTS node_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES roadmap_nodes(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(node_id, post_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_roadmap_id ON roadmap_nodes(roadmap_id);
CREATE INDEX IF NOT EXISTS idx_roadmap_nodes_parent_id ON roadmap_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_from_node ON node_connections(from_node_id);
CREATE INDEX IF NOT EXISTS idx_node_connections_to_node ON node_connections(to_node_id);
CREATE INDEX IF NOT EXISTS idx_node_posts_node_id ON node_posts(node_id);
CREATE INDEX IF NOT EXISTS idx_node_posts_post_id ON node_posts(post_id);
CREATE INDEX IF NOT EXISTS idx_roadmaps_slug ON roadmaps(slug);

-- Add updated_at trigger for roadmaps
CREATE OR REPLACE FUNCTION update_roadmap_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_roadmaps_updated_at
  BEFORE UPDATE ON roadmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

CREATE TRIGGER trigger_roadmap_nodes_updated_at
  BEFORE UPDATE ON roadmap_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_roadmap_updated_at();

-- Enable RLS
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roadmaps
CREATE POLICY "Anyone can view published roadmaps"
  ON roadmaps FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can do everything with roadmaps"
  ON roadmaps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for roadmap_nodes
CREATE POLICY "Anyone can view nodes of published roadmaps"
  ON roadmap_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roadmaps
      WHERE roadmaps.id = roadmap_nodes.roadmap_id
      AND roadmaps.is_published = true
    )
  );

CREATE POLICY "Admins can do everything with roadmap_nodes"
  ON roadmap_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for node_connections
CREATE POLICY "Anyone can view connections of published roadmaps"
  ON node_connections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roadmap_nodes rn
      JOIN roadmaps r ON r.id = rn.roadmap_id
      WHERE rn.id = node_connections.from_node_id
      AND r.is_published = true
    )
  );

CREATE POLICY "Admins can do everything with node_connections"
  ON node_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for node_posts
CREATE POLICY "Anyone can view node_posts of published roadmaps"
  ON node_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roadmap_nodes rn
      JOIN roadmaps r ON r.id = rn.roadmap_id
      WHERE rn.id = node_posts.node_id
      AND r.is_published = true
    )
  );

CREATE POLICY "Admins can do everything with node_posts"
  ON node_posts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
