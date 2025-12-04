<?php

class JuegoOpcionApuesta
{
    public function __construct() {}

    public function getAll()
    {
        $lista = [];
        try {
            $con = new Conexion();
            $query = "SELECT id, nombre, pago, activo FROM juego_opcion_apuesta;";

            $rs = mysqli_query($con->getConnection(), $query);
            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;

                    //debemos trabajar con el objeto
                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'nombre' => $registro['nombre'],
                        // 'pago' => $registro['pago'] . ' a 1',
                        'pago' => intval($registro['pago']),
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
