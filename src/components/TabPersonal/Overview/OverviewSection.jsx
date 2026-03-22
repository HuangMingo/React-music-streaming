import { Album } from "./Album";
import { Artist } from "../Artist";
import { Mv } from "./Mv";
import { Playlist } from "./Playlist";
import { PlayMusic } from "./PlayMusic";

export function OverviewSection() {
    return (
        <>
            <div className="grid container__tab tab-home active">
                {/* Play music */}
                <PlayMusic />

                {/* Playlist */}
                <Playlist />

                {/* Album */}
                <Album />

                {/* MV */}
                <Mv />

                {/* Artist */}
                <Artist />
            </div>

        </>
    )
}