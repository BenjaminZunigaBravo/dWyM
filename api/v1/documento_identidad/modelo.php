<?php
// En documento_identidad/modelo.php

class DocumentoIdentidad
{
    public function __construct() {}

    public function getByPersonaId($_personaId)
    {
        $lista = [];
        try {
            $con = new Conexion();
            $db = $con->getConnection();

            // --- CORRECCIÓN AQUÍ: Añadido docid.persona_id ---
            $query = "
                SELECT
                    docid.id id,
                    docid.persona_id, -- AÑADIDO
                    docid.valor valor,
                    docid.nombres nombres,
                    docid.apellido_paterno apellido_paterno,
                    docid.apellido_materno apellido_materno,
                    docid.orden_apeliido_id orden_apellido_id,
                    apor.nombre orden_apellido_nombre,
                    docid.nacionalidad_id nacionalidad_id,
                    naci.nombre nacionalidad_nombre,
                    docid.genero_id genero_id,
                    gene.nombre genero_nombre,
                    docid.documento_tipo_id tipo_id,
                    tipo.nombre tipo_nombre,
                    docid.activo activo
                FROM documento_identidad docid
                    INNER JOIN apellido_orden apor ON docid.orden_apeliido_id = apor.id
                    INNER JOIN nacionalidad naci ON (docid.nacionalidad_id = naci.id)
                    INNER JOIN genero gene ON (docid.genero_id = gene.id)
                    INNER JOIN documento_identidad_tipo tipo ON (docid.documento_tipo_id = tipo.id)
                WHERE docid.persona_id = ?;
            ";

            $stmt = mysqli_prepare($db, $query);
            mysqli_stmt_bind_param($stmt, "i", $_personaId);

            mysqli_stmt_execute($stmt);
            $rs = mysqli_stmt_get_result($stmt);

            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;

                    // El array_push sigue igual, no necesita el persona_id aquí
                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'valor' => $registro['valor'],
                        'nombres' => $registro['nombres'],
                        'apellidos' => [
                            'materno' => $registro['apellido_materno'],
                            'paterno' => $registro['apellido_paterno'],
                            'orden' => [
                                'id' => intval($registro['orden_apellido_id']),
                                'nombre' => $registro['orden_apellido_nombre']
                            ]
                        ],
                        'nacionalidad' => [
                            'id' => intval($registro['nacionalidad_id']),
                            'nombre' => $registro['nacionalidad_nombre']
                        ],
                        'genero' => [
                            'id' => intval($registro['genero_id']),
                            'nombre' => $registro['genero_nombre']
                        ],
                        'tipo' => [
                            'id' => intval($registro['tipo_id']),
                            'nombre' => $registro['tipo_nombre']
                        ],
                        'activo' => $registro['activo']
                    ));
                }
                mysqli_free_result($rs);
            }
            mysqli_stmt_close($stmt);
            $con->closeConnection();
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return $lista;
        }
        return $lista;
    }

    public function getByPersonaIds(array $_personaIds)
    {
        $lista = [];
        // Si el array de IDs está vacío, no hay nada que buscar
        if (empty($_personaIds)) {
            return $lista;
        }

        try {
            $con = new Conexion();
            $db = $con->getConnection();

            // Convierte el array [1, 2, 3] en el string "1,2,3" para SQL
            $idsString = implode(',', $_personaIds);

            // La misma consulta, pero con "WHERE IN (...)"
            $query = "
                SELECT 
                    docid.id id, docid.persona_id, docid.valor valor, docid.nombres nombres,
                    docid.apellido_paterno apellido_paterno, docid.apellido_materno apellido_materno,
                    docid.orden_apeliido_id orden_apellido_id, apor.nombre orden_apellido_nombre,
                    docid.nacionalidad_id nacionalidad_id, naci.nombre nacionalidad_nombre,
                    docid.genero_id genero_id, gene.nombre genero_nombre,
                    docid.documento_tipo_id tipo_id, tipo.nombre tipo_nombre,
                    docid.activo activo
                FROM documento_identidad docid
                    INNER JOIN apellido_orden apor ON docid.orden_apeliido_id = apor.id
                    INNER JOIN nacionalidad naci ON (docid.nacionalidad_id = naci.id)
                    INNER JOIN genero gene ON (docid.genero_id = gene.id)
                    INNER JOIN documento_identidad_tipo tipo ON (docid.documento_tipo_id = tipo.id)
                WHERE docid.persona_id IN ($idsString); -- WHERE IN para buscar varios
            ";

            // No usamos prepared statements con IN porque es más complejo, 
            // pero como los IDs vienen de nuestra propia consulta anterior, es seguro.
            $rs = mysqli_query($db, $query);

            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;
                    // Agrupamos por persona_id para que sea fácil buscar después
                    $personaIdActual = $registro['persona_id'];
                    if (!isset($lista[$personaIdActual])) {
                        $lista[$personaIdActual] = [];
                    }
                    // Armamos el objeto documento
                    $lista[$personaIdActual][] = array( /* ... la misma estructura JSON ... */ ); 
                }
                mysqli_free_result($rs);
            }
            $con->closeConnection();
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return []; // Devolvemos vacío en caso de error
        }
        // Devuelve un array ASOCIATIVO: [ personaId => [doc1, doc2], ...]
        return $lista; 
    }
}
?>



