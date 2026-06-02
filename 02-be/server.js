import express from 'express';
import cors from 'cors';

import SongRoutes from './routes/SongRoutes.js';
import PlaylistRoutes from './routes/PlaylistRoutes.js';
import AuthRoutes from './routes/AuthRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import AlbumRoutes from './routes/AlbumRoutes.js';
import SearchRoutes from './routes/SearchRoutes.js';
import ArtistRoutes from './routes/ArtistRoutes.js';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url) });
const app = express();
app.get('/', (req, res) => {
	res.send("Hello Minh");
});
const PORT = process.env.PORT || 3000;

// Cấu hình chỉ cho phép localhost:5173 (frontend) truy cập API để tránh lỗi CORS khi phát triển. Khi deploy thực tế, cần điều chỉnh lại cho phù hợp.
app.use(cors({ origin: 'https://frontend-rmqd.onrender.com' }));
app.use(express.json());
app.use('/api/songs', SongRoutes);
app.use('/api/playlists', PlaylistRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/albums', AlbumRoutes);
app.use('/api/search', SearchRoutes);
app.use('/api/artists', ArtistRoutes);

var server = app.listen(PORT, async () => {
	await console.log("Nodejs dang hoat dong tai http://localhost:" + PORT);
});
