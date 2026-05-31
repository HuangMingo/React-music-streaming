import axios from "axios";
import { useState } from "react";
import { showNotificationToast } from "../../toast";
import "./DeleteSongFromPlaylistDialog.css";
import { useAuthContext } from "../../context/AuthContext";

export function DeleteSongFromPlaylistDialog({ playlistId, song, onClose, onDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { currentUser } = useAuthContext();

    async function handleDeleteSong() {

        if (!playlistId) {
            alert("Playlist không hợp lệ");
            return;
        }
        if(!song?.id)
        {
            alert("Bài hát không hợp lệ");  
            return;
        }

        if (!currentUser?.id) {
            showNotificationToast("Vui lòng đăng nhập để xóa bài hát khỏi playlist");
            return;
        }

        try {
            setIsDeleting(true);
            await axios.delete("http://localhost:3000/api/playlists/delete-song-from-playlist", {
                params: {
                    playlistId,
                    songId: song.id,
                    userId: currentUser.id,
                },
            });

            if (onDeleted) {
                await onDeleted(song);
            }

            showNotificationToast(`Đã xóa bài hát ${song.title} khỏi playlist`);

            onClose();
        } catch (error) {
            console.error("Delete song from playlist failed:", error);
            showNotificationToast(error?.response?.data?.message || "Xóa bài hát khỏi playlist thất bại. Vui lòng thử lại.");
            setIsDeleting(false);
        }
    }

    return (
        <div className="delete-song-overlay" onClick={onClose}>
            <div className="delete-song-dialog" onClick={(event) => event.stopPropagation()}>
                <button type="button" className="create-playlist-close" onClick={onClose} aria-label="Đóng hộp thoại">
                    <i className="bi bi-x-lg" />
                </button>
                <h2 className="delete-song-title">Xóa bài hát</h2>
                <p className="delete-song-message">Bạn có chắc chắn muốn xóa bài hát này khỏi playlist không?</p>
                <div className="delete-song-actions">
                    <button type="button" className="btn btn--cancel" onClick={onClose}>
                        Không
                    </button>
                    <button type="button" className="btn btn--confirm" onClick={handleDeleteSong} disabled={isDeleting}>
                        {isDeleting ? "Đang xóa..." : "Xóa"}
                    </button>
                </div>
            </div>
        </div>
    );
}
