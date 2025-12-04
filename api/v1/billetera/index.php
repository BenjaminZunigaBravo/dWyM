<?php
// api/v1/billetera/index.php

// 1. Configuración de errores
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once '../version1.php';
include_once '../conexion.php';
include_once 'modelo.php';

// =======================================================================
// TRUCO DE MAGIA: Recuperar el Token si el servidor lo borró
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

// --- FUNCIÓN PARA VALIDAR EL TOKEN DINÁMICO ---
function validarToken($authHeader) {
    if (!$authHeader) return false;

    // 1. Quitamos la palabra "Bearer "
    $token = str_replace('Bearer ', '', $authHeader);
    
    // 2. Decodificamos el Base64
    $json = base64_decode($token);
    $data = json_decode($json, true);

    // 3. Verificamos si tiene ID y si no ha expirado
    if ($data && isset($data['id']) && isset($data['exp'])) {
        if ($data['exp'] > time()) {
            return $data['id']; // ¡Token Válido! Devolvemos el ID del usuario
        }
    }
    return false;
}

$usuarioIdDelToken = validarToken($_authorization);
$modelo = new Billetera();

// =======================================================================
// LÓGICA PRINCIPAL
// =======================================================================

if ($usuarioIdDelToken) { 
    // ¡SI EL TOKEN ES VÁLIDO, ENTRAMOS!

    switch ($_method) {
        // --- VER SALDO (GET) ---
        case 'GET':
            // Si piden por ID específico
            if ($_parametroID) {
                $unico = $modelo->getById($_parametroID);
                if($unico){
                    http_response_code(200);
                    echo json_encode($unico);
                } else {
                    http_response_code(404);
                    echo json_encode(['error' => 'No encontrado']);
                }
            } else { 
                // Si piden todos (o el del usuario actual)
                // Opcional: Podríamos filtrar aquí solo la billetera del usuario $usuarioIdDelToken
                $lista = $modelo->getAll();
                http_response_code(200);
                echo json_encode($lista);
            }
            break;

        // --- CARGAR / RETIRAR (POST) ---
        case 'POST':
            $body = json_decode(file_get_contents("php://input"), true);
            $accion = $body['accion'] ?? ''; 
            $monto = $body['monto'] ?? 0;
            
            // Usamos el ID que viene en el JSON (o podríamos forzar el del token por seguridad)
            $usuario_id = $body['usuario_id'] ?? $usuarioIdDelToken; 

            if ($monto <= 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Monto debe ser mayor a 0']);
                exit;
            }

            try {
                if ($accion === 'cargar') {
                    $resultado = $modelo->modificarSaldo($usuario_id, $monto, true); 
                    echo json_encode([
                        'mensaje' => 'Carga exitosa', 
                        'saldo' => $resultado['nuevo_saldo']
                    ]);
                } 
                elseif ($accion === 'retirar') {
                    $resultado = $modelo->modificarSaldo($usuario_id, $monto, false); 
                    echo json_encode([
                        'mensaje' => 'Retiro exitoso', 
                        'saldo' => $resultado['nuevo_saldo']
                    ]);
                } 
                else {
                    http_response_code(400);
                    echo json_encode(['error' => 'Acción no válida']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(['error' => $e->getMessage()]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Método no permitido']);
            break;
    }

} else {
    // SI EL TOKEN NO ES VÁLIDO
    http_response_code(403);
    echo json_encode([
        'error' => 'Prohibido: Token vencido o inválido',
        'debug' => 'El token recibido no se pudo decodificar correctamente.'
    ]);
}
?>