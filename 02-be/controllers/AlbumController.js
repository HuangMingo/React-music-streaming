import { albumService } from '../services/AlbumService.js';

export const AlbumController = {
    async getFavouriteAlbums(req, res) {
        try {
            const userId = Number(req.query.userId);

            if (!userId) {
                return res.status(400).json({ message: 'Thiáº¿u userId' });
            }

            const albums = await albumService.getFavouriteAlbum(userId);
            res.json(albums);
        } catch (error) {
            console.error('Get favourite albums failed:', error);
            res.status(500).json({ message: 'KhÃ´ng thá»ƒ láº¥y album yÃªu thÃ­ch.' });
        }
    },

    async toggleFavouriteAlbum(req, res) {
        try {
            const userId = Number(req.body.userId);
            const albumId = Number(req.body.albumId);

            if (!userId || !albumId) {
                return res.status(400).json({ message: 'Thiáº¿u userId hoáº·c albumId' });
            }

            const isFavouriteAlbum = await albumService.toggleFavouriteAlbum(userId, albumId);
            res.json({ isFavouriteAlbum });
        } catch (error) {
            console.error('Toggle favourite album failed:', error);
            res.status(500).json({ message: 'KhÃ´ng thá»ƒ cáº­p nháº­t album yÃªu thÃ­ch.' });
        }
    },

    async getAllAlbums(req, res) {
        try {
            const albums = await albumService.getAllAlbum();
            res.json(albums);
        } catch (error) {
            console.error('Get all albums failed:', error);
            res.status(500).json({ message: 'Không thể lấy danh sách album.' });
        }
    },

    async getAlbumById(req, res) {
        try {
            const albumId = Number(req.params.id);
            
            if (!Number.isInteger(albumId) || albumId <= 0) {
                return res.status(400).json({ message: 'Album id không hợp lệ.' });
            }

            const album = await albumService.getAlbumById(albumId);

            if (!album) {
                return res.status(404).json({ message: 'Không tìm thấy album.' });
            }

            res.json(album);
        } catch (error) {
            console.error('Get album failed:', error);
            res.status(500).json({ message: 'Không thể lấy dữ liệu album.' });
        }
    },

    async createAlbum(req, res) {
        try {
            const { name, artistId, releaseDate } = req.body;

            if (!name || !artistId) {
                return res.status(400).json({ message: 'Tên album và ID nghệ sĩ là bắt buộc.' });
            }

            const album = await albumService.createAlbum({
                name: name.trim(),
                artistId: Number(artistId),
                releaseDate
            });

            res.status(201).json(album);
        } catch (error) {
            console.error('Create album failed:', error);
            res.status(500).json({ message: 'Không thể tạo album.' });
        }
    }
};
