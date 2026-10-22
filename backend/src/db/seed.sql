-- ===========================================================================
--  Datos sintéticos — Grupo Meridiano (empresa ficticia)
--  Ningún registro corresponde a una persona, empresa o sistema real.
--  Contraseña de todos los usuarios de prueba: Demo1234!
--  (hash bcrypt con coste 10, generado para esta demo)
-- ===========================================================================

USE servicio_medico;
SET NAMES utf8mb4;

-- --------------------------------------------------------------- seguridad
INSERT INTO roles (id_rol, nombre_rol) VALUES
  (1, 'Administrador'),
  (2, 'Médico'),
  (3, 'Analista');

INSERT INTO usuarios (id_usuario, email_usuario, nombre_usuario, clave_hash, id_rol, activo) VALUES
  (1, 'ana.reyes@meridiano.local',    'Ana Reyes',    '$2b$10$Z6jQ3BnZYdjWlGQ0rZL67eb924y.mY.qJpMxw92MdHAuog/EvUfWi', 1, 1),
  (2, 'luis.pardo@meridiano.local',   'Luis Pardo',   '$2b$10$Z6jQ3BnZYdjWlGQ0rZL67eb924y.mY.qJpMxw92MdHAuog/EvUfWi', 2, 1),
  (3, 'marta.leon@meridiano.local',   'Marta León',   '$2b$10$Z6jQ3BnZYdjWlGQ0rZL67eb924y.mY.qJpMxw92MdHAuog/EvUfWi', 3, 1);

-- --------------------------------------------------------------- catálogos
INSERT INTO cargos (id_cargo, nombre_cargo) VALUES
  (1, 'Analista de Operaciones'),
  (2, 'Asistente Administrativo'),
  (3, 'Coordinador de Área'),
  (4, 'Ejecutivo de Atención al Cliente'),
  (5, 'Especialista de Sistemas'),
  (6, 'Gerente de Unidad'),
  (7, 'Supervisor de Planta'),
  (8, 'Técnico de Mantenimiento');

INSERT INTO vicepresidencias (id_vicepresidencia, nombre_vicepresidencia) VALUES
  (1, 'Vicepresidencia de Operaciones'),
  (2, 'Vicepresidencia de Tecnología'),
  (3, 'Vicepresidencia de Administración'),
  (4, 'Vicepresidencia Comercial'),
  (5, 'Vicepresidencia de Talento Humano');

INSERT INTO modalidades (id_modalidad, nombre_modalidad) VALUES
  (1, 'Consulta Presencial'),
  (2, 'Telemedicina'),
  (3, 'Consulta Ocupacional'),
  (4, 'Control y Seguimiento');

INSERT INTO diagnosticos (id_diagnostico, nombre_diagnostico) VALUES
  (1, 'Lumbalgia mecánica'),
  (2, 'Cefalea tensional'),
  (3, 'Rinofaringitis aguda'),
  (4, 'Hipertensión arterial controlada'),
  (5, 'Síndrome de túnel carpiano'),
  (6, 'Gastritis funcional'),
  (7, 'Conjuntivitis alérgica'),
  (8, 'Esguince de tobillo grado I');

INSERT INTO patologias (id_patologia, nombre_patologia) VALUES
  (1, 'Sin patología de base'),
  (2, 'Postural / ergonómica'),
  (3, 'Respiratoria'),
  (4, 'Cardiovascular'),
  (5, 'Musculoesquelética'),
  (6, 'Digestiva');

INSERT INTO especialidades (id_especialidad, nombre_especialidad) VALUES
  (1, 'Medicina General'),
  (2, 'Medicina Ocupacional'),
  (3, 'Traumatología'),
  (4, 'Oftalmología'),
  (5, 'Cardiología'),
  (6, 'Gastroenterología');

INSERT INTO tipos_reposo (id_tipo_reposo, nombre_reposo) VALUES
  (1, 'Reposo absoluto'),
  (2, 'Reposo relativo'),
  (3, 'Reposo post-quirúrgico');

INSERT INTO categorias_reposo (id_categoria_reposo, nombre_categoria) VALUES
  (1, 'Enfermedad común'),
  (2, 'Accidente laboral'),
  (3, 'Maternidad / Paternidad'),
  (4, 'Sin categoría');

INSERT INTO medicamentos (id_medicamento, nombre, presentacion) VALUES
  (1, 'Paracetamol',  'Tabletas 500 mg'),
  (2, 'Ibuprofeno',   'Tabletas 400 mg'),
  (3, 'Omeprazol',    'Cápsulas 20 mg'),
  (4, 'Loratadina',   'Tabletas 10 mg'),
  (5, 'Suero oral',   'Sobre 45 mEq');

INSERT INTO lotes (codigo_lote, id_medicamento, fecha_vencimiento, cantidad) VALUES
  ('LOT-2026-A001', 1, '2027-03-31', 480),
  ('LOT-2026-A002', 2, '2026-12-31', 260),
  ('LOT-2026-B001', 3, '2027-01-31', 150),
  ('LOT-2026-B002', 4, '2026-11-30',  90),
  ('LOT-2025-C003', 5, '2026-06-30',  40);

