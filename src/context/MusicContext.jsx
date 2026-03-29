import { createContext, useState, useContext, useEffect } from 'react';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playlistIndex, setPlaylistIndex] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    try {
      const savedIndexStr = localStorage.getItem("currentSongIndex");
      if (savedIndexStr && savedIndexStr !== "undefined") {
        const savedIndex = JSON.parse(savedIndexStr);
        if (savedIndex !== null) {
          setCurrentIndex(savedIndex);
        }
      }
      const savedPlaylistIndexStr = localStorage.getItem("playlistIndex");
      if (savedPlaylistIndexStr && savedPlaylistIndexStr !== "undefined") {
        const savedPlaylistIndex = JSON.parse(savedPlaylistIndexStr);
        if (savedPlaylistIndex !== null) {
          setPlaylistIndex(savedPlaylistIndex);
        }
      }
      const savedPlaylistStr = localStorage.getItem("selectedPlaylist");
      if (savedPlaylistStr && savedPlaylistStr !== "undefined") {
        const savedPlaylist = JSON.parse(savedPlaylistStr);
        if (savedPlaylist !== null) {
          setSelectedPlaylist(savedPlaylist);
        }
      }
    } catch (error) {
      console.error("Error parsing localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("currentSongIndex");
      localStorage.removeItem("playlistIndex");
      localStorage.removeItem("selectedPlaylist");
    }
  }, []);

  // Auto-save currentIndex to localStorage
  useEffect(() => {
    localStorage.setItem("currentSongIndex", JSON.stringify(currentIndex));
  }, [currentIndex]);

  // Auto-save playlistIndex to localStorage
  useEffect(() => {
    localStorage.setItem("playlistIndex", JSON.stringify(playlistIndex));
  }, [playlistIndex]);

  // Auto-save selectedPlaylist to localStorage
  useEffect(() => {
    if (selectedPlaylist !== null) {
      localStorage.setItem("selectedPlaylist", JSON.stringify(selectedPlaylist));
    }
  }, [selectedPlaylist]);

  return (
    <MusicContext.Provider value={{ currentIndex, setCurrentIndex, playlistIndex, setPlaylistIndex, selectedPlaylist, setSelectedPlaylist }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
}
