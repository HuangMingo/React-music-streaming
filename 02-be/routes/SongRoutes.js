import express from 'express';
import { SongController } from './../controllers/SongController.js';

const router = express.Router();

router.get('/', SongController.getAllSong);
router.get('/is-favourite', SongController.isFavourite);
router.post('/toggle-favourite', SongController.toggleFavouriteSong);
router.get('/top10-most-played-songs', SongController.getTop10MostPlayedSongs);
router.post('/increment-play-count', SongController.incrementPlayCount);

export default router;