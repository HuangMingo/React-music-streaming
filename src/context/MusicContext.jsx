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

function restorePlaylistFromStorage(key) {
  try {
    const savedPlaylistStr = localStorage.getItem(key);
    if (savedPlaylistStr && savedPlaylistStr !== "undefined") {
      return JSON.parse(savedPlaylistStr);
    }
  } catch (error) {
    console.error(`Error restoring ${key}:`, error);
    localStorage.removeItem(key);
  }

  return null;
}

export function MusicProvider({ children }) {
  //Số bài hát yêu thích trong playlist  bản yêu thích của người dùng (0: mặc định, 1: yêu thích, 2: không yêu thích)
  const { currentUser, setCurrentUser } = useAuthContext();

  //Sử dụng Set tạo state để lưu trữ tập hợp ID của các bài hát yêu thích
  const [favouriteSongIds, setFavouriteSongIds] = useState(new Set());
  const [favouritePlaylistIds, setFavouritePlaylistIds] = useState(new Set());
  const [favouriteAlbumIds, setFavouriteAlbumIds] = useState(new Set());
  const [activePlaylistScope, setActivePlaylistScope] = useState(() => (
    localStorage.getItem("activePlaylistScope") || "personal"
  ));
  const [personalSelectedPlaylistState, setPersonalSelectedPlaylistState] = useState(() => (
    restorePlaylistFromStorage("personalSelectedPlaylist") ||
    restorePlaylistFromStorage("selectedPlaylist")
  ));
  const [exploreSelectedPlaylistState, setExploreSelectedPlaylistState] = useState(() => (
    restorePlaylistFromStorage("exploreSelectedPlaylist")
  ));
  const personalSelectedPlaylist = personalSelectedPlaylistState;
  const exploreSelectedPlaylist = exploreSelectedPlaylistState;
  const selectedPlaylist = activePlaylistScope === "explore"
    ? exploreSelectedPlaylist
    : personalSelectedPlaylist;

  function setPersonalSelectedPlaylist(value) {
    setActivePlaylistScope("personal");
    setPersonalSelectedPlaylistState(value);
  }

  function setExploreSelectedPlaylist(value) {
    setActivePlaylistScope("explore");
    setExploreSelectedPlaylistState(value);
  }

  function resetSelectedPlaylist() {
    setPersonalSelectedPlaylistState(null);
    setExploreSelectedPlaylistState(null);
    setActivePlaylistScope("personal");
  }
  // Lưu danh sách artistId đã follow trong context để mọi màn dùng chung một nguồn state.
  const [followedArtists, setFollowedArtists] = useState(new Set());
  // Cache số follower theo artistId để UI cập nhật ngay sau follow/unfollow.
  const [artistFollowersCount, setArtistFollowersCount] = useState({});

  // Helper dùng trong component để kiểm tra nhanh trạng thái follow.
  function isArtistFollowed(artistId) {
    return followedArtists.has(Number(artistId));
  }

  // Đồng bộ trạng thái follow vào Set mà không reload trang.
  function syncArtistFollowStatus(artistId, isFollowing) {
    const normalizedArtistId = Number(artistId);
    if (!normalizedArtistId) return;

    setFollowedArtists((prev) => {
      const next = new Set(prev);
      if (isFollowing) {
        next.add(normalizedArtistId);
      } else {
        next.delete(normalizedArtistId);
      }
      return next;
    });
  }

  // Đồng bộ follower count theo artistId để ArtistDetail/card dùng lại được.
  function syncArtistFollowersCount(artistId, followersCount) {
    const normalizedArtistId = Number(artistId);
    if (!normalizedArtistId) return;

    setArtistFollowersCount((prev) => ({
      ...prev,
      [normalizedArtistId]: Number(followersCount) || 0,
    }));
  }

  // Lấy trạng thái follow từ backend khi một màn vừa load artist.
  async function loadArtistFollowStatus(artistId) {
    const normalizedArtistId = Number(artistId);
    if (!currentUser?.id || !normalizedArtistId) return false;

    try {
      const response = await axios.get(`${API_URL}/api/artists/follow-status`, {
        params: {
          userId: currentUser.id,
          artistId: normalizedArtistId,
        },
      });
      const isFollowing = Boolean(response?.data?.isFollowing);
      syncArtistFollowStatus(normalizedArtistId, isFollowing);
      return isFollowing;
    } catch (error) {
      console.error("Load artist follow status failed:", error);
      return false;
    }
  }

  // Lấy số follower từ backend và đưa vào cache trong context.
  async function loadArtistFollowersCount(artistId) {
    const normalizedArtistId = Number(artistId);
    if (!normalizedArtistId) return 0;

    try {
      const response = await axios.get(`${API_URL}/api/artists/followers-count`, {
        params: {
          artistId: normalizedArtistId,
        },
      });
      const followersCount = Number(response?.data?.followersCount) || 0;
      syncArtistFollowersCount(normalizedArtistId, followersCount);
      return followersCount;
    } catch (error) {
      console.error("Load artist followers count failed:", error);
      return 0;
    }
  }

  // Gọi API follow rồi cập nhật context sau khi backend thành công.
  async function followArtist(artistId) {
    const normalizedArtistId = Number(artistId);
    if (!currentUser?.id || !normalizedArtistId) {
      showNotificationToast("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ theo dÃµi nghá»‡ sÄ©.");
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/api/artists/follow`, {
        userId: currentUser.id,
        artistId: normalizedArtistId,
      });
      const followersCount = Number(response?.data?.followersCount) || 0;
      syncArtistFollowStatus(normalizedArtistId, true);
      syncArtistFollowersCount(normalizedArtistId, followersCount);
      return { isFollowing: true, followersCount };
    } catch (error) {
      console.error("Follow artist failed:", error);
      return null;
    }
  }

  // Gọi API unfollow rồi cập nhật context sau khi backend thành công.
  async function unfollowArtist(artistId) {
    const normalizedArtistId = Number(artistId);
    if (!currentUser?.id || !normalizedArtistId) {
      showNotificationToast("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ theo dÃµi nghá»‡ sÄ©.");
      return null;
    }

    try {
      const response = await axios.delete(`${API_URL}/api/artists/follow`, {
        data: {
          userId: currentUser.id,
          artistId: normalizedArtistId,
        },
      });
      const followersCount = Number(response?.data?.followersCount) || 0;
      syncArtistFollowStatus(normalizedArtistId, false);
      syncArtistFollowersCount(normalizedArtistId, followersCount);
      return { isFollowing: false, followersCount };
    } catch (error) {
      console.error("Unfollow artist failed:", error);
      return null;
    }
  }

  // Toggle dựa trên state context hiện tại để component không tự quản lý follow riêng.
  async function toggleFollowArtist(artistId) {
    return isArtistFollowed(artistId)
      ? unfollowArtist(artistId)
      : followArtist(artistId);
  }

  // Khi logout/chưa đăng nhập thì xóa state follow khỏi context.
  useEffect(() => {
    if (!currentUser?.id) {
      setFollowedArtists(new Set());
      setArtistFollowersCount({});
    }
  }, [currentUser?.id]);
  //Toggle trạng thái yêu thích của bài hát cho người dùng.
  async function toggleFavouriteSong(event, songId) {
    //Ngăn chặn sự kiện từ cha
    event.stopPropagation();
    if (!currentUser?.id || !songId) {
      showNotificationToast("Vui lòng đăng nhập để thêm bài hát yêu thích");
      return null;
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
      return nextIsFavourite;
    } catch (error) {
      console.error("Toggle favourite failed:", error);
      return null;
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
  async function toggleFavouriteAlbum(event, albumId) {
    event.stopPropagation();
    if (!currentUser?.id || !albumId) {
      showNotificationToast("Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ thÃªm album yÃªu thÃ­ch");
      return null;
    }

    try {
      const response = await axios.post(`${API_URL}/api/albums/toggle-favourite-album`, {
        userId: currentUser.id,
        albumId,
      });
      const nextIsFavourite = Boolean(response?.data?.isFavouriteAlbum);
      showNotificationToast(
        nextIsFavourite
          ? "Đã thêm album vào danh sách yêu thích"
          : "Đã xóa album khỏi danh sách yêu thích"
      );
      setFavouriteAlbumIds((prev) => {
        const next = new Set(prev);
        if (nextIsFavourite) {
          next.add(albumId);
        } else {
          next.delete(albumId);
        }
        return next;
      });
      setFavouriteAlbumVersion((version) => version + 1);
      return nextIsFavourite;
    } catch (error) {
      console.error("Toggle favourite album failed:", error);
      return null;
    }
  }
  const [favouriteVersion, setFavouriteVersion] = useState(0);
  const [favouriteAlbumVersion, setFavouriteAlbumVersion] = useState(0);
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

    setPersonalSelectedPlaylist((prevPlaylist) => {
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

    setPersonalSelectedPlaylist((prevPlaylist) => {
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
  useEffect(() => {
    if (!currentUser?.id) {
      setFavouriteAlbumIds(new Set());
      return;
    }

    let isMounted = true;

    async function loadFavouriteAlbums() {
      try {
        const response = await axios.get(
          `${API_URL}/api/albums/favourite-albums?userId=${currentUser.id}`
        );

        if (!isMounted) {
          return;
        }

        const albumIds = Array.isArray(response?.data)
          ? response.data.map((album) => album.id)
          : [];
        setFavouriteAlbumIds(new Set(albumIds));
      } catch (error) {
        if (isMounted) {
          setFavouriteAlbumIds(new Set());
        }
        console.error("Load favourite albums failed:", error);
      }
    }

    loadFavouriteAlbums();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, favouriteAlbumVersion]);

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
      localStorage.removeItem("personalSelectedPlaylist");
      localStorage.removeItem("exploreSelectedPlaylist");
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

  // Auto-save personalSelectedPlaylist to localStorage
  useEffect(() => {
    if (personalSelectedPlaylist !== null) {
      localStorage.setItem("personalSelectedPlaylist", JSON.stringify(personalSelectedPlaylist));
      return;
    }
    localStorage.removeItem("personalSelectedPlaylist");
  }, [personalSelectedPlaylist]);

  // Auto-save exploreSelectedPlaylist to localStorage
  useEffect(() => {
    if (exploreSelectedPlaylist !== null) {
      localStorage.setItem("exploreSelectedPlaylist", JSON.stringify(exploreSelectedPlaylist));
      return;
    }
    localStorage.removeItem("exploreSelectedPlaylist");
  }, [exploreSelectedPlaylist]);

  useEffect(() => {
    localStorage.setItem("activePlaylistScope", activePlaylistScope);
  }, [activePlaylistScope]);
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
      favouriteAlbumIds,
      setFavouriteAlbumIds,
      toggleFavouriteAlbum,
      favouriteAlbumVersion,
      followedArtists,
      setFollowedArtists,
      artistFollowersCount,
      setArtistFollowersCount,
      followArtist,
      unfollowArtist,
      toggleFollowArtist,
      isArtistFollowed,
      loadArtistFollowStatus,
      loadArtistFollowersCount,
      syncArtistFollowStatus,
      syncArtistFollowersCount,
      currentSong,
      setCurrentSong,
      selectedPlaylist,
      personalSelectedPlaylist,
      setPersonalSelectedPlaylist,
      exploreSelectedPlaylist,
      setExploreSelectedPlaylist,
      resetSelectedPlaylist,
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
  localStorage.removeItem("personalSelectedPlaylist");
  localStorage.removeItem("activePlaylistScope");
}
