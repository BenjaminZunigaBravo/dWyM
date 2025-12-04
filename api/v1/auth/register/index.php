<?php
// api/v1/auth/register/index.php
// VERSIÓN PRO: REGISTRO + BONO DE BIENVENIDA ($10.000)

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include_once __DIR__ . '/../../version1.php';

if ($_method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

include_once __DIR__ . '/../../conexion.php';

$body = json_decode(file_get_contents("php://input", true), true);

// Datos
$username = trim($body['username'] ?? '');
$password = (string)($body['password'] ?? '');
$nombre   = trim($body['nombre'] ?? '');
$apellido = trim($body['apellido'] ?? '');
$correo   = trim($body['correo'] ?? '');
$fecha    = trim($body['fecha_nacimiento'] ?? NULL); 

if (!$username || !$password || !$nombre || !$correo) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan campos obligatorios']);
    exit;
}

$cx = new Conexion();
$db = $cx->getConnection();

// 1. Verificar Usuario duplicado
$sqlCheck = "SELECT id FROM usuario WHERE username = ? LIMIT 1";
$st = mysqli_prepare($db, $sqlCheck);
mysqli_stmt_bind_param($st, "s", $username);
mysqli_stmt_execute($st);
if (mysqli_stmt_fetch($st)) {
    http_response_code(409);
    echo json_encode(['error' => 'El usuario ya existe']);
    exit;
}
mysqli_stmt_close($st);

// --- INICIO TRANSACCIÓN ---
mysqli_begin_transaction($db);

try {
    // 2. INSERTAR PERSONA
    $sqlPersona = "INSERT INTO persona (nombre, apellido, correo, fecha_nacimiento, activo) VALUES (?, ?, ?, ?, 1)";
    $stP = mysqli_prepare($db, $sqlPersona);
    $fechaFinal = empty($fecha) ? NULL : $fecha;
    mysqli_stmt_bind_param($stP, "ssss", $nombre, $apellido, $correo, $fechaFinal);
    if (!mysqli_stmt_execute($stP)) throw new Exception("Error al crear persona: " . mysqli_error($db));
    $nuevoPersonaId = mysqli_insert_id($db);
    mysqli_stmt_close($stP);

    // 3. INSERTAR USUARIO
    // (Al hacer esto, tu TRIGGER crea la billetera con saldo 0 automáticamente)
    $sqlUsuario = "INSERT INTO usuario (username, password, persona_id, activo) VALUES (?, ?, ?, 1)";
    $stU = mysqli_prepare($db, $sqlUsuario);
    mysqli_stmt_bind_param($stU, "ssi", $username, $password, $nuevoPersonaId);
    if (!mysqli_stmt_execute($stU)) throw new Exception("Error al crear usuario: " . mysqli_error($db));
    $nuevoUsuarioId = mysqli_insert_id($db);
    mysqli_stmt_close($stU);

    // =======================================================================
    // 4. APLICAR BONO DE BIENVENIDA ($10.000)
    // =======================================================================
    
    // A) Primero recuperamos el ID de la billetera que creó el Trigger
    $sqlGetBill = "SELECT id FROM billetera WHERE usuario_id = ? LIMIT 1";
    $stGet = mysqli_prepare($db, $sqlGetBill);
    mysqli_stmt_bind_param($stGet, "i", $nuevoUsuarioId);
    mysqli_stmt_execute($stGet);
    $resGet = mysqli_stmt_get_result($stGet);
    $filaBilletera = mysqli_fetch_assoc($resGet);
    mysqli_stmt_close($stGet);

    if ($filaBilletera) {
        $billeteraId = $filaBilletera['id'];
        $montoBono = 10000;
        
        // B) Actualizamos el saldo de esa billetera
        // Sumamos el bono (generalmente 0 + 10000)
        $sqlUpdate = "UPDATE billetera SET saldo = saldo + ? WHERE id = ?";
        $stUp = mysqli_prepare($db, $sqlUpdate);
        mysqli_stmt_bind_param($stUp, "di", $montoBono, $billeteraId);
        if (!mysqli_stmt_execute($stUp)) throw new Exception("Error al cargar bono: " . mysqli_error($db));
        mysqli_stmt_close($stUp);

        // C) Guardamos el registro en el HISTORIAL
        // Usamos tipo_id = 1 (Según tu foto, 1 es 'Bono Bienvenida')
        // partida_id va como NULL porque no es una jugada
        $sqlHist = "INSERT INTO billetera_historial (billetera_id, fecha, tipo_id, monto, partida_id, activo) 
                    VALUES (?, NOW(), 1, ?, NULL, 1)";
        $stHist = mysqli_prepare($db, $sqlHist);
        mysqli_stmt_bind_param($stHist, "id", $billeteraId, $montoBono);
        if (!mysqli_stmt_execute($stHist)) throw new Exception("Error al guardar historial: " . mysqli_error($db));
        mysqli_stmt_close($stHist);
    } else {
        // Si por alguna razón el trigger falló, esto nos avisará
        throw new Exception("No se encontró la billetera automática para aplicar el bono.");
    }

    // --- FIN TRANSACCIÓN ---
    mysqli_commit($db);

    http_response_code(201);
    echo json_encode(['success' => 'Usuario registrado con Bono de Bienvenida!']);

} catch (Throwable $e) {
    mysqli_rollback($db);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>