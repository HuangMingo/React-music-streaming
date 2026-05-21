import axios from "axios";
import { useState } from "react";
import "./DeletePlaylistDialog.css";
import "./../Sidebar/CreatePlaylist.css"
export function DeletePlaylistDialog({ playlistId, onClose, currentUser, onDeleted }) {
    const [isDeleting, setIsDeleting] = useState(false);
    //Xử lí nút xóa playlist

    async function handleDeletePlaylist() {
        if (!playlistId || !currentUser?.id) {
            alert("Thông tin không hợp lệ");
            return;
        }

        try {
            setIsDeleting(true);
            await axios.delete(`http://localhost:3000/api/playlists/delete-playlist`, {
                params: {
                    playlistId: playlistId,
                    userId: currentUser.id
                }
            });

            if (onDeleted) {
                await onDeleted();
            }
            onClose();
        } catch (error) {
            console.error("Delete playlist failed:", error);
            alert("Xóa playlist thất bại. Vui lòng thử lại.");
            setIsDeleting(false);
        }
    }

    return (
        <>
            <div className="delete-playlist-overlay" onClick={onClose}>
                <div className="delete-playlist-dialog" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="create-playlist-close" onClick={onClose} aria-label="Đóng hộp thoại">
                        <i className="bi bi-x-lg"></i>
                    </button>
                    <h2 className="delete-playlist-title">Xóa playlist</h2>
                    <p className="delete-playlist-message">Bạn có chắc chắn muốn xóa playlist này không?</p>
                    <div className="delete-playlist-actions">
                        <button className="btn btn--cancel" onClick={onClose}>
                            Không
                        </button>
                        <button className="btn btn--confirm" onClick={handleDeletePlaylist} disabled={isDeleting}>
                            {isDeleting ? "Đang xóa..." : "Có"}
                        </button>
                    </div>
                </div>
            </div>

        </>
    )
}