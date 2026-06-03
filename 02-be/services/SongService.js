import { pool } from '../config/dbpg.js';
import { playlistService } from './PlaylistService.js';
//Lấy tất cả bài hát (dùng cho trang khám phá)
const getAllSong = async () => {
    const result = await pool.query(`
        SELECT 
            s.*,
            json_agg(art.name) AS artist_names
        FROM artist_song ars
            RIGHT JOIN artist art ON art.id = ars.artist_id
            JOIN song s ON ars.song_id = s.id
        GROUP BY s.id
        ORDER BY RANDOM()
        LIMIT 6
    `);
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
    console.log(defaultPlaylistId);
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