-- Datos de conexion
-- host: db.hlhfqfoqiaugdbictpky.supabase.co
-- port: 5432
-- username: postgres
-- password: mariobross5625
--
-- NOTA PARA EL ASISTENTE (IA):
-- Para realizar consultas a la base de datos de manera fácil, 
-- utiliza el script de Node.js permanente que ya está configurado.
-- Comando: node scratch/query.js "AQUÍ_TU_CONSULTA_SQL"
-- Ejemplo: node scratch/query.js "SELECT COUNT(*) FROM trabajadores;"

-- Habilitar la extensión para generar UUIDs en PostgreSQL/Supabase
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABLA: trabajadores
-- ==========================================
-- Almacena la información de los empleados y sus tarifas específicas.
-- Según la transcripción, la hora extra y el pago de sábado no es una fórmula fija (ej. 1.5x),
-- sino que se define de manera individual para cada trabajador.
CREATE TABLE trabajadores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    pago_hora_regular DECIMAL(10, 2) DEFAULT 0.00,
    pago_hora_extra DECIMAL(10, 2) DEFAULT 0.00,
    pago_sabado DECIMAL(10, 2) DEFAULT 0.00,
    estatus VARCHAR(50) DEFAULT 'activo', -- Para saber si están activos o no
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: proyectos
-- ==========================================
-- Representa las casas o lugares de trabajo (ej. 1103 Lauren, Olímpic Boulevard, Avenida N, etc.).
CREATE TABLE proyectos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    estatus VARCHAR(50) DEFAULT 'activo',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: registros_tiempo
-- ==========================================
-- Registra el "labor" (mano de obra) diario.
-- Permite saber cuántas horas estuvo una persona en una casa en específico.
-- Ej: "Lunes a 9 horas en Avenida N".
CREATE TABLE registros_tiempo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    horas DECIMAL(5, 2) NOT NULL, -- Cantidad de horas invertidas en la propiedad ese día
    horas_extra DECIMAL(5, 2) DEFAULT 0.00,
    gasolina DECIMAL(10, 2) DEFAULT 0.00,
    tarifa_regular DECIMAL(10, 2),
    tarifa_extra DECIMAL(10, 2),
    tarifa_sabado DECIMAL(10, 2),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: nominas (Pagos semanales)
-- ==========================================
-- Sustituye la tabla de Excel para el cálculo del pago.
-- Registra las horas trabajadas en la semana, permisos, trabajo en sábado, extras (notas), etc.
CREATE TABLE nominas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trabajador_id UUID NOT NULL REFERENCES trabajadores(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL, -- Inicio de la semana a pagar
    fecha_fin DATE NOT NULL,    -- Fin de la semana a pagar
    trabajo_sabado BOOLEAN DEFAULT FALSE,
    horas_regulares DECIMAL(5, 2) DEFAULT 0.00,
    horas_extra DECIMAL(5, 2) DEFAULT 0.00,
    horas_permiso DECIMAL(5, 2) DEFAULT 0.00,
    monto_notas_extra DECIMAL(10, 2) DEFAULT 0.00, -- Adelantos, reparaciones, gasolina extra (ej. viaje a Mojave)
    notas TEXT, -- Explicación del monto extra (ej. "Factura máquina", "Mojave")
    total_pago DECIMAL(10, 2) DEFAULT 0.00, -- Total calculado a pagar en el cheque
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- TABLA: gastos_proyecto
-- ==========================================
-- Registra gastos adicionales que se le suman al costo de la casa/proyecto,
-- como por ejemplo la gasolina extra asignada a un proyecto por estar lejos (ej. Mojave).
CREATE TABLE gastos_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
    trabajador_id UUID REFERENCES trabajadores(id) ON DELETE SET NULL, -- Trabajador asociado al gasto, si aplica
    concepto VARCHAR(255) NOT NULL, -- Ej. 'Gasolina', 'Materiales'
    monto DECIMAL(10, 2) NOT NULL,
    fecha DATE NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- VISTAS
-- ==========================================



-- Vista: Horas trabajadas por persona en cada proyecto
-- Muestra el detalle de cuántas horas invirtió cada trabajador en cada casa.
CREATE OR REPLACE VIEW vista_horas_por_trabajador_proyecto AS
SELECT 
    p.nombre AS proyecto_nombre,
    t.nombre AS trabajador_nombre,
    SUM(rt.horas) AS total_horas
FROM registros_tiempo rt
JOIN proyectos p ON rt.proyecto_id = p.id
JOIN trabajadores t ON rt.trabajador_id = t.id
GROUP BY p.id, p.nombre, t.id, t.nombre;


-- ==========================================
-- QUERIES PARA VACIAR TABLAS (TRUNCATE)
-- ==========================================
-- Ejecutar para eliminar todos los registros manteniendo la estructura.
-- CASCADE eliminará en cadena los registros que dependan de estas tablas.

/*
TRUNCATE TABLE gastos_proyecto CASCADE;
TRUNCATE TABLE nominas CASCADE;
TRUNCATE TABLE registros_tiempo CASCADE;
TRUNCATE TABLE proyectos CASCADE;
TRUNCATE TABLE trabajadores CASCADE;
*/


-- ==========================================
-- QUERIES PARA ELIMINAR TABLAS Y VISTAS (DROP)
-- ==========================================
-- Ejecutar para destruir completamente las tablas, vistas y sus datos.

/*
DROP VIEW IF EXISTS vista_horas_por_trabajador_proyecto CASCADE;

DROP TABLE IF EXISTS gastos_proyecto CASCADE;
DROP TABLE IF EXISTS nominas CASCADE;
DROP TABLE IF EXISTS registros_tiempo CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS trabajadores CASCADE;
*/

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================
-- Habilitar RLS en todas las tablas
ALTER TABLE trabajadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_tiempo ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos_proyecto ENABLE ROW LEVEL SECURITY;

-- Crear políticas para permitir todas las operaciones (CRUD) a usuarios autenticados
CREATE POLICY "Permitir todo a usuarios autenticados" ON trabajadores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON proyectos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON registros_tiempo FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON nominas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Permitir todo a usuarios autenticados" ON gastos_proyecto FOR ALL TO authenticated USING (true) WITH CHECK (true);


