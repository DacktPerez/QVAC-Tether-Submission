-- Deshabilitar claves foráneas temporalmente para evitar conflictos en la creación
PRAGMA foreign_keys = ON;

-- 1. Tabla: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    identificacion TEXT UNIQUE,
    telefono TEXT,
    email TEXT,
    direccion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: equipos
CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    nombre_equipo TEXT NOT NULL,
    modelo TEXT,
    numero_serie TEXT UNIQUE,
    tipo TEXT, -- Ej: 'Médico', 'Laboratorio', 'Monitoreo'
    estado TEXT DEFAULT 'Activo',
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes (id) ON DELETE CASCADE
);

-- 3. Tabla: observaciones
CREATE TABLE IF NOT EXISTS observaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    equipo_id INTEGER NOT NULL,
    tecnico_nombre TEXT,
    detalles TEXT NOT NULL,
    audio_transcripcion TEXT, -- Para almacenar la transcripción de Whisper
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos (id) ON DELETE CASCADE
);

-- 4. Tabla: preguntas_seguimiento
CREATE TABLE IF NOT EXISTS preguntas_seguimiento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    observacion_id INTEGER NOT NULL,
    pregunta TEXT NOT NULL,
    respuesta_ia TEXT, -- Respuesta o análisis generado por el LLM
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (observacion_id) REFERENCES observaciones (id) ON DELETE CASCADE
);