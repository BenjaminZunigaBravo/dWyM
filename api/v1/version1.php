<?php
// ===== V1 bootstrap común =====
$_method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$_host = $_SERVER['HTTP_HOST'] ?? '';
$_uri  = $_SERVER['REQUEST_URI'] ?? '/';

// Headers/CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

if ($_method === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Parse path
$_uri_path = parse_url($_uri, PHP_URL_PATH);
$_partes_path = explode('/', trim($_uri_path, '/'));
$_parametroID = null;
$last = end($_partes_path);
if ($last !== false && is_numeric($last)) {
    $_parametroID = (int)$last;
}

// Query params
$_personaId = null;
if (isset($_SERVER['QUERY_STRING'])) {
    parse_str($_SERVER['QUERY_STRING'], $_QUERY);
    if (isset($_QUERY['personaId'])) $_personaId = (int)$_QUERY['personaId'];
}

// Authorization (no matamos acá; los endpoints decidirán)
$_authorization = null;
try {
    if (function_exists('getallheaders')) {
        $h = getallheaders();
        $_authorization = $h['Authorization'] ?? $h['authorization'] ?? null;
    } else {
        $_authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    }
} catch (Throwable $e) {
    $_authorization = null;
}

// Tokens fijos demo
$_token_get     = 'Bearer udp.2025';
$_token_post    = 'Bearer udp.2025';
$_token_patch   = 'Bearer udp.2025';
$_token_disable = 'Bearer udp.2025';
$_token_put     = 'Bearer udp.2025';
$_token_options = 'Bearer 2025.udp';
?>