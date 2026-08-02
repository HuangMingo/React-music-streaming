import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import SongRoutes from './routes/SongRoutes.js';
import PlaylistRoutes from './routes/PlaylistRoutes.js';
import AuthRoutes from './routes/AuthRoutes.js';
import UserRoutes from './routes/UserRoutes.js';
import AlbumRoutes from './routes/AlbumRoutes.js';
import SearchRoutes from './routes/SearchRoutes.js';
import ArtistRoutes from './routes/ArtistRoutes.js';
import AdminRoutes from './routes/AdminRoutes.js';
import GenreRoutes from './routes/GenreRoutes.js';
import GenreSongRoutes from './routes/GenreSongRoutes.js';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
dotenv.config({ path: new URL('./.env', import.meta.url) });
const app = express();
const uploadsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
console.log(uploadsDir);
app.get('/', (req, res) => {
	res.send("Hello Minh");
});
const PORT = process.env.PORT || 3000;

// Cấu hình chỉ cho phép localhost:5173 (frontend) truy cập API để tránh lỗi CORS khi phát triển. Khi deploy thực tế, cần điều chỉnh lại cho phù hợp.
const allowedOrigins = [
	'http://localhost:5173',
	'https://frontend-rmqd.onrender.com',
];

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
// Cấu hình multer để lưu file vào thư mục uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, uploadsDir); // Lưu vào thư mục uploads
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)); // Đặt tên file là timestamp + tên gốc
	}
});

const upload = multer({ storage: storage });
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dnsne0dgp',
	api_key: process.env.CLOUDINARY_API_KEY || '968498846331982',
	api_secret: process.env.CLOUDINARY_API_SECRET || '3j8rjKuTnuk2vo-9Zh4SWUZIi14'
});
app.post('/api/uploads/:type', upload.fields([{ name: 'file', maxCount: 1 }, { name: 'image', maxCount: 1 }]), async (req, res) => {
	const file = req.files?.file?.[0] || req.files?.image?.[0];
	const type = req.params.type; //chia folder cho từng loại file
	const folderMap = {
		album: 'album',
		artists: 'artists',
		song: 'song',
		songImage: 'songImage',
		lyrics: 'lyrics',
		bio: 'bio'
	}

	if (!file) {
		return res.status(400).json({ message: 'Vui lòng chọn file để upload.' });
	}

	const result = await cloudinary.uploader.upload(file.path, {
		folder: folderMap[type] || 'others',
		// Nếu type không khớp với bất kỳ key nào trong folderMap,
		// 	 sẽ lưu vào folder 'others'
		resource_type: 'auto'
	});
	fs.unlink(file.path, (err) => {
		if (err)
			console.log(err);
	});
	const durationSeconds = result.duration
    ? Math.floor(result.duration)
    : null;
	res.status(200).json({ 
		url: result.secure_url,
		duration_seconds: durationSeconds
	})
}
);
app.use('/api/uploads', express.static(uploadsDir)); // Cho phép truy cập file trong thư mục uploads qua URL /api/uploads
app.use('/api/songs', SongRoutes);
app.use('/api/playlists', PlaylistRoutes);
app.use('/api/auth', AuthRoutes);
app.use('/api/users', UserRoutes);
app.use('/api/albums', AlbumRoutes);
app.use('/api/genres', GenreRoutes);
app.use('/api/search', SearchRoutes);
app.use('/api/artists', ArtistRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/genre-song', GenreSongRoutes);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(err.status || 500).json({ message: err.message || 'Đã xảy ra lỗi khi xử lý yêu cầu.' });
});

var server = app.listen(PORT, async () => {
	await console.log("Nodejs dang hoat dong tai http://localhost:" + PORT);
});
