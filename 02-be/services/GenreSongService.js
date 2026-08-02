import { pool } from '../config/dbpg.js';
const createGenreSong = async (songId, genreId) => {
    const result = await pool.query(
        `
			INSERT INTO genre_song (song_id, genre_id)
			VALUES ($1, $2)
			ON CONFLICT (song_id, genre_id)
			DO NOTHING
			RETURNING *
		`, [songId, genreId]
    );
    return result;
}

const deleteGenreSong = async (songId, genreId) => {
    const result = await pool.query(`
			DELETE FROM genre_song
			WHERE genre_id = $1 AND song_id = $2
		`, [genreId, songId]);
    return result;
}

export const genreSongService = {
    createGenreSong,
    deleteGenreSong
}