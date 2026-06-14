import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { PlayMusic } from "../TabPersonal/Overview/PlayMusic.jsx";
import { API_URL } from '../../api.js';

export function PlaylistDetail() {
    const { id } = useParams();
    const location = useLocation();
    console.log("Current location:", location);
    //Xác định đây là album hay playlist
    const isAlbumDetail = location.pathname.startsWith("/album/");
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadPlaylist() {
            const detailId = Number(id);

            if (!Number.isInteger(detailId) || detailId <= 0) {
                setPlaylist(null);
                setNotFound(true);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setNotFound(false);

                if (isAlbumDetail) {
                    const response = await axios.get(`${API_URL}/api/albums/${detailId}`);
                    const album = response.data;

                    if (mounted) {
                        setPlaylist({
                            ...album,
                            playlist_name: album?.title || album?.name || album?.album_name,
                            playlist_image: album?.image,
                            songs: Array.isArray(album?.songs) ? album.songs : [],
                        });
                    }
                    return;
                }

                const response = await axios.get(`${API_URL}/api/playlists/playlist-details`, {
                    params: {
                        playlistId: detailId,
                    },
                });

                if (mounted) {
                    setPlaylist(response.data);
                }
            } catch (error) {
                console.error(isAlbumDetail ? "Load album detail failed:" : "Load playlist detail failed:", error);
                if (mounted) {
                    setPlaylist(null);
                    setNotFound(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadPlaylist();

        return () => {
            mounted = false;
        };
    }, [id, isAlbumDetail]);

    return (
        <div className="app__container active">
            <div className="app__container-content">
                <div className="grid container__tab tab-home active">
                    {notFound && !loading ? (
                        <div className="box--no-content">
                            <div className="no-content-image" />
                            <span className="no-content-text">{isAlbumDetail ? "Không tìm thấy album" : "Không tìm thấy playlist"}</span>
                        </div>
                    ) : (
                        <PlayMusic
                            playlist={playlist}
                            hideHeaderTitle = {true}
                            playlistScope="explore"
                            isAlbumDetail={isAlbumDetail}
                            loading={loading}
                            emptyMessage={isAlbumDetail ? "Album chưa có bài hát" : "Playlist chưa có bài hát"}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
