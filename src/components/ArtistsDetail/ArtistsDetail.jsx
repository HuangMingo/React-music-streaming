import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { getArtistPath } from "../../utils/artistNavigation.js";
import { showNotificationToast } from "../../toast.js";
import "./ArtistsDetail.css";
import { API_URL } from '../../api.js';
import { ArtistNameLink } from "../ArtistNameLink/ArtistNameLink.jsx";
import { AddSongToPlaylist } from "../AddSongToPlaylist/AddSongToPlaylist.jsx";
const ARTIST_TABS = [
  { id: "overview", label: "Tổng quan" },
  { id: "about", label: "Giới thiệu" },
  { id: "songs", label: "Bài hát" },
  { id: "albums", label: "Album" },
  { id: "playlists", label: "Playlist" },
  { id: "related", label: "Nghệ sĩ tương tự" },
];

function formatFollowers(followers = 0) {
  const value = Number(followers) || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatDuration(song) {
  const totalSeconds = Number(song?.duration_seconds ?? song?.duration ?? 0);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "--:--";
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function createSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getImage(item) {
  return item?.image_url || item?.image || item?.playlist_image || "/assets/img/avatars/avatar.jpg";
}

function getAlbumTitle(album) {
  return album?.title || album?.name || album?.album_name || "Album";
}

function getPlaylistTitle(playlist) {
  return playlist?.playlist_name || playlist?.name || "Playlist";
}

function toPlayableCollection(item, fallbackName) {
  return {
    ...item,
    playlist_name: item?.playlist_name || item?.name || item?.title || fallbackName,
    playlist_image: getImage(item),
    songs: Array.isArray(item?.songs) ? item.songs : [],
  };
}

export function ArtistDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuthContext();
  const {
    currentSong,
    isPlaying,
    setCurrentSong,
    setCurrentTime,
    setIsPlaying,
    exploreSelectedPlaylist,
    setExploreSelectedPlaylist,
    favouriteSongIds,
    setFavouriteSongIds,
    toggleFavouriteSong,
    toggleFollowArtist,
    isArtistFollowed,
    artistFollowersCount,
    loadArtistFollowStatus,
    loadArtistFollowersCount,
    syncArtistFollowStatus,
    syncArtistFollowersCount,
    playlistMenuRef,
    handleSelectTargetPlaylist,
    selectedPlaylistBySong,
    userPlaylists,
  } = useMusicContext();


  const containerRef = useRef(null);
  const sectionRefs = useRef({});
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [relatedArtists, setRelatedArtists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [followersCount, setFollowersCount] = useState(0);
  const [isMenuOpen] = useState(false);
  const [openSongMenuId, setOpenSongMenuId] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function loadArtist() {
      setLoading(true);
      setError("");
      //Lấy dữ liệu nghệ sĩ từ backend
      try {
        const artistResponse = await axios.get(`${API_URL}/api/artists/slug/${slug}`, {
          params: {
            userId: currentUser?.id,
          },
        });

        if (!mounted) return;

        const data = artistResponse?.data || {};
        setArtist(data);
        setSongs(Array.isArray(data.songs) ? data.songs : []);
        setAlbums(Array.isArray(data.albums) ? data.albums : []);
        setPlaylists(Array.isArray(data.playlists) ? data.playlists : []);
        setRelatedArtists(Array.isArray(data.relatedArtists) ? data.relatedArtists : []);
        setFollowersCount(Number(data.followersCount ?? data.follower_count) || 0);
        // Đẩy trạng thái follow/count từ response vào MusicContext để các màn khác dùng chung.
        syncArtistFollowStatus(data.id, Boolean(data.isFollowing));
        syncArtistFollowersCount(data.id, Number(data.followersCount ?? data.follower_count) || 0);
        // Gọi lại API riêng để đảm bảo context có trạng thái mới nhất từ bảng artist_follow.
        loadArtistFollowStatus(data.id);
        loadArtistFollowersCount(data.id);
      } catch (err) {
        console.error("Load artist detail failed:", err);
        if (mounted) {
          setArtist(null);
          setSongs([]);
          setAlbums([]);
          setPlaylists([]);
          setRelatedArtists([]);
          setError("Không thể tải dữ liệu nghệ sĩ.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadArtist();

    return () => {
      mounted = false;
    };
  }, [slug, currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id || songs.length === 0) {
      return;
    }

    let mounted = true;

    async function loadFavouriteStatuses() {
      try {
        const checks = await Promise.all(
          songs.map(async (song) => {
            const response = await axios.get(`${API_URL}/api/songs/is-favourite-song`, {
              params: {
                defaultPlaylistId: currentUser.defaultPlaylistId,
                songId: song.id,
              },
            });

            return { songId: song.id, isFavourite: Boolean(response?.data?.isFavouriteSong) };
          })
        );

        if (!mounted) return;
        setFavouriteSongIds(new Set(checks.filter((item) => item.isFavourite).map((item) => item.songId)));
      } catch (err) {
        console.error("Load artist song favourite statuses failed:", err);
      }
    }

    loadFavouriteStatuses();

    return () => {
      mounted = false;
    };
  }, [currentUser?.defaultPlaylistId, currentUser?.id, songs, setFavouriteSongIds]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (playlistMenuRef.current && !playlistMenuRef.current.contains(event.target)) {
        setOpenSongMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [playlistMenuRef]);

  const artistImage = getImage(artist);
  const artistName = artist?.name || "Nghệ sĩ";
  const popularSongs = songs.slice(0, 5);
  const featuredAlbums = albums.slice(0, 5);
  const featuredPlaylists = playlists.slice(0, 5);
  const featuredRelatedArtists = relatedArtists.slice(0, 5);
  const genreText = artist?.genre || artist?.genres;
  const verified = artist?.is_verified ?? artist?.verified ?? true;
  // Nút follow đọc từ MusicContext thay vì state/localStorage riêng trong component.
  const isFollowing = artist?.id ? isArtistFollowed(artist.id) : false;
  // Ưu tiên count trong context vì nó được cập nhật ngay sau follow/unfollow.
  const displayedFollowersCount = artist?.id
    ? artistFollowersCount[artist.id] ?? followersCount
    : followersCount;
  const linkAbout = artist?.bio;
  const [aboutArtist, setAboutArtist] = useState("");
  useEffect(() => {
    if (!linkAbout) {
      setAboutArtist("Chưa có thông tin");
      return;
    }
    async function fetchAbout() {
      try {
        const response = await axios.get(linkAbout);
        setAboutArtist(response.data);
      } catch (err) {
        console.error("Load artist about info failed:", err);
        setAboutArtist("Không thể tải thông tin về nghệ sĩ.");
      }
    }
    fetchAbout();
  }, [linkAbout]);

  const overviewData = useMemo(() => ({
    songs: popularSongs,
    albums: featuredAlbums,
    playlists: featuredPlaylists,
    relatedArtists: featuredRelatedArtists,
  }), [popularSongs, featuredAlbums, featuredPlaylists, featuredRelatedArtists]);
  const showOverview = activeTab === "overview";
  const showAbout = activeTab === "about";

  function setSectionRef(id, element) {
    sectionRefs.current[id] = element;
  }

  function goToTab(id) {
    setActiveTab(id);

  }

  function handleSongClick(song) {
    setExploreSelectedPlaylist(null);
    setCurrentSong(song);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  function handleToggleSongMenu(event, songId) {
    event.stopPropagation();
    setOpenSongMenuId((prevSongId) => (prevSongId === songId ? null : songId));
  }

  function navigateToPlaylist(playlist) {
    const playlistData = toPlayableCollection(playlist, "Playlist");
    const playlistSlug = createSlug(playlistData.playlist_name);
    if (!playlistSlug) return;

    navigate(`/playlist/${playlistSlug}`, {
      state: {
        playlistId: playlistData.id,
        playlist: playlistData,
      },
    });
  }

  function navigateToAlbum(album) {
    const albumData = toPlayableCollection(album, getAlbumTitle(album));
    const albumSlug = createSlug(albumData.playlist_name);
    if (!albumSlug) return;

    navigate(`/playlist/${albumSlug}`, {
      state: {
        playlistId: albumData.id,
        playlist: albumData,
      },
    });
  }

  function playCollection(event, item, fallbackName) {
    event.stopPropagation();
    const collection = toPlayableCollection(item, fallbackName);
    const firstSong = collection.songs?.[0];

    if (!firstSong) {
      showNotificationToast("Danh sách này chưa có bài hát.");
      return;
    }

    setExploreSelectedPlaylist(collection);
    setCurrentSong(firstSong);
    setCurrentTime(0);
    setIsPlaying(true);
  }

  async function handleToggleFollow(event) {
    event.stopPropagation();

    if (!currentUser?.id) {
      showNotificationToast("Vui lòng đăng nhập để theo dõi nghệ sĩ.");
      return;
    }

    if (!artist?.id) return;

    // Toggle thông qua MusicContext để trạng thái follow đồng bộ toàn hệ thống.
    const result = await toggleFollowArtist(artist.id);
    if (result) {
      setFollowersCount(Number(result.followersCount) || 0);
      return;
    }

    showNotificationToast("Không thể cập nhật theo dõi nghệ sĩ.");
  }
  function renderSongList(list, limit = list.length) {
    const visibleSongs = list.slice(0, limit);

    if (visibleSongs.length === 0) {
      return <p className="artist-detail__empty">Chưa có bài hát.</p>;
    }

    return (
      <div className="container__playlist artist-detail__song-list">
        <div className="playlist__list-charts overflow-visible artist-detail__songs">
          {visibleSongs.map((song, index) => {
            const isActiveSong = currentSong?.id === song.id;
            const isPlayingSong = isActiveSong && isPlaying;

            return (
              <div
                className={`playlist__list-song media artist-detail__song ${isActiveSong ? "active" : ""} ${isPlayingSong ? "playing" : ""}`}
                key={song.id ?? `${song.title}-${index}`}
                onClick={() => handleSongClick(song)}
              >
                <div className="playlist__song-info media__left">
                  <span className="artist-detail__song-index">{index + 1}</span>
                  <div className="playlist__song-thumb media__thumb mr-10" style={{ background: `url(${getImage(song)}) no-repeat center center / cover` }}>
                    <span className="song-note note-1">♪</span>
                    <span className="song-note note-2">♫</span>
                    <span className="song-note note-3">♪</span>
                    <span className="song-note note-4">♫</span>
                    <div className="thumb--animate">
                      <div className="thumb--animate-img" style={{ background: "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }} />
                    </div>
                    <div className="play-song--actions">
                      <div className="control-btn btn-toggle-play btn--play-song">
                        <i className="bi bi-play-fill" />
                      </div>
                    </div>
                  </div>

                  <div className="playlist__song-body media__info artist-detail__song-info">
                    <span className="playlist__song-title info__title">{song.title}</span>
                    <p className="playlist__song-author info__author">
                      {
                        song.artist_names.map((artist, artistIndex) => {
                          return (
                            <span key={`${artist}-${artistIndex}`}>
                              <ArtistNameLink artist={artist} />
                              {artistIndex < song.artist_names.length - 1 && ", "}
                            </span>
                          )

                        })
                      }
                    </p>
                  </div>
                </div>

                <span className="playlist__song-time media__content">{formatDuration(song)}</span>

                <div className="playlist__song-option song--tab media__right hide-on-mobile">
                  <div
                    className="playlist__song-btn btn--heart option-btn"
                    onClick={(event) => toggleFavouriteSong(event, song.id)}
                    title={favouriteSongIds.has(song.id) ? "Bỏ yêu thích" : "Yêu thích"}
                  >
                    <i className={`btn--icon song__icon icon--heart bi bi-heart${favouriteSongIds.has(song.id) ? "-fill" : ""} primary`} />
                  </div>
                  <div
                    className="playlist__song-btn option-btn playlist__song-more"
                    onClick={(event) => handleToggleSongMenu(event, song.id)}
                    ref={openSongMenuId === song.id ? playlistMenuRef : null}
                    title="Khác"
                  >
                    <i className="btn--icon bi bi-three-dots" />
                    <AddSongToPlaylist
                      song={song}
                      isOpen={openSongMenuId === song.id}
                      playlists={userPlaylists}
                      selectedTargetPlaylist={selectedPlaylistBySong[song.id] ?? ""}
                      onSelectPlaylist={handleSelectTargetPlaylist}
                      onCloseMenu={() => setOpenSongMenuId(null)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderArtistAlbumGrid(list, limit = list.length) {
    const visibleAlbums = list.slice(0, limit);

    if (visibleAlbums.length === 0) {
      return <p className="artist-detail__empty">Chưa có album.</p>;
    }

    return (
      <div className="row album--container artist-detail__collection-row">
        {visibleAlbums.map((album, index) => {
          const albumTitle = getAlbumTitle(album);
          const isCollectionActive = exploreSelectedPlaylist?.id === album.id;
          const isCollectionPlaying = isCollectionActive && isPlaying && album?.songs?.some((song) => song.id === currentSong?.id);

          return (
            <div
              className="col l-2-4 m-3 c-4 mb-30"
              key={album.id ?? `${albumTitle}-${index}`}
              onClick={() => navigateToAlbum(album)}
            >
              <div className={`row__item item--playlist item--album artist-detail__collection-card ${isCollectionActive ? "active" : ""} ${isCollectionPlaying ? "playing" : ""}`}>
                <div className="row__item-container flex--top-left">
                  <div className="row__item-display br-5">
                    <div
                      className="row__item-img img--square"
                      style={{ background: `url(${getImage(album)}) no-repeat center center / cover`, overflow: "hidden" }}
                    />
                    <div className="row__item-actions">
                      <div className="action-btn btn--heart" onClick={(event) => event.stopPropagation()}>
                        <i className="btn--icon icon--heart bi bi-heart-fill primary" />
                      </div>
                      <div className="btn--play-playlist" onClick={(event) => playCollection(event, album, albumTitle)}>
                        <div className="control-btn btn-toggle-play">
                          <i className="bi bi-play-fill" />
                        </div>
                        <span className="song-note note-1">♪</span>
                        <span className="song-note note-2">♫</span>
                        <span className="song-note note-3">♪</span>
                        <span className="song-note note-4">♫</span>
                        <div className="thumb--animate">
                          <div className="thumb--animate-img" style={{ background: "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }} />
                        </div>
                      </div>
                      <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                        <i className="btn--icon bi bi-three-dots" />
                      </div>
                    </div>
                    <div className="overlay" />
                  </div>
                  <div className="row__item-info">
                    <a href="#" className="row__info-name is-twoline" onClick={(event) => event.preventDefault()}>{albumTitle}</a>
                    <h3 className="row__info-creator">{album.release_date ? new Date(album.release_date).getFullYear() : "Album"} · {album.song_count ?? album.songs?.length ?? 0} bài hát</h3>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderArtistPlaylistGrid(list, limit = list.length) {
    const visiblePlaylists = list.slice(0, limit);

    if (visiblePlaylists.length === 0) {
      return <p className="artist-detail__empty">Chưa có playlist.</p>;
    }

    return (
      <div className="row playlist--container artist-detail__collection-row">
        {visiblePlaylists.map((playlist, index) => {
          const playlistTitle = getPlaylistTitle(playlist);
          const isPlaylistActive = exploreSelectedPlaylist?.id === playlist.id;
          const isPlaylistPlaying = isPlaylistActive && isPlaying && playlist?.songs?.some((song) => song.id === currentSong?.id);

          return (
            <div
              className="col l-2-4 m-3 c-4 mb-30"
              key={playlist.id ?? `${playlistTitle}-${index}`}
              onClick={() => navigateToPlaylist(playlist)}
            >
              <div className={`row__item item--playlist artist-detail__collection-card ${isPlaylistActive ? "active" : ""} ${isPlaylistPlaying ? "playing" : ""}`}>
                <div className="row__item-container flex--top-left">
                  <div className="row__item-display br-5">
                    <div
                      className="row__item-img img--square"
                      style={{ background: `url(${getImage(playlist)}) no-repeat center center / cover`, overflow: "hidden" }}
                    />
                    <div className="row__item-actions">
                      <div className="action-btn btn--heart" onClick={(event) => event.stopPropagation()}>
                        <i className="btn--icon icon--heart bi bi-heart-fill primary" />
                      </div>
                      <div className="btn--play-playlist" onClick={(event) => playCollection(event, playlist, playlistTitle)}>
                        <div className="control-btn btn-toggle-play">
                          <i className="bi bi-play-fill" />
                        </div>
                        <span className="song-note note-1">♪</span>
                        <span className="song-note note-2">♫</span>
                        <span className="song-note note-3">♪</span>
                        <span className="song-note note-4">♫</span>
                        <div className="thumb--animate">
                          <div className="thumb--animate-img" style={{ background: "url('/assets/img/SongActiveAnimation/icon-playing.gif') no-repeat 50% / contain" }} />
                        </div>
                      </div>
                      <div className="action-btn" onClick={(event) => event.stopPropagation()}>
                        <i className="btn--icon bi bi-three-dots" />
                      </div>
                    </div>
                    <div className="overlay" />
                  </div>
                  <div className="row__item-info">
                    <a href="#" className="row__info-name is-twoline" onClick={(event) => event.preventDefault()}>{playlistTitle}</a>
                    <h3 className="row__info-creator">{playlist.song_count ?? playlist.songs?.length ?? 0} bài hát</h3>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderRelatedArtists(list, limit = list.length) {
    const visibleArtists = list.slice(0, limit);

    if (visibleArtists.length === 0) {
      return <p className="artist-detail__empty">Chưa có nghệ sĩ tương tự.</p>;
    }

    return (
      <div className="artist-detail__related-list">
        {visibleArtists.map((item, index) => (
          <button className="artist-detail__related" type="button" key={item.id ?? `${item.name}-${index}`} onClick={() => navigate(getArtistPath(item))}>
            <img src={getImage(item)} alt={item.name} />
            <strong>{item.name}</strong>
            <span>{formatFollowers(artistFollowersCount[item.id] ?? item.followersCount ?? item.followers)} người theo dõi</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app__container artist-detail active" ref={containerRef}>
      <div className="app__container-content">
        {loading ? (
          <div className="loader">Đang tải...</div>
        ) : error ? (
          <div className="artist-detail__state">
            <h2>{error}</h2>
            <button className="button is-small button-primary" type="button" onClick={() => navigate("/")}>Về trang chủ</button>
          </div>
        ) : (
          <>
            <section className="artist-detail__hero" style={{ backgroundImage: `url(${artistImage})` }}>
              <div className="artist-detail__portrait-wrap">
                <img className="artist-detail__portrait" src={artistImage} alt={artistName} />
              </div>

              <div className="artist-detail__intro">
                <h1>
                  {artistName}
                  {verified ? <i className="bi bi-patch-check-fill artist-detail__verified" /> : null}
                </h1>
                <p>{genreText}</p>
                <div className="artist-detail__stats">
                  <div><strong>{formatFollowers(displayedFollowersCount)}</strong><span>Người theo dõi</span></div>
                  <div><strong>{songs.length}</strong><span>Bài hát</span></div>
                </div>
                <div className="artist-detail__actions">
                  <button className="button is-small artist-detail__follow-btn" type="button" onClick={handleToggleFollow}>
                    <i className={`bi ${isFollowing ? "bi-check-lg" : "bi-plus-lg"}`} />
                    <span>{isFollowing ? "Đang theo dõi" : "Theo dõi"}</span>
                  </button>
                  {isMenuOpen ? (
                    <div className="artist-detail__menu">
                      <button type="button" onClick={handleToggleFollow}>{isFollowing ? "Bỏ theo dõi nghệ sĩ" : "Theo dõi nghệ sĩ"}</button>
                      <button type="button" onClick={() => goToTab("songs")}>Xem bài hát</button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="artist-detail__signature" aria-hidden="true">{artistName}</div>
            </section>

            <nav className="artist-detail__tabs">
              {ARTIST_TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  type="button"
                  onClick={() => goToTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="artist-detail__content">
              {showOverview && (
                <section className="artist-detail__section" data-section="overview" ref={(element) => setSectionRef("overview", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Giới thiệu</h2>
                    </div>
                    <p className="artist-detail__empty">{aboutArtist}</p>
                  </div>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Bài hát phổ biến</h2>
                      <button type="button" onClick={() => goToTab("songs")}>Xem tất cả</button>
                    </div>
                    {renderSongList(overviewData.songs, 5)}
                  </div>

                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Album nổi bật</h2>
                      <button type="button" onClick={() => goToTab("albums")}>Xem tất cả</button>
                    </div>
                    {renderArtistAlbumGrid(overviewData.albums, 5)}
                  </div>

                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Playlist nổi bật</h2>
                      <button type="button" onClick={() => goToTab("playlists")}>Xem tất cả</button>
                    </div>
                    {renderArtistPlaylistGrid(overviewData.playlists, 5)}
                  </div>

                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Nghệ sĩ tương tự</h2>
                      <button type="button" onClick={() => goToTab("related")}>Xem tất cả</button>
                    </div>
                    {renderRelatedArtists(overviewData.relatedArtists, 5)}
                  </div>
                </section>
              )}

              {showAbout && (
                <section className="artist-detail__section" data-section="about" ref={(element) => setSectionRef("about", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Giới thiệu</h2>
                    </div>
                    <p className="artist-detail__empty">{aboutArtist}</p>
                  </div>
                </section>
              )}

              {activeTab === "songs" && (
                <section className="artist-detail__section" data-section="songs" ref={(element) => setSectionRef("songs", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Bài hát</h2>
                    </div>
                    {renderSongList(songs)}
                  </div>
                </section>
              )}

              {activeTab === "albums" && (
                <section className="artist-detail__section" data-section="albums" ref={(element) => setSectionRef("albums", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Album</h2>
                    </div>
                    {renderArtistAlbumGrid(albums)}
                  </div>
                </section>
              )}

              {activeTab === "playlists" && (
                <section className="artist-detail__section" data-section="playlists" ref={(element) => setSectionRef("playlists", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Playlist</h2>
                    </div>
                    {renderArtistPlaylistGrid(playlists)}
                  </div>
                </section>
              )}

              {activeTab === "related" && (
                <section className="artist-detail__section" data-section="related" ref={(element) => setSectionRef("related", element)}>
                  <div className="artist-detail__panel">
                    <div className="artist-detail__panel-header">
                      <h2>Nghệ sĩ tương tự</h2>
                    </div>
                    {renderRelatedArtists(relatedArtists)}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
