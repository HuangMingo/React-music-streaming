import { AllSongs } from "./AllSongs";
import { FavoriteArtist } from "./FavoriteArtist";
import { NewPlaylist } from "./NewPlaylist";

export function TabExplorer() {
    return (
        <>
            <div className="app__container tab--explore active">
                <div className="app__container-content">
                    <div className="explore__container">
                        <div className="grid">
                            {/* Bài hát nổi bật */}
                            <AllSongs />

                            {/* Album nổi bật */}
                            <NewPlaylist />

                            {/* Nghệ sĩ nổi bật */}
                            <FavoriteArtist />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
