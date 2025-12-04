<?php
class BilleteraHistorico {
    private $conn;
    private $table_name = "billetera_historial";

    public function __construct() {
        $db = new Conexion();
        $this->conn = $db->getConnection();
    }

    public function getAll() {
        global $usuarioIdValidado; 

        // 1. Buscamos el ID de la Billetera del usuario logueado
        $sqlBill = "SELECT id FROM billetera WHERE usuario_id = ? LIMIT 1";
        $stmtBill = $this->conn->prepare($sqlBill);
        $stmtBill->bind_param("i", $usuarioIdValidado);
        $stmtBill->execute();
        $res = $stmtBill->get_result();
        $fila = $res->fetch_assoc();
        
        if (!$fila) return []; // Si no tiene billetera, devolvemos vacío
        
        $billeteraId = $fila['id'];

        // 2. HACEMOS EL CRUCE (JOIN) CON TUS NOMBRES DE COLUMNA EXACTOS
        // Usamos t.nombre y t.suma porque así se llaman en tu foto 'image_9fb3e6.png'
        $sql = "SELECT 
                    h.id, 
                    h.monto, 
                    h.fecha, 
                    h.tipo_id,
                    t.nombre AS titulo,    /* Columna 'nombre' de tu tabla de tipos */
                    t.suma  AS es_positivo /* Columna 'suma' de tu tabla de tipos */
                FROM " . $this->table_name . " h
                INNER JOIN bill_hist_reg_tipo t ON h.tipo_id = t.id
                WHERE h.billetera_id = ? 
                ORDER BY h.fecha DESC";

        $stmt = $this->conn->prepare($sql);
        $stmt->bind_param("i", $billeteraId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return $data;
    }

    public function getById($id) {
        return null;
    }
}
?>