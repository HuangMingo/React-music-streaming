import { pool } from '../config/dbpg.js';
function normalizeLimit(limit) {
    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
        return 6;
    }

    return Math.min(parsedLimit, 24);
}
const getAllAlbum = async () => {
    const result = await pool.query('SELECT * FROM album ORDER BY id');
    return result.rows;
};
//Lấy album theo id, kèm theo thôn tin nghệ sĩ và bài hát trong album đó
const getAlbumById = async (albumId) => {
    const result = await pool.query(`
        SELECT
            al.*,
        FROM album al
        WHERE al.id = $1
    `, [albumId]);
    return result.rows[0];
};

const getFavouriteAlbum = async (userId) => {
    const result = await pool.query(`
        SELECT
            al.id,
            al.title,
            al.image,
            al.release_date,
            al.artist_id,
            COUNT(s.id)::int AS song_count
        FROM favourite_album fa
        JOIN album al ON al.id = fa.album_id
        LEFT JOIN song s ON s.album_id = al.id
        WHERE fa.user_id = $1
        GROUP BY al.id
        ORDER BY al.title ASC
    `, [userId]);
    return result.rows;
};

const isFavouriteAlbum = async (userId, albumId) => {
    const result = await pool.query(`
        SELECT 1
        FROM favourite_album
        WHERE user_id = $1 AND album_id = $2
        LIMIT 1
    `, [userId, albumId]);

    return result.rows.length > 0;
};

const toggleFavouriteAlbum = async (userId, albumId) => {
    const isFavourite = await isFavouriteAlbum(userId, albumId);

    if (isFavourite) {
        await pool.query(`
            DELETE FROM favourite_album
            WHERE user_id = $1 AND album_id = $2
        `, [userId, albumId]);

        return false;
    }

    await pool.query(`
        INSERT INTO favourite_album (user_id, album_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
            SELECT 1
            FROM favourite_album
            WHERE user_id = $1 AND album_id = $2
        )
    `, [userId, albumId]);

    return true;
};

const createAlbum = async ({ title, artistId, releaseDate }) => {
    const result = await pool.query(
        'INSERT INTO album (title, artist_id, release_date) VALUES ($1, $2, $3) RETURNING *',
        [title, artistId, releaseDate]
    );
    return result.rows[0];
};
const getRandomAlbums = async (limit) => {
    const safeLimit = normalizeLimit(limit);
    const result = await pool.query(`
            SELECT
            al.id,
            al.title,
            al.image,
            al.release_date,
            al.artist_id,
            art.name AS artist_name
        FROM album al
        LEFT JOIN artist art ON art.id = al.artist_id
        ORDER BY RANDOM()
        LIMIT $1
        `, [safeLimit]);
    return result.rows;
}
const getNewestAlbums = async (limit = 5) => {
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 24)
        : 5;
    const result = await pool.query(`
        SELECT
            al.id,
            al.title,
            al.image,
            al.release_date,
            al.artist_id,
            art.name AS artist_name
        FROM album al
        LEFT JOIN artist art ON art.id = al.artist_id
        ORDER BY al.release_date DESC NULLS LAST, al.id DESC
        LIMIT $1
    `, [safeLimit]);
    return result.rows;
}
export const albumService = {
    getAllAlbum,
    getAlbumById,
    createAlbum,
    getFavouriteAlbum,
    isFavouriteAlbum,
    toggleFavouriteAlbum,
    getRandomAlbums,
    getNewestAlbums
};
