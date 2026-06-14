import { AllSongs } from "./AllSongs";
import { PlaylistOfDay } from "./PlaylistOfDay";
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

                            {/* Dành cho bạn */}
                            <PlaylistOfDay />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
