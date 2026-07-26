import express from 'express';
import { GenreController } from '../controllers/GenreController.js';

const router = express.Router();

router.get('/', GenreController.getAllGenres);
router.get('/:slug/songs', GenreController.getSongsByGenreSlug);
router.post('/create-genre-song', GenreController.createGenreSong);
export default router;
