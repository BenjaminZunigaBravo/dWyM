<?php
// En billetera_registro_historico_tipo/modelo.php

class BilleteraRegistroHistoricoTipo
{
    public function __construct() {}

    public function getAll()
    {
        $lista = [];
        try {
            $con = new Conexion();
            // El nombre de tu tabla es bill_hist_reg_tipo
            $query = "SELECT id, nombre, suma, activo FROM bill_hist_reg_tipo;"; 

            $rs = mysqli_query($con->getConnection(), $query);
            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;
                    $registro['suma'] = $registro['suma'] == 1 ? true : false; // Asumo que 'suma' es un booleano (1 o 0)

                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'nombre' => $registro['nombre'],
                        // Tu código original lo convierte a int, pero 'suma' (1/0)
                        // probablemente deba ser booleano, igual que 'activo'.
                        // Lo dejaré como booleano para que sea más lógico.
                        'suma' => $registro['suma'], 
                        'activo' => $registro['activo']
                    ));
                }
                mysqli_free_result($rs);
            }
            $con->closeConnection();
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return $lista;
        }
        return $lista;
    }

    // --- FUNCIÓN 'getById' CORREGIDA (EFICIENTE) ---
    public function getById($_id)
    {
        $registro = null;
        try {
            $con = new Conexion();
            $db = $con->getConnection(); 
            
            $query = "SELECT id, nombre, suma, activo FROM bill_hist_reg_tipo WHERE id = ?;";
            $stmt = mysqli_prepare($db, $query);
            mysqli_stmt_bind_param($stmt, "i", $_id); 
            
            mysqli_stmt_execute($stmt);
            $rs = mysqli_stmt_get_result($stmt);

            if ($rs) {
                $fila = mysqli_fetch_assoc($rs);
                if ($fila) {
                    $fila['activo'] = $fila['activo'] == 1 ? true : false;
                    $fila['suma'] = $fila['suma'] == 1 ? true : false; // Igual que en getAll

                    $registro = array(
                        'id' => intval($fila['id']),
                        'nombre' => $fila['nombre'],
                        'suma' => $fila['suma'],
                        'activo' => $fila['activo']
                    );
                }
                mysqli_free_result($rs);
            }
            mysqli_stmt_close($stmt);
            $con->closeConnection();
        } catch (\Throwable $th) {
            error_log($th->getMessage());
            return null;
        }
        return $registro; // Retorna el objeto encontrado o null
    }
}
?>