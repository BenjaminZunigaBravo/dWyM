<?php
// api/v1/ruleta/index.php
// 1. Configuración de errores (IMPORTANTE: display_errors en 0 para no romper el JSON)
ini_set('display_errors', 0);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Rutas dinámicas (A prueba de balas)
$base = dirname(__DIR__); 

if (!file_exists($base . '/conexion.php') || !file_exists($base . '/version1.php')) {
    http_response_code(500);
    echo json_encode(['error' => 'Error: No se encuentran conexion.php o version1.php']);
    exit;
}

require_once $base . '/version1.php';
require_once $base . '/conexion.php';

// 3. Validar Token
$tokenReal = isset($_token_post) ? $_token_post : 'Bearer udp.2025';
$headers = getallheaders();
$auth = $headers['Authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

if ($auth !== $tokenReal) {
    http_response_code(401);
    echo json_encode(['error' => 'Token invalido', 'recibido' => $auth]);
    exit;
}

// 4. Leer datos
$json = file_get_contents("php://input");
$data = json_decode($json, true);

// 5. Validar datos
$uid = $data['usuario_id'] ?? null;
$bets = $data['apuestas'] ?? [];

if (!$uid || empty($bets)) {
    http_response_code(400);
    echo json_encode(['error' => 'Faltan datos (Usuario ID o Apuestas)']);
    exit;
}

// 6. Lógica del Juego
try {
    $cx = new Conexion();
    $db = $cx->getConnection();
    
    mysqli_begin_transaction($db);
    
    // Validar Saldo
    $total = 0;
    foreach($bets as $b) $total += (float)$b['amount'];
    
    $q = $db->prepare("SELECT id, saldo FROM billetera WHERE usuario_id = ? LIMIT 1 FOR UPDATE");
    $q->bind_param("i", $uid);
    $q->execute();
    $res = $q->get_result();
    $bill = $res->fetch_assoc();
    
    if (!$bill) throw new Exception("Usuario sin billetera");
    if ($bill['saldo'] < $total) throw new Exception("Saldo insuficiente");
    
    $bid = $bill['id'];
    
    // Cobrar
    $upd = $db->prepare("UPDATE billetera SET saldo = saldo - ? WHERE id = ?");
    $upd->bind_param("di", $total, $bid);
    $upd->execute();
    
    $hist = $db->prepare("INSERT INTO billetera_historial (billetera_id, monto, fecha, tipo_id, activo) VALUES (?, ?, NOW(), 2, 1)");
    $hist->bind_param("id", $bid, $total);
    $hist->execute();
    
    // Jugar
    $winNum = rand(0, 36);
    $ganancia = 0;
    $reds = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
    
    $isRed = in_array($winNum, $reds);
    $isBlack = !$isRed && $winNum !== 0;
    $isEven = ($winNum !== 0 && $winNum % 2 === 0);
    $isOdd = ($winNum !== 0 && $winNum % 2 !== 0);
    
    foreach($bets as $b) {
        $t = $b['category'];
        $v = $b['value'];
        $amt = (float)$b['amount'];
        $win = false;
        $m = 0;
        
        if ($t === 'pleno' && (int)$v === $winNum) { $win=true; $m=36; }
        elseif ($t === 'external') {
            if ($v === 'rojo' && $isRed) { $win=true; $m=2; }
            elseif ($v === 'negro' && $isBlack) { $win=true; $m=2; }
            elseif ($v === 'par' && $isEven) { $win=true; $m=2; }
            elseif ($v === 'impar' && $isOdd) { $win=true; $m=2; }
            elseif ($v === 'mitad1' && $winNum>=1 && $winNum<=18) { $win=true; $m=2; }
            elseif ($v === 'mitad2' && $winNum>=19 && $winNum<=36) { $win=true; $m=2; }
            elseif ($v === 'docena1' && $winNum>=1 && $winNum<=12) { $win=true; $m=3; }
            elseif ($v === 'docena2' && $winNum>=13 && $winNum<=24) { $win=true; $m=3; }
            elseif ($v === 'docena3' && $winNum>=25 && $winNum<=36) { $win=true; $m=3; }
        }
        if($win) $ganancia += ($amt * $m);
    }
    
    // Pagar
    if ($ganancia > 0) {
        $pay = $db->prepare("UPDATE billetera SET saldo = saldo + ? WHERE id = ?");
        $pay->bind_param("di", $ganancia, $bid);
        $pay->execute();
        
        $hwin = $db->prepare("INSERT INTO billetera_historial (billetera_id, monto, fecha, tipo_id, activo) VALUES (?, ?, NOW(), 5, 1)");
        $hwin->bind_param("id", $bid, $ganancia);
        $hwin->execute();
    }
    
    // Saldo Final
    $sf = $db->prepare("SELECT saldo FROM billetera WHERE id = ?");
    $sf->bind_param("i", $bid);
    $sf->execute();
    $final = $sf->get_result()->fetch_assoc()['saldo'];
    
    mysqli_commit($db);
    
    echo json_encode([
        'success' => true,
        'numero_ganador' => $winNum,
        'ganancia_total' => $ganancia,
        'saldo_nuevo' => $final,
        'total_apostado' => $total
    ]);
    
} catch (Exception $e) {
    mysqli_rollback($db);
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>