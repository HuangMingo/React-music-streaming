import { songService } from './../services/SongService.js';
import { playlistService } from './../services/PlaylistService.js';
import { albumService } from './../services/AlbumService.js';
//Lấy toàn bộ bài hát
const getAllSong = async (req, res) => {
    const result = await songService.getAllSong();
    res.send(result);
}
//Kiểm tra bài hát có phải là yêu thích của người dùng hay không
const getNewestSongs = async (req, res) => {
    try {
        const result = await songService.getNewestSongs(req.query.limit);
        res.json(result);
    } catch (error) {
        console.error('Get newest songs failed:', error);
        res.status(500).json({ message: 'Lá»—i há»‡ thá»‘ng' });
    }
}

const isFavouriteSong = async (req, res) => {
    try {
        const defaultPlaylistId = req.query.defaultPlaylistId;
        const songId = req.query.songId;
        if (!defaultPlaylistId)
            return res.status(400).json({ message: 'Thiếu defaultPlaylistId' });
        if (!songId)
            return res.status(400).json({ message: "Thiếu songId" });
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
        if (!defaultPlaylistId) {
            return res.status(400).json({ message: 'Thiếu defaultPlaylistId' });
        }
        if (!songId) {
            return res.status(400).json({ message: "Thiếu songId" });
        }
        const newStatus = await songService.toggleFavouriteSong(defaultPlaylistId, songId);
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
        res.status(500).json({ message: `${error.message}` });
    }
}

//Tăng play_count của bài hát lên 1
const incrementPlayCount = async (req, res) => {
    try {
        const { songId } = req.body;
        if (!songId) {
            return res.status(400).json({ message: 'Thiếu songId' });
        }
        const result = await songService.incrementPlayCount(songId);
        res.json({ success: true, playCount: result?.play_count });
    }
    catch (error) {
        console.log(error.message);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const getNewMusic = async (req, res) => {
    try {
        const [songs, playlists, albums] = await Promise.all([
            songService.getNewestSongs(req.query.songLimit ?? 6),
            playlistService.getNewestPlaylists(req.query.playlistLimit ?? 5),
            albumService.getNewestAlbums(req.query.albumLimit ?? 5),
        ]);

        res.json({ songs, playlists, albums });
    } catch (error) {
        console.error('Get new music failed:', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
}

const getAudioBySongId = async (req, res) => {
    try {
        const songId = req.query.songId || req.params.songId;
        if (!songId) {
            return res.status(400).json({ message: "Thiếu songId" });
        }
        const result = await songService.getAudioBySongId(songId);
        if (!result?.audio) {
            return res.status(404).json({ message: "Bài hát này chưa có audio" });
        }
        res.json(result);
    }
    catch (error) {
        console.error("Get audio failed", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
}
const streamSong = async (req, res) => {
    try {
        const { songId } = req.params;
        if (!songId) {
            res.status(400).json({
                message: "Thiếu songId"
            });
        }
        const result = await songService.getAudioBySongId(songId);
        const file_path = result?.audio;
        if (!file_path) {
            return res.status(400).json({
                message: "Bài hát này chưa có audio"
            })
        }
        return res.redirect(file_path);
    }
    catch(error){
        console.log("Lỗi hệ thống", error);
        return res.status(500).json(
            {
                message: "Lỗi hệ thống"
            }
        );
    }
}
export const SongController = {
    getAllSong,
    getNewestSongs,
    isFavouriteSong,
    toggleFavouriteSong,
    getTop10MostPlayedSongs,
    incrementPlayCount,
    getNewMusic,
    getAudioBySongId,
    streamSong
}
