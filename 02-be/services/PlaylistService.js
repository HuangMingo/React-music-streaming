import { pool } from "../config/dbpg.js"
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
                    'image', s.image,
                    'artist_names', sa.artist_names
                )
            ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS songs
    FROM playlist p 
    JOIN favourite_playlists fp ON fp.playlist_id = p.id AND fp.user_id = $1
    JOIN "user" u ON u.id = p.creator_id
    LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
    LEFT JOIN song s ON sp.song_id = s.id
    LEFT JOIN song_artists sa ON s.id = sa.song_id
    GROUP BY p.id, p.name, u.username, p.image;
    `, [userId]);
    return result.rows;
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
        u.username,
        p.image AS playlist_image,
		TRUE AS isMine,
        p.isdefault AS isdefault,
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
                    'image', s.image,
                    'duration', s.duration_seconds,
                    'artist_names', sa.artist_names
                )
            ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
        ) AS songs
    FROM playlist p 
    JOIN "user" u ON u.id = p.creator_id
    LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
    LEFT JOIN song s ON sp.song_id = s.id
    LEFT JOIN song_artists sa ON s.id = sa.song_id
	WHERE p.creator_id = $1
    GROUP BY p.id, p.name, u.username, p.image;
        `, [userId]);
    return result.rows;
}

const createPlaylist = async ({ name, creatorId, ispublic, isDefault }) => {
    const result = await pool.query(
        `
        INSERT INTO playlist (name, creator_id, ispublic, image, isdefault)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, creator_id, ispublic, created_at, image, isdefault;
        `,
        [name, creatorId, ispublic, "https://res.cloudinary.com/dnsne0dgp/image/upload/v1775963817/macdinh_ivawgv.jpg", isDefault]
    );
    return result.rows[0];
};
//Xóa playlist
const deletePlaylist = async (playlistId, userId) => {
    await pool.query(`
        DELETE FROM song_playlist
        WHERE playlist_id = $1;`, [playlistId]);

    const result = await pool.query(`
        DELETE FROM playlist
        WHERE id = $1 AND creator_id = $2
        RETURNING id;`, [playlistId, userId]);
    return result;
}
//Xóa bài hát khỏi playlist
const deleteSongFromPlaylist = async (playlistId, songId) => {
    const result = await pool.query(`
        DELETE FROM song_playlist
        WHERE playlist_id = $1 AND song_id = $2
        `, [playlistId, songId]);
    return result;
}
//Thêm bài hát vào playlist 
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

const getDefaultFavouritePlaylistIdByUser = async (userId) => {
    const result = await pool.query(`
        SELECT p.id
        FROM playlist p
        JOIN favourite_playlists fp ON fp.playlist_id = p.id
        WHERE fp.user_id = $1
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
            u.username,
            p.image AS playlist_image,
            TRUE AS isMine,
            p.isdefault AS isdefault,
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
                ) FILTER (WHERE s.id IS NOT NULL), '[]'::json
            ) AS songs
        FROM playlist p
        JOIN "user" u ON u.id = p.creator_id
        LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
        LEFT JOIN song s ON sp.song_id = s.id
        LEFT JOIN song_artists sa ON s.id = sa.song_id
        WHERE p.id = $1
        GROUP BY p.id, p.name, u.username, p.image, p.isdefault;
    `, [playlistId]);

    return result.rows[0] ?? null;
}

export const playlistService = {
    getAllPlaylist,
    getFavouritePlaylist,
    getUserCreatedPlaylist,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    deleteSongFromPlaylist,
    getDefaultFavouritePlaylistIdByUser,
    getPlaylistById
}
