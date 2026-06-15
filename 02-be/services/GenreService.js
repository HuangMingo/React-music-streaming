import { pool } from '../config/dbpg.js';

function createSlug(text) {
	return String(text || '')
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd')
		.replace(/Đ/g, 'D')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

const getAllGenres = async () => {
	const result = await pool.query(`
		SELECT id, name, image
		FROM genre
		ORDER BY name ASC
	`);

	return result.rows.map((genre) => ({
		...genre,
		slug: createSlug(genre.name),
	}));
};

const getSongsByGenreSlug = async (slug) => {
	const genres = await getAllGenres();
	const normalizedSlug = createSlug(slug);
	const genre = genres.find((item) => item.slug === normalizedSlug);

	if (!genre) {
		return null;
	}

	const result = await pool.query(`
		WITH song_artists AS (
			SELECT
				ars.song_id,
				COALESCE(
					json_agg(art.name ORDER BY art.name) FILTER (WHERE art.id IS NOT NULL),
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
			s.audio,
			s.duration_seconds,
			s.release_date,
			COALESCE(sa.artist_names, '[]'::json) AS artist_names
		FROM genre_song gs
		JOIN song s ON s.id = gs.song_id
		LEFT JOIN song_artists sa ON sa.song_id = s.id
		WHERE gs.genre_id = $1
		ORDER BY gs.updated_date DESC NULLS LAST, s.release_date DESC NULLS LAST, s.id DESC
	`, [genre.id]);

	return {
		genre,
		songs: result.rows,
	};
};

export const genreService = {
	getAllGenres,
	getSongsByGenreSlug,
};
