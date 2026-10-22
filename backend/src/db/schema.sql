-- ===========================================================================
--  Portal de Servicio Médico — Esquema de base de datos
--  ---------------------------------------------------------------------------
--  IMPLEMENTACIÓN DE REFERENCIA CON DATOS SINTÉTICOS.
--  La empresa "Grupo Meridiano" y todos sus registros son ficticios.
--  Este esquema reproduce la arquitectura del sistema original, no su contenido.
-- ===========================================================================

CREATE DATABASE IF NOT EXISTS servicio_medico
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE servicio_medico;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------------- seguridad
DROP TABLE IF EXISTS usuarios;
CREATE TABLE usuarios (
  id_usuario      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_usuario   VARCHAR(120) NOT NULL,
  nombre_usuario  VARCHAR(120) NOT NULL,
  clave_hash      VARCHAR(100) NULL COMMENT 'NULL cuando la identidad vive en el directorio',
  id_rol          TINYINT UNSIGNED NOT NULL DEFAULT 3,
  token_activo    VARCHAR(512) NULL COMMENT 'Sesión única: el token vigente del usuario',
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_email (email_usuario),
  KEY ix_usuarios_token (token_activo(64))
) ENGINE=InnoDB;

DROP TABLE IF EXISTS roles;
CREATE TABLE roles (
  id_rol      TINYINT UNSIGNED NOT NULL,
  nombre_rol  VARCHAR(40) NOT NULL,
  PRIMARY KEY (id_rol)
) ENGINE=InnoDB;

-- --------------------------------------------------------------- catálogos
DROP TABLE IF EXISTS cargos;
CREATE TABLE cargos (
  id_cargo     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_cargo VARCHAR(120) NOT NULL,
  activo       TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_cargo),
  UNIQUE KEY uq_cargos_nombre (nombre_cargo)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS vicepresidencias;
CREATE TABLE vicepresidencias (
  id_vicepresidencia     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_vicepresidencia VARCHAR(120) NOT NULL,
  activo                 TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_vicepresidencia),
  UNIQUE KEY uq_vp_nombre (nombre_vicepresidencia)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS modalidades;
CREATE TABLE modalidades (
  id_modalidad     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_modalidad VARCHAR(60) NOT NULL,
  PRIMARY KEY (id_modalidad),
  UNIQUE KEY uq_modalidades_nombre (nombre_modalidad)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS diagnosticos;
CREATE TABLE diagnosticos (
  id_diagnostico     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_diagnostico VARCHAR(150) NOT NULL,
  activo             TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_diagnostico)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS patologias;
CREATE TABLE patologias (
  id_patologia     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_patologia VARCHAR(150) NOT NULL,
  activo           TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_patologia)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS especialidades;
CREATE TABLE especialidades (
  id_especialidad     SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_especialidad VARCHAR(120) NOT NULL,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_especialidad)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS tipos_reposo;
CREATE TABLE tipos_reposo (
  id_tipo_reposo SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_reposo  VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_tipo_reposo)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS categorias_reposo;
CREATE TABLE categorias_reposo (
  id_categoria_reposo SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_categoria    VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_categoria_reposo)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS medicamentos;
CREATE TABLE medicamentos (
  id_medicamento SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre         VARCHAR(150) NOT NULL,
  presentacion   VARCHAR(80) NOT NULL,
  activo         TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_medicamento)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS lotes;
CREATE TABLE lotes (
  id_lote           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo_lote       VARCHAR(40) NOT NULL,
  id_medicamento    SMALLINT UNSIGNED NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  cantidad          INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id_lote),
  UNIQUE KEY uq_lotes_codigo (codigo_lote),
  KEY ix_lotes_medicamento (id_medicamento),
  CONSTRAINT fk_lotes_medicamento FOREIGN KEY (id_medicamento)
    REFERENCES medicamentos (id_medicamento)
) ENGINE=InnoDB;

-- --------------------------------------------------------------- personal
DROP TABLE IF EXISTS colaboradores;
CREATE TABLE colaboradores (
  cedula              VARCHAR(15) NOT NULL,
  nombre              VARCHAR(150) NOT NULL,
  fecha_nacimiento    DATE NULL,
  id_cargo            SMALLINT UNSIGNED NULL,
  id_vicepresidencia  SMALLINT UNSIGNED NULL,
  tipo_nomina         VARCHAR(30) NULL,
  email               VARCHAR(120) NULL,
  telefono            VARCHAR(25) NULL,
  activo              TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (cedula),
  KEY ix_colaboradores_vp (id_vicepresidencia),
  CONSTRAINT fk_colab_cargo FOREIGN KEY (id_cargo) REFERENCES cargos (id_cargo),
  CONSTRAINT fk_colab_vp FOREIGN KEY (id_vicepresidencia)
    REFERENCES vicepresidencias (id_vicepresidencia)
) ENGINE=InnoDB;

