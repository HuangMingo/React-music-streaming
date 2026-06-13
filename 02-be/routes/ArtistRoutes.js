import express from 'express';
import { ArtistController } from './../controllers/ArtistController.js';

const router = express.Router();

router.get('/slug/:slug', ArtistController.getArtistDetailBySlug);
router.post('/follow', ArtistController.followArtist);
router.delete('/follow', ArtistController.unfollowArtist);
router.delete('/:artistId/follow', ArtistController.unfollowArtist);
router.get('/follow-status', ArtistController.getArtistFollowStatus);
router.get('/followers-count', ArtistController.getArtistFollowersCount);
// Route tĩnh phải đặt trước "/:slug"; nếu đặt sau, Express sẽ hiểu "followed-artists" là slug nghệ sĩ.
router.get('/followed-artists', ArtistController.getFollowedArtistsByUserId);
router.post('/:artistId/toggle-follow', ArtistController.toggleFollowArtist);
router.get('/:slug', ArtistController.getArtistBySlug);

export default router;
