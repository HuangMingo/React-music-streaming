import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { showNotificationToast } from "../toast";
import { useAuthContext } from "../context/AuthContext";

export function AddSongToPlaylist({
    songId,
    isOpen,
    playlists = [],
    selectedPlaylistId = "",
    onSelectPlaylist,
    onAddSong,
    isAddingSong = false,
    onCreatePlaylist,
}) {
    //State quan li trang thai dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    //Ref để quản lý sự kiện click ngoài dropdown
    const rootRef = useRef(null);

    const selectedPlaylist = useMemo(() => {
        return playlists.find((item) => String(item.id) === String(selectedPlaylistId)) ?? null;
    }, [playlists, selectedPlaylistId]);

    const { currentUser } = useAuthContext();

    // Create playlist state
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [autoAddToNew, setAutoAddToNew] = useState(true);

    useEffect(() => {
        if (!isOpen) {
            setIsDropdownOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    if (!isOpen) {
        return null;
    }

    function handleToggleDropdown(event) {
        event.stopPropagation();
        setIsDropdownOpen((prev) => !prev);
    }

    function handleSelectPlaylist(event, playlistId) {
        event.stopPropagation();
        onSelectPlaylist?.(songId, playlistId);
        setIsDropdownOpen(false);
    }

    async function handleCreatePlaylist(event) {
        event.stopPropagation();

        if (!currentUser || !currentUser.id) {
            showNotificationToast("Vui lòng đăng nhập để tạo playlist");
            return;
        }

        const name = String(newPlaylistName || "").trim();
        if (!name) {
            showNotificationToast("Vui lòng nhập tên playlist");
            return;
        }

        setIsCreating(true);
        try {
            const body = {
                name,
                creator_id: Number(currentUser.id),
                ispublic: false,
                isdefault: false,
            };

            const createRes = await axios.post("http://localhost:3000/api/playlists/create-playlist", body);
            const created = createRes.data;
            showNotificationToast("Tạo playlist thành công");

            // notify parent to reload playlists if provided
            onCreatePlaylist?.();

            // Optionally add song to newly created playlist
            if (autoAddToNew && created && created.id) {
                try {
                    await axios.post("http://localhost:3000/api/playlists/add-song-to-playlist", null, {
                        params: { playlistId: Number(created.id), songId: Number(songId) },
                    });
                    showNotificationToast("Đã thêm bài hát vào playlist mới");

                    // let parent handle UI update if it provided onAddSong
                    onAddSong?.(songId, created.id);
                    // select newly created playlist in dropdown
                    onSelectPlaylist?.(songId, created.id);
                } catch (err) {
                    console.error("Add to new playlist failed:", err);
                    showNotificationToast("Không thể thêm bài hát vào playlist mới");
                }
            }

            // reset create form
            setNewPlaylistName("");
            setIsDropdownOpen(false);
        } catch (error) {
            console.error("Create playlist failed:", error);
            showNotificationToast("Tạo playlist thất bại");
        } finally {
            setIsCreating(false);
        }
    }
    
    async function handleAddSong(event) {
        event.stopPropagation();

        if (!selectedPlaylistId) {
            showNotificationToast("Vui lòng chọn playlist trước khi thêm");
            return;
        }

        if (typeof onAddSong === "function") {
            await onAddSong(songId, selectedPlaylistId);
            return;
        }
        // Trường hợp không có onAddSong được truyền vào, thực hiện logic mặc định
        const playlistId = Number(selectedPlaylistId);
        if (!playlistId || !songId) {
            showNotificationToast("Vui lòng chọn playlist trước khi thêm");
            return;
        }

        try {
            await axios.post("http://localhost:3000/api/playlists/add-song-to-playlist", null, {
                params: { playlistId, songId },
            });
            showNotificationToast("Đã thêm bài hát vào playlist");
            setIsDropdownOpen(false);
        } catch (error) {
            console.error("Add song to playlist failed:", error);
            showNotificationToast("Không thể thêm bài hát vào playlist");
        }
    }

    return (
        <div className="option__log-out open playlist__menu-popup" ref={rootRef}>
            <button className="log-out__action playlist__menu-title">
                <i className="bi bi-music-note-list log-out__icon" />
                <span>Thêm vào playlist</span>
            </button>
            <div className="playlist__menu-field">
                <button
                    type="button"
                    className={`playlist__menu-trigger ${isDropdownOpen ? "is-open" : ""}`}
                    onClick={handleToggleDropdown}
                    aria-expanded={isDropdownOpen}
                    aria-haspopup="listbox"
                >
                    <span className={`playlist__menu-trigger-text ${selectedPlaylist ? "has-value" : ""}`}>
                        {selectedPlaylist?.playlist_name || "Chọn playlist"}
                    </span>
                    <i className="bi bi-chevron-down playlist__menu-arrow" />
                </button>

                <div className={`playlist__menu-panel ${isDropdownOpen ? "open" : ""}`} role="listbox">
                    <button
                        type="button"
                        className={`playlist__menu-option ${!selectedPlaylistId ? "is-selected" : ""}`}
                        onClick={(event) => handleSelectPlaylist(event, "")}
                    >
                        Chọn playlist
                    </button>

                    <div className="playlist__menu-options-scroll">
                        {playlists.length === 0 ? (
                            <div className="playlist__menu-empty">Chưa có playlist nào</div>
                        ) : (
                            playlists.map((item) => {
                                if(item.isdefault) {
                                    return null; // Bỏ qua playlist mặc định
                                }
                                const isSelected = String(item.id) === String(selectedPlaylistId);
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`playlist__menu-option ${isSelected ? "is-selected" : ""}`}
                                        onClick={(event) => handleSelectPlaylist(event, item.id)}
                                    >
                                        <span className="playlist__menu-option-title">{item.playlist_name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                    <div className="playlist__menu-create">
                        <div className="playlist__create-row">
                            <input
                                type="text"
                                className="playlist__create-input"
                                placeholder="Tên playlist mới"
                                value={newPlaylistName}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setNewPlaylistName(e.target.value)}
                            />
                            <label className="playlist__create-checkbox">
                                <input
                                    type="checkbox"
                                    checked={autoAddToNew}
                                    onChange={(e) => setAutoAddToNew(Boolean(e.target.checked))}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                Thêm bài này
                            </label>
                        </div>
                        <div className="playlist__create-actions">
                            <button
                                type="button"
                                className="playlist__menu-option playlist__create-btn"
                                onClick={handleCreatePlaylist}
                                disabled={isCreating}
                            >
                                {isCreating ? "Đang tạo..." : "+ Tạo playlist mới"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <button
                className="log-out__action playlist__menu-submit"
                type="button"
                onClick={handleAddSong}
                disabled={isAddingSong}
            >
                <i className="bi bi-plus-circle log-out__icon" />
                <span>{isAddingSong ? "Đang thêm..." : "Thêm bài hát"}</span>
            </button>
        </div>
    );
}