import express from 'express';
import { genreSongController } from '../controllers/GenreSongController.js';
import multer from 'multer'
const router = express.Router();
const upload = multer();
router.post('/create-genre-song', upload.none(), genreSongController.createGenreSong);
router.delete('/delete-genre-song/:genreId/:songId', genreSongController.deleteGenreSong);
export default router;