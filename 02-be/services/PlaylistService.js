import { pool } from "../config/dbpg.js"

const DEFAULT_PLAYLIST_IMAGE = "https://res.cloudinary.com/dnsne0dgp/image/upload/v1775963817/macdinh_ivawgv.jpg";
//Lấy tất cả playlist (dùng cho trang khám phá)
const getAllPlaylist = async () => { }
// const getFavouriteSong = async(userId, )
const getFavouritePlaylist = async (userId) => {
    const result = await pool.query(`
        WITH song_artists AS (
            -- Bước 1: Gom nhóm nghệ sĩ cho từng bài hát trước
        SELECT 
            ars.song_id, 
            json_agg(art.name) AS artist_names
        FROM artist_song ars
        JOIN artist art ON art.id = ars.artist_id
        GROUP BY ars.song_id
    )
    SELECT 
        p.id,
        p.name AS playlist_name, 
        p.creator_id,
        u.username,
        p.image AS playlist_image,
        -- Bước 2: Chỉ gom nhóm JSON nếu bài hát tồn tại (tránh mảng null)
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
                    'added_at', sp.added_at,
                    'image', s.image,
                    'artist_names', sa.artist_names
                )
                ORDER BY sp.added_at DESC
            ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS songs
    FROM playlist p 
    JOIN favourite_playlists fp ON fp.playlist_id = p.id AND fp.user_id = $1
    JOIN "user" u ON u.id = p.creator_id
    LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
    LEFT JOIN song s ON sp.song_id = s.id
    LEFT JOIN song_artists sa ON s.id = sa.song_id
    GROUP BY p.id, p.name, p.creator_id, u.username, p.image;
    `, [userId]);
    return result.rows;
}

const isFavouritePlaylist = async (userId, playlistId) => {
    const result = await pool.query(`
        SELECT id
        FROM favourite_playlists
        WHERE user_id = $1 AND playlist_id = $2
        LIMIT 1
    `, [userId, playlistId]);

    return result.rows.length > 0;
}

