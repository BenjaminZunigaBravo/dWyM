<?php

class PartidaDetalle
{
    public function __construct() {}

    public function getAll()
    {
        $lista = [];
        try {
            $con = new Conexion();
            $query = "  SELECT 
                            pardet.id id, 
                            partida_id,
                            opcion_id, opci.nombre opcion_nombre, opci.pago opcion_pago,
                            resultado_id, resu.nombre resultado_nombre,
                            pardet.fecha_hora, 
                            pardet.cantidad, 
                            pardet.monto, 
                            pardet.activo 
                        FROM partida_detalle pardet
                            INNER JOIN partida part ON (pardet.partida_id = part.id)
                            INNER JOIN juego_opcion_apuesta opci ON (pardet.opcion_id = opci.id)
                            INNER JOIN partida_resultado resu ON (pardet.resultado_id = resu.id)
                        ;";

            $rs = mysqli_query($con->getConnection(), $query);
            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;

                    //debemos trabajar con el objeto
                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'fecha' => $registro['fecha_hora'],
                        'partida' => [
                            'id' => intval($registro['partida_id'])
                        ],
                        'opcion' => [
                            'id' => intval($registro['opcion_id']),
                            'nombre' => $registro['opcion_nombre'],
                            'pago' => $registro['opcion_pago'],
                        ],
                        'resultado' => [
                            'id' => intval($registro['resultado_id']),
                            'nombre' => $registro['resultado_nombre'],
                        ],
                        'cantidad' => $registro['cantidad'],
                        'monto' => $registro['monto'],
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

    public function getById($_id)
    {
        try {
            $lista = $this->getAll();
            foreach ($lista as $buscado) {
                if ($buscado['id'] == $_id) {
                    return $buscado;
                }
            }
        } catch (\Throwable $th) {
            return null;
        }
        return null;
    }
}
