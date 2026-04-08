import { useState } from "react";
import axios from "axios";
import "./CreatePlaylist.css";
import { MUSIC_STORAGE_KEY } from "../../../public/data/songPlaylists.js";

export function CreatePlaylist({ onClose }) {
    const [playlistName, setPlaylistName] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        if (!playlistName.trim() || isSubmitting) {
            return;
        }

        try {
            setIsSubmitting(true);

            await axios.post("http://localhost:3000/api/playlists", {
                name: playlistName.trim(),
                creator_id: 1,
                ispublic: isPublic,
                image: null,
            });

            const response = await axios.get("http://localhost:3000/api/favourite-playlists");
            localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(response.data));

            onClose();
            window.location.reload();
        } catch (error) {
            console.error("Create playlist failed:", error);
            alert("Tao playlist that bai. Vui long thu lai.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="create-playlist-overlay" onClick={onClose}>
            <form
                className="create-playlist-dialog"
                onSubmit={handleSubmit}
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    className="create-playlist-close"
                    aria-label="Dong form"
                    onClick={onClose}
                >
                    <i className="bi bi-x-lg" />
                </button>

                <h2 className="create-playlist-title">Tạo playlist mới</h2>

                <input
                    className="create-playlist-input"
                    type="text"
                    value={playlistName}
                    onChange={(event) => setPlaylistName(event.target.value)}
                    placeholder="Nhap ten playlist"
                />

                <div className="create-playlist-option">
                    <div>
                        <h3>Công khai</h3>
                        <p>Mọi người có thể nhìn thấy playlist này</p>
                    </div>
                    <label className="create-playlist-switch">
                        <input
                            type="checkbox"
                            checked={isPublic}
                            onChange={() => setIsPublic((prev) => !prev)}
                        />
                        <span className="create-playlist-slider" />
                    </label>
                </div>


                <button className="create-playlist-submit" type="submit">
                    {isSubmitting ? "Dang tao..." : "Tao moi"}
                </button>
            </form>
        </div>
    );
}