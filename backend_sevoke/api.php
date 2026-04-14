<?php
// 1. Force error reporting for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Database Connection
$host = "127.0.0.1";
$db_name = "u715656778_sevoke_realty"; 
$username = "u715656778_sevokerealty";       
$password = "Consultica@12345";        

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $request_type = $_GET['type'] ?? 'all';

    // --- 1. GET ALL PROPERTIES ---
    if ($request_type === 'properties') {
        $query = "SELECT p.*, i.image_url 
                  FROM property p 
                  LEFT JOIN property_image i ON p.id = i.property_id 
                  WHERE i.is_main = 1 OR i.is_main IS NULL
                  ORDER BY p.id DESC";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    } 
    
    
    // --- 6. FETCH IMAGES FOR SPECIFIC PROPERTY ---
    elseif ($request_type === 'images' && isset($_GET['listing_id'])) {
        $stmt = $conn->prepare("SELECT image_url, is_main FROM property_image WHERE property_id = ?");
        $stmt->execute([$_GET['listing_id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // --- 7. FETCH FEATURES FOR SPECIFIC PROPERTY ---
    elseif ($request_type === 'features' && isset($_GET['listing_id'])) {
        $stmt = $conn->prepare("SELECT feature_name FROM property_feature WHERE property_id = ?");
        $stmt->execute([$_GET['listing_id']]);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
    
    
    //search feature
  elseif ($request_type === 'search') {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);

    // 1. Prepare and Clean Search Data
    $category = strtolower(trim($data['category'] ?? ''));
    $type = strtolower(trim($data['type'] ?? ''));
    
    // Normalize BHK Search: "2 BHK" -> "2bhk", "BHK" (default) -> ""
    $rawBhk = strtolower($data['bhk'] ?? '');
    $bhkSearch = ($rawBhk === 'bhk') ? '' : str_replace(' ', '', $rawBhk);
    
    $rawLocation = $data['enteredLocation'] ?? '';
    $cleanLocation = str_replace(' ', '', strtolower($rawLocation));

    // 2. TIER 1: Match Category and Type (The Foundation)
    // Using p.category and p.type ensures we stay within the user's main choice (e.g., Residential/Resell)
    $sql = "SELECT p.*, i.image_url 
            FROM property p 
            LEFT JOIN property_image i ON p.id = i.property_id 
            AND (i.is_main = 1 OR i.is_main IS NULL)
            WHERE LOWER(p.category) = ? AND LOWER(p.type) = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->execute([$category, $type]);
    $baseResults = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // If no Category/Type matches, return 0 results immediately
    if (empty($baseResults)) {
        echo json_encode([]);
        exit;
    }

    // 3. TIER 2: Filter by Location (within the Category/Type results)
    $locationResults = array_filter($baseResults, function($item) use ($cleanLocation) {
        if (empty($cleanLocation)) return true;
        $dbLocation = str_replace(' ', '', strtolower($item['location']));
        return strpos($dbLocation, $cleanLocation) !== false;
    });

    // 4. TIER 3: Filter by BHK (within the results that passed the location filter)
    $finalResults = array_filter($locationResults, function($item) use ($bhkSearch) {
        if (empty($bhkSearch)) return true;
        // Match against 'name' column (e.g., "2bhk" in DB)
        $dbName = str_replace(' ', '', strtolower($item['name']));
        return strpos($dbName, $bhkSearch) !== false;
    });

    // 5. DECISION LOGIC:
    if (!empty($finalResults)) {
        // Return properties matching Category + Type + Location + BHK
        $output = array_values($finalResults);
    } elseif (!empty($locationResults) && empty($bhkSearch)) {
        // If they didn't specify a BHK, but location matched
        $output = array_values($locationResults);
    } else {
        // Return 0 properties if no specific match found after filtering
        $output = [];
    }

    echo json_encode($output);
}
    // --- 2. ADD PROPERTY ---
    elseif ($request_type === 'add_property' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        ob_start();
        $conn->beginTransaction();

        $stmt = $conn->prepare("INSERT INTO property (name, location, category, type,developer,availableOption, price_text, area_sqft, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $_POST['name'], $_POST['location'], $_POST['category'], 
            $_POST['type'],$_POST['developer'],$_POST['availableOption'], $_POST['price_text'], $_POST['area_sqft'], $_POST['description']
        ]);
        $property_id = $conn->lastInsertId();

        // Features
        if (isset($_POST['features']) && is_array($_POST['features'])) {
            $featStmt = $conn->prepare("INSERT INTO property_feature (property_id, feature_name) VALUES (?, ?)");
            foreach ($_POST['features'] as $feature) {
                if (!empty($feature)) $featStmt->execute([$property_id, $feature]);
            }
        }

        // Images
        if (isset($_FILES['images'])) {
            $folderName = strtolower(str_replace(' ', '_', $_POST['location']));
            $targetDir = "pimages/" . $folderName . "/";
            if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);

            $mainIndex = isset($_POST['main_index']) ? (int)$_POST['main_index'] : 0;
            $imgStmt = $conn->prepare("INSERT INTO property_image (property_id, image_url, is_main) VALUES (?, ?, ?)");

            foreach ($_FILES['images']['tmp_name'] as $key => $tmpName) {
                if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                    $originalName = basename($_FILES['images']['name'][$i]);
                    $fileName = uniqid() . "_" . $i . "_" . $originalName;
                    $targetFilePath = $targetDir . $fileName;
                    if (move_uploaded_file($tmpName, $targetFilePath)) {
                        $isMain = ($key === $mainIndex) ? 1 : 0;
                        $imgStmt->execute([$property_id, $targetFilePath, $isMain]);
                    }
                }
            }
        }
        ob_clean();
        $conn->commit();
        header('Content-Type: application/json');
        echo json_encode(["success" => true, "message" => "Property added!"]);
        exit;
    }

    // --- 3. DELETE PROPERTY (New) ---
   elseif ($request_type === 'delete_property' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (empty($_POST['id'])) throw new Exception("Property ID is required.");
    
    $conn->beginTransaction();
    $property_id = $_POST['id'];

    // 1. Get image paths
    $imgSelect = $conn->prepare("SELECT image_url FROM property_image WHERE property_id = ?");
    $imgSelect->execute([$property_id]);
    $images = $imgSelect->fetchAll(PDO::FETCH_ASSOC);

    $propertyFolder = ""; // To track the folder path

    foreach($images as $img) {
        $relativePath = $img['image_url']; 
        
        // Convert relative URL/path to a physical server path
        // $_SERVER['DOCUMENT_ROOT'] helps Hostinger find the exact file
        $absolutePath = $_SERVER['DOCUMENT_ROOT'] . '/' . ltrim($relativePath, '/');

        if (file_exists($absolutePath) && is_file($absolutePath)) {
            unlink($absolutePath);
        }

        // Capture the folder path (assuming images are in something like uploads/prop_10/)
        if (empty($propertyFolder)) {
            $propertyFolder = dirname($absolutePath);
        }
    }

    // 2. Optional: Delete the folder if it's empty
    if (!empty($propertyFolder) && is_dir($propertyFolder)) {
        // Only delete if the folder is empty to be safe
        $filesInDir = glob($propertyFolder . "/*");
        if (empty($filesInDir)) {
            rmdir($propertyFolder); 
        }
    }

    // 3. Delete DB Records (Your existing logic)
    $conn->prepare("DELETE FROM property_image WHERE property_id = ?")->execute([$property_id]);
    $conn->prepare("DELETE FROM property_feature WHERE property_id = ?")->execute([$property_id]);
    $stmt = $conn->prepare("DELETE FROM property WHERE id = ?");
    $stmt->execute([$property_id]);

    $conn->commit();
    echo json_encode(["success" => true, "message" => "Property and files deleted"]);
}

    // --- 4. UPDATE PROPERTY (New) ---
    elseif ($request_type === 'update_property' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        if (empty($_POST['id'])) throw new Exception("Property ID is required.");

        $stmt = $conn->prepare("UPDATE property SET name=?, location=?, category=?, type=?,developer=?,availableOption=?, price_text=?, area_sqft=?, description=? WHERE id=?");
        $stmt->execute([
            $_POST['name'], $_POST['location'], $_POST['category'], 
            $_POST['type'],$_POST['developer'],$_POST['availableOption'], $_POST['price_text'], $_POST['area_sqft'], $_POST['description'],
            $_POST['id']
        ]);

        echo json_encode(["success" => true, "message" => "Property updated successfully"]);
    }

    // --- 5. LOGIN ---
    elseif($request_type === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST'){
        $stmt = $conn->prepare("SELECT * FROM user WHERE username = ?");
        $stmt->execute([$_POST['username']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user && $_POST['password'] == $user['password']) {
            unset($user['password']); 
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Invalid credentials."]);
        }
    }

} catch (Exception $e) {
    if (isset($conn) && $conn->inTransaction()) $conn->rollBack();
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>