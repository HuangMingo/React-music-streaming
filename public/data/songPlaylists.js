import axios from 'axios';
import { API_URL } from '../../src/api.js';
// Tạo một hàm khởi tạo dữ liệu
export const initMusicData = async (userId) => {
    //Lưu các playlist cá nhân
    let personalPlaylists = [];
    try {
        //Lấy dữ liệu playlist yêu thích của người dùng (dùng cho trang khám phá)
        const response = await axios.get(`${API_URL}/api/playlists/favourite-playlists?userId=${userId}`);
        const data = response.data;
        personalPlaylists = data;

    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
    }
    //Lấy dữ liệu playlist do người dùng tạo (dùng cho trang cá nhân)
    try{
        const response = await axios.get(`${API_URL}/api/playlists/user-created-playlists?userId=${userId}`);
        const data = Array.isArray(response.data)
            ? response.data.map((playlist) => ({
                ...playlist,
                creator_id: playlist.creator_id ?? userId
            }))
            : [];
        personalPlaylists = [...personalPlaylists, ...data];
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu playlist do người dùng tạo:", error);
    }
    return personalPlaylists;
};

