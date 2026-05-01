import {pool} from '../config/dbpg.js';
const getAllAlbum = async () => {
    const result = await pool.query('SELECT * FROM album ORDER BY id');
    return result.rows;
};

const getAlbumById = async (albumId) => {
    const result = await pool.query('SELECT * FROM album WHERE id = $1', [albumId]);
    return result.rows[0];
};

const createAlbum = async ({ name, artistId, releaseDate }) => {
    const result = await pool.query(
        'INSERT INTO album (name, artist_id, release_date) VALUES ($1, $2, $3) RETURNING *',
        [name, artistId, releaseDate]
    );
    return result.rows[0];
};

export const albumService = {
    getAllAlbum,
    getAlbumById,
    createAlbum
};