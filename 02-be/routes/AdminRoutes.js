import express from 'express';
import {
  createAlbum,
  createArtist,
  createSong,
  deleteAlbum,
  deleteArtist,
  deleteSong,
  deleteSystemPlaylist,
  getAlbums,
  getArtists,
  getOverview,
  getSongs,
  getSystemPlaylists,
  getUsers,
  createSystemPlaylist,
  updateAlbum,
  updateArtist,
  updateSong,
  updateSystemPlaylist,
  updateUserRole,
} from '../controllers/AdminController.js';
import { requireAdminContent, requireSuperAdmin } from '../middlewares/AdminAuthMiddleware.js';

const router = express.Router();

router.get('/overview', requireAdminContent, getOverview);

router.get('/songs', requireAdminContent, getSongs);
router.post('/songs', requireAdminContent, express.raw({ type: 'multipart/form-data', limit: '120mb' }), createSong);
router.put('/songs/:id', requireAdminContent, updateSong);
router.delete('/songs/:id', requireAdminContent, deleteSong);

router.get('/albums', requireAdminContent, getAlbums);
router.post('/albums', requireAdminContent, createAlbum);
router.put('/albums/:id', requireAdminContent, updateAlbum);
router.delete('/albums/:id', requireAdminContent, deleteAlbum);

router.get('/artists', requireAdminContent, getArtists);
router.post('/artists', requireAdminContent, createArtist);
router.put('/artists/:id', requireAdminContent, updateArtist);
router.delete('/artists/:id', requireAdminContent, deleteArtist);

router.get('/playlists', requireAdminContent, getSystemPlaylists);
router.post('/playlists', requireAdminContent, createSystemPlaylist);
router.put('/playlists/:id', requireAdminContent, updateSystemPlaylist);
router.delete('/playlists/:id', requireAdminContent, deleteSystemPlaylist);

router.get('/users', requireSuperAdmin, getUsers);
router.patch('/users/:id/role', requireSuperAdmin, updateUserRole);

export default router;
