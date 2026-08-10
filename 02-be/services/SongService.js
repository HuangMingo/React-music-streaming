import { pool } from '../config/dbpg.js';
import { playlistService } from './PlaylistService.js';
//Lấy tất cả bài hát (dùng cho trang khám phá)
const getAllSong = async () => {
    const result = await pool.query(`
        SELECT 
            s.id,
            title, s.image, duration_seconds,
            COALESCE(
                json_agg(art.name) FILTER (WHERE art.name IS NOT NULL),
                '[]'::json
            ) AS artist_names
        FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            RIGHT JOIN song s ON ars.song_id = s.id
        GROUP BY s.id
        ORDER BY RANDOM()
        LIMIT 6
    `);
    return result.rows;
}
const getNewestSongs = async (limit = 6) => {
    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 24)
        : 6;
    const result = await pool.query(`
        WITH song_artists AS (
            SELECT
                ars.song_id,
                COALESCE(
                    json_agg(art.name ORDER BY art.name) FILTER (WHERE art.name IS NOT NULL),
                    '[]'::json
                ) AS artist_names
            FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            GROUP BY ars.song_id
        )
        SELECT
            s.id,
            s.title,
            s.image,
            s.duration_seconds,
            s.release_date,
            s.album_id,
            s.lyrics,
            COALESCE(sa.artist_names, '[]'::json) AS artist_names
        FROM song s
        LEFT JOIN song_artists sa ON sa.song_id = s.id
        ORDER BY s.release_date DESC NULLS LAST, s.id DESC
        LIMIT $1
    `, [safeLimit]);
    return result.rows;
}
const isFavouriteSong = async (defaultPlaylistId, songId) => {
    const result = await pool.query(`
        SELECT * 
        FROM playlist p join song_playlist sp on p.id = sp.playlist_id
        JOIN song s on s.id = sp.song_id
        where p.id = $1 and s.id = $2`, [defaultPlaylistId, songId]);
    return result.rows.length > 0;
}
// Toggle trạng thái yêu thích của bài hát cho người dùng.
const toggleFavouriteSong = async (defaultPlaylistId, songId) => {

    const isFavourite = await isFavouriteSong(defaultPlaylistId, songId);
    if (isFavourite) {
        if (defaultPlaylistId) {
            await playlistService.deleteSongFromPlaylist(defaultPlaylistId, songId);
        }
        return false;
    }
    if (defaultPlaylistId) {
        await playlistService.addSongToPlaylist(defaultPlaylistId, songId);
    }
    else{
        return res.status(400).json({message: "defaultPlaylistId không tồn tại"})
    }
    return true;
}

//Lấy top 10 bài hát được nghe nhiều nhất
const getTop10MostPlayedSongs = async () => {
    const result = await pool.query(`
        SELECT s.id,
            s.title, 
            s.image, 
            s.duration_seconds,
            s.play_count,
	        COALESCE(
                json_agg(art.name) FILTER (WHERE art.name IS NOT NULL),
                '[]'::json
            ) AS artist_names
        FROM song s
        LEFT JOIN artist_song ars
            ON s.id = ars.song_id 
        LEFT JOIN artist art
            ON art.id = ars.artist_id
        GROUP BY s.id
        ORDER BY play_count DESC
        LIMIT 10
    `);
    return result.rows;
}

//Tăng play_count của bài hát lên 1
const incrementPlayCount = async (songId) => {
    const result = await pool.query(
        `UPDATE song SET play_count = play_count + 1 WHERE id = $1 RETURNING play_count`,
        [songId]
    );
    return result.rows[0];
}
//Lấy file mp3 qua songId
const getAudioBySongId = async (songId) => {
    const result = await pool.query(`
        SELECT audio 
        FROM song 
        where id = $1
    `, [songId]);
    console.log(result.rows[0]);
    return result.rows[0];
};

const updateSong = async(songId, songForm) => {
    const { title, image, duration_seconds, release_date, album_id, lyrics } = songForm;
    const result = await pool.query(`
        UPDATE song 
        SET title = $1, image = $2, duration_seconds = $3, release_date = $4, album_id = $5, lyrics = $6
        WHERE id = $7
        RETURNING *
    `, [title, image, duration_seconds, release_date, album_id, lyrics, songId]);
    return result.rows[0];
}

export const songService = {
    getAllSong,
    getNewestSongs,
    isFavouriteSong,
    toggleFavouriteSong,
    getTop10MostPlayedSongs,
    incrementPlayCount,
    getAudioBySongId,
    updateSong
}
