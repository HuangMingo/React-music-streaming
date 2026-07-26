import { genreService } from '../services/GenreService.js';

const getAllGenres = async (req, res) => {
	try {
		const genres = await genreService.getAllGenres();
		res.json(genres);
	} catch (error) {
		console.error('Get all genres failed:', error);
		res.status(500).json({ message: 'Lỗi hệ thống' });
	}
};

const getSongsByGenreSlug = async (req, res) => {
	try {
		const { slug } = req.params;
		const result = await genreService.getSongsByGenreSlug(slug);

		if (!result) {
			return res.status(404).json({ message: 'Không tìm thấy thể loại' });
		}

		res.json(result);
	} catch (error) {
		console.error('Get genre songs failed:', error);
		res.status(500).json({ message: 'Lỗi hệ thống' });
	}
};
const createGenreSong = async (req, res) => {
	try {
		const songId = req.body.songId;
		const genreId = req.body.genreId;
		if (!songId) {
			return res.status(400).json({
				message: 'songId không hợp lệ'
			})
		}
		if (!genreId) {
			return res.status(400).json({
				message: 'genreId không hợp lệ'
			})
		}
		const result = await genreService.createGenreSong(songId, genreId);
		return res.json(result);
	}
	catch (error) {
		return res.status(500).json({
			message: error.message
		})
	}
}
export const GenreController = {
	getAllGenres,
	getSongsByGenreSlug,
	createGenreSong
};
