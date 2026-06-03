import { Content } from './Content';
import { User } from './User';
import { useEffect } from 'react';
import { useMusicContext } from '../../context/MusicContext';

export function TabPersonal({ playlists, onPlaylistsChanged }) {
    // Lấy state và hàm cập nhật player từ MusicContext
    const {
        personalSelectedPlaylist,
        setPersonalSelectedPlaylist,
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
                    selectedPlaylist={personalSelectedPlaylist}
                    setSelectedPlaylist={setPersonalSelectedPlaylist}
                    playlists={playlists}
                    onPlaylistsChanged={onPlaylistsChanged}
                    canRemoveFromCurrentPlaylist = {true}
                />
            </div>
        </>
    )
}
