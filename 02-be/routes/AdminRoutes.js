import express from 'express';
import {adminController} from '../controllers/AdminController.js';
import { requireAdminContent, requireSuperAdmin } from '../middlewares/AdminAuthMiddleware.js';

const router = express.Router();

router.get('/overview', requireAdminContent, adminController.getOverview);

router.get('/songs', requireAdminContent, adminController.getSongs);
router.post('/songs/insert-song', requireAdminContent, express.raw({ type: 'multipart/form-data', limit: '120mb' }), adminController.createSong);
router.put('/songs/update-song/:id', requireAdminContent, adminController.updateSong);
router.delete('/songs/:id', requireAdminContent, adminController.deleteSong);

router.get('/albums', requireAdminContent, adminController.getAlbums);
router.post('/albums', requireAdminContent, adminController.createAlbum);
router.put('/albums/:id', requireAdminContent, adminController.updateAlbum);
router.delete('/albums/:id', requireAdminContent, adminController.deleteAlbum);

router.get('/artists', requireAdminContent, adminController.getArtists);
router.post('/artists', requireAdminContent, adminController.createArtist);
router.put('/artists/:id', requireAdminContent, adminController.updateArtist);
router.delete('/artists/:id', requireAdminContent, adminController.deleteArtist);

router.get('/playlists', requireAdminContent, adminController.getSystemPlaylists);
router.post('/playlists', requireAdminContent, adminController.createSystemPlaylist);
router.put('/playlists/:id', requireAdminContent, adminController.updateSystemPlaylist);
router.delete('/playlists/:id', requireAdminContent, adminController.deleteSystemPlaylist);

router.get('/users', requireSuperAdmin, adminController.getUsers);
router.patch('/users/:id/role', requireSuperAdmin, adminController.updateUserRole);

export default router;
