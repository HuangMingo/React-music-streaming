import { Slide } from "./Slide";
import { Playlists } from "./Playlists";
import { Radio } from "./Radio";
import { Playlist } from "./Playlist";
import { Label } from "./Label";
import { SingerSlide } from "./SingerSlide";
import { Event } from "./Event";
import { Brand } from "./Brand";
import { FavoriteArtist } from "./FavoriteArtist";
import { NewPlaylist } from "./NewPlaylist";

export function TabExplorer() {
    return (
        <>
            < div className="app__container tab--explore" >
                <div className="app__container-content">
                    <div className="explore__container">
                        <div className="grid">
                            {/* Slide */}
                            <Slide />

                            {/* Playlists */}
                            <Playlists />

                            {/* Radio */}
                            <Radio />

                            {/* Playlist */}
                            <Playlist />
                            <Playlist />

                            {/* Label */}
                            <Label />

                            {/* Singer slide */}
                            <SingerSlide />

                            {/* Playlist */}
                            <Playlist />

                            {/* Event */}
                            <Event />

                            {/* Playlist */}
                            <Playlist />

                            {/* New Playlist */}
                            <NewPlaylist />

                            {/* Playlist */}
                            <Playlist />
                            
                            {/* Favorite artist */}
                            <FavoriteArtist />

                            {/* Brand */}
                            <Brand />

                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}
