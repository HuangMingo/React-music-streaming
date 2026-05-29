import { searchService } from '../services/SearchService.js';

const suggest = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const userId = req.query.userId ? Number(req.query.userId) : null;
        if (!q) return res.json({ songs: [], artists: [], playlists: [] });
        const result = await searchService.suggest(q, Number.isFinite(userId) ? userId : null);
        res.json(result);
    } catch (error) {
        console.error('Suggest failed', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

const searchAll = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const userId = req.query.userId ? Number(req.query.userId) : null;
        if (!q) return res.json({ songs: [], artists: [], playlists: [] });
        const result = await searchService.searchAll(q, Number.isFinite(userId) ? userId : null);
        res.json(result);
    } catch (error) {
        console.error('Search failed', error);
        res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

export const SearchController = {
    suggest,
    searchAll
};
