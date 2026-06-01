import { useState } from "react";
import axios from "axios";
import { showNotificationToast } from "../../../toast.js";
import "./CreatePlaylist.css";
import { useAuthContext } from "../../../context/AuthContext.jsx";
import { API_URL } from '../../../api.js';

export function CreatePlaylist({ onClose, onSuccess, editingPlaylist = null }) {
    const isEditing = Boolean(editingPlaylist);
    const [playlistName, setPlaylistName] = useState(editingPlaylist?.playlist_name ?? "");
    const [isPublic, setIsPublic] = useState(editingPlaylist?.ispublic ?? true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nameError, setNameError] = useState("");
    const { currentUser } = useAuthContext();
    async function handleSubmit(event) {
        event.preventDefault();

        if (isSubmitting) {
            return;
        }

        if (!playlistName.trim()) {
            setNameError("Vui lòng nhập tên playlist.");
            return;
        }

        setNameError("");

        try {
            setIsSubmitting(true);
            const userId = currentUser?.id;
            let savedPlaylist = null;
            if (isEditing) {
                const response = await axios.put(`${API_URL}/api/playlists/update-playlist/${editingPlaylist.id}`, {
                    name: playlistName.trim(),
                    userId,
                    ispublic: isPublic
                });
                savedPlaylist = response.data;
            } else {
                const response = await axios.post(`${API_URL}/api/playlists/create-playlist`, {
                    name: playlistName.trim(),
                    creator_id: userId,
                    ispublic: isPublic,
                    isdefault: false
                });
                savedPlaylist = response.data;
            }

            if (onSuccess) {
                await onSuccess(savedPlaylist);
            }
            onClose();
            showNotificationToast(isEditing ? "Cập nhật playlist thành công" : "Tạo playlist thành công");
        } catch (error) {
            console.error("Create playlist failed:", error);
            showNotificationToast(isEditing ? "Cập nhật playlist thất bại. Vui lòng thử lại." : "Tạo playlist thất bại. Vui lòng thử lại.");
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

                <h2 className="create-playlist-title">{isEditing ? "Chỉnh sửa playlist" : "Tạo playlist mới"}</h2>

                <input
                    className="create-playlist-input"
                    type="text"
                    value={playlistName}
                    onChange={(event) => {
                        setPlaylistName(event.target.value);
                        if (nameError) {
                            setNameError("");
                        }
                    }}
                    placeholder="Nhập tên playlist"
                />
                {nameError ? <div className="create-playlist-error">{nameError}</div> : null}
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
                    {isSubmitting ? (isEditing ? "Đang lưu..." : "Đang tạo...") : (isEditing ? "Lưu" : "Tạo mới")}
                </button>
            </form>
        </div>
    );
}
