import { songService } from './../services/SongService.js';
import { playlistService } from './../services/PlaylistService.js';
import { albumService } from './../services/AlbumService.js';
import { Buffer } from 'node:buffer';
const AUDIO_CHUNK_SIZE = 1024 * 1024;

const parseAudioRange = (rangeHeader, fileSize) => {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader?.trim() || '');
    if (!match || (!match[1] && !match[2])) return null;

    let start;
    let end;
    if (!match[1]) {
        const suffixLength = Number(match[2]);
        if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
        start = Math.max(fileSize - suffixLength, 0);
        end = fileSize - 1;
    } else {
        start = Number(match[1]);
        const requestedEnd = match[2] ? Number(match[2]) : fileSize - 1;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd)) return null;
        end = Math.min(requestedEnd, start + AUDIO_CHUNK_SIZE - 1, fileSize - 1);
    }

    if (start < 0 || start >= fileSize || end < start) return null;
    return { start, end };
};
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
    } catch {
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
            return res.status(400).json({
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
        const audioUrl = new URL(file_path);
        if (!['http:', 'https:'].includes(audioUrl.protocol)) {
            return res.status(500).json({ message: 'Invalid audio URL' });
        }

        const metadataResponse = await fetch(audioUrl, { method: 'HEAD' });
        const fileSize = Number(metadataResponse.headers.get('content-length'));
        if (!metadataResponse.ok || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
            throw new Error(`Cannot read audio metadata: ${metadataResponse.status}`);
        }

        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Type', metadataResponse.headers.get('content-type') || 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        const rangeHeader = req.headers.range;
        if (!rangeHeader) {
            const fullResponse = await fetch(audioUrl);
            if (!fullResponse.ok || !fullResponse.body) {
                throw new Error(`Audio origin returned ${fullResponse.status}`);
            }
            const body = Buffer.from(await fullResponse.arrayBuffer());
            res.setHeader('Content-Length', body.length);
            return res.status(200).send(body);
        }

        const range = parseAudioRange(rangeHeader, fileSize);
        if (!range) {
            res.setHeader('Content-Range', `bytes */${fileSize}`);
            return res.sendStatus(416);
        }

        const upstreamResponse = await fetch(audioUrl, {
            headers: { Range: `bytes=${range.start}-${range.end}` }
        });
        if (upstreamResponse.status !== 206 || !upstreamResponse.body) {
            throw new Error(`Audio origin did not return partial content: ${upstreamResponse.status}`);
        }

        const body = Buffer.from(await upstreamResponse.arrayBuffer());
        res.status(206);
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${fileSize}`);
        res.setHeader('Content-Length', body.length);
        return res.send(body);
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
