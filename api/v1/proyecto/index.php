<?php

include_once '../version1.php';

switch ($_method) {
    case 'GET':
        if ($_authorization === $_token_get) {
            $lista = [];
            //llamamos al archivo que contiene la clase conexion
            include_once '../conexion.php';
            include_once 'modelo.php';
            //se realiza la instancia al modelo
            $modelo = new Proyecto();
            $lista = $modelo->getAll();
            http_response_code(200);
            echo json_encode($lista);
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Prohibido']);
        }
        break;
    case 'POST':
        if ($_authorization === $_token_post) {
            include_once '../conexion.php';
            include_once 'modelo.php';
            //se realiza la instancia al modelo Indicador
            $modelo = new Proyecto();
            //se recuperan los datos RAW del body en formato JSON
            $body = json_decode(file_get_contents("php://input", true)); // json_decode -> transforma un JSON a un Objeto standar para trabajar
            //revisamos que podemos obtener el contenido del body
            // print_r($body);
            //asignar usando el modelo del objeto
            $modelo->setNombre($body->nombre);
            $modelo->setDescripcion($body->descripcion);
            $modelo->setIntegrantes($body->integrantes);
            $modelo->setUrl($body->url);
            //revisamos que tenemos los datos bien seteados en el modelo
            //print_r($modelo);
            //agrega el nuevo valor
            $respuesta = $modelo->add($modelo);
            if ($respuesta) {
                http_response_code(201);
                echo json_encode(['success' => 'Creado sin errores']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'No se logro crear']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Prohibido']);
        }
        break;
    case 'PUT':
        if ($_authorization === $_token_post) {
            include_once '../conexion.php';
            include_once 'modelo.php';
            //se realiza la instancia al modelo Indicador
            $modelo = new Proyecto();
            //se recuperan los datos RAW del body en formato JSON
            $body = json_decode(file_get_contents("php://input", true)); // json_decode -> transforma un JSON a un Objeto standar para trabajar
            //revisamos que podemos obtener el contenido del body
            //print_r($body);
            //print_r($_parametroID);
            //asignar usando el modelo del objeto
            $modelo->setId($_parametroID);
            $modelo->setNombre($body->nombre);
            $modelo->setDescripcion($body->descripcion);
            $modelo->setIntegrantes($body->integrantes);
            $modelo->setUrl($body->url);
            //revisamos que tenemos los datos bien seteados en el modelo
            //print_r($modelo);
            //pide modificar el nuevo valor
            $respuesta = $modelo->update($modelo);
            if ($respuesta) {
                http_response_code(202);
                echo json_encode(['success' => 'Actualizado sin errores']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'No se logro actualizar']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Prohibido']);
        }
        break;
    
    case 'DELETE':
        if ($_authorization === $_token_post) {
            include_once '../conexion.php';
            include_once 'modelo.php';
            //se realiza la instancia al modelo Indicador
            $modelo = new Proyecto();
            //se recuperan los datos RAW del body en formato JSON
            $body = json_decode(file_get_contents("php://input", true)); // json_decode -> transforma un JSON a un Objeto standar para trabajar
            $modelo->setId($_parametroID);
            $respuesta = $modelo->disable($modelo);
            if ($respuesta) {
                http_response_code(202);
                echo json_encode(['success' => 'Eliminado sin errores']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'No se logro insertar']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Prohibido']);
        }
        break;
    case 'PATCH':
        if ($_authorization === $_token_post) {
            include_once '../conexion.php';
            include_once 'modelo.php';
            //se realiza la instancia al modelo Indicador
            $modelo = new Proyecto();
            //se recuperan los datos RAW del body en formato JSON
            $body = json_decode(file_get_contents("php://input", true)); // json_decode -> transforma un JSON a un Objeto standar para trabajar
            $modelo->setId($_parametroID);
            $respuesta = $modelo->enable($modelo);
            if ($respuesta) {
                http_response_code(202);
                echo json_encode(['success' => 'Reactivado sin errores']);
            } else {
                http_response_code(403);
                echo json_encode(['error' => 'No se logro insertar']);
            }
        } else {
            http_response_code(403);
            echo json_encode(['error' => 'Prohibido']);
        }
        break;
    default:
        http_response_code(501);
        echo json_encode(['error' => 'No implementado']);
        break;
}