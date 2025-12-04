<?php
// api/v1/billetera_historico/index.php

// 1. Mostrar errores por si acaso
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// 2. Includes necesarios
include_once '../version1.php';
include_once '../conexion.php';
include_once 'modelo.php';

// =======================================================================
// PARCHE: Recuperar el Token si el servidor lo borró
// =======================================================================
if (empty($_SERVER['HTTP_AUTHORIZATION'])) {
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        if (isset($headers['Authorization'])) {
            $_SERVER['HTTP_AUTHORIZATION'] = $headers['Authorization'];
        }
    }
}
$_authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

// =======================================================================
// FUNCIÓN: Validar que el token sea real y no haya vencido
// =======================================================================
function validarToken($authHeader) {
    if (!$authHeader) return false;

    // 1. Limpiar el string "Bearer "
    $token = str_replace('Bearer ', '', $authHeader);
    
    // 2. Decodificar
    $json = base64_decode($token);
    $data = json_decode($json, true);

    // 3. Verificar ID y Expiración
    if ($data && isset($data['id']) && isset($data['exp'])) {
        if ($data['exp'] > time()) {
            return $data['id']; // ¡Token Válido!
        }
    }
    return false;
}

// =======================================================================
// LÓGICA PRINCIPAL
// =======================================================================

// Verificamos el token
$usuarioIdValidado = validarToken($_authorization);

if ($usuarioIdValidado) {
    // --- USUARIO AUTORIZADO ---

    $modelo = new BilleteraHistorico();

    switch ($_method) {
        case 'GET':
            if ($_parametroID) {
                // Buscar uno específico
                $unico = $modelo->getById($_parametroID);
                if($unico){
                    http_response_code(200);
                    echo json_encode($unico);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'Movimiento no encontrado']);
                }
            } else { 
                // Traer todo el historial
                $lista = $modelo->getAll();
                http_response_code(200);
                echo json_encode($lista);
            }
            break;

        default:
            http_response_code(501);
            echo json_encode(['error' => 'Método no implementado']);
            break;
    }

} else {
    // --- USUARIO PROHIBIDO ---
    http_response_code(403);
    echo json_encode([
        'error' => 'Prohibido: Token vencido o inválido',
        'debug' => 'El token dinámico no coincide o expiró.'
    ]);
}
?>