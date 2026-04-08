import { pool } from "../config/dbpg.js"
export const getAllPlaylist = async () => {
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
        p.name AS playlist_name, 
        u.username,
        p.image AS playlist_image,
        -- Bước 2: Chỉ gom nhóm JSON nếu bài hát tồn tại (tránh mảng null)
        COALESCE(
            json_agg(
                json_build_object(
                    'name', s.title,
                    'path', s.audio,
                    'image', s.image,
                    'duration', s.duration_seconds,
                    'artists', artist_names
                )
            ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS songs
    FROM playlist p 
    JOIN favourite_playlists fp ON fp.playlist_id = p.id
    JOIN "user" u ON u.id = p.creator_id
    LEFT JOIN song_playlist sp ON p.id = sp.playlist_id
    LEFT JOIN song s ON sp.song_id = s.id
    LEFT JOIN song_artists sa ON s.id = sa.song_id
    WHERE p.creator_id = 1 OR p.creator_id = 2
    GROUP BY p.id, p.name, u.username, p.image;
    `);
    return result.rows;
}

export const createPlaylist = async ({ name, creatorId, ispublic, image }) => {
    const result = await pool.query(
        `
        INSERT INTO playlist (name, creator_id, ispublic, image)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, creator_id, ispublic, created_at, image;
        `,
        [name, 1, ispublic, image]
    );

    return result.rows[0];
};