const toggleFavouritePlaylist = async (userId, playlistId) => {
    const isFavourite = await isFavouritePlaylist(userId, playlistId);

    if (isFavourite) {
        await pool.query(`
            DELETE FROM favourite_playlists
            WHERE user_id = $1 AND playlist_id = $2
        `, [userId, playlistId]);

        return false;
    }

    await pool.query(`
        INSERT INTO favourite_playlists (user_id, playlist_id)
        SELECT $1, $2
        WHERE NOT EXISTS (
            SELECT 1
            FROM favourite_playlists
            WHERE user_id = $1 AND playlist_id = $2
        )
    `, [userId, playlistId]);

    return true;
}
//Lấy playlist do người dùng tạo (dùng cho trang cá nhân)
const getUserCreatedPlaylist = async (userId) => {
    const result = await pool.query(`
        WITH song_artists AS (
            -- Bước 1: Gom nhóm nghệ sĩ cho từng bài hát trước
        SELECT 
            ars.song_id, 
            json_agg(art.name) AS artist_names
        FROM artist_song ars
        JOIN artist art ON art.id = ars.artist_id
        GROUP BY ars.song_id
    )
    SELECT 
        p.id,
        p.name AS playlist_name, 
        p.creator_id,
        u.username,
        p.image AS playlist_image,
        p.isdefault AS isdefault,
        p.ispublic AS ispublic,
        -- Bước 2: Chỉ gom nhóm JSON nếu bài hát tồn tại (tránh mảng null)
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
                    'added_at', sp.added_at,
                    'image', s.image,
                    'duration', s.duration_seconds,
                    'artist_names', sa.artist_names
                )
                ORDER BY sp.added_at DESC, s.id asc
            ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS songs
    FROM playlist p 
    JOIN "user" u ON u.id = p.creator_id
    LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
    LEFT JOIN song s ON sp.song_id = s.id
    LEFT JOIN song_artists sa ON s.id = sa.song_id
	WHERE p.creator_id = $1
    GROUP BY p.id, p.name, p.creator_id, u.username, p.image, p.isdefault, p.ispublic;
        `, [userId]);
    return result.rows;
}
const createPlaylist = async ({ name, creatorId, ispublic, isDefault }) => {
    const result = await pool.query(
        `
        INSERT INTO playlist (name, creator_id, ispublic, image, isdefault)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
        `,
        [name, creatorId, ispublic, DEFAULT_PLAYLIST_IMAGE, isDefault]
    );
    return result.rows[0];
};
const updatePlaylist = async ({ playlistId, userId, name, ispublic }) => {
    const result = await pool.query(
        `
        UPDATE playlist
        SET name = $1, ispublic = $2
        WHERE id = $3 AND creator_id = $4 AND isdefault = false
        RETURNING id, name AS playlist_name, creator_id, ispublic, isdefault
        `,
        [name, ispublic, playlistId, userId]
    );
    return result.rows[0] ?? null;
};
//Xóa playlist
const deletePlaylist = async (playlistId, userId) => {
    await pool.query(`
        DELETE FROM song_playlist
        WHERE playlist_id = $1
          AND EXISTS (
              SELECT 1
              FROM playlist
              WHERE id = $1 AND creator_id = $2
          );`, [playlistId, userId]);

    const result = await pool.query(`
        DELETE FROM playlist
        WHERE id = $1 AND creator_id = $2
        RETURNING *
        `, [playlistId, userId]);
    return result.rows[0] ?? null;
}
//Xóa bài hát khỏi playlist
const deleteSongFromPlaylist = async (playlistId, songId, userId = null) => {
    const deleteResult = userId
        ? await pool.query(`
        DELETE FROM song_playlist sp
        USING playlist p
        WHERE sp.playlist_id = p.id
          AND sp.playlist_id = $1
          AND sp.song_id = $2
          AND p.creator_id = $3
          AND p.isdefault = false
        RETURNING sp.*
    `, [playlistId, songId, userId])
        : await pool.query(`
            DELETE FROM song_playlist
            WHERE playlist_id = $1 AND song_id = $2
            RETURNING *
        `, [playlistId, songId]);

    if (deleteResult.rowCount === 0) {
        return null;
    }

    const newestSongResult = await pool.query(`
        SELECT s.image
        FROM song_playlist sp
        JOIN song s ON s.id = sp.song_id
        WHERE sp.playlist_id = $1
        ORDER BY sp.added_at DESC
        LIMIT 1
    `, [playlistId]);

    const nextImage =
        newestSongResult.rows[0]?.image ?? DEFAULT_PLAYLIST_IMAGE;

    await pool.query(`
        UPDATE playlist
        SET image = $1
        WHERE id = $2
    `, [nextImage, playlistId]);

    return deleteResult.rows[0];
};


const addSongToPlaylist = async (playlistId, songId) => {
    const result = await pool.query(`
        INSERT INTO song_playlist (playlist_id, song_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
        RETURNING playlist_id, song_id;
    `, [playlistId, songId]);
    if (!result.rows[0]) return null; // Bai hat da ton tai trong playlist
    await pool.query(`
        update playlist 
        set image = (select image from song 
                        where id = $2)
        where id = $1
    `, [playlistId, songId]);
}
// Lấy playlist mặc định của user

const getDefaultPlaylistIdByUser = async (userId) => {
    const result = await pool.query(`
                SELECT p.id
                FROM playlist p
                WHERE p.creator_id = $1
                    AND p.isdefault = true
                LIMIT 1;
        `, [userId]);
    return result.rows[0]?.id ?? null;
}

const getPlaylistById = async (playlistId) => {
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
            p.id,
            p.name AS playlist_name,
            p.creator_id,
            u.username,
            p.image AS playlist_image,
            p.isdefault AS isdefault,
            p.ispublic AS ispublic,
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
                        'added_at', sp.added_at,
                        'image', s.image,
                        'artist_names', sa.artist_names
                    )
                    ORDER BY sp.added_at DESC
                ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
            ) AS songs
        FROM playlist p
        JOIN "user" u ON u.id = p.creator_id
        LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
        LEFT JOIN song s ON sp.song_id = s.id
        LEFT JOIN song_artists sa ON s.id = sa.song_id
        WHERE p.id = $1
        GROUP BY p.id, p.name, p.creator_id, u.username, p.image, p.isdefault, p.ispublic;
    `, [playlistId]);

    return result.rows[0] ?? null;
}

export const playlistService = {
    getAllPlaylist,
    getFavouritePlaylist,
    isFavouritePlaylist,
    toggleFavouritePlaylist,
    getUserCreatedPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    deleteSongFromPlaylist,
    getDefaultPlaylistIdByUser,
    getPlaylistById
}