-- --------------------------------------------------------------- consultas
DROP TABLE IF EXISTS consultas;
CREATE TABLE consultas (
  id_consulta            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  cedula                 VARCHAR(15) NOT NULL,
  fecha_consulta         DATE NOT NULL,
  edad                   TINYINT UNSIGNED NULL,
  id_cargo               SMALLINT UNSIGNED NULL,
  id_vicepresidencia     SMALLINT UNSIGNED NULL,
  tipo_nomina            VARCHAR(30) NULL,
  id_modalidad           TINYINT UNSIGNED NULL,

  -- Signos vitales
  tension                VARCHAR(10) NULL,
  tension_b              VARCHAR(10) NULL,
  frecuencia             SMALLINT NULL,
  temperatura            DECIMAL(4,1) NULL,
  respiracion            SMALLINT NULL,
  talla                  DECIMAL(5,2) NULL,
  peso                   DECIMAL(5,2) NULL,
  imc                    DECIMAL(5,2) NULL,

  -- Reposo
  flag_reposo            TINYINT(1) NOT NULL DEFAULT 0,
  id_tipo_reposo         SMALLINT UNSIGNED NULL,
  id_categoria_reposo    SMALLINT UNSIGNED NULL,
  dias_reposo            SMALLINT UNSIGNED NULL,
  fecha_desde            DATE NULL,
  fecha_hasta            DATE NULL,
  fecha_reintegro        DATE NULL,

  -- Contacto
  email_contacto         VARCHAR(120) NULL,
  telefono_contacto      VARCHAR(25) NULL,
  contacto_emergencia    VARCHAR(120) NULL,

  id_usuario             INT UNSIGNED NOT NULL,
  creado_en              TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id_consulta),
  KEY ix_consultas_cedula (cedula),
  KEY ix_consultas_fecha (fecha_consulta),
  KEY ix_consultas_modalidad (id_modalidad),
  -- Índice compuesto: cubre la búsqueda más frecuente del portal.
  KEY ix_consultas_busqueda (fecha_consulta, id_modalidad, cedula),
  CONSTRAINT fk_consultas_colaborador FOREIGN KEY (cedula)
    REFERENCES colaboradores (cedula),
  CONSTRAINT fk_consultas_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

