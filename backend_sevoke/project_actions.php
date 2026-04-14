<?php
// Functions for large scale projects
function getProjects($conn) {
    $query = "SELECT p.*, i.image_url FROM projects p 
    LEFT JOIN project_image i ON p.id = i.project_id 
    WHERE i.is_main = 1 OR i.is_main IS NULL 
    ORDER BY p.id DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProjectDetails($conn, $id) {
    // 1. Get Basic Info
    $stmt = $conn->prepare("SELECT * FROM projects WHERE id = ?");
    $stmt->execute([$id]);
    $project = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$project) return null;

    // 2. Get All Images
    $stmt = $conn->prepare("SELECT image_url, is_main FROM project_image WHERE property_id = ?");
    $stmt->execute([$id]);
    $project['images'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get All Features
    $stmt = $conn->prepare("SELECT feature_name FROM project_feature WHERE property_id = ?");
    $stmt->execute([$id]);
    $project['features'] = $stmt->fetchAll(PDO::FETCH_COLUMN); // FETCH_COLUMN gives a simple array of strings

    return $project;
}

function addProject($conn, $data, $files) {
    $conn->beginTransaction();
    try {
        $stmt = $conn->prepare("INSERT INTO projects 
            (name, developer, location, price, size, category, type, options, status, details) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

        $stmt->execute([
            $data['name'] ?? '',
            $data['developer'] ?? '',
            $data['location'] ?? '',
            $data['price'] ?? '',
            $data['size'] ?? '',
            $data['category'] ?? '',
            $data['type'] ?? '',
            $data['options'] ?? '',
            $data['status'] ?? '',
            $data['details'] ?? ''
        ]);
        $projectId = $conn->lastInsertId();

        if (isset($data['features']) && is_array($data['features'])) {
            $featStmt = $conn->prepare("INSERT INTO project_feature (project_id, feature_name) VALUES (?, ?)");
            foreach ($data['features'] as $feature) {
                $feature = trim((string)$feature);
                if ($feature !== '') {
                    $featStmt->execute([$projectId, $feature]);
                }
            }
        }

        if (isset($files['images']) && isset($files['images']['tmp_name']) && is_array($files['images']['tmp_name'])) {
            $targetDir = __DIR__ . DIRECTORY_SEPARATOR . 'pimages' . DIRECTORY_SEPARATOR . 'project' . DIRECTORY_SEPARATOR . $projectId . DIRECTORY_SEPARATOR;
            if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                throw new Exception("Failed to create image directory.");
            }

            $mainIndex = isset($data['main_index']) ? (int)$data['main_index'] : 0;
            $imgStmt = $conn->prepare("INSERT INTO project_image (project_id, image_url, is_main) VALUES (?, ?, ?)");

            foreach ($files['images']['tmp_name'] as $key => $tmpName) {
                if (($files['images']['error'][$key] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                    continue;
                }
                $originalName = basename((string)$files['images']['name'][$key]);
                $fileName = uniqid('img_', true) . "_" . $key . "_" . $originalName;
                $absoluteFilePath = $targetDir . $fileName;

                if (!move_uploaded_file($tmpName, $absoluteFilePath)) {
                    throw new Exception("Image upload failed.");
                }

                $relativePath = 'pimages/project/' . $projectId . '/' . $fileName;
                $isMain = ($key === $mainIndex) ? 1 : 0;
                $imgStmt->execute([$projectId, $relativePath, $isMain]);
            }
        }

        $conn->commit();
        return $projectId;
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }
}

function searchProjects($conn, $filters) {
    $category = strtolower(trim((string)($filters['category'] ?? '')));
    $type = strtolower(trim((string)($filters['type'] ?? '')));
    $cleanLocation = str_replace(' ', '', strtolower((string)($filters['enteredLocation'] ?? '')));
    $optionSearch = str_replace(' ', '', strtolower((string)($filters['option'] ?? ($filters['options'] ?? ''))));

    $sql = "SELECT p.*, i.image_url
            FROM projects p
            LEFT JOIN project_image i ON p.id = i.project_id
            AND (i.is_main = 1 OR i.is_main IS NULL)
            WHERE 1=1";
    $params = [];

    if ($category !== '') {
        $sql .= " AND LOWER(p.category) LIKE ?";
        $params[] = "%" . $category . "%";
    }

    if ($type !== '') {
        $sql .= " AND LOWER(p.type) = ?";
        $params[] = $type;
    }

    $sql .= " ORDER BY p.id DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $baseResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($baseResults)) {
        return [];
    }

    $locationResults = array_filter($baseResults, function ($item) use ($cleanLocation) {
        if ($cleanLocation === '') {
            return true;
        }
        $dbLocation = str_replace(' ', '', strtolower((string)($item['location'] ?? '')));
        return strpos($dbLocation, $cleanLocation) !== false;
    });

    $finalResults = array_filter($locationResults, function ($item) use ($optionSearch) {
        if ($optionSearch === '') {
            return true;
        }
        $dbOptions = str_replace(' ', '', strtolower((string)($item['options'] ?? '')));
        return strpos($dbOptions, $optionSearch) !== false;
    });

    if (!empty($finalResults)) {
        return array_values($finalResults);
    }
    if (!empty($locationResults) && $optionSearch === '') {
        return array_values($locationResults);
    }
    return [];
}

function getProjectImages($conn, $projectId) {
    $stmt = $conn->prepare("SELECT image_url, is_main FROM project_image WHERE project_id = ?");
    $stmt->execute([$projectId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getProjectFeatures($conn, $projectId) {
    $stmt = $conn->prepare("SELECT feature_name FROM project_feature WHERE project_id = ?");
    $stmt->execute([$projectId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function updateProject($conn, $data) {
    if (empty($data['id'])) {
        throw new Exception("Project ID is required.");
    }

    $stmt = $conn->prepare("UPDATE projects
        SET name=?, developer=?, location=?, price=?, size=?, category=?, type=?, options=?, status=?, details=?
        WHERE id=?");
    $stmt->execute([
        $data['name'] ?? '',
        $data['developer'] ?? '',
        $data['location'] ?? '',
        $data['price'] ?? '',
        $data['size'] ?? '',
        $data['category'] ?? '',
        $data['type'] ?? '',
        $data['options'] ?? '',
        $data['status'] ?? '',
        $data['details'] ?? '',
        $data['id']
    ]);

    return true;
}

function deleteProject($conn, $projectId) {
    $conn->beginTransaction();
    try {
        $imgSelect = $conn->prepare("SELECT image_url FROM project_image WHERE project_id = ?");
        $imgSelect->execute([$projectId]);
        $images = $imgSelect->fetchAll(PDO::FETCH_ASSOC);

        $projectFolder = '';
        foreach ($images as $img) {
            $relativePath = ltrim((string)$img['image_url'], '/\\');
            if ($relativePath === '') {
                continue;
            }

            $absolutePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath);
            if (file_exists($absolutePath) && is_file($absolutePath)) {
                unlink($absolutePath);
            }
            if ($projectFolder === '') {
                $projectFolder = dirname($absolutePath);
            }
        }

        if ($projectFolder !== '' && is_dir($projectFolder)) {
            $entries = array_diff(scandir($projectFolder), ['.', '..']);
            if (empty($entries)) {
                rmdir($projectFolder);
            }
        }

        $conn->prepare("DELETE FROM project_image WHERE project_id = ?")->execute([$projectId]);
        $conn->prepare("DELETE FROM project_feature WHERE project_id = ?")->execute([$projectId]);
        $conn->prepare("DELETE FROM projects WHERE id = ?")->execute([$projectId]);

        $conn->commit();
        return true;
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }
}