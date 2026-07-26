import { useState, useEffect } from 'react'
import './App.css'
import './assets/css/base.css'
import './assets/css/grid.css'
import './assets/css/main.css'
import './assets/css/responsive.css'
import './components/Header.jsx'
import { ThemeModal } from './components/ThemeModal.jsx'
import { applyTheme } from './utils/theme.js'
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
import { GenresPage } from './components/GenresPage.jsx'
import { GenreDetailPage } from './components/GenreDetailPage.jsx'
import { NewMusicPage } from './components/NewMusicPage.jsx'
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
import { PlaylistDetail } from './components/PlaylistDetail/PlaylistDetail.jsx'
import { ArtistDetail } from './components/ArtistsDetail/ArtistsDetail.jsx'

function GuestOnlyRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuthContext();
  if (isAuthenticated) {sfgsgfsfs
    // Người đã đăng nhập không cần quay lại trang login/register.
    return <Navigate to={'/'} />;
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
  const [currentTheme, setCurrentTheme] = useState(() => JSON.parse(localStorage.getItem("theme")));
  const [playlists, setPlaylists] = useState([]);
  const authEntryPaths = ['/login', '/register'];
  const isAuthEntryPage = authEntryPaths.includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const isFullScreenPage = isAuthEntryPage || isAdminPage;
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const reservedTopLevelPaths = new Set([
    'admin',
    'album',
    'dashboard',
    'dream',
    'genres',
    'genre',
    'guest',
    'login',
    'new',
    'personal',
    'playlist',
    'recent',
    'register',
    'tim-kiem',
  ]);
  const isArtistDetailPage =
    location.pathname.startsWith('/artist/') ||
    (pathSegments.length === 1 && !reservedTopLevelPaths.has(pathSegments[0]));
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
  const standalonePaths = ['/login', '/register', '/dashboard'];
  const isStandalonePage = standalonePaths.includes(location.pathname) || isAdminPage;
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
    if (currentTheme) {
      applyTheme(currentTheme);
    }
  }, [currentTheme]);

  function handleApplyTheme(theme) {
    setCurrentTheme(theme);
    localStorage.setItem("theme", JSON.stringify(theme));
  }

  const appBackgroundImage = currentTheme?.backgroundImage
    ? `url(${currentTheme.backgroundImage})`
    : "none";
  const playerStyle = currentTheme?.playerImage
    ? { background: `url(${currentTheme.playerImage})` }
    : undefined;

  return (
    <MusicProvider>
      <>
        <div
          className={`app grid${isFullScreenPage ? ' app--full-screen' : ''}${currentTheme ? ' has__theme-img' : ''}${isArtistDetailPage ? ' app--artist-detail' : ''}`}
          style={{ backgroundImage: appBackgroundImage }}
        >
          {/* Header */}
          {!isFullScreenPage ? <Header onClose={() => setShowTheme(true)} /> : null}

          {/* Sidebar */}
          {/* Khi có sự thay đổi về playlist thì load lại danh sách playlist */}
          {!isStandalonePage ? <Sidebar onPlaylistsChanged={loadPlaylists} /> : null}
          <Routes>
            <Route path="/" element={<TabExplorer />} />
            <Route path="/guest" element={<Navigate to="/personal" replace />} />
            <Route path="/login" element={<GuestOnlyRoute><LoginPage /></GuestOnlyRoute>} />
            <Route path="/register" element={<GuestOnlyRoute><RegisterPage /></GuestOnlyRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboardPage /></ProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/songs" replace />} />
            <Route path="/admin/:tab" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/:tab/:mode" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/:tab/:mode/:songId" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            {/* Tab Cá nhân hiển thị giao diện chào mừng cho khách và giao diện thật cho người đã đăng nhập */}
            <Route path="/personal" element={isAuthenticated ? <TabPersonal playlists={playlists} onPlaylistsChanged={loadPlaylists} /> : <GuestPage />} >
              <Route path="" element={<OverviewSection />} />
              <Route path="overview" element={<OverviewSection />} />
              <Route path="song" element={<SongSection />} />
              <Route path="playlist" element={<PlaylistSection />} />
              <Route path="album" element={<AlbumSection />} />
              <Route path="artist" element={<ArtistSection />} />
            </Route>
            <Route path="/dream" element={<DreamChart />} />
            <Route path="/recent" element={<RecentSong />} />
            <Route path="/new" element={<NewMusicPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/genre/:slug" element={<GenreDetailPage />} />
            <Route path="/tim-kiem" element={<Navigate to="/tim-kiem/tat-ca" replace />} />
            <Route path="/tim-kiem/:tab" element={<SearchResults />} />
            <Route path="/album/:id" element={<PlaylistDetail />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/artist/:slug" element={<ArtistDetail />} />
            <Route path="/:slug" element={<ArtistDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>



        </div >

        {/* Tab radio */}
        {!isStandalonePage ? <TabRadio /> : null}

        {/* Player */}
        {!isStandalonePage ? <Player style={playerStyle} /> : null}
        {/* Theme */}
        {
          showTheme && (
            <ThemeModal
              onClose={() => setShowTheme(false)}
              onApplyTheme={handleApplyTheme}
              currentTheme={currentTheme}
            />
          )
        }

        {/* Toast */}
        < div id="toast" ></div >

      </>
    </MusicProvider>
  )
}

export default App
