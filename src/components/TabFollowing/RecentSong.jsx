import { useMusicContext } from "../../context/MusicContext";
import { SingerSlide } from "../TabExplorer/SingerSlide";
import { FollowingNavbar } from "./FollowingNavbar";
import { StoryPosts } from "./StoryPosts";
export function RecentSong() {
    const {setCurrentSongId, setCurrentSong, setCurrentTime} = useMusicContext();
    // --------------Active song-------------
    function handleClickSong(song) {
        setCurrentSongId(song.id);
        setCurrentSong(song);
        if (currentSong !== song) {
            // Reset currentTime when changing songs
            setCurrentTime(0);
        }
    }
    return (
        <>
            <div className="app__container tab--following active">
                <div className="app__container-content">
                    <div className="following__container">
                        <div className="grid">
                            {/* Following Navbar */}
                            <FollowingNavbar />

                            {/* Singer slide */}
                            <SingerSlide />

                            {/* <!-- Story posts --> */}
                            <StoryPosts />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
