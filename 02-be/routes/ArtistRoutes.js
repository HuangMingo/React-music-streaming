import express from 'express';
import { ArtistController } from './../controllers/ArtistController.js';

const router = express.Router();

router.get('/slug/:slug', ArtistController.getArtistDetailBySlug);
// Các API follow artist dùng chung cho ArtistDetail, search/card và MusicContext.
router.post('/follow', ArtistController.followArtist);
router.delete('/follow', ArtistController.unfollowArtist);
router.delete('/:artistId/follow', ArtistController.unfollowArtist);
router.get('/follow-status', ArtistController.getArtistFollowStatus);
router.get('/followers-count', ArtistController.getArtistFollowersCount);
// Giữ route cũ để các màn đang gọi toggle-follow không bị lỗi.
router.post('/:artistId/toggle-follow', ArtistController.toggleFollowArtist);
router.get('/:slug', ArtistController.getArtistBySlug);
router.get('/followed-artists', ArtistController.getFollowedArtistsByUserId);
export default router;
