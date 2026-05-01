import { pool } from '../config/dbpg.js';
import { playlistService } from './PlaylistService.js';
//Lấy tất cả bài hát (dùng cho trang khám phá)
const getAllSong = async () => {
    const result = await pool.query(`
        SELECT 
            s.*,
            json_agg(art.name) AS artist_names
        FROM artist_song ars
            JOIN artist art ON art.id = ars.artist_id
            JOIN song s ON ars.song_id = s.id
        GROUP BY s.id
        ORDER BY RANDOM()
    `);
    return result.rows;
}
const isFavouriteSong = async (userId, songId) => {
    const result = await pool.query(`
        SELECT * 
        FROM favourite_song fs
        where fs.user_id = $1 and fs.song_id = $2`, [userId, songId]);
    return result.rows.length > 0;
}
// Toggle trạng thái yêu thích của bài hát cho người dùng.
const toggleFavouriteSong = async (userId, songId) => {
    const defaultPlaylistId = await playlistService.getDefaultFavouritePlaylistIdByUser(userId);
    const isFavourite = await isFavouriteSong(userId, songId);
    if (isFavourite) {
        await pool.query(
            `DELETE FROM favourite_song WHERE user_id = $1 AND song_id = $2`,
            [userId, songId]
        );
        if (defaultPlaylistId) {
            await playlistService.deleteSongFromPlaylist(defaultPlaylistId, songId);
        }
        return false;
    }

    await pool.query(
        `INSERT INTO favourite_song (user_id, song_id) VALUES ($1, $2)`,
        [userId, songId]
    );
    if (defaultPlaylistId) {
        await playlistService.addSongToPlaylist(defaultPlaylistId, songId);
    }
    return true;
}

//Lấy top 10 bài hát được nghe nhiều nhất
const getTop10MostPlayedSongs = async () => {
    const result = await pool.query(`
        SELECT s.*, 
	           json_agg(art.name) artist_names
        FROM song s
        JOIN artist_song ars
            ON s.id = ars.song_id 
        JOIN artist art
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

export const songService = {
    getAllSong,
    isFavouriteSong,
    toggleFavouriteSong,
    getTop10MostPlayedSongs,
    incrementPlayCount
}