-- --------------------------------------------------------------- personal
INSERT INTO colaboradores (cedula, nombre, fecha_nacimiento, id_cargo, id_vicepresidencia, tipo_nomina, email, telefono) VALUES
  ('V-10000001', 'Andrés Salcedo',    '1992-03-14', 1, 1, 'Contratado',  'andres.salcedo@meridiano.local',  '+58 412-0000001'),
  ('V-10000002', 'Beatriz Ochoa',     '1985-07-22', 3, 2, 'Contratado',  'beatriz.ochoa@meridiano.local',   '+58 412-0000002'),
  ('V-10000003', 'Carlos Méndez',     '1997-11-02', 5, 2, 'Contratado',  'carlos.mendez@meridiano.local',   '+58 412-0000003'),
  ('V-10000004', 'Daniela Ríos',      '1988-01-30', 4, 4, 'Contratado',  'daniela.rios@meridiano.local',    '+58 412-0000004'),
  ('V-10000005', 'Eduardo Navas',     '1979-05-18', 7, 1, 'Obrero',      'eduardo.navas@meridiano.local',   '+58 412-0000005'),
  ('V-10000006', 'Fabiola Peraza',    '1981-09-09', 6, 3, 'Contratado',  'fabiola.peraza@meridiano.local',  '+58 412-0000006'),
  ('V-10000007', 'Gustavo Linares',   '1974-12-01', 8, 1, 'Obrero',      'gustavo.linares@meridiano.local', '+58 412-0000007'),
  ('V-10000008', 'Helena Bravo',      '1995-02-27', 2, 5, 'Contratado',  'helena.bravo@meridiano.local',    '+58 412-0000008');

-- --------------------------------------------------------------- consultas
INSERT INTO consultas (
  id_consulta, cedula, fecha_consulta, edad, id_cargo, id_vicepresidencia, tipo_nomina, id_modalidad,
  tension, tension_b, frecuencia, temperatura, respiracion, talla, peso, imc,
  flag_reposo, id_tipo_reposo, id_categoria_reposo, dias_reposo,
  fecha_desde, fecha_hasta, fecha_reintegro,
  email_contacto, telefono_contacto, contacto_emergencia, id_usuario, creado_en
) VALUES
  (1, 'V-10000001', '2026-09-02', 34, 1, 1, 'Contratado', 1,
   '120', '80', 72, 36.5, 16, 1.75, 82.00, 26.78,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'andres.salcedo@meridiano.local', '+58 412-0000001', 'María Salcedo', 2, '2026-09-02 09:14:00'),

  (2, 'V-10000002', '2026-09-05', 41, 3, 2, 'Contratado', 3,
   '118', '78', 68, 36.4, 15, 1.62, 61.50, 23.43,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'beatriz.ochoa@meridiano.local', '+58 412-0000002', 'Jorge Ochoa', 2, '2026-09-05 10:32:00'),

  (3, 'V-10000005', '2026-09-09', 47, 7, 1, 'Obrero', 1,
   '130', '85', 80, 36.8, 18, 1.70, 91.20, 31.56,
   1, 2, 2, 7, '2026-09-09', '2026-09-16', '2026-09-17',
   'eduardo.navas@meridiano.local', '+58 412-0000005', 'Rosa de Navas', 2, '2026-09-09 08:05:00'),

  (4, 'V-10000003', '2026-09-12', 29, 5, 2, 'Contratado', 2,
   '115', '75', 66, 36.2, 14, 1.78, 74.00, 23.36,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'carlos.mendez@meridiano.local', '+58 412-0000003', 'Lucía Méndez', 2, '2026-09-12 14:48:00'),

  (5, 'V-10000004', '2026-09-18', 38, 4, 4, 'Contratado', 1,
   '122', '81', 74, 36.6, 16, 1.66, 68.40, 24.82,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'daniela.rios@meridiano.local', '+58 412-0000004', 'Pedro Ríos', 3, '2026-09-18 11:20:00'),

  (6, 'V-10000007', '2026-09-23', 52, 8, 1, 'Obrero', 3,
   '135', '88', 82, 37.1, 19, 1.72, 88.00, 29.75,
   1, 2, 2, 14, '2026-09-23', '2026-10-07', '2026-10-08',
   'gustavo.linares@meridiano.local', '+58 412-0000007', 'Elena Linares', 2, '2026-09-23 07:52:00'),

  (7, 'V-10000006', '2026-10-01', 45, 6, 3, 'Contratado', 1,
   '128', '83', 76, 36.7, 17, 1.68, 79.30, 28.10,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'fabiola.peraza@meridiano.local', '+58 412-0000006', 'Ricardo Peraza', 2, '2026-10-01 09:40:00'),

  (8, 'V-10000008', '2026-10-06', 31, 2, 5, 'Contratado', 4,
   '110', '72', 64, 36.3, 14, 1.60, 55.80, 21.80,
   0, NULL, NULL, NULL, NULL, NULL, NULL,
   'helena.bravo@meridiano.local', '+58 412-0000008', 'Tomás Bravo', 3, '2026-10-06 15:10:00');

INSERT INTO consulta_diagnosticos (id_consulta, id_diagnostico, id_patologia, id_especialidad) VALUES
  (1, 1, 2, 1),
  (1, 3, 3, 1),
  (2, 2, 1, 1),
  (3, 1, 5, 3),
  (3, 8, 5, 3),
  (4, 5, 5, 3),
  (5, 2, 1, 1),
  (6, 4, 4, 5),
  (6, 1, 2, 3),
  (7, 6, 6, 6),
  (8, 7, 1, 4);
