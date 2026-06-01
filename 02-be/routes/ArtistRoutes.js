import express from 'express';
import { ArtistController } from './../controllers/ArtistController.js';

const router = express.Router();

router.get('/slug/:slug', ArtistController.getArtistDetailBySlug);
router.get('/:slug', ArtistController.getArtistBySlug);

export default router;
