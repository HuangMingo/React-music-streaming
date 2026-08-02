import { genreSongService } from "../services/GenreSongService.js";

const createGenreSong = async (req, res) => {
    console.log(req.body);
    try {
        const songId = req.body.songId;
        const genreId = req.body.genreId;
        if (!songId) {
            return res.status(400).json({
                message: 'songId không hợp lệ'
            })
        }
        if (!genreId) {
            return res.status(400).json({
                message: 'genreId không hợp lệ'
            })
        }
        const result = await genreSongService.createGenreSong(songId, genreId);
        return res.json(result);
    }
    catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}
const deleteGenreSong = async (req, res) => {
    const songId = req.params.songId || req.query.songId;
    const genreId = req.params.genreId || req.query.genreId;
    if (!songId) {
        return res.status(400).json({
            message: "SongId không hợp lệ"
        })
    }
    if (!genreId) {
        return res.status(400).json({
            message: "GenreId không hợp lệ"
        })
    }
    try {
        const result = await genreSongService.deleteGenreSong(songId, genreId);
        return res.status(200).json({
            message: `Xóa thành công genre_song ${genreId} và ${songId}`
        });
    }
    catch (error) {
        return res.json({
            message: error.message
        })
    }
}
export const genreSongController = {
    createGenreSong,
    deleteGenreSong
}   