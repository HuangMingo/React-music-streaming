import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { useAuthContext } from './AuthContext';
import axios from 'axios';
import { showNotificationToast } from '../toast.js';
import { API_URL } from '../api.js';
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
  const [favouritePlaylistIds, setFavouritePlaylistIds] = useState(new Set());
  //Toggle trạng thái yêu thích của bài hát cho người dùng.
  async function toggleFavouriteSong(event, songId) {
    //Ngăn chặn sự kiện từ cha
    event.stopPropagation();
    if (!currentUser?.id || !songId) {
      showNotificationToast("Vui lòng đăng nhập để thêm bài hát yêu thích");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/songs/toggle-favourite-song`, {
        defaultPlaylistId: currentUser?.defaultPlaylistId,
        songId: songId,
      });
      const nextIsFavourite = Boolean(response?.data?.isFavouriteSong);
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
//Toggle trạng thái yêu thích của playlist cho người dùng.
  async function toggleFavouritePlaylist(event, playlistId) {
    event.stopPropagation();
    if (!currentUser?.id ) {
        showNotificationToast("Vui long đăng nhập để thêm playlist yêu thích");
      return;
    }
    try {
      const response = await axios.post(`${API_URL}/api/playlists/toggle-favourite-playlist`, {
        userId: currentUser.id,
        playlistId,
      });
      const nextIsFavourite = Boolean(response?.data?.isFavouritePlaylist);
      showNotificationToast(
        nextIsFavourite
          ? "Đã thêm playlist vào danh sách yêu thích"
          : "Đã xóa playlist khỏi danh sách yêu thích"
      );
      setFavouritePlaylistIds((prev) => {
        const next = new Set(prev);
        if (nextIsFavourite) {
          next.add(playlistId);
        } else {
          next.delete(playlistId);
        }
        return next;
      });
    } catch (error) {
      console.error("Toggle favourite playlist failed:", error);
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
  //State trigger form Xóa bài hát khỏi playlist
  const [songToRemove, setSongToRemove] = useState(null);
  function handleOpenRemoveSongDialog(event, song) {
    event.preventDefault();
    event.stopPropagation();
    setSongToRemove(song);
  }
  function handleCloseRemoveSongDialog() {
    setSongToRemove(null);
  }
  //Dữ liệu bài hát được chọn
  const [currentSong, setCurrentSong] = useState(EMPTY_SONG);
  // --------------Active song-------------
  function handleClickSong(song) {
    setCurrentSong(song);
    setIsPlaying(true);
    if (currentSong !== song) {
      // Reset currentTime when changing songs
      setCurrentTime(0);
    }
  }
  // Sau khi xóa bài hát khỏi playlist thành công, cập nhật lại danh sách bài hát trong playlist đã chọn
  function handleSongRemoved(removedSong) {

    setSelectedPlaylist((prevPlaylist) => {
      if (!prevPlaylist) {
        return prevPlaylist;
      }

      return {
        ...prevPlaylist,
        songs: prevPlaylist.songs.filter(
          (song) => song.id !== removedSong.id
        ),
      };
    });

    handleCloseRemoveSongDialog();
  }
  //xử lý sau khi thêm bài hát.
  function handleSongAddedToPlaylist(playlistId, addedSong) {
    setUserPlaylists((prevPlaylists) =>
      prevPlaylists.map((playlist) => {
        if (playlist.id !== Number(playlistId)) {
          return playlist;
        }

        const songs = playlist.songs || [];
        const isExisting = songs.some((song) => song.id === addedSong.id);

        if (isExisting) {
          return playlist;
        }

        return {
          ...playlist,
          songs: [addedSong, ...songs],
          playlist_image: addedSong.image || playlist.playlist_image,
        };
      })
    );

    setSelectedPlaylist((prevPlaylist) => {
      if (!prevPlaylist || prevPlaylist.id !== Number(playlistId)) {
        return prevPlaylist;
      }

      const songs = prevPlaylist.songs || [];
      const isExisting = songs.some((song) => song.id === addedSong.id);

      if (isExisting) {
        return prevPlaylist;
      }

      return {
        ...prevPlaylist,
        songs: [addedSong, ...songs],
        playlist_image: addedSong.image || prevPlaylist.playlist_image,
      };
    });
  }
  //State để lưu id của bài hát đang mở menu

  //State để lưu thông tin playlist đang mở menu khi click vào 3 chấm ở mỗi bài hát
  const [selectedPlaylistBySong, setSelectedPlaylistBySong] = useState({});
  //State để lưu tất cả playlist của người dùng
  const [userPlaylists, setUserPlaylists] = useState([]);
  //tai du lieu cac playlist cua user khi login vao userPlaylists
  useEffect(() => {
    if (!currentUser?.id) {
      setUserPlaylists([]);
      return;
    }

    let isMounted = true;
    //Tải danh sách playlist của người dùng
    async function loadUserPlaylists() {
      try {
        const response = await axios.get(
          `${API_URL}/api/playlists/user-created-playlists?userId=${currentUser.id}`
        );

        if (!isMounted) {
          return;
        }

        setUserPlaylists(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        if (isMounted) {
          setUserPlaylists([]);
        }
        console.error("Load user playlists failed:", error);
      }
    }

    loadUserPlaylists();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setFavouritePlaylistIds(new Set());
      return;
    }

    let isMounted = true;

    async function loadFavouritePlaylists() {
      try {
        const response = await axios.get(
          `${API_URL}/api/playlists/favourite-playlists?userId=${currentUser.id}`
        );

        if (!isMounted) {
          return;
        }

        const playlistIds = Array.isArray(response?.data)
          ? response.data.map((playlist) => playlist.id)
          : [];
        setFavouritePlaylistIds(new Set(playlistIds));
      } catch (error) {
        if (isMounted) {
          setFavouritePlaylistIds(new Set());
        }
        console.error("Load favourite playlists failed:", error);
      }
    }

    loadFavouritePlaylists();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);
  //Ref trỏ về menu của mỗi bài hát để kiểm tra click bên ngoài đóng menu
  const playlistMenuRef = useRef(null);

  //lưu playlist mà người dùng đã chọn cho từng bài hát.
  function handleSelectTargetPlaylist(songId, playlistId) {
    console.log(playlistId);
    setSelectedPlaylistBySong((prev) => ({
      ...prev,
      [songId]: playlistId,
    }));
  }
  //Đóng menu khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        playlistMenuRef.current &&
        !playlistMenuRef.current.contains(event.target)
      ) {
        setOpenSongMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //Active playlist
  function handleClickPlaylist(playlist) {

  }

  //Dữ liệu các bài hát của playlist đang được chọn
  const [selectedPlaylist, setSelectedPlaylist] = useState(() => {
    try {
      const savedPlaylistStr = localStorage.getItem("selectedPlaylist");
      if (savedPlaylistStr && savedPlaylistStr !== "undefined") {
        return JSON.parse(savedPlaylistStr);
      }
    } catch (error) {
      console.error("Error restoring selectedPlaylist:", error);
      localStorage.removeItem("selectedPlaylist");
    }

    return null;
  });

  useEffect(() => {
    try {
      //Lưu dữ liệu âm lượng vào biến hiện tại
      const savedVolumeStr = localStorage.getItem("currentVolume");
      if (savedVolumeStr && savedVolumeStr !== "undefined") {
        const savedVolume = JSON.parse(savedVolumeStr);
        if (savedVolume !== null) {
          setCurrentVolume(Number(savedVolume) > 0 ? savedVolume : 50);
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

  // async function handleClickPlaylistPersonal(playlist) {
  //     try {
  //         const response = await axios.get(
  //             `${API_URL}/api/playlists/playlist-details`,
  //             {
  //                 params: {
  //                     playlistId: playlist.id
  //                 }
  //             }
  //         );

  //         const playlistData = response.data;

  //         setSelectedPlaylist(playlistData);

  //         const firstSong = playlistData?.songs?.[0];

  //         if (firstSong) {
  //             setCurrentSong(firstSong);
  //             setCurrentTime(0);
  //             setIsPlaying(true);
  //         }
  //     } catch (error) {
  //         console.error("Load playlist failed:", error);
  //     }
  // }

  // Auto-save currentSong to localStorage
  useEffect(() => {
    if (currentSong !== null) {
      localStorage.setItem("currentSong", JSON.stringify(currentSong));
    }
  }, [currentSong]);

  // Auto-save selectedPlaylist to localStorage
  useEffect(() => {
    if (selectedPlaylist !== null) {
      localStorage.setItem("selectedPlaylist", JSON.stringify(selectedPlaylist));
      return;
    }
  }, [selectedPlaylist]);
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
    <MusicContext.Provider value={{
      favouriteSongIds,
      setFavouriteSongIds,
      toggleFavouriteSong,
      favouritePlaylistIds,
      setFavouritePlaylistIds,
      toggleFavouritePlaylist,
      currentSong,
      setCurrentSong,
      selectedPlaylist,
      setSelectedPlaylist,
      currentVolume,
      setCurrentVolume,
      currentTime,
      setCurrentTime,
      isPlaying,
      setIsPlaying,
      handleClickSong,
      handleClickPlaylist,
      songToRemove,
      setSongToRemove,
      handleOpenRemoveSongDialog,
      handleCloseRemoveSongDialog,
      refreshPlaylists,
      selectedPlaylistBySong,
      userPlaylists,
      playlistMenuRef,
      handleSelectTargetPlaylist,
      handleSongRemoved,
    }}>
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
  localStorage.removeItem("playlistIndex");
  localStorage.removeItem("selectedPlaylist");
}
