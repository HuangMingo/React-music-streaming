import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { PlayMusic } from "../TabPersonal/Overview/PlayMusic.jsx";
import { API_URL } from '../../api.js';

function createPlaylistSlug(playlist) {
    const rawSlug = playlist?.playlist_name;
    console.log(rawSlug.normalize("NFD"));
    return String(rawSlug)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function PlaylistDetail() {
    const { slug } = useParams();
    const location = useLocation();
    const { exploreSelectedPlaylist } = useMusicContext();
    const [playlist, setPlaylist] = useState(location.state?.playlist ?? null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        async function loadPlaylist() {
            const statePlaylist = location.state?.playlist;
            const playlistId = location.state?.playlistId ?? statePlaylist?.id;

            if (statePlaylist?.songs?.length) {
                setPlaylist(statePlaylist);
                return;
            }

            if (playlistId) {
                try {
                    setLoading(true);
                    const response = await axios.get(`${API_URL}/api/playlists/playlist-details`, {
                        params: {
                            playlistId,
                        },
                    });

                    if (mounted) {
                        setPlaylist(response.data);
                    }
                } catch (error) {
                    console.error("Load playlist detail failed:", error);
                } finally {
                    if (mounted) {
                        setLoading(false);
                    }
                }
                return;
            }
            console.log(playlist.playlist_name.normalize("NFD"));
            if (exploreSelectedPlaylist && createPlaylistSlug(exploreSelectedPlaylist) === slug) {
                setPlaylist(exploreSelectedPlaylist);
            }
        }

        loadPlaylist();

        return () => {
            mounted = false;
        };
    }, [location.state, exploreSelectedPlaylist, slug]);

    return (
        <div className="app__container active">
            <div className="app__container-content">
                <div className="grid container__tab tab-home active">
                    {loading ? (
                        <div className="loader">Đang tải...</div>
                    ) : (
                        <PlayMusic playlist={playlist} hideHeaderTitle = {true} playlistScope="explore" />
                    )}
                </div>
            </div>
        </div>
    );
}
