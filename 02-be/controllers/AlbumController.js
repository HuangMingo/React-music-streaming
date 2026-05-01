import { albumService } from '../services/AlbumService.js';

export const AlbumController = {
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
