import express from 'express';
import { GenreController } from '../controllers/GenreController.js';
import multer from 'multer'
const router = express.Router();
const upload = multer();
router.get('/', GenreController.getAllGenres);
router.get('/:slug/songs', GenreController.getSongsByGenreSlug);

export default router;
