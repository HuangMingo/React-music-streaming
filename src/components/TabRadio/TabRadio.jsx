import { Playlist } from "../TabPersonal/Overview/Playlist"
import { RadioList } from "./RadioList"
export function TabRadio() {
    return (
        <>
            < div className="app__container tab--radio" >
                <div className="app__container-content">
                    <div className="radio__container">
                        <div className="grid">
                            {/* Radio list */}
                            <RadioList />
                            {/* Playlist */}
                            <Playlist />
                            <Playlist />
                            <Playlist />
                            <Playlist />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}