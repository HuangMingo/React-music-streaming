import { Content } from './Content';
import { User } from './User';
import { useEffect } from 'react';
import { useMusicContext } from '../../context/MusicContext';

export function TabPersonal({ playlists, onPlaylistsChanged }) {
    // Lấy state và hàm cập nhật player từ MusicContext
    const {
        selectedPlaylist,
        setSelectedPlaylist,
        setPlaylistIndex,
        setCurrentSong,
        setCurrentSongId,
        setCurrentTime,
    } = useMusicContext();
    return (
        <>
            <div className="app__container tab--personal active">
                {/* User */}
                <User />

                {/* Content */}
                <Content
                    selectedPlaylist={selectedPlaylist}
                    setSelectedPlaylist={setSelectedPlaylist}
                    playlists={playlists}
                    onPlaylistsChanged={onPlaylistsChanged}
                />
            </div>
        </>
    )
}