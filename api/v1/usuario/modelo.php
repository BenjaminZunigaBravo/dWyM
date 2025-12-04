<?php
// usuario/modelo.php
class Usuario {


  public function __construct() {
    $cx = new Conexion();
    $this->cn = $cx->getConnection(); // tu clase ya muere con die() si falla
    mysqli_set_charset($this->cn, 'utf8');
  }

  public function getAll(int $limit = 100) {
    $out = [];
    $limit = max(1, min($limit, 1000));
    $sql = "SELECT id, username, password, persona_id, activo
            FROM usuario
            ORDER BY id ASC
            LIMIT $limit";
    $rs = mysqli_query($this->cn, $sql);
    if ($rs) {
      while ($row = mysqli_fetch_assoc($rs)) {
        $row['id']         = (int)$row['id'];
        $row['persona_id'] = (int)$row['persona_id'];
        $row['activo']     = (bool)$row['activo'];
        $out[] = $row;
      }
      mysqli_free_result($rs);
    }
    return $out;
  }

  public function getById($id) {
    $sql = "SELECT id, username, password, persona_id, activo
            FROM usuario
            WHERE id = ?
            LIMIT 1";
    $st = mysqli_prepare($this->cn, $sql);
    if (!$st) throw new Exception('Prepare falló: '.mysqli_error($this->cn));
    mysqli_stmt_bind_param($st, 'i', $id);
    mysqli_stmt_execute($st);
    $rs  = mysqli_stmt_get_result($st);
    $row = $rs ? mysqli_fetch_assoc($rs) : null;
    if ($rs) mysqli_free_result($rs);
    mysqli_stmt_close($st);

    if ($row) {
      $row['id']         = (int)$row['id'];
      $row['persona_id'] = (int)$row['persona_id'];
      $row['activo']     = (bool)$row['activo'];
      return $row;
    }
    return null;
  }

  public function getByUsername($username) {
    $sql = "SELECT id, username, password, persona_id, activo
            FROM usuario
            WHERE username = ?
            LIMIT 1";
    $st = mysqli_prepare($this->cn, $sql);
    if (!$st) throw new Exception('Prepare falló: '.mysqli_error($this->cn));
    mysqli_stmt_bind_param($st, 's', $username);
    mysqli_stmt_execute($st);
    $rs  = mysqli_stmt_get_result($st);
    $row = $rs ? mysqli_fetch_assoc($rs) : null;
    if ($rs) mysqli_free_result($rs);
    mysqli_stmt_close($st);

    if ($row) {
      $row['id']         = (int)$row['id'];
      $row['persona_id'] = (int)$row['persona_id'];
      $row['activo']     = (bool)$row['activo'];
      return $row;
    }
    return null;
  }
}
