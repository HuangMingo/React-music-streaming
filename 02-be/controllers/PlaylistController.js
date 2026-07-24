import { playlistService } from "../services/PlaylistService.js";
const getFavouritePlaylist = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Thiếu userId' });
        }
        const result = await playlistService.getFavouritePlaylist(userId);
        res.send(result);
    }
    catch (error) {
        console.error('Get favourite playlists failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const toggleFavouritePlaylist = async (req, res) => {
    try {
        const userId = req.body.userId;
        const playlistId = req.body.playlistId;

        if (!userId) {
            return res.status(400).json({ message: 'Thiếu userId' });
        }

        if (!playlistId) {
            return res.status(400).json({ message: 'Thiếu playlistId' });
        }
        const newStatus = await playlistService.toggleFavouritePlaylist(userId, playlistId);
        res.json({ isFavouritePlaylist: newStatus });
    } catch (error) {
        console.error('Toggle favourite playlist failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const getUserCreatedPlaylist = async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ message: 'Thiếu userId' });
        }
        const result = await playlistService.getUserCreatedPlaylist(userId);
        res.send(result);
    }
    catch (error) {
        console.error('Get user created playlists failed:', error);
        res.status(500).json({
            status: 500,
            message: 'Lỗi hệ thống'
        });
    }
}

const getPlaylistById = async (req, res) => {
    try {
        const playlistId = req.query.playlistId;
        if (!playlistId) {
            return res.status(400).json({ message: 'Thiếu playlistId' });
        }

        const result = await playlistService.getPlaylistById(playlistId);
        if (!result) {
            return res.status(404).json({ message: 'Không tìm thấy playlist' });
        }

        res.send(result);
    } catch (error) {
        console.error('Get playlist by id failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}
const createPlaylist = async (req, res) => {
    try {
        const { name, creator_id, ispublic, isdefault } = req.body;
        if (!name || !name.trim()) {
            res.status(400).json({ message: 'Playlist name is required' });
            return;
        }
        if (!creator_id) {
            res.status(400).json({ message: 'creator_id is invalid' });
            return;
        }
        const newPlaylist = await playlistService.createPlaylist({
            name: name.trim(),
            creator_id: creator_id,
            ispublic: Boolean(ispublic),
            isDefault: Boolean(isdefault)
        });

        res.status(201).json(newPlaylist);
    } catch (error) {
        console.error('Create playlist failed:', error);
        res.status(500).json({ message: 'Cannot create playlist' });
    }
}
//chỉnh sửa thông tin playlist (tên, công khai/riêng tư)
const updatePlaylist = async (req, res) => {
    try {
        const playlistId = req.body.playlistId;
        const { name, userId, ispublic } = req.body;
        if (!playlistId) {
            return res.status(400).json({ message: 'Thiếu playlistId' });
        }
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Playlist name is required' });
        }

        if (!currentUserId) {
            return res.status(400).json({ message: 'userId is invalid' });
        }

        const updatedPlaylist = await playlistService.updatePlaylist({
            playlistId,
            userId: currentUserId,
            name: name.trim(),
            ispublic: Boolean(ispublic)
        });
        if (!updatedPlaylist) {
            return res.status(403).json({ message: 'Bạn không có quyền sửa playlist này hoặc playlist không tồn tại' });
        }

        res.json(updatedPlaylist);
    } catch (error) {
        console.error('Update playlist failed:', error);
        res.status(500).json({ message: 'Không thể cập nhật playlist lúc này' });
    }
}
const deletePlaylist = async (req, res) => {
    try {
        const playlistId = req.query.playlistId;
        const userId = req.query.userId;
        if (!playlistId || !userId) {
            return res.status(400).json({ message: 'Thiếu playlistId hoặc userId' });
        }

        const deletedPlaylist = await playlistService.deletePlaylist(playlistId, userId);
        if (!deletedPlaylist) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa playlist này hoặc playlist không tồn tại' });
        }

        res.json({ success: true, playlistId: deletedPlaylist.id });
    } catch (error) {
        console.error('Delete playlist failed:', error);
        res.status(500).json({ message: 'Không thể xóa playlist lúc này' });
    }
}
//Thêm bài hát vào playlist
const addSongToPlaylist = async (req, res) => {
    try {
        const playlistId = req.body.playlistId;
        const songId = req.body.songId;
        if (!playlistId) {
            return res.status(400).json({ message: 'Thiếu playlistId' });
        }
        if (!songId) {
            return res.status(400).json({ message: "Thiếu songId" });
        }
        const result = await playlistService.addSongToPlaylist(playlistId, songId);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Add song to playlist failed:', error);
        res.status(500).json({ message: 'Không thể thêm bài hát vào playlist lúc này' });
    }
}
const deleteSongFromPlaylist = async (req, res) => {
    try {
        const playlistId = req.query.playlistId;
        const songId = req.query.songId ?? req.body.songId;
        const userId = req.query.userId ?? req.body.userId;
        if (!playlistId || !songId || !userId) {
            return res.status(400).json({ message: 'Thiếu playlistId, songId hoặc userId' });
        }

        const removedSong = await playlistService.deleteSongFromPlaylist(playlistId, songId, userId);
        if (!removedSong) {
            return res.status(403).json({ message: 'Không có quyền xóa bài hát khỏi playlist này hoặc bài hát không còn trong playlist' });
        }

        res.json({ success: true, playlistId, songId });
    }
    catch (error) {
        console.error('Remove song from playlist failed:', error);
        res.status(500).json({ message: 'Không thể xóa bài hát khỏi playlist lúc này' });
    }
}

const getRandomPlaylists = async (req, res) => {
    try {
        const limit = req.query.limit;
        const result = await playlistService.getRandomPlaylists(limit);
        res.json(result);
    }
    catch (error) {
        console.error('Get random playlists failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const getNewestPlaylists = async (req, res) => {
    try {
        const limit = req.query.limit;
        const result = await playlistService.getNewestPlaylists(limit);
        res.json(result);
    }
    catch (error) {
        console.error('Get newest playlists failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}
export const PlaylistController = {
    getFavouritePlaylist,
    toggleFavouritePlaylist,
    getUserCreatedPlaylist,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    deleteSongFromPlaylist,
    getRandomPlaylists,
    getNewestPlaylists,
};
