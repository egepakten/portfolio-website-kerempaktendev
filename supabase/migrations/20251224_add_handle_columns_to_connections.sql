-- Add source_handle and target_handle columns to node_connections table
-- These columns store which handle (top, bottom, left, right) the connection uses

ALTER TABLE node_connections
ADD COLUMN IF NOT EXISTS source_handle VARCHAR(50) DEFAULT 'bottom-source',
ADD COLUMN IF NOT EXISTS target_handle VARCHAR(50) DEFAULT 'top-target';

-- Update existing connections to use default values
UPDATE node_connections
SET source_handle = 'bottom-source', target_handle = 'top-target'
WHERE source_handle IS NULL OR target_handle IS NULL;
