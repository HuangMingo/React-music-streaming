import express from 'express';
import { PlaylistController } from './../controllers/PlaylistController.js';
const router = express.Router();
//Lấy playlist yêu thích của người dùng
router.get('/favourite-playlists', PlaylistController.getFavouritePlaylist);
router.post('/toggle-favourite-playlist', PlaylistController.toggleFavouritePlaylist);
//Lấy playlist do người dùng tạo (dùng cho trang cá nhân)
router.get('/user-created-playlists', PlaylistController.getUserCreatedPlaylist);
router.get('/playlist-details', PlaylistController.getPlaylistById);
router.post('/create-playlist', PlaylistController.createPlaylist);
router.put('/update-playlist/:playlistId', PlaylistController.updatePlaylist);
router.delete('/delete-playlist', PlaylistController.deletePlaylist);
router.post('/add-song-to-playlist', PlaylistController.addSongToPlaylist);
router.delete('/delete-song-from-playlist', PlaylistController.deleteSongFromPlaylist);
router.get('/random-playlists', PlaylistController.getRandomPlaylists);
export default router;
