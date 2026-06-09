import {pool} from '../config/dbpg.js';
const getAllAlbum = async () => {
    const result = await pool.query('SELECT * FROM album ORDER BY id');
    return result.rows;
};
//Lấy album theo id, kèm theo thôn tin nghệ sĩ và bài hát trong album đó
const getAlbumById = async (albumId) => {
    const result = await pool.query(`
        WITH song_artists AS (
            SELECT 
                ars.song_id,
                json_agg(art.name) AS artist_names
            FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            GROUP BY ars.song_id
        )
        SELECT
            al.*,
            art.name AS artist_name,
            CASE WHEN art.name IS NULL THEN '[]'::json ELSE json_build_array(art.name) END AS artist_names,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'title', s.title,
                        'album_id', s.album_id,
                        'duration_seconds', s.duration_seconds,
                        'track_number', s.track_number,
                        'release_date', s.release_date,
                        'lyrics', s.lyrics,
                        'audio', s.audio,
                        'image', s.image,
                        'artist_names', sa.artist_names
                    )
                    ORDER BY s.track_number NULLS LAST, s.id
                ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
            ) AS songs
        FROM album al
        LEFT JOIN artist art ON art.id = al.artist_id
        LEFT JOIN song s ON s.album_id = al.id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        WHERE al.id = $1
        GROUP BY al.id, art.name
    `, [albumId]);
    return result.rows[0];
};

const getFavouriteAlbum = async (userId) => {
    const result = await pool.query(`
        WITH song_artists AS (
            SELECT 
                ars.song_id,
                json_agg(art.name) AS artist_names
            FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            GROUP BY ars.song_id
        )
        SELECT
            al.id,
            al.title,
            al.image,
            al.release_date,
            al.artist_id,
            art.name AS artist_name,
            COUNT(s.id)::int AS song_count,
            COALESCE(
                json_agg(
                    json_build_object(
                        'id', s.id,
                        'title', s.title,
                        'album_id', s.album_id,
                        'duration_seconds', s.duration_seconds,
                        'track_number', s.track_number,
                        'release_date', s.release_date,
                        'lyrics', s.lyrics,
                        'audio', s.audio,
                        'image', s.image,
                        'artist_names', sa.artist_names
                    )
                    ORDER BY s.track_number NULLS LAST, s.id
                ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
            ) AS songs
        FROM favourite_album fa
        JOIN album al ON al.id = fa.album_id
        LEFT JOIN artist art ON art.id = al.artist_id
        LEFT JOIN song s ON s.album_id = al.id
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        WHERE fa.user_id = $1
        GROUP BY al.id, art.name
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
    createAlbum,
    getFavouriteAlbum,
    isFavouriteAlbum,
    toggleFavouriteAlbum
};
