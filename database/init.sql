-- Obfusi-Bob Database Schema
-- PostgreSQL initialization script for production deployment

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- IR Files table
CREATE TABLE IF NOT EXISTS ir_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_hash VARCHAR(64) NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis Results table
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ir_file_id UUID NOT NULL REFERENCES ir_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    functions_count INTEGER NOT NULL,
    instructions_count INTEGER NOT NULL,
    basic_blocks_count INTEGER NOT NULL,
    complexity_score INTEGER NOT NULL,
    analysis_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Obfuscation Operations table
CREATE TABLE IF NOT EXISTS obfuscation_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ir_file_id UUID NOT NULL REFERENCES ir_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pass_name VARCHAR(100) NOT NULL,
    input_path TEXT NOT NULL,
    output_path TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ir_file_id UUID NOT NULL REFERENCES ir_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    technique VARCHAR(100) NOT NULL,
    confidence DECIMAL(5,4) NOT NULL,
    effectiveness DECIMAL(5,4) NOT NULL,
    reasoning TEXT NOT NULL,
    papers JSONB,
    implementation JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Usage Metrics table
CREATE TABLE IF NOT EXISTS api_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_ir_files_project_id ON ir_files(project_id);
CREATE INDEX idx_analysis_results_ir_file_id ON analysis_results(ir_file_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_obfuscation_operations_ir_file_id ON obfuscation_operations(ir_file_id);
CREATE INDEX idx_obfuscation_operations_user_id ON obfuscation_operations(user_id);
CREATE INDEX idx_ai_recommendations_ir_file_id ON ai_recommendations(ir_file_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_api_metrics_user_id ON api_metrics(user_id);
CREATE INDEX idx_api_metrics_created_at ON api_metrics(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo user (password: demo123, hashed with bcrypt)
-- Note: In production, use proper password hashing
INSERT INTO users (email, password_hash, name, role) VALUES
    ('demo@ibm.com', '$2b$10$rKvVPZqGvVZqGvVZqGvVZO7KqGvVZqGvVZqGvVZqGvVZqGvVZqGvV', 'Demo User', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Create views for analytics
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT p.id) as project_count,
    COUNT(DISTINCT ir.id) as file_count,
    COUNT(DISTINCT ar.id) as analysis_count,
    COUNT(DISTINCT oo.id) as obfuscation_count,
    MAX(al.created_at) as last_activity
FROM users u
LEFT JOIN projects p ON u.id = p.user_id
LEFT JOIN ir_files ir ON p.id = ir.project_id
LEFT JOIN analysis_results ar ON u.id = ar.user_id
LEFT JOIN obfuscation_operations oo ON u.id = oo.user_id
LEFT JOIN audit_log al ON u.id = al.user_id
GROUP BY u.id, u.email, u.name;

CREATE OR REPLACE VIEW daily_metrics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_operations,
    COUNT(DISTINCT user_id) as active_users,
    AVG(response_time_ms) as avg_response_time,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as failed_requests
FROM api_metrics
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO obfusibob;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO obfusibob;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO obfusibob;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Obfusi-Bob database initialized successfully!';
END $$;

-- Made with Bob
