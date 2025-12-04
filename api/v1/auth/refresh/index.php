<?php
include_once __DIR__ . '/../../version1.php';

if ($_method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

$body = json_decode(file_get_contents("php://input", true), true);
$refresh = (string)($body['refresh_token'] ?? '');

if ($refresh !== 'udp.2025.refresh') {
    http_response_code(401);
    echo json_encode(['error' => 'refresh token inválido']);
    exit;
}

echo json_encode([
    'access_token' => 'udp.2025',
    'token_type' => 'Bearer',
    'expires_in' => 3600
]);
?>