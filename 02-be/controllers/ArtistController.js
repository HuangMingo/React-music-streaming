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
        return res.status(500).json({ message: 'Lá»—i há»‡ thá»‘ng' });
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
        return res.status(500).json({ message: 'LÃ¡Â»â€”i hÃ¡Â»â€¡ thÃ¡Â»â€˜ng' });
    }
};

export const ArtistController = {
    getArtistBySlug,
    getArtistDetailBySlug,
};
