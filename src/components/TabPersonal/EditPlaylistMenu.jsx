import { useEffect } from "react";
import {
    autoUpdate,
    flip,
    offset,
    shift,
    useFloating,
} from "@floating-ui/react";

export function EditPlaylistMenu({
    openPlaylistMenuId,
    playlistMenuTrigger,
    playlistMenuRef,
    playlists,
    onEditPlaylist,
    onCloseMenu = () => {},
}) {
    const {
        refs: menuRefs,
        floatingStyles: menuFloatingStyles,
    } = useFloating({
        strategy: "fixed",
        placement: "bottom-end",
        whileElementsMounted: autoUpdate,
        middleware: [
            offset(8),
            flip({
                fallbackPlacements: ["top-end", "bottom-start", "top-start"],
            }),
            shift({ padding: 70 }),
        ],
        transform: false,
    });

    useEffect(() => {
        menuRefs.setReference(openPlaylistMenuId ? playlistMenuTrigger : null);
    }, [menuRefs, openPlaylistMenuId, playlistMenuTrigger]);

    useEffect(() => {
        if (!openPlaylistMenuId) {
            return;
        }

        window.addEventListener("wheel", onCloseMenu, { capture: true, passive: true });
        window.addEventListener("scroll", onCloseMenu, { capture: true, passive: true });

        return () => {
            window.removeEventListener("wheel", onCloseMenu, { capture: true });
            window.removeEventListener("scroll", onCloseMenu, { capture: true });
        };
    }, [onCloseMenu, openPlaylistMenuId]);

    if (!openPlaylistMenuId || !playlistMenuTrigger) {
        return null;
    }

    function handleClickEditPlaylist() {
        const playlist = playlists.find((item) => item.id === openPlaylistMenuId);

        if (playlist) {
            onEditPlaylist(playlist);
        }
    }

    return (
        <div
            className="option__log-out open playlist__menu-popup"
            role="menu"
            ref={(node) => {
                playlistMenuRef.current = node;
                menuRefs.setFloating(node);
            }}
            onClick={(e) => e.stopPropagation()}
            style={{
                ...menuFloatingStyles,
                right: "auto",
                width: "220px",
                minHeight: "auto",
                padding: "6px",
                zIndex: 5000
            }}
        >
            <button
                type="button"
                className="playlist__menu-option"
                onClick={handleClickEditPlaylist}
            >
                <i className="bi bi-pencil-square log-out__icon" />
                <span className="playlist__menu-option-title">Chỉnh sửa playlist</span>
            </button>
        </div>
    );
}
