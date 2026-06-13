import { Artist } from "./Artist.jsx";

export function ArtistSection() {
    return (
        <div className="grid container__tab tab-artist active">
            {/* Tab /personal/artist dùng lại Artist để hiển thị đúng danh sách nghệ sĩ đã follow. */}
            <Artist />
        </div>
    );
}
