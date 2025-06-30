import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación

    // Obtener datos del usuario
    const userResult = await pool.query(
      `SELECT u.id, u.name, u.email, array_agg(i.name) as interests
       FROM users u
       LEFT JOIN user_interests ui ON u.id = ui.user_id
       LEFT JOIN interests i ON ui.interest_id = i.id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(userResult.rows[0]);
  } catch (err) {
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ error: 'Error al obtener perfil de usuario' });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  const client = await pool.connect();
  try {
    const userId = req.user.id;
    const { name, email, password } = req.body;

    await client.query('BEGIN');

    // Actualizar datos básicos del usuario
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await client.query(
        'UPDATE users SET name = $1, email = $2, password = $3 WHERE id = $4',
        [name, email, hashedPassword, userId]
      );
    } else {
      await client.query(
        'UPDATE users SET name = $1, email = $2 WHERE id = $3',
        [name, email, userId]
      );
    }

    await client.query('COMMIT');

    res.json({ message: 'Perfil actualizado correctamente' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ error: 'Error al actualizar perfil de usuario' });
  } finally {
    client.release();
  }
};