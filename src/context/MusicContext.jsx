import { createContext, useState, useContext, useEffect } from 'react';

const MusicContext = createContext();
const EMPTY_SONG = {
  path: '',
  name: '',
  singers: [],
  image: '',
  duration: 0,
};

export function MusicProvider({ children }) {
  const [currentTime, setCurrentTime] = useState(0); // Thời gian hiện tại của bài hát
  const [currentVolume, setCurrentVolume] = useState(100); // Mặc định âm lượng là 100%
  //Chạy bài hoặc dừng
  const [isPlaying, setIsPlaying] = useState(false);
  //Dữ liệu bài hát được chọn
  const [currentSong, setCurrentSong] = useState(EMPTY_SONG);
  // ----Vị trí bài hát đang phát trong playlist-----
  const [currentIndex, setCurrentIndex] = useState(0);
  //Playlist đang được chọn
  const [playlistIndex, setPlaylistIndex] = useState(0);
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
      //Chuỗi vị trí bài hát hiện tại được lưu trong localStorage
      const savedIndexStr = localStorage.getItem("currentSongIndex");
      if (savedIndexStr && savedIndexStr !== "undefined") {
        const savedIndex = JSON.parse(savedIndexStr);
        if (savedIndex !== null) {
          setCurrentIndex(savedIndex);
        }
      }
      //Chuỗi vị trí playlist hiện tại được lưu trong localStorage
      const savedPlaylistIndexStr = localStorage.getItem("playlistIndex");
      if (savedPlaylistIndexStr && savedPlaylistIndexStr !== "undefined") {
        const savedPlaylistIndex = JSON.parse(savedPlaylistIndexStr);
        if (savedPlaylistIndex !== null) {
          setPlaylistIndex(savedPlaylistIndex);
        }
      }
      //  Chuỗi playlist được lưu trong localStorage
      const savedPlaylistStr = localStorage.getItem("selectedPlaylist");
      if (savedPlaylistStr && savedPlaylistStr !== "undefined") {
        const savedPlaylist = JSON.parse(savedPlaylistStr);
        if (savedPlaylist !== null) {
          setSelectedPlaylist(savedPlaylist);
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
      // Clear corrupted data
      localStorage.removeItem("currentSongIndex");
      localStorage.removeItem("playlistIndex");
      localStorage.removeItem("currentSong");
      localStorage.removeItem("selectedPlaylist");
      localStorage.removeItem("isPlaying");
    }
  }, []);

  // Auto-save currentIndex to localStorage
  useEffect(() => {
    localStorage.setItem("currentSongIndex", JSON.stringify(currentIndex));
  }, [currentIndex]);

  // Auto-save playlistIndex to localStorage
  useEffect(() => {
    localStorage.setItem("playlistIndex", JSON.stringify(playlistIndex));
  }, [playlistIndex]);

  // Auto-save selectedPlaylist to localStorage
  useEffect(() => {
    if (selectedPlaylist !== null) {
      localStorage.setItem("selectedPlaylist", JSON.stringify(selectedPlaylist));
    }
  }, [selectedPlaylist]);

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
    <MusicContext.Provider value={{ currentSong, setCurrentSong, currentIndex, setCurrentIndex, playlistIndex, setPlaylistIndex, selectedPlaylist, setSelectedPlaylist, currentVolume, setCurrentVolume, currentTime, setCurrentTime }}>
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
