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

export const GenreController = {
	getAllGenres,
	getSongsByGenreSlug,
};
