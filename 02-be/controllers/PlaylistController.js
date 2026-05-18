import { playlistService } from "../services/PlaylistService.js";
const getFavouritePlaylist = async (req, res) => {
    try {
        const userId = Number(req.query.userId);
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
const getUserCreatedPlaylist = async (req, res) => {
    try {
        const userId = Number(req.query.userId);
        if (!userId) {
            return res.status(400).json({ message: 'Thiếu userId' });
        }
        const result = await playlistService.getUserCreatedPlaylist(userId);
        res.send(result);
    }
    catch (error) {
        console.error('Get user created playlists failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const getPlaylistById = async (req, res) => {
    try {
        const playlistId = Number(req.query.playlistId);
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
        const creatorId = Number(creator_id);
        if (!Number.isInteger(creatorId) || creatorId <= 0) {
            res.status(400).json({ message: 'creator_id is invalid' });
            return;
        }
        const newPlaylist = await playlistService.createPlaylist({
            name: name.trim(),
            creatorId: creatorId,
            ispublic: Boolean(ispublic),
            isDefault: Boolean(isdefault)
        });

        res.status(201).json(newPlaylist);
    } catch (error) {
        console.error('Create playlist failed:', error);
        res.status(500).json({ message: 'Cannot create playlist' });
    }
}
const deletePlaylist = async (req, res) => {
    try {
        const playlistId = Number(req.query.playlistId);
        const userId = Number(req.query.userId);
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
        const playlistId = Number(req.query.playlistId ?? req.body.playlistId);
        const songId = Number(req.query.songId ?? req.body.songId);
        if (!playlistId || !songId) {
            return res.status(400).json({ message: 'Thiếu playlistId hoặc songId' });
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
        const playlistId = Number(req.query.playlistId ?? req.body.playlistId);
        const songId = Number(req.query.songId ?? req.body.songId);
        if (!playlistId || !songId) {
            return res.status(400).json({ message: 'Thiếu playlistId hoặc songId' });
        }

        const removedSong = await playlistService.deleteSongFromPlaylist(playlistId, songId);
        if (!removedSong) {
            return res.status(404).json({ message: 'Bài hát không còn trong playlist' });
        }

        res.json({ success: true, playlistId, songId });
    }
    catch (error) {
        console.error('Remove song from playlist failed:', error);
        res.status(500).json({ message: 'Không thể xóa bài hát khỏi playlist lúc này' });
    }
}
export const PlaylistController = {
    getFavouritePlaylist,
    getUserCreatedPlaylist,
    getPlaylistById,
    createPlaylist,
    deletePlaylist, 
    addSongToPlaylist,
    deleteSongFromPlaylist
};
