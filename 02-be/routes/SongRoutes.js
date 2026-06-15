import express from 'express';
import { SongController } from './../controllers/SongController.js';

const router = express.Router();

router.get('/new', SongController.getNewestSongs);
router.get('/', SongController.getAllSong);
router.get('/is-favourite-song', SongController.isFavouriteSong);
// Toggle trạng thái yêu thích của bài hát 
router.post('/toggle-favourite-song', SongController.toggleFavouriteSong);
router.get('/top10-most-played-songs', SongController.getTop10MostPlayedSongs);
router.post('/increment-play-count', SongController.incrementPlayCount);

export default router;
