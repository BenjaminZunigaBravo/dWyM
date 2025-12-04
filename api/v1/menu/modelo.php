<?php

/*
CREATE TABLE menu(
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(50) NOT NULL,
    sesion tinyint(1) NOT NULL,
    url VARCHAR(100) NOT NULL,
    activo tinyint(1) NOT NULL
);
*/

class Menu
{
    private $id;
    private $nombre;
    private $descripcion;
    private $sesion;
    private $url;
    private $activo;

    public function __construct() {}

    public function getId()
    {
        return intval($this->id);
    }
    public function getNombre()
    {
        return $this->nombre;
    }
    public function getDescripcion()
    {
        return $this->descripcion;
    }
    public function getSesion()
    {
        return $this->sesion;
    }
    public function getUrl()
    {
        return $this->url;
    }
    public function isActivo() //solo para booleanos
    {
        return $this->activo;
    }
    //mutadores
    
    public function setId($_n)
    {
        $this->id = $_n;
    }
    public function setNombre($_n)
    {
        $this->nombre = $_n;
    }
    public function setDescripcion($_n)
    {
        $this->descripcion = $_n;
    }
    public function setSesion($_n)
    {
        $this->sesion = $_n;
    }
    public function setUrl($_n)
    {
        $this->url = $_n;
    }
    public function setActivo($_n)
    {
        $this->activo = $_n;
    }
    
    public function getAll()
    {
        $lista = [];
        $con = new Conexion();
        $query = "SELECT id, nombre, descripcion, sesion, url, activo FROM menu;";
        
        $rs = mysqli_query($con->getConnection(), $query);
        if ($rs) {
            while ($registro = mysqli_fetch_assoc($rs)) {
                
                $registro['activo'] = $registro['activo'] == 1 ? true : false;

                $tupla = new Menu();
                $tupla->setId($registro['id']);
                $tupla->setNombre($registro['nombre']);
                $tupla->setDescripcion($registro['descripcion']);
                $tupla->setSesion($registro['sesion']);
                $tupla->setUrl($registro['url']);
                $tupla->setActivo($registro['activo']);

                //debemos trabajar con el objeto
                array_push($lista, array(
                    'id' => $tupla->getId(),
                    'nombre' => $tupla->getNombre(),
                    'descripcion' => $tupla->getDescripcion(),
                    'sesion' => $tupla->getSesion(),
                    'url' => $tupla->getUrl(),
                    'activo' => $tupla->isActivo()
                ));
            }
            mysqli_free_result($rs);
        }
        $con->closeConnection();
        return $lista;
    }

    public function add(Menu $_nuevo)
    {
        $con = new Conexion();
        
        $query = "INSERT INTO menu (nombre, descripcion, sesion, url, activo) VALUES ('".$_nuevo->getNombre()."', '".$_nuevo->getDescripcion()."', '".$_nuevo->getSesion()."', '".$_nuevo->getUrl()."', '1');";
        
        $rs = mysqli_query($con->getConnection(), $query);
        $con->closeConnection();
        if ($rs) {
            return true;
        }
        
        return false;
    }

    public function update(Menu $_nuevo)
    {
        $con = new Conexion();
        $query = "UPDATE menu SET nombre='".$_nuevo->getNombre()."', descripcion = '".$_nuevo->getDescripcion()."', sesion = '".$_nuevo->getSesion()."', url = '".$_nuevo->getUrl()."' WHERE id = " . $_nuevo->getId();
        // echo $query;
        $rs = mysqli_query($con->getConnection(), $query);
        $con->closeConnection();
        if ($rs) {
            return true;
        }
        return false;
    }

    public function disable(Menu $_nuevo)
    {
        $con = new Conexion();
        $query = "UPDATE menu SET activo = 0 WHERE id = " . $_nuevo->getId();
        $rs = mysqli_query($con->getConnection(), $query);
        $con->closeConnection();
        if ($rs) {
            return true;
        }
        return false;
    }
    
    public function enable(Menu $_nuevo)
    {
        $con = new Conexion();
        $query = "UPDATE menu SET activo = 1 WHERE id = " . $_nuevo->getId();
        $rs = mysqli_query($con->getConnection(), $query);
        $con->closeConnection();
        if ($rs) {
            return true;
        }
        return false;
    }

    public function reset()
    {
        $con = new Conexion();
        $query = "TRUNCATE TABLE menu;";
        $rs = mysqli_query($con->getConnection(), $query);
        $con->closeConnection();
        if ($rs) {
            return true;
        }
        return false;
    }
}