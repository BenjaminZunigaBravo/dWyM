<?php
// En billetera/modelo.php

class Billetera
{
    public function __construct() {}

    public function getAll()
    {
        $lista = [];
        try {
            $con = new Conexion();
            $query = "SELECT id, usuario_id, saldo, activo FROM billetera;";

            $rs = mysqli_query($con->getConnection(), $query);
            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;

                    //debemos trabajar con el objeto
                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'usuario' => [
                            'id' => intval($registro['usuario_id'])
                        ],
                        'saldo' => intval($registro['saldo']),
                        'activo' => $registro['activo']
                    ));
                }
                mysqli_free_result($rs);
            }
            $con->closeConnection();
        } catch (\Throwable $th) {
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
            
            // 1. SQL directo con WHERE
            $query = "SELECT id, usuario_id, saldo, activo FROM billetera WHERE id = ?;";
            $stmt = mysqli_prepare($db, $query);
            mysqli_stmt_bind_param($stmt, "i", $_id); 
            
            mysqli_stmt_execute($stmt);
            $rs = mysqli_stmt_get_result($stmt);

            if ($rs) {
                $fila = mysqli_fetch_assoc($rs);
                if ($fila) {
                    // 2. Arma el mismo objeto que tu getAll()
                    $registro = array(
                        'id' => intval($fila['id']),
                        'usuario' => [
                            'id' => intval($fila['usuario_id'])
                        ],
                        'saldo' => intval($fila['saldo']),
                        'activo' => $fila['activo'] == 1 ? true : false
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
// --- FUNCIÓN MODIFICADA PARA INCLUIR 'partida_id' ---
    public function modificarSaldo($usuario_id, $monto, $es_carga)
    {
        $con = new Conexion();
        $db = $con->getConnection();
        
        try {
            // 1. Iniciar Transacción
            mysqli_begin_transaction($db);

            // 2. Buscar billetera (bloqueando fila)
            $sql = "SELECT id, saldo FROM billetera WHERE usuario_id = ? LIMIT 1 FOR UPDATE";
            $stmt = mysqli_prepare($db, $sql);
            mysqli_stmt_bind_param($stmt, "i", $usuario_id);
            mysqli_stmt_execute($stmt);
            $res = mysqli_stmt_get_result($stmt);
            $billetera = mysqli_fetch_assoc($res);
            mysqli_stmt_close($stmt);

            if (!$billetera) {
                throw new Exception("Billetera no encontrada para este usuario.");
            }

            $billetera_id = $billetera['id'];
            $saldo_actual = floatval($billetera['saldo']);
            $monto_final = floatval($monto);

            // 3. Calcular nuevo saldo y definir Tipo de Historial
            if ($es_carga) {
                $nuevo_saldo = $saldo_actual + $monto_final;
                // REVISA EN TU BD: Si el ID para 'Carga' es 1, déjalo así.
                $tipo_historial = 4; 
            } else {
                if ($saldo_actual < $monto_final) {
                    throw new Exception("Saldo insuficiente.");
                }
                $nuevo_saldo = $saldo_actual - $monto_final;
                // REVISA EN TU BD: Si el ID para 'Retiro' es 2, déjalo así.
                $tipo_historial = 3; 
            }

            // 4. Actualizar Billetera
            $updateSql = "UPDATE billetera SET saldo = ? WHERE id = ?";
            $stmtUpdate = mysqli_prepare($db, $updateSql);
            mysqli_stmt_bind_param($stmtUpdate, "di", $nuevo_saldo, $billetera_id);
            if (!mysqli_stmt_execute($stmtUpdate)) {
                throw new Exception("Error actualizando saldo.");
            }
            mysqli_stmt_close($stmtUpdate);

            // 5. Guardar Historial (AQUÍ AGREGAMOS partida_id)
            $fecha = date('Y-m-d H:i:s');
            $activo = 1;
            $partida_id = null; // Es NULL porque es carga/retiro, no juego.

            // Consulta corregida con partida_id
            $insertHist = "INSERT INTO billetera_historial (billetera_id, fecha, tipo_id, monto, partida_id, activo) VALUES (?, ?, ?, ?, ?, ?)";
            $stmtHist = mysqli_prepare($db, $insertHist);
            
            // 'isidii' significa: int, string, int, double(decimal), int(o null), int
            mysqli_stmt_bind_param($stmtHist, "isidii", $billetera_id, $fecha, $tipo_historial, $monto_final, $partida_id, $activo);
            
            if (!mysqli_stmt_execute($stmtHist)) {
                throw new Exception("Error guardando historial.");
            }
            mysqli_stmt_close($stmtHist);

            // 6. Confirmar
            mysqli_commit($db);
            $con->closeConnection();

            return ['success' => true, 'nuevo_saldo' => $nuevo_saldo];

        } catch (Exception $e) {
            mysqli_rollback($db);
            $con->closeConnection();
            throw $e;
        }
    }
}
?>