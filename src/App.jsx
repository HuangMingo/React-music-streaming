import { useState, useEffect } from 'react'
import './App.css'
import './assets/css/base.css'
import './assets/css/grid.css'
import './assets/css/main.css'
import './assets/css/responsive.css'
import './components/Header.jsx'
import { applyTheme, ThemeModal } from './components/ThemeModal.jsx'
import { MusicProvider } from './context/MusicContext.jsx'
import { AlbumSection } from './components/TabPersonal/AlbumSection.jsx'
import { ArtistSection } from './components/TabPersonal/ArtistSection.jsx'
import { DreamChart } from './components/Sidebar/DreamChart.jsx'
import { Header } from './components/Header.jsx'
import { Mood } from './components/Sidebar/TabMood.jsx'
import { MUSIC_STORAGE_KEY } from '../public/data/songPlaylists.js'
import { OverviewSection } from './components/TabPersonal/Overview/OverviewSection.jsx'
import { Player } from './components/Player.jsx'
import { PlaylistSection } from './components/TabPersonal/PlaylistSection.jsx'
import { Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar/Sidebar.jsx'
import { SongSection } from './components/TabPersonal/SongSection.jsx'
import { TabExplorer } from './components/TabExplorer/TabExplorer.jsx'
import { TabFollowing } from './components/TabFollowing/TabFollowing.jsx'
import { TabPersonal } from './components/TabPersonal/TabPersonal.jsx'
import { TabRadio } from './components/TabRadio/TabRadio.jsx'
import { UploadSection } from './components/TabPersonal/UploadSection.jsx'
import { Radio } from './components/TabExplorer/Radio.jsx'


function App() {
  const [showTheme, setShowTheme] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const playlists = JSON.parse(localStorage.getItem(MUSIC_STORAGE_KEY) || []);
  const [selectedAlbum, setSelectedAlbum] = useState(null);

  // -----------Set background for header when scroll-----------
  useEffect(() => {
    const appContainers = Array.from(document.querySelectorAll('.app__container'));
    const header = document.querySelector(".header");
    appContainers.forEach(appContainer => {
      appContainer.onscroll = function () {
        const scrollTop = appContainer.scrollY || appContainer.scrollTop;
        if (scrollTop > 5) {
          Object.assign(header.style, {
            backgroundColor: 'var(--layout-bg)',
            boxShadow: '0 1px 1px rgba(0, 0, 0, 0.08)',
          })
        } else {
          Object.assign(header.style, {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          })
        }
      }
    })
  })

  //Lay du lieu cu
  useEffect(() => {
    const savedTheme = JSON.parse(localStorage.getItem("theme"));
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  }, []);
  return (
    <MusicProvider>
      <>
        <div className="app grid" style={{ backgroundImage: "none" }}>
          {/* Header */}
          <Header onClose={() => setShowTheme(true)} onOpen={() => setOpen(true)} />

          {/* Sidebar */}
          <Sidebar />


          <Routes>
            <Route path="/" element={<Mood />} />
            <Route path="/personal" element={<TabPersonal playlists={playlists} />} >
              <Route path="" element={<OverviewSection />} />
              <Route path="overview" element={<OverviewSection />} />
              <Route path="song" element={<SongSection />} />
              <Route path="playlist" element={<PlaylistSection />} />
              <Route path="album" element={<AlbumSection />} />
              <Route path="artist" element={<ArtistSection />} />
              <Route path="upload" element={<UploadSection />} />
            </Route>
            <Route path="/mood" element={<Mood />} />
            <Route path="/dream" element={<DreamChart />} />
            <Route path="/radio" element={<Radio />} />
            <Route path="/following" element={<TabFollowing />} />
          </Routes>



        </div >

        {/* Tab radio */}
        < TabRadio />

        {/* Tab following */}
        < TabFollowing />

        {/* Player */}
        < Player />
        {/* Theme */}
        {
          showTheme && (
            <ThemeModal onClose={() => setShowTheme(false)} />
          )
        }

        {/* Toast */}
        < div id="toast" ></div >

      </>
    </MusicProvider>
  )
}

export default App
