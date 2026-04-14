-- The Property Table
CREATE TABLE property (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    location VARCHAR(255),
    category ENUM('residential', 'commercial'),
    subcategory VARCHAR(50),
    type VARCHAR(50),
    listing_type VARCHAR(50),
    price_text VARCHAR(100),
    area_sqft VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The Projects Table
CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),
    developer VARCHAR(100),
    location VARCHAR(100),
    price VARCHAR(100),
    size VARCHAR(100),
    category VARCHAR(255), -- Use varchar for mixed types like "residential, commercial"
    type VARCHAR(50),
    options VARCHAR(100),
    status VARCHAR(50),
    details TEXT
);

-- 1. IMAGES FOR INDIVIDUAL PROPERTIES
CREATE TABLE property_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_main TINYINT(1) DEFAULT 0,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 2. FEATURES FOR INDIVIDUAL PROPERTIES
CREATE TABLE property_feature (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (property_id) REFERENCES property(id) ON DELETE CASCADE
);

-- 3. IMAGES FOR LARGE PROJECTS
CREATE TABLE project_image (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_main TINYINT(1) DEFAULT 0,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 4. FEATURES FOR LARGE PROJECTS
CREATE TABLE project_feature (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT NOT NULL,
    feature_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);