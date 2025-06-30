import { Request, Response } from 'express';
import pool from '../config/database';


// Crear una nueva actividad de interés
export const createInterest = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const {
    name,
    climas_permitidos = [0],
    temp_min = 0,
    temp_max = 30,
    viento_min = 0,
    viento_max = 20,
    humedad_min = 0,
    humedad_max = 100,
    vis_min_km = 0,
    requiere_sin_lluvia = false,
    descripcion = null
  } = req.body;

  if (!userId || !name || !Array.isArray(climas_permitidos)) {
    return res.status(400).json({ error: 'Faltan campos requeridos o inválidos' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertInterest = await client.query(
      `INSERT INTO interests 
      (name, climas_permitidos, temp_min, temp_max, viento_min, viento_max, 
       humedad_min, humedad_max, vis_min_km, requiere_sin_lluvia, descripcion) 
      VALUES 
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING id, name`,
      [
        name,
        climas_permitidos,
        temp_min,
        temp_max,
        viento_min,
        viento_max,
        humedad_min,
        humedad_max,
        vis_min_km,
        requiere_sin_lluvia,
        descripcion
      ]
    );

    const interestId = insertInterest.rows[0].id;

    await client.query(
      `INSERT INTO user_interests (user_id, interest_id) VALUES ($1, $2)`,
      [userId, interestId]
    );

    await client.query('COMMIT');

    res.status(201).json({ message: 'Actividad creada y asignada al usuario', interest: insertInterest.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear la actividad y asignarla:', err);
    res.status(500).json({ error: 'Error al crear la actividad' });
  } finally {
    client.release();
  }
};

// Cambia parametros de una actividad de interés
export const updateInterest = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    climas_permitidos,
    temp_min,
    temp_max,
    viento_min,
    viento_max,
    humedad_min,
    humedad_max,
    vis_min_km,
    requiere_sin_lluvia,
    descripcion,
    estado
  } = req.body;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID inválido de actividad' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) {
    fields.push(`name = $${idx++}`);
    values.push(name);
  }
  if (climas_permitidos !== undefined) {
    fields.push(`climas_permitidos = $${idx++}`);
    values.push(climas_permitidos);
  }
  if (temp_min !== undefined) {
    fields.push(`temp_min = $${idx++}`);
    values.push(temp_min);
  }
  if (temp_max !== undefined) {
    fields.push(`temp_max = $${idx++}`);
    values.push(temp_max);
  }
  if (viento_min !== undefined) {
    fields.push(`viento_min = $${idx++}`);
    values.push(viento_min);
  }
  if (viento_max !== undefined) {
    fields.push(`viento_max = $${idx++}`);
    values.push(viento_max);
  }
  if (humedad_min !== undefined) {
    fields.push(`humedad_min = $${idx++}`);
    values.push(humedad_min);
  }
  if (humedad_max !== undefined) {
    fields.push(`humedad_max = $${idx++}`);
    values.push(humedad_max);
  }
  if (vis_min_km !== undefined) {
    fields.push(`vis_min_km = $${idx++}`);
    values.push(vis_min_km);
  }
  if (requiere_sin_lluvia !== undefined) {
    fields.push(`requiere_sin_lluvia = $${idx++}`);
    values.push(requiere_sin_lluvia);
  }
  if (descripcion !== undefined) {
    fields.push(`descripcion = $${idx++}`);
    values.push(descripcion);
  }
  if (estado !== undefined) {
    fields.push(`estado = $${idx++}`);
    values.push(estado);
  }

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
  }

  const query = `
    UPDATE interests
    SET ${fields.join(', ')}
    WHERE id = $${idx}
    RETURNING *;
  `;

  values.push(id);

  try {
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.status(200).json({
      message: 'Actividad actualizada correctamente',
      updated: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar la actividad:', err);
    res.status(500).json({ error: 'Error al actualizar la actividad' });
  }
};

// Elimina una actividad de interés
export const deleteInterest = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID inválido de la actividad' });
  }

  try {
    await pool.query('DELETE FROM user_interests WHERE interest_id = $1', [id]);
    const result = await pool.query('DELETE FROM interests WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    res.status(200).json({ message: 'Actividad eliminada correctamente', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error al eliminar actividad:', err);
    res.status(500).json({ error: 'Error al eliminar la actividad' });
  }
};

// Obtiene todas las actividades de interés de un usuario
export const getUserInterests = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) 
    return res.status(401).json({ error: 'Usuario no autenticado' });
  try {
    const result = await pool.query(`
      SELECT i.*
      FROM interests i
      INNER JOIN user_interests ui ON ui.interest_id = i.id
      WHERE ui.user_id = $1
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las actividades del usuario' });
  }
};

// Obtiene las actividades de interés activas de un usuario
export const getOnUserInterests = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ error: 'Usuario no autenticado' });

  try {
    const result = await pool.query(`
      SELECT i.*
      FROM interests i
      INNER JOIN user_interests ui ON ui.interest_id = i.id
      WHERE ui.user_id = $1 AND i.estado = TRUE
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las actividades activas del usuario' });
  }
};

// Actualiza el estado de una actividad de interés (activada/desactivada)
export const updateInterestState = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ error: 'ID inválido de actividad' });
  }

  if (typeof estado !== 'boolean') {
    return res.status(400).json({ error: 'El estado debe ser true o false' });
  }

  try {
    const result = await pool.query(
      `UPDATE interests SET estado = $1 WHERE id = $2 RETURNING *`,
      [estado, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    res.status(200).json({
      message: `Actividad ${estado ? 'activada' : 'desactivada'} correctamente`,
      updated: result.rows[0]
    });
  } catch (err) {
    console.error('Error al actualizar estado:', err);
    res.status(500).json({ error: 'Error al actualizar el estado de la actividad' });
  }
};
