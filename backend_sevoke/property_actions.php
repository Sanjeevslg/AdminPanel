<?php
// Functions for individual property listings
function getProperties($conn) {
    $query = "SELECT p.*, i.image_url FROM property p 
              LEFT JOIN property_image i ON p.id = i.property_id 
              WHERE i.is_main = 1 OR i.is_main IS NULL 
              ORDER BY p.id DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getPropertyDetails($conn, $id) {
    // 1. Get Basic Info
    $stmt = $conn->prepare("SELECT * FROM property WHERE id = ?");
    $stmt->execute([$id]);
    $property = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$property) return null;

    // 2. Get All Images
    $stmt = $conn->prepare("SELECT image_url, is_main FROM property_image WHERE property_id = ?");
    $stmt->execute([$id]);
    $property['images'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Get All Features
    $stmt = $conn->prepare("SELECT feature_name FROM property_feature WHERE property_id = ?");
    $stmt->execute([$id]);
    $property['features'] = $stmt->fetchAll(PDO::FETCH_COLUMN); // FETCH_COLUMN gives a simple array of strings

    return $property;
}

function addProperty($conn, $data, $files) {
    $conn->beginTransaction();
    try {
        // Supports both local schema and legacy payload keys used in api.php.
        $stmt = $conn->prepare("INSERT INTO property 
            (name, location, category, subcategory, type, listing_type, price_text, area_sqft, description) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        
        $stmt->execute([
            $data['name'] ?? '',
            $data['location'] ?? '',
            $data['category'] ?? '',
            $data['subcategory'] ?? ($data['developer'] ?? ''),
            $data['type'] ?? '',
            $data['listing_type'] ?? ($data['availableOption'] ?? ''),
            $data['price_text'] ?? '',
            $data['area_sqft'] ?? '',
            $data['description'] ?? ''
        ]);
        $propertyId = $conn->lastInsertId();

        if (isset($data['features']) && is_array($data['features'])) {
            $featStmt = $conn->prepare("INSERT INTO property_feature (property_id, feature_name) VALUES (?, ?)");
            foreach ($data['features'] as $feature) {
                $feature = trim((string)$feature);
                if ($feature !== '') {
                    $featStmt->execute([$propertyId, $feature]);
                }
            }
        }

        if (isset($files['images']) && isset($files['images']['tmp_name']) && is_array($files['images']['tmp_name'])) {
            $targetDir = __DIR__ . DIRECTORY_SEPARATOR . 'pimages' . DIRECTORY_SEPARATOR . 'property' . DIRECTORY_SEPARATOR . $propertyId . DIRECTORY_SEPARATOR;
            if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                throw new Exception("Failed to create image directory.");
            }

            $mainIndex = isset($data['main_index']) ? (int)$data['main_index'] : 0;
            $imgStmt = $conn->prepare("INSERT INTO property_image (property_id, image_url, is_main) VALUES (?, ?, ?)");

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

                $relativePath = 'pimages/property/' . $propertyId . '/' . $fileName;
                $isMain = ($key === $mainIndex) ? 1 : 0;
                $imgStmt->execute([$propertyId, $relativePath, $isMain]);
            }
        }

        $conn->commit();
        return $propertyId;
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }
}

function searchProperties($conn, $filters) {
    $category = strtolower(trim((string)($filters['category'] ?? '')));
    $type = strtolower(trim((string)($filters['type'] ?? '')));
    $rawBhk = strtolower(trim((string)($filters['bhk'] ?? '')));
    $bhkSearch = ($rawBhk === 'bhk') ? '' : str_replace(' ', '', $rawBhk);
    $cleanLocation = str_replace(' ', '', strtolower((string)($filters['enteredLocation'] ?? '')));

    $sql = "SELECT p.*, i.image_url 
            FROM property p 
            LEFT JOIN property_image i ON p.id = i.property_id 
            AND (i.is_main = 1 OR i.is_main IS NULL)
            WHERE LOWER(p.category) = ? AND LOWER(p.type) = ?";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$category, $type]);
    $baseResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($baseResults)) {
        return [];
    }

    $locationResults = array_filter($baseResults, function($item) use ($cleanLocation) {
        if ($cleanLocation === '') {
            return true;
        }
        $dbLocation = str_replace(' ', '', strtolower((string)$item['location']));
        return strpos($dbLocation, $cleanLocation) !== false;
    });

    $finalResults = array_filter($locationResults, function($item) use ($bhkSearch) {
        if ($bhkSearch === '') {
            return true;
        }
        $dbName = str_replace(' ', '', strtolower((string)$item['name']));
        return strpos($dbName, $bhkSearch) !== false;
    });

    if (!empty($finalResults)) {
        return array_values($finalResults);
    }
    if (!empty($locationResults) && $bhkSearch === '') {
        return array_values($locationResults);
    }
    return [];
}

function getPropertyImages($conn, $propertyId) {
    $stmt = $conn->prepare("SELECT image_url, is_main FROM property_image WHERE property_id = ?");
    $stmt->execute([$propertyId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function getPropertyFeatures($conn, $propertyId) {
    $stmt = $conn->prepare("SELECT feature_name FROM property_feature WHERE property_id = ?");
    $stmt->execute([$propertyId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function deleteProperty($conn, $propertyId) {
    $conn->beginTransaction();
    try {
        $imgSelect = $conn->prepare("SELECT image_url FROM property_image WHERE property_id = ?");
        $imgSelect->execute([$propertyId]);
        $images = $imgSelect->fetchAll(PDO::FETCH_ASSOC);

        $propertyFolder = '';
        foreach ($images as $img) {
            $relativePath = ltrim((string)$img['image_url'], '/\\');
            if ($relativePath === '') {
                continue;
            }

            $absolutePath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $relativePath);
            if (file_exists($absolutePath) && is_file($absolutePath)) {
                unlink($absolutePath);
            }
            if ($propertyFolder === '') {
                $propertyFolder = dirname($absolutePath);
            }
        }

        if ($propertyFolder !== '' && is_dir($propertyFolder)) {
            $entries = array_diff(scandir($propertyFolder), ['.', '..']);
            if (empty($entries)) {
                rmdir($propertyFolder);
            }
        }

        $conn->prepare("DELETE FROM property_image WHERE property_id = ?")->execute([$propertyId]);
        $conn->prepare("DELETE FROM property_feature WHERE property_id = ?")->execute([$propertyId]);
        $conn->prepare("DELETE FROM property WHERE id = ?")->execute([$propertyId]);

        $conn->commit();
        return true;
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        throw $e;
    }
}

function updateProperty($conn, $data) {
    if (empty($data['id'])) {
        throw new Exception("Property ID is required.");
    }

    $stmt = $conn->prepare("UPDATE property 
        SET name=?, location=?, category=?, subcategory=?, type=?, listing_type=?, price_text=?, area_sqft=?, description=? 
        WHERE id=?");
    $stmt->execute([
        $data['name'] ?? '',
        $data['location'] ?? '',
        $data['category'] ?? '',
        $data['subcategory'] ?? ($data['developer'] ?? ''),
        $data['type'] ?? '',
        $data['listing_type'] ?? ($data['availableOption'] ?? ''),
        $data['price_text'] ?? '',
        $data['area_sqft'] ?? '',
        $data['description'] ?? '',
        $data['id']
    ]);

    return true;
}