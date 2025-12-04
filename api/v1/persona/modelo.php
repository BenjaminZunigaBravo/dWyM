<?php
// En persona/modelo.php (LA VERSIÓN FINALMENTE CORRECTA XD)

class Persona
{
    // Incluye al otro Chef una sola vez
    public function __construct() {
        include_once '../documento_identidad/modelo.php';
    }
    
    // --- getAll() EFICIENTE Y REUTILIZA ---
    public function getAll()
    {
        $lista = [];
        $personas = []; // Guarda las personas por ID
        
        try {
            $con = new Conexion();
            $db = $con->getConnection();
            
            // 1. OBTENER TODAS LAS PERSONAS (Consulta 1)
            $queryPersonas = "SELECT id, activo FROM persona;";
            $rsPersonas = mysqli_query($db, $queryPersonas);

            if (!$rsPersonas || mysqli_num_rows($rsPersonas) == 0) {
                $con->closeConnection();
                return []; 
            }

            $listaIdsPersonas = []; // Guarda los IDs para la siguiente consulta
            while ($reg = mysqli_fetch_assoc($rsPersonas)) {
                $reg['activo'] = $reg['activo'] == 1 ? true : false;
                $personas[$reg['id']] = $reg; 
                $listaIdsPersonas[] = $reg['id']; 
            }
            mysqli_free_result($rsPersonas);
            
            // 2. OBTENER TODOS LOS DOCUMENTOS NECESARIOS (Consulta 2 - Usando el otro modelo)
            $documentosMap = []; // Guarda los documentos agrupados por persona_id
            if (!empty($listaIdsPersonas)) {
                $documentoModel = new DocumentoIdentidad();
                // ¡Llamamos a la NUEVA función que busca por VARIOS IDs!
                $documentosMap = $documentoModel->getByPersonaIds($listaIdsPersonas); 
            }
            
            // Cerramos conexión aquí, ya no la necesitamos más
            $con->closeConnection();

            // 3. UNIR LOS DATOS EN PHP (rápido)
            foreach ($personas as $id => $persona) {
                $lista[] = [
                    'id' => intval($id),
                    // Busca los documentos para esta persona en el mapa devuelto por getByPersonaIds
                    'documento_identidad' => $documentosMap[$id] ?? [], 
                    'activo' => $persona['activo']
                ];
            }

        } catch (\Throwable $th) {
            error_log("Error en Persona->getAll: " . $th->getMessage());
            if (isset($con) && $con->getConnection()) $con->closeConnection();
            return []; 
        }
        return $lista;
    }

    // --- getById() EFICIENTE Y REUTILIZA (Esta ya estaba bien) ---
    public function getById($_id)
    {
        $registro = null;
        try {
            $con = new Conexion();
            $db = $con->getConnection();
            
            // 1. OBTENER LA PERSONA (Consulta 1)
            $queryP = "SELECT id, activo FROM persona WHERE id = ?;";
            $stmtP = mysqli_prepare($db, $queryP);
            mysqli_stmt_bind_param($stmtP, "i", $_id);
            mysqli_stmt_execute($stmtP);
            $rsP = mysqli_stmt_get_result($stmtP);
            $persona = mysqli_fetch_assoc($rsP);
            mysqli_stmt_close($stmtP); 
            
            if ($persona) {
                // 2. USA AL OTRO CHEF para traer sus documentos (Consulta(s) 2)
                $documentoModel = new DocumentoIdentidad();
                $listaDocumentoIdentidad = $documentoModel->getByPersonaId($persona['id']); 

                // 3. Armar el objeto final
                $registro = [
                    'id' => intval($persona['id']),
                    'documento_identidad' => $listaDocumentoIdentidad, 
                    'activo' => $persona['activo'] == 1 ? true : false
                ];
            }
            
            $con->closeConnection(); 
            
        } catch (\Throwable $th) {
            error_log("Error en Persona->getById: " . $th->getMessage());
             if (isset($con) && $con->getConnection()) $con->closeConnection();
            return null;
        }
        return $registro; 
    }
}
?>