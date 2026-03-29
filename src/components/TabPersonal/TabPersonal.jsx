import { Content } from './Content';
import { User } from './User';
import { useMusicContext } from '../../context/MusicContext';

export function TabPersonal({ playlists }) {
    const { selectedPlaylist, setSelectedPlaylist } = useMusicContext();
    return (
        <>
            <div className="app__container tab--personal active">
                {/* User */}
                <User />

                {/* Content */}
                <Content selectedPlaylist={selectedPlaylist} setSelectedPlaylist={setSelectedPlaylist} playlists={playlists} />
            </div>
        </>
    )
}