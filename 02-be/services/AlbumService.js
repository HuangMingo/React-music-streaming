import {pool} from '../config/dbpg.js';
export const getAllAlbum = async () => {
    const result = await pool.query(`
    SELECT * FROM 