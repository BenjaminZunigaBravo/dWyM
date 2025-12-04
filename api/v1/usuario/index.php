<?php
// usuario/index.php

// Bootstrap común: headers, CORS, parse de path/query, autorización, tokens
include_once __DIR__ . '/../version1.php';

// Auth básica (token fijo demo). No repliques headers; ya están en version1.php
if ($_authorization !== $_token_get) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Dependencias
include_once __DIR__ . '/../conexion.php';
include_once __DIR__ . '/modelo.php';

// Modelo
$modelo = new Usuario();

// Solo GET para este recurso
if ($_method !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// ?username=...
if (isset($_GET['username']) && trim($_GET['username']) !== '') {
    $un = $modelo->getByUsername(trim($_GET['username']));
    if ($un) {
        http_response_code(200);
        echo json_encode($un, JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
    }
    exit;
}

// /usuario/{id}/
if (!is_null($_parametroID)) {
    $un = $modelo->getById($_parametroID);
    if ($un) {
        http_response_code(200);
        echo json_encode($un, JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Usuario no encontrado']);
    }
    exit;
}

// /usuario/ (lista)
$lista = $modelo->getAll();
http_response_code(200);
echo json_encode($lista, JSON_UNESCAPED_UNICODE);
