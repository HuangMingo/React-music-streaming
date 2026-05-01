import { createContext, useState, useContext, useEffect } from 'react';
import { useAuthContext } from './AuthContext';
import axios from 'axios';
import { showNotificationToast } from '../toast.js';
const MusicContext = createContext();
const EMPTY_SONG = {
  path: '',
  name: '',
  singers: [],
  image: '',
  duration: 0,
};

export function MusicProvider({ children }) {
  //Số bài hát yêu thích trong playlist  bản yêu thích của người dùng (0: mặc định, 1: yêu thích, 2: không yêu thích)
  const { currentUser, setCurrentUser } = useAuthContext();

  //Sử dụng Set tạo state để lưu trữ tập hợp ID của các bài hát yêu thích
  const [favouriteSongIds, setFavouriteSongIds] = useState(new Set());
  //Toggle trạng thái yêu thích của bài hát cho người dùng.
  async function toggleFavouriteSong(event, songId) {
    //Ngăn chặn sự kiện từ cha
    event.stopPropagation();
    if (!currentUser?.id || !songId) {
      showNotificationToast("Vui lòng đăng nhập để thêm bài hát yêu thích");
      return;
    }
    try {
      const response = await axios.post("http://localhost:3000/api/songs/toggle-favourite", {
        userId: currentUser.id,
        songId: songId,
      });
      const nextIsFavourite = Boolean(response?.data?.isFavourite);
      showNotificationToast(
        nextIsFavourite
          ? "Đã thêm bài hát vào " + `Nhạc của ${currentUser.username}`
          : "Đã xóa bài hát khỏi " + `Nhạc của ${currentUser.username}`
      );
      setFavouriteSongIds((prev) => {
        const next = new Set(prev);
        if (nextIsFavourite) {
          next.add(songId);
        } else {
          next.delete(songId);
        }
        return next;
      });
    } catch (error) {
      console.error("Toggle favourite failed:", error);
    }
  }
  const [favouriteVersion, setFavouriteVersion] = useState(0);
  const refreshPlaylists = () => setPlaylistVersion(v => v + 1);
  // Thời gian hiện tại của bài hát
  const [currentTime, setCurrentTime] = useState(0);
  // Mặc định âm lượng là 0%
  const [currentVolume, setCurrentVolume] = useState(0);
  //Chạy bài hoặc dừng
  const [isPlaying, setIsPlaying] = useState(false);
  //Dữ liệu bài hát được chọn
  const [currentSong, setCurrentSong] = useState(EMPTY_SONG);
  // --------------Active song-------------
  function handleClickSong(song) {
    setCurrentSong(song);
    if (currentSong !== song) {
      // Reset currentTime when changing songs
      setCurrentTime(0);
    }
  }
  //Dữ liệu các bài hát của playlist đang được chọn
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    try {
      // Khi component được mount, kiểm tra localStorage để khôi phục trạng thái
      const savedIsPlayingStr = localStorage.getItem("isPlaying");
      if (savedIsPlayingStr && savedIsPlayingStr !== "undefined") {
        const savedIsPlaying = JSON.parse(savedIsPlayingStr);
        if (savedIsPlaying !== null) {
          setIsPlaying(savedIsPlaying);
        }
      }

      // Không lưu selectedPlaylist nữa, chỉ giữ trong state runtime
      const savedPlaylistStr = localStorage.getItem("selectedPlaylist");
      if (savedPlaylistStr && savedPlaylistStr !== "undefined") {
          const savedPlaylist = JSON.parse(savedPlaylistStr);
          if (savedPlaylist !== null) {
              setSelectedPlaylist(savedPlaylist);
          }
      }
      //Lưu dữ liệu âm lượng vào biến hiện tại
      const savedVolumeStr = localStorage.getItem("currentVolume");
      if (savedVolumeStr && savedVolumeStr !== "undefined") {
        const savedVolume = JSON.parse(savedVolumeStr);
        if (savedVolume !== null) {
          setCurrentVolume(savedVolume);
        }
      }
      //Lưu dữ liệu thời gian hiện tại của bài hát vào currentTime
      const savedTimeStr = localStorage.getItem("currentTime");
      if (savedTimeStr && savedTimeStr !== "undefined") {
        const savedTime = JSON.parse(savedTimeStr);
        if (savedTime !== null) {
          setCurrentTime(savedTime);
        }
      }
      //Dữ liệu bài hát hiện tại được lưu trong localStorage
      const savedCurrentSongStr = localStorage.getItem("currentSong");
      if (savedCurrentSongStr && savedCurrentSongStr !== "undefined") {
        const savedCurrentSong = JSON.parse(savedCurrentSongStr);
        if (savedCurrentSong !== null) {
          setCurrentSong(savedCurrentSong);
        }
      }

    } catch (error) {
      console.error("Error parsing localStorage:", error);
      // Clear corrupted data from localStorage
      localStorage.removeItem("currentSong");
      localStorage.removeItem("selectedPlaylist");
      localStorage.removeItem("isPlaying");
    }
  }, []);


  // Luôn fetch lại playlist từ server khi selectedPlaylist.id thay đổi
  useEffect(() => {
    const playlistId = Number(selectedPlaylist?.id);
    if (!playlistId) {
      return;
    }

    let isMounted = true;

    async function loadSelectedPlaylist() {
      try {
        const response = await axios.get(`http://localhost:3000/api/playlists/playlist-details?playlistId=${playlistId}`);
        if (!isMounted) {
          return;
        }

        const playlistData = Array.isArray(response?.data) ? response.data[0] : response?.data;
        if (playlistData) {
          setSelectedPlaylist(playlistData);
        }
      } catch (error) {
        console.error("Load selected playlist failed:", error);
      }
    }

    loadSelectedPlaylist();

    return () => {
      isMounted = false;
    };
  }, [selectedPlaylist?.id]);

  // Auto-save currentSong to localStorage
  useEffect(() => {
    if (currentSong !== null) {
      localStorage.setItem("currentSong", JSON.stringify(currentSong));
    }
  }, [currentSong]);
  // Auto-save isPlaying to localStorage
  useEffect(() => {
    localStorage.setItem("isPlaying", JSON.stringify(isPlaying));
  }, [isPlaying]);
  // Auto-save currentVolume to localStorage
  useEffect(() => {
    localStorage.setItem("currentVolume", JSON.stringify(currentVolume));
  }, [currentVolume]);
  //Auto-save currentTime to localStoragge
  useEffect(() => {
    localStorage.setItem("currentTime", JSON.stringify(currentTime));
  }, [currentTime]);
  return (
    <MusicContext.Provider value={{ favouriteSongIds, setFavouriteSongIds, toggleFavouriteSong, currentSong, setCurrentSong, selectedPlaylist, setSelectedPlaylist, currentVolume, setCurrentVolume, currentTime, setCurrentTime, isPlaying, setIsPlaying, handleClickSong }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
}

// Function to clear all music-related localStorage when user logs out
export function clearMusicStorage() {
  localStorage.removeItem("currentSongIndex");
  localStorage.removeItem("playlistIndex");
  localStorage.removeItem("selectedPlaylist");
  localStorage.removeItem("currentSong");
  localStorage.removeItem("isPlaying");
  localStorage.removeItem("currentVolume");
  localStorage.removeItem("currentTime");
}
