import '../assets/css/main.css';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import axios from 'axios';
import { SuggestionDropdown } from './SuggestionDropdown/SuggestionDropdown.jsx';
import { useAuthContext } from '../context/AuthContext';
import { useMusicContext } from '../context/MusicContext.jsx';
import { getArtistPath } from '../utils/artistNavigation.js';
import { API_URL } from '../api.js';

const EMPTY_SUGGESTIONS = { songs: [], artists: [], playlists: [], albums: [] };

export function Header({ onClose }) {
    const [isOpenLogout, setOpenLogout] = useState(false);
    // Trạng thái bật/tắt của nút quay lại và tiến tới trên header.
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const navigationType = useNavigationType();
    const { currentUser, isAuthenticated, isAdmin, logout } = useAuthContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState(EMPTY_SUGGESTIONS);
    const [showSuggest, setShowSuggest] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const debounceRef = useRef(null); //
    const inputRef = useRef(null);
    const userMenuRef = useRef(null);
    const { resetSelectedPlaylist } = useMusicContext();

    // Đồng bộ trạng thái nút back/forward theo history index của browser
    useEffect(() => {
        // idx là vị trí hiện tại trong history stack của React Router.
        const currentIdx = Number(window.history.state?.idx ?? 0);
        const maxIdxKey = 'maxHistoryIdx';
        // Lưu lại idx lớn nhất đã đi qua để biết còn trang forward hay không.
        const savedMaxIdx = Number(sessionStorage.getItem(maxIdxKey) ?? currentIdx);
        const maxIdx = navigationType === 'PUSH'
            ? currentIdx
            : Math.max(savedMaxIdx, currentIdx);

        sessionStorage.setItem(maxIdxKey, String(maxIdx));

        // Có thể lùi khi không ở vị trí đầu; có thể tiến khi chưa ở idx lớn nhất.
        setCanGoBack(currentIdx > 0);
        setCanGoForward(currentIdx < maxIdx);
    }, [location, navigationType]);

    //Chuyển trang cũ
    function handleBack() {
        // Chỉ điều hướng khi nút đang khả dụng.
        if (canGoBack) {
            navigate(-1);
        }
    }
    //Chuyển trang mới
    function handleForward() {
        // Chỉ điều hướng khi còn trang phía trước trong history.
        if (canGoForward) {
            navigate(1);
        }
    }

    useEffect(() => {
        // hide suggestion when clicking outside
        function handleClick(e) {
            if (!inputRef.current?.contains(e.target)) {
                setShowSuggest(false);
            }
        }
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setOpenLogout(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const q = searchTerm.trim();
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!q) {
            setSuggestions(EMPTY_SUGGESTIONS);
            setShowSuggest(false);
            setActiveIndex(-1);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            try {
                const userParam = currentUser?.id ? `&userId=${encodeURIComponent(currentUser.id)}` : '';
                const res = await axios.get(`${API_URL}/api/search/suggest?q=${encodeURIComponent(q)}${userParam}`);
                setSuggestions(res.data || EMPTY_SUGGESTIONS);
                setShowSuggest(true);
                setActiveIndex(-1);
            } catch (err) {
                console.error('Suggest error', err);
                setSuggestions(EMPTY_SUGGESTIONS);
            }
        }, 1000);
        return () => clearTimeout(debounceRef.current);
    }, [searchTerm, currentUser?.id]);

    function buildFlatList(list) {
        const out = [];
        (list.songs || []).forEach((s) => out.push({ type: 'song', item: s }));
        (list.artists || []).forEach((a) => out.push({ type: 'artist', item: a }));
        (list.playlists || []).forEach((p) => out.push({ type: 'playlist', item: p }));
        (list.albums || []).forEach((a) => out.push({ type: 'album', item: a }));
        return out;
    }

    function handleInputKeyDown(e) {
        const flat = buildFlatList(suggestions);
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (flat.length === 0) return;
            setActiveIndex((idx) => Math.min(idx + 1, flat.length - 1));
            setShowSuggest(true);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (flat.length === 0) return;
            setActiveIndex((idx) => Math.max(idx - 1, 0));
            setShowSuggest(true);
            return;
        }
        if (e.key === 'Escape') {
            setShowSuggest(false);
            setActiveIndex(-1);
            return;
        }
        if (e.key === 'Enter') {
            const q = searchTerm.trim();
            if (activeIndex >= 0) {
                const sel = flat[activeIndex];
                if (sel) {
                    const val = encodeURIComponent(sel.item.title || sel.item.name || sel.item.playlist_name || '');
                    setShowSuggest(false);
                    setActiveIndex(-1);
                    if (sel.type === 'artist') {
                        navigate(getArtistPath(sel.item));
                        return;
                    }
                    navigate(`/tim-kiem/tat-ca?q=${val}`);
                }
                return;
            }
            if (q) {
                setShowSuggest(false);
                navigate(`/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`);
            }
        }
    }

    function handleSubmitSearch() {
        const q = searchTerm.trim();
        if (!q) return;
        setShowSuggest(false);
        setActiveIndex(-1);
        navigate(`/tim-kiem/tat-ca?q=${encodeURIComponent(q)}`);
    }

    function handleLogout() {
        resetSelectedPlaylist();
        logout();
        setOpenLogout(false);
        navigate('/personal');
    }

    function closeUserMenu() {
        setOpenLogout(false);
    }

    return (
        <>
            {/* Header */}
            < header className="header grid" >
                <div className="header__with-search">
                    <button
                        className="header__button"
                        type="button"
                        onClick={handleBack}
                        disabled={!canGoBack}
                        title={canGoBack ? 'Trang trước' : 'Không có trang trước'}
                    >
                        <i className="bi bi-arrow-left header__button-icon" />
                    </button>
                    <button
                        className="header__button"
                        type="button"
                        onClick={handleForward}
                        disabled={!canGoForward}
                        title={canGoForward ? 'Trang tiếp theo' : 'Không có trang tiếp theo'}
                    >
                        <i className="bi bi-arrow-right header__button-icon" />
                    </button>
                    <div className="header__search" ref={inputRef}>
                        <input
                            type="text"
                            placeholder="Nhập tên bài hát, nghệ sĩ hoặc MV..."
                            className="header__search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                        />
                        <div className="header__search-btn" onClick={handleSubmitSearch}>
                            <i className="bi bi-search header__search-icon" />
                        </div>
                        {showSuggest && (
                            <SuggestionDropdown
                                suggestions={suggestions}
                                activeIndex={activeIndex}
                                onHoverIndex={(i) => setActiveIndex(i)}
                                onSelect={(type, item) => {
                                    const val = encodeURIComponent(item.title || item.name || item.playlist_name || '');
                                    const text = item.title || item.name || item.playlist_name || '';
                                    setSearchTerm(text);
                                    setShowSuggest(false);
                                    setActiveIndex(-1);
                                    navigate(`/tim-kiem/tat-ca?q=${val}`);
                                }}
                            />
                        )}


                    </div>
                </div>
                <div className="header__nav">
                    <ul className="header__nav-list">
                        <li className="header__nav-item">
                            <div className="header__nav-btn nav-btn--theme" onClick={onClose}>
                                <svg
                                    width={20}
                                    height={20}
                                    className="header__nav-icon"
                                    viewBox="0 0 20 20"
                                >
                                    <defs>
                                        <linearGradient
                                            id="j32lhg93hd"
                                            x1="62.206%"
                                            x2="18.689%"
                                            y1="70.45%"
                                            y2="39.245%"
                                        >
                                            <stop offset="0%" stopColor="#F81212" />
                                            <stop offset="100%" stopColor="red" />
                                        </linearGradient>
                                        <linearGradient
                                            id="hjoavsus6g"
                                            x1="50%"
                                            x2="11.419%"
                                            y1="23.598%"
                                            y2="71.417%"
                                        >
                                            <stop offset="0%" stopColor="#00F" />
                                            <stop offset="100%" stopColor="#0031FF" />
                                        </linearGradient>
                                        <linearGradient
                                            id="la1y5u3dvi"
                                            x1="65.655%"
                                            x2="25.873%"
                                            y1="18.825%"
                                            y2="56.944%"
                                        >
                                            <stop offset="0%" stopColor="#FFA600" />
                                            <stop offset="100%" stopColor="orange" />
                                        </linearGradient>
                                        <linearGradient
                                            id="2dsmrlvdik"
                                            x1="24.964%"
                                            x2="63.407%"
                                            y1="8.849%"
                                            y2="55.625%"
                                        >
                                            <stop offset="0%" stopColor="#13EFEC" />
                                            <stop offset="100%" stopColor="#00E8DF" />
                                        </linearGradient>
                                        <filter
                                            id="4a7imk8mze"
                                            width="230%"
                                            height="230%"
                                            x="-65%"
                                            y="-65%"
                                            filterUnits="objectBoundingBox"
                                        >
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.9" />
                                        </filter>
                                        <filter
                                            id="301mo6jeah"
                                            width="312.7%"
                                            height="312.7%"
                                            x="-106.4%"
                                            y="-106.4%"
                                            filterUnits="objectBoundingBox"
                                        >
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.9" />
                                        </filter>
                                        <filter
                                            id="b2zvzgq7fj"
                                            width="295%"
                                            height="295%"
                                            x="-97.5%"
                                            y="-97.5%"
                                            filterUnits="objectBoundingBox"
                                        >
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.9" />
                                        </filter>
                                        <filter
                                            id="a1wq161tvl"
                                            width="256%"
                                            height="256%"
                                            x="-78%"
                                            y="-78%"
                                            filterUnits="objectBoundingBox"
                                        >
                                            <feGaussianBlur in="SourceGraphic" stdDeviation="3.9" />
                                        </filter>
                                        <path
                                            id="qtpqrj1oda"
                                            d="M3.333 14.167V5.833l-1.666.834L0 3.333 3.333 0h3.334c.04 1.57.548 2.4 1.524 2.492l.142.008C9.403 2.478 9.958 1.645 10 0h3.333l3.334 3.333L15 6.667l-1.667-.834v8.334h-10z"
                                        />
                                        <path id="jggzvnjgfc" d="M0 0H20V20H0z" />
                                        <path
                                            id="2eiwxjmc7m"
                                            d="M3.333 14.167V5.833l-1.666.834L0 3.333 3.333 0h3.334c.04 1.57.548 2.4 1.524 2.492l.142.008C9.403 2.478 9.958 1.645 10 0h3.333l3.334 3.333L15 6.667l-1.667-.834v8.334h-10z"
                                        />
                                    </defs>
                                    <g fill="none" fillRule="evenodd" transform="translate(2 3)">
                                        <mask id="tinejqaasb" fill="#fff">
                                            <use xlinkHref="#qtpqrj1oda" />
                                        </mask>
                                        <use fill="#FFF" fillOpacity={0} xlinkHref="#qtpqrj1oda" />
                                        <g mask="url(#tinejqaasb)">
                                            <g transform="translate(-2 -3)">
                                                <mask id="uf3ckvfvpf" fill="#fff">
                                                    <use xlinkHref="#jggzvnjgfc" />
                                                </mask>
                                                <use fill="#D8D8D8" xlinkHref="#jggzvnjgfc" />
                                                <circle
                                                    cx="8.9"
                                                    cy="6.8"
                                                    r={9}
                                                    fill="url(#j32lhg93hd)"
                                                    filter="url(#4a7imk8mze)"
                                                    mask="url(#uf3ckvfvpf)"
                                                />
                                                <circle
                                                    cx="9.3"
                                                    cy="13.7"
                                                    r="5.5"
                                                    fill="url(#hjoavsus6g)"
                                                    filter="url(#301mo6jeah)"
                                                    mask="url(#uf3ckvfvpf)"
                                                />
                                                <circle
                                                    cx="15.9"
                                                    cy="6.9"
                                                    r={6}
                                                    fill="url(#la1y5u3dvi)"
                                                    filter="url(#b2zvzgq7fj)"
                                                    mask="url(#uf3ckvfvpf)"
                                                />
                                                <circle
                                                    cx="16.4"
                                                    cy="17.7"
                                                    r="7.5"
                                                    fill="url(#2dsmrlvdik)"
                                                    filter="url(#a1wq161tvl)"
                                                    mask="url(#uf3ckvfvpf)"
                                                />
                                            </g>
                                        </g>
                                        <use fill="#FFF" fillOpacity="0.05" xlinkHref="#2eiwxjmc7m" />
                                    </g>
                                </svg>
                            </div>
                        </li>

                        {!isAuthenticated ? (
                            <>
                                <li className="header__nav-item">
                                    <Link className="header__auth-btn" to="/login">
                                        Đăng nhập
                                    </Link>
                                </li>
                                <li className="header__nav-item">
                                    <Link className="header__auth-btn header__auth-btn--outline" to="/register">
                                        Đăng ký
                                    </Link>
                                </li>
                            </>
                        ) : (
                            <li className="header__nav-item" ref={userMenuRef}>
                                <img
                                    src={currentUser?.avatar || '/assets/img/avatars/avatar.jpg'}
                                    alt={currentUser?.username || 'avatar'}
                                    className="header__nav-btn"
                                    onClick={() => setOpenLogout(!isOpenLogout)}
                                />
                                <div className={`option__log-out ${isOpenLogout ? 'open' : ''}`}>

                                    {isAdmin ? (
                                        <Link className="log-out__action" to="/admin" onClick={closeUserMenu}>
                                            <i className="bi bi-shield-lock log-out__icon" />
                                            <span>Quản trị Admin</span>
                                        </Link>
                                    ) : (
                                        <Link className="log-out__action" to="/dashboard" onClick={closeUserMenu}>
                                            <i className="bi bi-person-circle log-out__icon" />
                                            <span>Trang đã đăng nhập</span>
                                        </Link>
                                    )}
                                    <button className="log-out__action log-out__button" type="button" onClick={handleLogout}>
                                        <i className="bi bi-box-arrow-right log-out__icon" />
                                        <span>Đăng xuất</span>
                                    </button>
                                </div>
                            </li>
                        )}
                    </ul>
                </div>
            </header >

        </>
    )
}
