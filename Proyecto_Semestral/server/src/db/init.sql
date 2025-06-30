-- Verificar si la base de datos existe y crearla si no
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'weather_app') THEN
        CREATE DATABASE weather_app;
    END IF;
END
$$;

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_locations table if not exists
CREATE TABLE IF NOT EXISTS user_locations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create interests table if not exists
CREATE TABLE IF NOT EXISTS interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    climas_permitidos INT[] NOT NULL,
    temp_min INT NOT NULL,
    temp_max INT NOT NULL,
    viento_min INT NOT NULL,
    viento_max INT NOT NULL,
    humedad_min INT NOT NULL,
    humedad_max INT NOT NULL,
    vis_min_km INT NOT NULL,
    requiere_sin_lluvia BOOLEAN NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    estado BOOLEAN DEFAULT TRUE
);

-- Create user_interests junction table if not exists
CREATE TABLE IF NOT EXISTS user_interests (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, interest_id)
);
--tokens invalidos para el blacklist
CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    expira_en TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Verifica si la tabla está vacía
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM interests) THEN
        RAISE NOTICE 'Tabla vacía. Ejecutar el INSERT manualmente.';
    END IF;
END $$;