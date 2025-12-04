<?php
// api/v1/auth/login/index.php

// 1. Mostrar errores en pantalla (SOLO PARA DEPURAR SI SIGUE FALLANDO)
// Si ya funciona, puedes borrar estas 2 lineas despues:
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once __DIR__ . '/../../version1.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

include_once __DIR__ . '/../../conexion.php';

$body = json_decode(file_get_contents("php://input", true), true);

$username = trim($body['username'] ?? '');
$password = (string)($body['password'] ?? '');

if (!$username || !$password) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan credenciales']);
    exit;
}

$cx = new Conexion();
$db = $cx->getConnection();

// --- SQL CORREGIDO (SIN RUT) ---
$sql = "SELECT 
            u.id, 
            u.username, 
            u.password, 
            u.activo,
            u.persona_id,
            p.nombre, 
            p.apellido, 
            p.correo,       
            p.fecha_nacimiento 
        FROM usuario u
        LEFT JOIN persona p ON u.persona_id = p.id
        WHERE u.username = ? 
        LIMIT 1";

$st = mysqli_prepare($db, $sql);

if (!$st) {
    // Si falla la preparación del SQL, muestra por qué (Error 500)
    http_response_code(500);
    echo json_encode(['error' => 'Error SQL: ' . mysqli_error($db)]);
    exit;
}

mysqli_stmt_bind_param($st, "s", $username);
mysqli_stmt_execute($st);
$rs = mysqli_stmt_get_result($st);
$user = mysqli_fetch_assoc($rs);

if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Usuario no encontrado']);
    exit;
}

// Verificar contraseña (comparación simple según tu sistema actual)
if ($user['password'] !== $password) {
    http_response_code(401);
    echo json_encode(['error' => 'Contraseña incorrecta']);
    exit;
}

// Eliminar contraseña de la respuesta
unset($user['password']);

// Generar tokens
$accessToken  = base64_encode(json_encode(['id' => $user['id'], 'exp' => time() + 3600]));
$refreshToken = base64_encode(json_encode(['id' => $user['id'], 'exp' => time() + 86400]));

// Respuesta final
http_response_code(200);
echo json_encode([
    'message' => 'Login exitoso',
    'access_token' => $accessToken,
    'refresh_token' => $refreshToken,
    'user' => $user
], JSON_UNESCAPED_UNICODE);
?>