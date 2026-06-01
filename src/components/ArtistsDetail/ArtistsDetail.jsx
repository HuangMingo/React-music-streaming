import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { createArtistSlug } from "../../utils/artistNavigation.js";
import "./ArtistsDetail.css";
import { API_URL } from '../../api.js';

function formatFollowers(followers = 0) {
  const value = Number(followers) || 0;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

function formatDuration(song) {
  const totalSeconds = Number(song?.duration_seconds ?? song?.duration ?? 0);
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function getLocalArtists() {
  return [];
}

function getLocalAlbums() {
  return [];
}

export function ArtistDetail() {
  const { slug } = useParams();
  const { currentUser } = useAuthContext();
  const [artist, setArtist] = useState(null);
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const albums = useMemo(() => {
    return getLocalAlbums().filter((album) =>
      album.singers?.some((singer) => createArtistSlug(singer) === slug)
    );
  }, [slug]);

  const relatedArtists = useMemo(() => {
    return getLocalArtists().filter((item) => createArtistSlug(item) !== slug).slice(0, 6);
  }, [slug]);

  useEffect(() => {
    let mounted = true;

    async function loadArtist() {
      setLoading(true);

      const localArtist = getLocalArtists().find((item) => createArtistSlug(item) === slug) ?? {
        name: slug
          ?.split("-")
          .filter(Boolean)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(" "),
        followers: 0,
        image: "/assets/img/avatars/avatar.jpg",
      };

      try {
        const artistResponse = await axios.get(`${API_URL}/api/artists/slug/${slug}`, {
          params: {
            userId: currentUser?.id,
          },
        });

        if (!mounted) return;

        if (artistResponse?.data) {
          setArtist(artistResponse.data);
          setFollowersCount(Number(artistResponse.data.followersCount) || 0);
          setIsFollowing(Boolean(artistResponse.data.isFollowing));
        } else {
          setArtist(localArtist);
          setFollowersCount(0);
          setIsFollowing(false);
          setSongs([]);
        }
      } catch (error) {
        if (mounted) {
          setArtist(localArtist);
          setFollowersCount(0);
          setIsFollowing(false);
          setSongs([]);
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

  const artistImage = artist?.image_url || artist?.image || "/assets/img/avatars/avatar.jpg";
  const artistName = artist?.name || "Nghệ sĩ";
  const popularSongs = songs.slice(0, 4);
  const featuredAlbums = albums.slice(0, 4);
  const shouldShowAll = activeTab === "all";
  const shouldShowAbout = shouldShowAll;
  const shouldShowSongs = shouldShowAll || activeTab === "songs";
  const shouldShowAlbums = shouldShowAll || activeTab === "albums";
  const shouldShowPlaylists = shouldShowAll || activeTab === "playlists";
  const artistTabs = [
    { id: "all", label: "Tổng quan" },
    { id: "songs", label: "Bài hát" },
    { id: "playlists", label: "Playlist" },
    { id: "albums", label: "Albums" },
  ];

  return (
    <div className="app__container artist-detail active">
      <div className="app__container-content">
        {loading ? (
          <div className="loader">Đang tải...</div>
        ) : (
          <>
            <section className="artist-detail__hero" style={{ backgroundImage: `url(${artistImage})` }}>
              <div className="artist-detail__hero-content">
                <img className="artist-detail__avatar" src={artistImage} alt={artistName} />
                <div className="artist-detail__intro">
                  <h1>{artistName}</h1>
                  <p>Ca sĩ, nhạc sĩ, nhà sản xuất âm nhạc</p>
                  <p>{formatFollowers(followersCount)} người theo dõi</p>
                  <div className="artist-detail__actions">
                    <button className="button is-small button-primary" type="button">
                      <i className="bi bi-play-fill" />
                      <span>Phát</span>
                    </button>
                    <button className="button is-small artist-detail__ghost-btn" type="button">
                      <span>{isFollowing ? "Đã quan tâm" : "Quan tâm"}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="artist-detail__stats">
                <div><strong>{formatFollowers(followersCount)}</strong><span>Người theo dõi</span></div>
                <div><strong>{songs.length}</strong><span>Bài hát</span></div>
                <div><strong>{albums.length}</strong><span>Album</span></div>
              </div>
            </section>

            <nav className="artist-detail__tabs">
              {artistTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            <div className="artist-detail__content">
              {shouldShowAbout && (
                <section className="artist-detail__panel artist-detail__about">
                  <h2>Giới thiệu</h2>
                  <div className="artist-detail__about-content">
                    <img src={artistImage} alt={artistName} />
                    <p>{artistName} là nghệ sĩ được nhiều người nghe quan tâm. Trang này tổng hợp bài hát, album và thông tin nổi bật của nghệ sĩ.</p>
                  </div>
                </section>
              )}

              {shouldShowSongs && (
                <section className="artist-detail__panel">
                  <div className="artist-detail__panel-header">
                    <h2>Bài hát phổ biến</h2>
                    <span>Xem tất cả</span>
                  </div>
                  <div className="artist-detail__song-list">
                    {popularSongs.length ? popularSongs.map((song, index) => (
                      <div className="artist-detail__song" key={song.id ?? `${song.title}-${index}`}>
                        <span>{index + 1}</span>
                        <img src={song.image} alt={song.title} />
                        <strong>{song.title}</strong>
                        <em>{formatDuration(song)}</em>
                      </div>
                    )) : <p className="artist-detail__empty">Chưa có bài hát.</p>}
                  </div>
                </section>
              )}

              {shouldShowAlbums && (
                <section className="artist-detail__panel">
                  <div className="artist-detail__panel-header">
                    <h2>Album nổi bật</h2>
                    <span>Xem tất cả</span>
                  </div>
                  <div className="artist-detail__album-list">
                    {featuredAlbums.length ? featuredAlbums.map((album, index) => (
                      <div className="artist-detail__album" key={`${album.title}-${index}`}>
                        <img src={album.image} alt={album.title} />
                        <strong>{album.title}</strong>
                        <span>{album.singers?.join(", ")}</span>
                      </div>
                    )) : <p className="artist-detail__empty">Chưa có album.</p>}
                  </div>
                </section>
              )}

              {shouldShowPlaylists && (
                <section className="artist-detail__panel">
                  <div className="artist-detail__panel-header">
                    <h2>Playlist</h2>
                    <span>Xem tất cả</span>
                  </div>
                  <p className="artist-detail__empty">Chưa có playlist.</p>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
