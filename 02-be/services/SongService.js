import { pool } from '../config/dbpg.js';
export const getAllSong = async () => {
    const result = await pool.query('SELECT * FROM song');
    return result.rows;
}
