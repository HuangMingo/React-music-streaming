import { artistService } from '../services/ArtistService.js';

const getArtistBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const artist = await artistService.getArtistBySlug(slug);

        if (!artist) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        return res.json(artist);
    } catch (error) {
        console.error('Get artist by slug failed', error);
        return res.status(500).json({ message: 'System error' });
    }
};

const getArtistDetailBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.query.userId ? Number(req.query.userId) : null;
        const artist = await artistService.getArtistDetailBySlug(
            slug,
            Number.isFinite(userId) ? userId : null
        );

        if (!artist) {
            return res.status(404).json({
                message: "Artist not found"
            });
        }

        return res.json(artist);
    } catch (error) {
        console.error('Get artist detail by slug failed', error);
        return res.status(500).json({ message: 'System error' });
    }
};

// Tạo quan hệ follow giữa user và artist; service sẽ tự chống insert trùng.
const followArtist = async (req, res) => {
    try {
        const userId = req.query.userId ?? req.params.userId;
        const artistId = req.query.artistId ?? req.params.artistId;
        if (!artistId || !userId) {
            return res.status(400).json({ message: 'Missing artistId or userId' });
        }

        const result = await artistService.followArtist(userId, artistId);
        return res.json(result);
    } catch (error) {
        console.error('Follow artist failed', error);
        return res.status(500).json({ message: 'Cannot follow artist.' });
    }
};

// Xóa quan hệ follow giữa user và artist.
const unfollowArtist = async (req, res) => {
    try {
        const userId = req.query.userId;
        const artistId = req.params.artistId ?? req.query.artistId;

        if (!artistId || !userId) {
            return res.status(400).json({ message: 'Missing artistId or userId' });
        }

        const result = await artistService.unfollowArtist(userId, artistId);
        return res.json(result);
    } catch (error) {
        console.error('Unfollow artist failed', error);
        return res.status(500).json({ message: 'Cannot unfollow artist.' });
    }
};

// Trả về trạng thái user hiện tại có đang follow artist này hay không.
const getArtistFollowStatus = async (req, res) => {
    try {
        const userId = req.query.userId;
        const artistId = req.query.artistId;

        if (!artistId || !userId) {
            return res.status(400).json({ message: 'Missing artistId or userId' });
        }

        const isFollowing = await artistService.isFollowingArtist(userId, artistId);
        return res.json({ isFollowing });
    } catch (error) {
        console.error('Get artist follow status failed', error);
        return res.status(500).json({ message: 'Cannot get artist follow status.' });
    }
};

// Trả về tổng số user đang follow artist, lấy từ bảng artist_follow.
const getArtistFollowersCount = async (req, res) => {
    try {
        const artistId = Nreq.query.artistId;

        if (!artistId) {
            return res.status(400).json({ message: 'Missing artistId' });
        }

        const followersCount = await artistService.getArtistFollowersCount(artistId);
        return res.json({ followersCount });
    } catch (error) {
        console.error('Get artist followers count failed', error);
        return res.status(500).json({ message: 'Cannot get artist followers count.' });
    }
};

// Endpoint tương thích cho nơi còn gọi toggle: nếu đang follow thì unfollow, ngược lại follow.
const toggleFollowArtist = async (req, res) => {
    try {
        const artistId = req.params.artistId ?? req.query.artistId;
        const userId = req.params.userId ?? req.query.userId;

        if (!artistId || !userId) {
            return res.status(400).json({ message: 'Missing artistId or userId' });
        }

        const result = await artistService.toggleFollowArtist(userId, artistId);
        return res.json(result);
    } catch (error) {
        console.error('Toggle follow artist failed', error);
        return res.status(500).json({ message: 'Cannot update artist follow.' });
    }
};
const getFollowedArtistsByUserId = async (req, res) => {
    try {
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ message: 'Missing userId' });
        }

        const artists = await artistService.getFollowedArtistsByUserId(userId);
        return res.json(artists);
    } catch (error) {
        console.error('Không thể lấy danh sách nghệ sĩ đã theo dõi', error);
        return res.status(500).json({ message: 'Cannot get followed artists.' });
    }
};
export const ArtistController = {
    getArtistBySlug,
    getArtistDetailBySlug,
    followArtist,
    unfollowArtist,
    getArtistFollowStatus,
    getArtistFollowersCount,
    toggleFollowArtist,
    getFollowedArtistsByUserId
};
