import { useState, useEffect } from 'react'
import './App.css'
import './assets/css/base.css'
import './assets/css/grid.css'
import './assets/css/main.css'
import './assets/css/responsive.css'
import './components/Header.jsx'
import { applyTheme, ThemeModal } from './components/ThemeModal.jsx'
import { MusicProvider } from './context/MusicContext.jsx'
import { useAuthContext } from './context/AuthContext.jsx'
import { AlbumSection } from './components/TabPersonal/AlbumSection.jsx'
import { ArtistSection } from './components/TabPersonal/ArtistSection.jsx'
import {
  AdminDashboardPage,
  GuestPage,
  LoginPage,
  RegisterPage,
  UserDashboardPage,
} from './components/Auth/AuthPages.jsx'
import { DreamChart } from './components/Sidebar/DreamChart.jsx'
import { Header } from './components/Header.jsx'
import { initMusicData } from '../public/data/songPlaylists.js'
import { OverviewSection } from './components/TabPersonal/Overview/OverviewSection.jsx'
import { Player } from './components/Player.jsx'
import { PlaylistSection } from './components/TabPersonal/PlaylistSection.jsx'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Sidebar } from './components/Sidebar/Sidebar.jsx'
import { SongSection } from './components/TabPersonal/SongSection.jsx'
import { TabExplorer } from './components/TabExplorer/TabExplorer.jsx'
import { RecentSong } from './components/TabFollowing/RecentSong.jsx'
import { TabPersonal } from './components/TabPersonal/TabPersonal.jsx'
import { TabRadio } from './components/TabRadio/TabRadio.jsx'
import { SearchResults } from './components/Search/SearchResults.jsx'
import { UploadSection } from './components/TabPersonal/UploadSection.jsx'
import { Radio } from './components/TabExplorer/Radio.jsx'

function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthContext();
  if (isAuthenticated) {
    // Người đã đăng nhập không cần quay lại trang login/register.
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return children;
}

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthContext();

  if (!isAuthenticated) {
    // Trang người dùng chỉ mở khi đã có phiên đăng nhập.
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthContext();
  if (!isAuthenticated) {
    // Chưa đăng nhập thì quay về form đăng nhập.
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    // User thường không được vào trang admin hoặc upload.
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuthContext();
  const [showTheme, setShowTheme] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const authEntryPaths = ['/login', '/register'];
  const isAuthEntryPage = authEntryPaths.includes(location.pathname);
  //Tải dữ liệu playlist và cập nhât khi có sự thay đổi 
  async function loadPlaylists() {
    if (!currentUser?.id) {
      setPlaylists([]);
      return;
    }

    const data = await initMusicData(currentUser.id);
    setPlaylists(Array.isArray(data) ? data : []);
  }
  //Load playlists khi người dùng đăng nhập
  useEffect(() => {
    loadPlaylists();
  }, [currentUser?.id]);
  //Các trang độc lập
  const standalonePaths = ['/login', '/register', '/dashboard', '/admin'];
  const isStandalonePage = standalonePaths.includes(location.pathname);
  // -----------Set background for header when scroll-----------
  useEffect(() => {
    const appContainers = Array.from(document.querySelectorAll('.app__container'));
    const header = document.querySelector(".header");

    if (!header) {
      return;
    }

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

    return () => {
      appContainers.forEach((appContainer) => {
        appContainer.onscroll = null;
      });
    };
  }, [location.pathname])

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
        <div className={`app grid${isAuthEntryPage ? ' app--full-screen' : ''}`} style={{ backgroundImage: "none" }}>
          {/* Header */}
          {!isAuthEntryPage ? <Header onClose={() => setShowTheme(true)} /> : null}

          {/* Sidebar */}
          {/* Khi có sự thay đổi về playlist thì load lại danh sách playlist */}
          {!isStandalonePage ? <Sidebar onPlaylistsChanged={loadPlaylists} /> : null}
          <Routes>
            <Route path="/" element={<TabExplorer />} />
            <Route path="/guest" element={<Navigate to="/personal" replace />} />
            <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
            <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            {/* Tab Cá nhân hiển thị giao diện chào mừng cho khách và giao diện thật cho người đã đăng nhập */}
            <Route path="/personal" element={isAuthenticated ? <TabPersonal playlists={playlists} onPlaylistsChanged={loadPlaylists} /> : <GuestPage />} >
              <Route path="" element={<OverviewSection />} />
              <Route path="overview" element={<OverviewSection />} />
              <Route path="song" element={<SongSection />} />
              <Route path="playlist" element={<PlaylistSection />} />
              <Route path="album" element={<AlbumSection />} />
              <Route path="artist" element={<ArtistSection />} />
              {/* Upload chỉ cho admin để tránh user thường truy cập trực tiếp */}
              <Route path="upload" element={<AdminRoute><UploadSection /></AdminRoute>} />
            </Route>
            <Route path="/dream" element={<DreamChart />} />
            <Route path="/recent" element={<RecentSong />} />
            <Route path="/tim-kiem" element={<Navigate to="/tim-kiem/tat-ca" replace />} />
            <Route path="/tim-kiem/:tab" element={<SearchResults />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>



        </div >

        {/* Tab radio */}
        {!isStandalonePage ? <TabRadio /> : null}

        {/* Tab following */}
        {!isStandalonePage ? <RecentSong /> : null}

        {/* Player */}
        {!isStandalonePage ? <Player /> : null}
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
