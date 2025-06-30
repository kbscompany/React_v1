-- Create missing Foodics tables
CREATE TABLE IF NOT EXISTS foodics_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    api_token TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    configured_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    config_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT NULL,
    INDEX idx_key (config_key),
    INDEX idx_type (config_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configurations
INSERT IGNORE INTO api_configurations 
(config_key, config_value, config_type, description, updated_by)
VALUES 
('foodics_read_only_mode', 'true', 'boolean', 'Enable read-only mode for Foodics integration', 1),
('foodics_default_branch_id', '', 'string', 'Default Foodics branch for direct integration', 1),
('foodics_default_branch_name', '', 'string', 'Default Foodics branch name', 1); 