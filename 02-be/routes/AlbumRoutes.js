import express from 'express';
import { AlbumController } from '../controllers/AlbumController.js';

const router = express.Router();

router.get('/', AlbumController.getAllAlbums);
router.get('/:id', AlbumController.getAlbumById);
router.post('/', AlbumController.createAlbum);

export default router;
