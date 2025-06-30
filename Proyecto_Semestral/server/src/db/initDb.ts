import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function initializeDatabase() {
    // Conexión a la base de datos postgres para crear la base de datos si no existe
    const mainPool = new Pool({
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '2347',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: 'postgres'
    });

    try {
        // Verificar si la base de datos existe
        const dbResult = await mainPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            ['weather_app']
        );

        // Crear la base de datos si no existe
        if (dbResult.rows.length === 0) {
            await mainPool.query('CREATE DATABASE weather_app');
            console.log('Base de datos weather_app creada');
        }

        await mainPool.end();

        // Conexión a la base de datos weather_app para crear tablas y poblar datos
        const appPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '2347',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            database: 'weather_app'
        });

        // Ejecutar el script de creación de tablas
        const sqlPath = path.join(__dirname, 'init.sql');
        const sqlFile = fs.readFileSync(sqlPath, 'utf8');
        await appPool.query(sqlFile);
        console.log('Tablas creadas correctamente');

        await appPool.end();
        console.log('Base de datos inicializada correctamente');
    } catch (error) {
        console.error('Error inicializando la base de datos:', error);
        throw error;
    }
}

// Ejecutar la inicialización
initializeDatabase().catch(console.error);