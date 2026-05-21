import { songService } from './../services/SongService.js';
//Lấy toàn bộ bài hát
const getAllSong = async (req, res) => {
    const result = await songService.getAllSong();
    res.send(result);
}
//Kiểm tra bài hát có phải là yêu thích của người dùng hay không
const isFavouriteSong = async (req, res) => {
    try {
        const defaultPlaylistId = Number(req.query.defaultPlaylistId);
        const songId = Number(req.query.songId);

        if (!defaultPlaylistId || !songId)
            return res.status(400).json({ message: 'Thiếu defaultPlaylistId hoặc songId' });

        const isFav = await songService.isFavouriteSong(defaultPlaylistId, songId);
        res.json({ isFavouriteSong: isFav });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};
//Chuyển trạng thái yêu thích của bài hát
const toggleFavouriteSong = async (req, res) => {
    try {
        const { defaultPlaylistId, songId } = req.body;
        if (!defaultPlaylistId || !songId) {
            return res.status(400).json({ message: 'Thiếu defaultPlaylistId hoặc songId' });
        }
        const newStatus = await songService.toggleFavouriteSong(Number(defaultPlaylistId), Number(songId));
        res.json({ isFavouriteSong: newStatus });
    } catch (error) {
        console.error('Toggle favourite failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

//Lấy top 10 bài hát được nghe nhiều nhất
const getTop10MostPlayedSongs = async (req, res) => {
    try {
        const result = await songService.getTop10MostPlayedSongs();
        res.json(result);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

//Tăng play_count của bài hát lên 1
const incrementPlayCount = async (req, res) => {
    try {
        const { songId } = req.body;
        if (!songId) {
            return res.status(400).json({ message: 'Thiếu songId' });
        }
        const result = await songService.incrementPlayCount(Number(songId));
        res.json({ success: true, playCount: result?.play_count });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

export const SongController = {
    getAllSong,
    isFavouriteSong,
    toggleFavouriteSong,
    getTop10MostPlayedSongs,
    incrementPlayCount
}