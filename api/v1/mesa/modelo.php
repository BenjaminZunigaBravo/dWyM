<?php

class Mesa
{
    public function __construct() {}

    public function getAll()
    {
        $lista = [];
        try {
            $con = new Conexion();
            $query = "SELECT mesa.id id, mesa.nombre nombre, mesa.activo activo, monto_min, monto_max,
            mesa.juego_id juego_id, juego.nombre juego_nombre, juego.descripcion juego_descripcion, juego.reglas_url juego_reglas_url,
            mesa.estado_id estado_id, mees.nombre estado_nombre
            FROM mesa INNER JOIN juego ON (mesa.juego_id = juego.id)
            INNER JOIN mesa_estado mees ON (mesa.estado_id = mees.id)
            ;";

            $rs = mysqli_query($con->getConnection(), $query);
            if ($rs) {
                while ($registro = mysqli_fetch_assoc($rs)) {
                    $registro['activo'] = $registro['activo'] == 1 ? true : false;

                    //debemos trabajar con el objeto
                    array_push($lista, array(
                        'id' => intval($registro['id']),
                        'nombre' => $registro['nombre'],
                        'apuesta' => [
                            'minima' => intval($registro['monto_min']),
                            'maxima' => intval($registro['monto_max'])
                        ],
                        'juego' => [
                            'id' => intval($registro['juego_id']),
                            'nombre' => $registro['juego_nombre'],
                            'descripcion' => $registro['juego_descripcion'],
                            'reglas' => [
                                'url' => $registro['juego_reglas_url']
                            ],
                        ],
                        'estado' => [
                            'id' => intval($registro['estado_id']),
                            'nombre' => $registro['estado_nombre'],
                        ],
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
