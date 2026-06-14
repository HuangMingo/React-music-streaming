import express from 'express';
import { AlbumController } from '../controllers/AlbumController.js';

const router = express.Router();

router.get('/favourite-albums', AlbumController.getFavouriteAlbums);
router.post('/toggle-favourite-album', AlbumController.toggleFavouriteAlbum);
router.get('/random-albums', AlbumController.getRandomAlbums);
router.get('/', AlbumController.getAllAlbums);
router.get('/:id', AlbumController.getAlbumById);


export default router;
