import { Album } from "./Album";
import { Artist } from "../Artist";
import { Playlist } from "./Playlist";
import { PlayMusic } from "./PlayMusic";
import { useEffect, useState } from "react";
import { MUSIC_STORAGE_KEY } from "../../../../public/data/songPlaylists.js";
import { useOutletContext } from "react-router-dom";
import { useMusicContext } from "../../../context/MusicContext";
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

export function OverviewSection() {
    //---------Render song --------------
    const [playlist, setPlaylist] = useState({ songs: [] });
    const [currentPlaylist, setCurrentPlaylist] = useState(0);
    const {playlists} = useOutletContext();
    const {selectedPlaylist} = useMusicContext();
    useEffect(() => {
        setPlaylist(playlists[currentPlaylist]);
        if (playlists.length > 0) {
            setPlaylist(playlists[currentPlaylist]);
        }
    }, [currentPlaylist]);
    return (
        <>
            <div className="grid container__tab tab-home active">
                {/* Play music */}
                <PlayMusic playlist={selectedPlaylist} />

                {/* Playlist */}
                <Playlist playlists={playlists} />

                {/* Album */}
                <Album />

                {/* Artist */}
                <Artist />
            </div>

        </>
    )
}