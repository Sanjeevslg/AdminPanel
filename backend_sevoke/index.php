<?php
require_once 'headers.php';
require_once 'login.php';
require_once 'db.php';
require_once 'property_actions.php';
require_once 'project_actions.php';

$type = $_GET['type'] ?? '';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function requestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }
    return $_POST;
}

try {
    switch ($type) {
        //login route
        case 'login':
            if($method!='POST'){
                http_response_code(405);
                echo json_encode(["success"=>false,"error"=>"Method not allowed kindly make a post request"]);
                break;
            }
            $data=requestData();
            $username=$data['username']??'';
            $password=$data['password']??'';
            $user=login($conn,$username,$password);
            echo json_encode(["success"=>true,"user"=>$user,"message"=>"login successful"]);
            break;

        // Property routes
        case 'properties':
            echo json_encode(getProperties($conn));
            break;

        case 'search_property':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            echo json_encode(searchProperties($conn, requestData()));
            break;

        case 'property_details':
            if (isset($_GET['id'])) {
                echo json_encode(getPropertyDetails($conn, $_GET['id']));
            }
            
            break;
         
        case 'add_property':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            $propertyId = addProperty($conn, $_POST, $_FILES);
            echo json_encode(["success" => true, "id" => $propertyId, "message" => "Property added"]);
            break;

        case 'update_property':
            if ($method !== 'POST' && $method !== 'PUT') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            updateProperty($conn, requestData());
            echo json_encode(["success" => true, "message" => "Property updated"]);
            break;

        case 'delete_property':
            if ($method !== 'POST' && $method !== 'DELETE') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            $data = requestData();
            $propertyId = $data['id'] ?? ($_GET['id'] ?? null);
            if (empty($propertyId)) {
                throw new Exception("Property ID is required.");
            }
            deleteProperty($conn, $propertyId);
            echo json_encode(["success" => true, "message" => "Property deleted"]);
            break;

        case 'property_images':
            $propertyId = $_GET['id'] ?? ($_GET['listing_id'] ?? null);
            if (empty($propertyId)) {
                throw new Exception("Property ID is required.");
            }
            echo json_encode(getPropertyImages($conn, $propertyId));
            break;

        case 'property_features':
            $propertyId = $_GET['id'] ?? ($_GET['listing_id'] ?? null);
            if (empty($propertyId)) {
                throw new Exception("Property ID is required.");
            }
            echo json_encode(getPropertyFeatures($conn, $propertyId));
            break;

        // Project routes
        case 'projects':
            echo json_encode(getProjects($conn));
            break;

        case 'project_details':
            if (isset($_GET['id'])) {
                echo json_encode(getProjectDetails($conn, $_GET['id']));
           }
            break;

        case 'search_project':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            echo json_encode(searchProjects($conn, requestData()));
            break;

        case 'add_project':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            $projectId = addProject($conn, $_POST, $_FILES);
            echo json_encode(["success" => true, "id" => $projectId, "message" => "Project added"]);
            break;

        case 'update_project':
            if ($method !== 'POST' && $method !== 'PUT') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            updateProject($conn, requestData());
            echo json_encode(["success" => true, "message" => "Project updated"]);
            break;

        case 'delete_project':
            if ($method !== 'POST' && $method !== 'DELETE') {
                http_response_code(405);
                echo json_encode(["success" => false, "error" => "Method not allowed"]);
                break;
            }
            $data = requestData();
            $projectId = $data['id'] ?? ($_GET['id'] ?? null);
            if (empty($projectId)) {
                throw new Exception("Project ID is required.");
            }
            deleteProject($conn, $projectId);
            echo json_encode(["success" => true, "message" => "Project deleted"]);
            break;

        case 'project_images':
            $projectId = $_GET['id'] ?? null;
            if (empty($projectId)) {
                throw new Exception("Project ID is required.");
            }
            echo json_encode(getProjectImages($conn, $projectId));
            break;

        case 'project_features':
            $projectId = $_GET['id'] ?? null;
            if (empty($projectId)) {
                throw new Exception("Project ID is required.");
            }
            echo json_encode(getProjectFeatures($conn, $projectId));
            break;

        default:
            echo json_encode(["message" => "Welcome to Sevoke Realty API"]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
