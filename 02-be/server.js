import express from 'express';
import cors from 'cors';
import { getAllSong } from './services/SongService.js';
import { createPlaylist, getAllPlaylist } from './services/PlaylistService.js';
const app = express();
app.get('/', (req, res) => {
	res.send("Hello Minh");
});
const PORT = 3000;
var server = app.listen(PORT, async () => {
	await console.log("Nodejs dang hoat dong tai http://localhost:3000");
});
// Cấu hình chỉ cho phép React của bạn:
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/songs', async (req, res) => {
	const result = await getAllSong();
	res.send(result);
});

app.get('/api/favourite-playlists', async (req, res) => {
	const result = await getAllPlaylist();
	res.send(result);
});

app.post('/api/playlists', async (req, res) => {
	try {
		const { name, creator_id, ispublic, image } = req.body;

		if (!name || !name.trim()) {
			res.status(400).json({ message: 'Playlist name is required' });
			return;
		}

		const newPlaylist = await createPlaylist({
			name: name.trim(),
			creatorId: Number(creator_id) || 1,
			ispublic: Boolean(ispublic),
			image: image || null,
		});

		res.status(201).json(newPlaylist);
	} catch (error) {
		console.error('Create playlist failed:', error);
		res.status(500).json({ message: 'Cannot create playlist' });
	}
});

