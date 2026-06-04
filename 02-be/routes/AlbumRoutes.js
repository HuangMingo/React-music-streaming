import express from 'express';
import { AlbumController } from '../controllers/AlbumController.js';

const router = express.Router();

router.get('/favourite-albums', AlbumController.getFavouriteAlbums);
router.post('/toggle-favourite-album', AlbumController.toggleFavouriteAlbum);
router.get('/', AlbumController.getAllAlbums);
router.get('/:id', AlbumController.getAlbumById);
router.post('/', AlbumController.createAlbum);

export default router;
