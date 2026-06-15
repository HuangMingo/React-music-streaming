import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { CreatePlaylist } from "./../Sidebar/CreatePlaylist/CreatePlaylist.jsx";
import {
    autoUpdate, //Middleware để tự động cập nhật vị trí của popup/menu khi có sự thay đổi về kích thước hoặc vị trí của phần tử tham chiếu hoặc popup/menu.
    flip, // Middleware để tự động điều chỉnh vị trí nếu popup/menu bị tràn ra ngoài viewport.
    offset, // Tạo khoảng cách giữa button và menu.
    shift, //Middleware để đảm bảo popup/menu luôn nằm trong viewport bằng cách đẩy nó vào trong nếu cần thiết.
    useFloating, //Hook chính để tính vị trí popup/menu.
} from "@floating-ui/react";
import { showNotificationToast } from "./../../../src/toast.js";
import "./AddSongToPlaylist.css";
import { useMusicContext } from "../../context/MusicContext.jsx";
import { useAuthContext } from "../../context/AuthContext.jsx";
import { DeleteSongFromPlaylistDialog } from "../TabPersonal/DeleteSongFromPlaylistDialog.jsx";
import { API_URL } from '../../api.js';
export function AddSongToPlaylist({
    song,
    isOpen,
    playlists = [],
    selectedPlaylist,
    selectedTargetPlaylist = {},
    currentPlaylistId = "",
    onSelectPlaylist,
    onAddSong,
    onRemoveFromPlaylist,
    onCloseMenu,
    canRemoveFromCurrentPlaylist = false,
    isAddingSong = false,
}) {
    const {
        songToRemove,
        setSongToRemove,
        handleOpenRemoveSongDialog,
        handleCloseRemoveSongDialog,
        handleSongRemoved,
    } = useMusicContext();
    const { currentUser } = useAuthContext();
    const [isAddSubmenuOpen, setIsAddSubmenuOpen] = useState(false);
    const [playlistSearch, setPlaylistSearch] = useState("");
    const rootRef = useRef(null); // Ref để gắn vào phần tử gốc của menu nhằm theo dõi sự kiện click bên ngoài
    const submenuTriggerRef = useRef(null); // Ref để gắn vào button "Thêm vào playlist" nhằm làm reference cho submenu
    const submenuPanelRef = useRef(null);
    const [isOpenForm, setOpenForm] = useState(false); // State để quản lý việc hiển thị form tạo playlist mới
    function toggleOpenForm() {
        setOpenForm(!isOpenForm);
    }
    const {
        refs: menuRefs,
        floatingStyles: menuFloatingStyles,
    } = useFloating({
        strategy: "fixed",
        placement: "left-start",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(8),
            flip({
                fallbackPlacements: ["right-start", "left-start", "bottom-start", "top-start"],
            }),
            shift({ padding: 70 }),
        ],
        transform: false,
    });

    const {
        refs: submenuRefs,
        floatingStyles: submenuFloatingStyles,
    } = useFloating({
        strategy: "fixed",
        placement: "right-start",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(8),
            flip({
                fallbackPlacements: ["left-start", "right-start", "bottom-start", "top-start"],
            }),
            shift({ padding: 8 }),
        ],
        transform: false,
    });

    const filteredPlaylists = useMemo(() => {
        const searchValue = playlistSearch.trim().toLowerCase();

        return playlists.filter((item) => {
            if (item.isdefault) {
                return false;
            }

            if (!searchValue) {
                return true;
            }

            return String(item.playlist_name ?? "").toLowerCase().includes(searchValue);
        });
    }, [playlists, playlistSearch]);

    useEffect(() => {
        if (!isOpen) {
            setIsAddSubmenuOpen(false);
            setPlaylistSearch("");
            menuRefs.setReference(null);
            return;
        }

        menuRefs.setReference(rootRef.current?.parentElement ?? null);
    }, [isOpen, menuRefs]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        function handleUserScroll(event) {
            const scrollTarget = event.target;
            const isScrollInsideMenu =
                rootRef.current?.contains(scrollTarget) ||
                submenuPanelRef.current?.contains(scrollTarget);

            if (isScrollInsideMenu) {
                return;
            }

            setIsAddSubmenuOpen(false);
            onCloseMenu?.();
        }

        window.addEventListener("wheel", handleUserScroll, { capture: true, passive: true });
        window.addEventListener("scroll", handleUserScroll, { capture: true, passive: true });

        return () => {
            window.removeEventListener("wheel", handleUserScroll, { capture: true });
            window.removeEventListener("scroll", handleUserScroll, { capture: true });
        };
    }, [isOpen, onCloseMenu]);

    useEffect(() => {
        submenuRefs.setReference(isAddSubmenuOpen ? submenuTriggerRef.current : null);
    }, [isAddSubmenuOpen, submenuRefs]);

    useEffect(() => {
        function handleOutsideClick(event) {
            if (rootRef.current && !rootRef.current.contains(event.target)) {
                setIsAddSubmenuOpen(false);
            }
        }

        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    if (!isOpen) {
        return null;
    }
    function openSubmenu(event) {
        event.stopPropagation();
        setIsAddSubmenuOpen(true);
    }
    async function handleAddSongToPlaylist(event, playlist) {
     
        event.stopPropagation();
        const targetPlaylistId = playlist?.id;

        if (!targetPlaylistId) {
            showNotificationToast("Vui lòng chọn playlist trước khi thêm");
            return;
        }

        await onSelectPlaylist?.(song.id, targetPlaylistId);

        if (typeof onAddSong === "function") {
            await onAddSong(song.id, targetPlaylistId);
            setIsAddSubmenuOpen(false);
            return;
        }

        const playlistIdNumber = Number(targetPlaylistId);
        if (!playlistIdNumber || !song.id) {
            showNotificationToast("Vui lòng chọn playlist trước khi thêm");
            return;
        }

        try {
            await axios.post(`${API_URL}/api/playlists/add-song-to-playlist`, null, {
                params: { playlistId: playlistIdNumber, songId: song.id },
            });
            showNotificationToast(`Đã thêm bài hát thành công vào playlist "${playlist?.playlist_name}"`);
            setIsAddSubmenuOpen(false);
            setOpenForm(false);
        } catch (error) {
            console.error("Add song to playlist failed:", error);
            showNotificationToast("Không thể thêm bài hát vào playlist");
        }
    }

    function handleCreatePlaylistClick(event) {
        const userid = currentUser?.id;
        if (!userid) {
            showNotificationToast("Vui lòng đăng nhập để tạo playlist", "error");
            return;
        }
        event.stopPropagation();
        toggleOpenForm();
    }
    return (
        <>
            <div
                className="option__log-out open playlist__menu-popup"
                ref={(node) => {
                    rootRef.current = node;
                    menuRefs.setFloating(node);
                }}
                style={{ ...menuFloatingStyles, zIndex: 5000 }}
                onClick={(event) => {
                    event.stopPropagation();

                }}
            >

                <button
                    type="button"
                    className="playlist__menu-option"
                    ref={submenuTriggerRef}
                    onClick={openSubmenu}
                    aria-haspopup="menu"
                    aria-expanded={isAddSubmenuOpen}
                    disabled={isAddingSong}
                >
                    <span style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                        <i className="bi bi-music-note-list log-out__icon" />
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Thêm vào playlist</span>
                        <i className="bi bi-chevron-right" style={{ fontSize: "1.4rem", marginLeft: "10px", opacity: 0.8 }} />
                    </span>
                </button>

                {canRemoveFromCurrentPlaylist ? (
                    <button
                        type="button"
                        className="playlist__menu-option"
                        onClick={(event) => handleOpenRemoveSongDialog(event, song)}
                        disabled={isAddingSong}
                    >
                        <span style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1", minWidth: "0" }}>
                            <i className="fa-solid fa-trash log-out__icon"></i>
                            <span>Xóa khỏi playlist này</span>
                        </span>
                    </button>
                ) : null}

                <div
                    className={`playlist__menu-panel ${isAddSubmenuOpen ? "open" : ""}`}
                    ref={(node) => {
                        submenuPanelRef.current = node;
                        submenuRefs.setFloating(node);
                    }}
                    role="menu"
                    aria-label="Thêm vào playlist"
                    style={{ ...submenuFloatingStyles, right: "auto", width: "280px", zIndex: 5001 }}
                    onClick={(event) => event.stopPropagation()}
                    onMouseEnter={openSubmenu}
                // onMouseLeave={scheduleCloseSubmenu}
                >
                    <div className="playlist__menu-field" style={{ paddingTop: 12 }}>
                        <input
                            type="text"
                            value={playlistSearch}
                            onChange={(event) => setPlaylistSearch(event.target.value)}
                            onClick={(event) => event.stopPropagation()}
                            onFocus={openSubmenu}
                            placeholder="Tìm playlist"
                            aria-label="Tìm playlist"
                            style={{
                                width: "100%",
                                height: "38px",
                                borderRadius: "10px",
                                border: "1px solid var(--border-primary)",
                                padding: "0 12px",
                                background: "color-mix(in srgb, var(--bg-content-color) 86%, transparent)",
                                color: "var(--text-color)",
                                outline: "none",
                            }}
                        />
                    </div>

                    {/* <button
                        type="button"
                        className="playlist__menu-option"
                        onClick={handleCreatePlaylistClick}
                        disabled={isAddingSong}
                        style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                    >
                        <i className="bi bi-plus-circle" style={{ fontSize: "1.4rem" }} />
                        <span className="playlist__menu-option-title">Tạo playlist mới</span>
                    </button> */}
                    <div className="playlist__menu-options-scroll">
                        {filteredPlaylists.length === 0 ? (
                            <div className="playlist__menu-empty">
                                {playlistSearch.trim() ? "Không tìm thấy playlist nào" : "Chưa có playlist nào"}
                            </div>
                        ) : (
                            filteredPlaylists.map((item) => {
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        className={`playlist__menu-option`}
                                        onClick={(event) => handleAddSongToPlaylist(event, item)}
                                        disabled={isAddingSong}
                                    >
                                        <span className="playlist__menu-option-title">{item.playlist_name}</span>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
            {isOpenForm && (
                <CreatePlaylist
                    onClose={() => setOpenForm(false)}
                />
            )}
            {songToRemove ? (
                <DeleteSongFromPlaylistDialog
                    playlistId={selectedPlaylist?.id}
                    song={songToRemove}
                    onClose={handleCloseRemoveSongDialog}
                    onDeleted={handleSongRemoved}
                />
            ) : null}

        </>

    );
}
