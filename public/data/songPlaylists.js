import axios from 'axios';

export const MUSIC_STORAGE_KEY = 'VIK_MUSIC';

// Tạo một hàm khởi tạo dữ liệu
const initMusicData = async () => {
    try {
        // Chờ API trả về dữ liệu
        const response = await axios.get('http://localhost:3000/api/favourite-playlists');
        const data = response.data;

        // Sau khi có dữ liệu mới lưu vào localStorage
        localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(data));
        
        console.log("Đã lưu dữ liệu vào VIK_MUSIC:", data);
        return data;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
};

// Gọi hàm để thực thi
initMusicData();