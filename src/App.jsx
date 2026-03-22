import { useState, useEffect } from 'react'
import './App.css'
import './assets/css/base.css'
import './assets/css/grid.css'
import './assets/css/main.css'
import './assets/css/responsive.css'
import './components/Header.jsx'
import { applyTheme, ThemeModal } from './components/ThemeModal.jsx'
import { DreamChart } from './components/Sidebar/DreamChart.jsx'
import { Header } from './components/Header.jsx'
import { Mood } from './components/Sidebar/Mood.jsx'
import { MvSection } from './components/MvSection.jsx'
import { OverviewSection } from './components/TabPersonal/Overview/OverviewSection.jsx'
import { Player } from './components/Player.jsx'
import { Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/Sidebar/Sidebar.jsx'
import { SongSection } from './components/TabPersonal/SongSection.jsx'
import { TabExplorer } from './components/TabExplorer/TabExplorer.jsx'
import { TabFollowing } from './components/TabFollowing/TabFollowing.jsx'
import { TabPersonal } from './components/TabPersonal/TabPersonal.jsx'
import { TabRadio } from './components/TabRadio/TabRadio.jsx'
import { UploadSection } from './components/TabPersonal/UploadSection.jsx'
import { PlaylistSection } from './components/TabPersonal/PlaylistSection.jsx'









function App() {
  const [showTheme, setShowTheme] = useState(false);
  const [isOpen, setOpen] = useState(false);
  useEffect(() => {
    const savedTheme = JSON.parse(localStorage.getItem("theme"));
    if (savedTheme) {
      applyTheme(savedTheme);
    }
  }, []);
  return (
    <>
      <div className="app grid" style={{ backgroundImage: "none" }}>
        {/* Header */}
        <Header onClose={() => setShowTheme(true)} onOpen={() => setOpen(true)} />

        {/* Sidebar */}
        <Sidebar />


        <Routes>
          <Route path="/" element={<Mood />} />
          <Route path="/personal" element={<TabPersonal />} >
            <Route path="" element={<OverviewSection />} />
            <Route path="overview" element={<OverviewSection />} />
            <Route path="song" element={<SongSection />} />
            <Route path="playlist" element={<PlaylistSection />} />
            <Route path="album" />
            <Route path="mv" element={<MvSection />} />
            <Route path="artist" />
            <Route path="upload" element={<UploadSection />} />
          </Route>
          <Route path="/mood" element={<Mood />} />
          <Route path="/dream" element={<DreamChart />} />
          <Route path="/dream" element={<DreamChart />} />
          <Route path="/following" element={<DreamChart />} />
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
  )
}

export default App