DROP TABLE IF EXISTS consulta_diagnosticos;
CREATE TABLE consulta_diagnosticos (
  id_consulta     INT UNSIGNED NOT NULL,
  id_diagnostico  SMALLINT UNSIGNED NOT NULL,
  id_patologia    SMALLINT UNSIGNED NULL,
  id_especialidad SMALLINT UNSIGNED NULL,
  PRIMARY KEY (id_consulta, id_diagnostico),
  CONSTRAINT fk_cd_consulta FOREIGN KEY (id_consulta)
    REFERENCES consultas (id_consulta) ON DELETE CASCADE,
  CONSTRAINT fk_cd_diagnostico FOREIGN KEY (id_diagnostico)
    REFERENCES diagnosticos (id_diagnostico)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ===========================================================================
--  STORED PROCEDURES
--  Se mantiene el patrón de parámetros OUT (@codigo / @mensaje) del sistema
--  original: el SP reporta éxito o error de negocio en lugar de lanzar SQLSTATE.
-- ===========================================================================

DELIMITER $$

-- ----------------------------------------------------- catálogos (dropdowns)
DROP PROCEDURE IF EXISTS sp_catalogo_cargos $$
CREATE PROCEDURE sp_catalogo_cargos(OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al consultar cargos';
  END;

  SELECT id_cargo AS id, nombre_cargo AS nombre
    FROM cargos WHERE activo = 1 ORDER BY nombre_cargo;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

DROP PROCEDURE IF EXISTS sp_catalogo_vicepresidencias $$
CREATE PROCEDURE sp_catalogo_vicepresidencias(OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al consultar vicepresidencias';
  END;

  SELECT id_vicepresidencia AS id, nombre_vicepresidencia AS nombre
    FROM vicepresidencias WHERE activo = 1 ORDER BY nombre_vicepresidencia;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

-- Devuelve todos los catálogos en un solo viaje a la base de datos.
DROP PROCEDURE IF EXISTS sp_catalogo_subdatos $$
CREATE PROCEDURE sp_catalogo_subdatos(OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al consultar catálogos';
  END;

  SELECT id_diagnostico AS id, nombre_diagnostico AS nombre, 'diagnostico' AS tipo
    FROM diagnosticos WHERE activo = 1
  UNION ALL
  SELECT id_patologia, nombre_patologia, 'patologia'
    FROM patologias WHERE activo = 1
  UNION ALL
  SELECT id_especialidad, nombre_especialidad, 'especialidad'
    FROM especialidades WHERE activo = 1
  UNION ALL
  SELECT id_tipo_reposo, nombre_reposo, 'tipo_reposo'
    FROM tipos_reposo
  UNION ALL
  SELECT id_categoria_reposo, nombre_categoria, 'categoria_reposo'
    FROM categorias_reposo
  UNION ALL
  SELECT id_modalidad, nombre_modalidad, 'modalidad'
    FROM modalidades;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

DROP PROCEDURE IF EXISTS sp_catalogo_medicamentos $$
CREATE PROCEDURE sp_catalogo_medicamentos(OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al consultar medicamentos';
  END;

  SELECT id_medicamento AS id, CONCAT(nombre, ' — ', presentacion) AS nombre
    FROM medicamentos WHERE activo = 1 ORDER BY nombre;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

DROP PROCEDURE IF EXISTS sp_catalogo_lotes $$
CREATE PROCEDURE sp_catalogo_lotes(OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al consultar lotes';
  END;

  SELECT l.id_lote AS id, l.codigo_lote AS codigo, m.nombre AS medicamento,
         l.fecha_vencimiento AS vencimiento, l.cantidad
    FROM lotes l
    JOIN medicamentos m ON m.id_medicamento = l.id_medicamento
   WHERE l.cantidad > 0 AND l.fecha_vencimiento >= CURDATE()
   ORDER BY l.fecha_vencimiento;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

-- ----------------------------------------------------- datos del colaborador
DROP PROCEDURE IF EXISTS sp_datos_colaborador $$
CREATE PROCEDURE sp_datos_colaborador(IN p_cedula VARCHAR(15),
                                      OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE v_existe INT DEFAULT 0;

  IF p_cedula IS NULL OR p_cedula = '' THEN
    SET p_codigo = 2;
    SET p_mensaje = 'La cédula es obligatoria';
  ELSE
    -- Se consulta la existencia antes del SELECT: después de un SELECT, ROW_COUNT()
    -- devuelve -1 en MariaDB (salvo con SQL_CALC_FOUND_ROWS), por lo que usarlo como
    -- señal de "encontrado" deja pasar los casos de cédula inexistente.
    SELECT COUNT(*) INTO v_existe
      FROM colaboradores WHERE cedula = p_cedula AND activo = 1;

    IF v_existe = 0 THEN
      SET p_codigo = 3;
      SET p_mensaje = 'No existe un colaborador activo con esa cédula';
    ELSE
      SELECT c.cedula, c.nombre, c.id_cargo, c.id_vicepresidencia,
             c.tipo_nomina, c.email, c.telefono, c.fecha_nacimiento,
             ca.nombre_cargo, vp.nombre_vicepresidencia,
             TIMESTAMPDIFF(YEAR, c.fecha_nacimiento, CURDATE()) AS edad
        FROM colaboradores c
        LEFT JOIN cargos ca ON ca.id_cargo = c.id_cargo
        LEFT JOIN vicepresidencias vp ON vp.id_vicepresidencia = c.id_vicepresidencia
       WHERE c.cedula = p_cedula AND c.activo = 1;

      SET p_codigo = 0;
      SET p_mensaje = 'OK';
    END IF;
  END IF;
END $$

-- ----------------------------------------------------- consultas (CRUD)
DROP PROCEDURE IF EXISTS sp_buscar_consultas $$
CREATE PROCEDURE sp_buscar_consultas(
  IN p_cedula     VARCHAR(15),
  IN p_modalidad  INT,
  IN p_fecha      DATE,
  IN p_usuario    INT,
  OUT p_codigo    INT,
  OUT p_mensaje   VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al buscar consultas';
  END;

  SELECT  q.id_consulta,
          q.cedula,
          col.nombre            AS nombre_colaborador,
          q.fecha_consulta,
          q.edad,
          q.id_modalidad,
          m.nombre_modalidad    AS modalidad,
          ca.nombre_cargo       AS cargo,
          vp.nombre_vicepresidencia AS vicepresidencia,
          q.flag_reposo,
          q.dias_reposo,
          q.fecha_desde,
          q.fecha_hasta,
          -- Resumen de diagnósticos para el listado (evita el N+1 en el frontend).
          (SELECT GROUP_CONCAT(d.nombre_diagnostico SEPARATOR ' / ')
             FROM consulta_diagnosticos cd
             JOIN diagnosticos d ON d.id_diagnostico = cd.id_diagnostico
            WHERE cd.id_consulta = q.id_consulta) AS diagnosticos_resumen
  FROM consultas q
  LEFT JOIN colaboradores   col ON col.cedula = q.cedula
  LEFT JOIN modalidades     m   ON m.id_modalidad = q.id_modalidad
  LEFT JOIN cargos          ca  ON ca.id_cargo = q.id_cargo
  LEFT JOIN vicepresidencias vp ON vp.id_vicepresidencia = q.id_vicepresidencia
  WHERE (p_cedula IS NULL OR p_cedula = '' OR q.cedula = p_cedula)
    AND (p_modalidad IS NULL OR p_modalidad = 0 OR q.id_modalidad = p_modalidad)
    AND (p_fecha IS NULL OR q.fecha_consulta = p_fecha)
  ORDER BY q.fecha_consulta DESC, q.id_consulta DESC
  LIMIT 500;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

DROP PROCEDURE IF EXISTS sp_obtener_consulta $$
CREATE PROCEDURE sp_obtener_consulta(IN p_id_consulta INT UNSIGNED,
                                     OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  SELECT * FROM consultas WHERE id_consulta = p_id_consulta;

  SELECT cd.id_diagnostico, cd.id_patologia, cd.id_especialidad
    FROM consulta_diagnosticos cd
   WHERE cd.id_consulta = p_id_consulta;

  SET p_codigo = 0;
  SET p_mensaje = 'OK';
END $$

DROP PROCEDURE IF EXISTS sp_guardar_consulta $$
CREATE PROCEDURE sp_guardar_consulta(
  IN p_cedula VARCHAR(15), IN p_fecha DATE, IN p_edad INT,
  IN p_cargo INT, IN p_vp INT, IN p_nomina VARCHAR(30), IN p_modalidad INT,
  IN p_tension VARCHAR(10), IN p_tension_b VARCHAR(10), IN p_frecuencia INT,
  IN p_temperatura DECIMAL(4,1), IN p_respiracion INT, IN p_talla DECIMAL(5,2),
  IN p_peso DECIMAL(5,2), IN p_imc DECIMAL(5,2),
  IN p_flag_reposo TINYINT, IN p_tipo_reposo INT, IN p_categoria_reposo INT,
  IN p_dias_reposo INT, IN p_desde DATE, IN p_hasta DATE, IN p_reintegro DATE,
  IN p_email VARCHAR(120), IN p_telefono VARCHAR(25), IN p_contacto VARCHAR(120),
  IN p_usuario INT,
  OUT p_codigo INT, OUT p_mensaje VARCHAR(200), OUT p_id_nuevo INT)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al guardar la consulta';
    SET p_id_nuevo = 0;
  END;

  IF p_cedula IS NULL OR p_cedula = '' THEN
    SET p_codigo = 2; SET p_mensaje = 'La cédula es obligatoria'; SET p_id_nuevo = 0;
  ELSEIF p_fecha IS NULL THEN
    SET p_codigo = 2; SET p_mensaje = 'La fecha de la consulta es obligatoria'; SET p_id_nuevo = 0;
  ELSEIF NOT EXISTS (SELECT 1 FROM colaboradores WHERE cedula = p_cedula AND activo = 1) THEN
    SET p_codigo = 3; SET p_mensaje = 'El colaborador no existe o está inactivo'; SET p_id_nuevo = 0;
  ELSE
    INSERT INTO consultas (
      cedula, fecha_consulta, edad, id_cargo, id_vicepresidencia, tipo_nomina, id_modalidad,
      tension, tension_b, frecuencia, temperatura, respiracion, talla, peso, imc,
      flag_reposo, id_tipo_reposo, id_categoria_reposo, dias_reposo,
      fecha_desde, fecha_hasta, fecha_reintegro,
      email_contacto, telefono_contacto, contacto_emergencia, id_usuario
    ) VALUES (
      p_cedula, p_fecha, p_edad, p_cargo, p_vp, p_nomina, p_modalidad,
      p_tension, p_tension_b, p_frecuencia, p_temperatura, p_respiracion, p_talla, p_peso, p_imc,
      IFNULL(p_flag_reposo, 0), p_tipo_reposo, p_categoria_reposo, p_dias_reposo,
      p_desde, p_hasta, p_reintegro,
      p_email, p_telefono, p_contacto, p_usuario
    );

    SET p_id_nuevo = LAST_INSERT_ID();
    SET p_codigo = 0;
    SET p_mensaje = 'Consulta registrada correctamente';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_actualizar_consulta $$
CREATE PROCEDURE sp_actualizar_consulta(
  IN p_id_consulta INT UNSIGNED, IN p_edad INT,
  IN p_cargo INT, IN p_vp INT, IN p_nomina VARCHAR(30), IN p_modalidad INT,
  IN p_tension VARCHAR(10), IN p_tension_b VARCHAR(10), IN p_frecuencia INT,
  IN p_temperatura DECIMAL(4,1), IN p_respiracion INT, IN p_talla DECIMAL(5,2),
  IN p_peso DECIMAL(5,2), IN p_imc DECIMAL(5,2),
  IN p_flag_reposo TINYINT, IN p_tipo_reposo INT, IN p_categoria_reposo INT,
  IN p_dias_reposo INT, IN p_desde DATE, IN p_hasta DATE, IN p_reintegro DATE,
  IN p_email VARCHAR(120), IN p_telefono VARCHAR(25), IN p_contacto VARCHAR(120),
  OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al actualizar la consulta';
  END;

  IF NOT EXISTS (SELECT 1 FROM consultas WHERE id_consulta = p_id_consulta) THEN
    SET p_codigo = 4; SET p_mensaje = 'La consulta no existe';
  ELSE
    UPDATE consultas SET
      edad = p_edad, id_cargo = p_cargo, id_vicepresidencia = p_vp,
      tipo_nomina = p_nomina, id_modalidad = p_modalidad,
      tension = p_tension, tension_b = p_tension_b, frecuencia = p_frecuencia,
      temperatura = p_temperatura, respiracion = p_respiracion, talla = p_talla,
      peso = p_peso, imc = p_imc,
      flag_reposo = IFNULL(p_flag_reposo, 0), id_tipo_reposo = p_tipo_reposo,
      id_categoria_reposo = p_categoria_reposo, dias_reposo = p_dias_reposo,
      fecha_desde = p_desde, fecha_hasta = p_hasta, fecha_reintegro = p_reintegro,
      email_contacto = p_email, telefono_contacto = p_telefono,
      contacto_emergencia = p_contacto
    WHERE id_consulta = p_id_consulta;

    SET p_codigo = 0;
    SET p_mensaje = 'Consulta actualizada correctamente';
  END IF;
END $$

DROP PROCEDURE IF EXISTS sp_insertar_diagnostico $$
CREATE PROCEDURE sp_insertar_diagnostico(IN p_id_consulta INT UNSIGNED,
                                         IN p_diagnostico INT,
                                         IN p_patologia INT,
                                         IN p_especialidad INT)
BEGIN
  -- Se usa ON DUPLICATE KEY UPDATE (y no INSERT IGNORE) a propósito:
  -- IGNORE degrada a advertencia TODOS los errores de la sentencia, incluida una
  -- violación de clave foránea. Eso deja pasar un diagnóstico con un id inexistente
  -- sin propagar ningún error. ON DUPLICATE solo absorbe el choque de clave
  -- primaria (el diagnóstico repetido en la misma consulta) y deja que el resto
  -- de los errores de integridad sí suban y hagan rollback de la transacción.
  INSERT INTO consulta_diagnosticos (id_consulta, id_diagnostico, id_patologia, id_especialidad)
  VALUES (p_id_consulta, p_diagnostico, p_patologia, p_especialidad)
  ON DUPLICATE KEY UPDATE
    id_patologia = VALUES(id_patologia),
    id_especialidad = VALUES(id_especialidad);
END $$

DROP PROCEDURE IF EXISTS sp_eliminar_consulta $$
CREATE PROCEDURE sp_eliminar_consulta(IN p_id_consulta INT UNSIGNED,
                                      OUT p_codigo INT, OUT p_mensaje VARCHAR(200))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    SET p_codigo = 1;
    SET p_mensaje = 'Error al eliminar la consulta';
  END;

  IF EXISTS (SELECT 1 FROM consultas WHERE id_consulta = p_id_consulta) THEN
    DELETE FROM consultas WHERE id_consulta = p_id_consulta;
    SET p_codigo = 0;
    SET p_mensaje = 'Consulta eliminada correctamente';
  ELSE
    SET p_codigo = 4;
    SET p_mensaje = 'La consulta no existe';
  END IF;
END $$

DELIMITER ;
