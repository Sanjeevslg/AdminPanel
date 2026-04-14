<?php 
try{
function login($conn,$username,$password){
    $query='select * from user where username=? and password=?';
    $stmt=$conn->prepare($query);
    $stmt->execute([$username,$password]);
    $user=$stmt->fetch(PDO::FETCH_ASSOC);
    if($user){
        return $user;
    }
    else{
        http_response_code(401);
        echo json_encode(["success"=>false,"message"=>"Invalid credentials"]);
    }
}
}catch(Exception $e){
    http_response_code(500);
    echo json_encode(["success"=>false,"message"=>$e->getMessage()]);
}