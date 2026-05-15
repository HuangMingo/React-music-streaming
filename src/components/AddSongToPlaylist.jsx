import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { showNotificationToast } from "../toast";

export function AddSongToPlaylist({
    songId,
    isOpen,
    playlists = [],
    selectedPlaylistId = "",
    onSelectPlaylist,
    onAddSong,
    isAddingSong = false,
}) {
    //State quan li trang thai dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    //Ref để quản lý sự kiện click ngoài dropdown
    const rootRef = useRef(null);

    const selectedPlaylist = useMemo(() => {
        return playlists.find((item) => String(item.id) === String(selectedPlaylistId)) ?? null;
    }, [playlists, selectedPlaylistId]);

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
        } catch (error) {
            console.error("Add song to playlist failed:", error);
            showNotificationToast("Không thể thêm bài hát vào playlist");
        }
    }

    return (
        <div className="option__log-out open playlist__menu-popup" ref={rootRef}>
            <div className="log-out__action playlist__menu-title">
                <i className="bi bi-music-note-list log-out__icon" />
                <span>Thêm vào playlist</span>
            </div>
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
