<?php
// Put this file in the same folder as users.php (e.g. htdocs/ticketing-api/api/login.php)
require_once "../config/database.php";

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "fail", "message" => "Use POST to log in."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["status" => "fail", "message" => "Email and password are required."]);
    exit;
}

$db = (new Database())->getConnection();
$stmt = $db->prepare("SELECT user_id, name, email, role, password FROM Users WHERE email = ?");
$stmt->execute([$data['email']]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Accepts a hashed password (password_hash) or, for the current sample data, a plain-text match.
$ok = $user && (password_verify($data['password'], $user['password']) || hash_equals($user['password'], $data['password']));
if (!$ok) {
    http_response_code(401);
    echo json_encode(["status" => "fail", "message" => "Incorrect email or password."]);
    exit;
}

unset($user['password']);
ob_clean(); // Membersihkan sebarang output buffer yang boleh mencacatkan JSON
echo json_encode(["status" => "success", "data" => $user]);
exit;
?>