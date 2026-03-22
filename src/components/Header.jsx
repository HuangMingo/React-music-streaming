import '../assets/css/main.css';
import { useState } from 'react';
export function Header({ onClose }) {
    const [isOpen, setOpen] = useState(false);
    const [isOpenLogout, setOpenLogout] = useState(false);
    return (
        <>
            {/* Header */}
            < header className="header grid" >
                <div className="header__with-search">
                    <button className="header__button">
                        <i className="bi bi-arrow-left header__button-icon" />
                    </button>
                    <button className="header__button button--disabled">
                        <i className="bi bi-arrow-right header__button-icon" />
                    </button>
                    <div className="header__search">
                        <input
                            type="text"
                            placeholder="Nhập tên bài hát, nghệ sĩ hoặc MV..."
                            className="header__search-input"
                        />
                        <div className="header__search-btn">
                            <i className="bi bi-search header__search-icon" />
                        </div>
                        <div className="header__search-history">
                            <ul className="header__search-list">
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        Tình bạn diệu kì
                                    </a>
                                </li>
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        Gác lại âu lo
                                    </a>
                                </li>
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        Hongkong1
                                    </a>
                                </li>
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        #zingchart
                                    </a>
                                </li>
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        Cheating on You
                                    </a>
                                </li>
                                <li className="header__search-item">
                                    <i className="bi bi-search header__item-icon" />
                                    <a href="#" className="header__item-link">
                                        BlackJack
                                    </a>
                                </li>
                            </ul>
                        </div>
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
                        <li className="header__nav-item hide-on-mobile">
                            <div className="header__nav-btn btn--nav-setting" >
                                <i className="bi bi-gear header__nav-icon" onClick={() => setOpen(!isOpen)} />
                                <div className={`setting__menu ${isOpen ? "open" : ""}`}  >
                                    <div className="setting__nav">
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-shield-lock setting__item-icon" />
                                                <span>Danh sách chặn</span>
                                            </div>
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-badge-hd setting__item-icon" />
                                                <span>Chất lượng nhạc</span>
                                            </div>
                                            <i className="bi bi-chevron-right setting__item-icon" />
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-play-circle setting__item-icon" />
                                                <span>Trình phát nhạc</span>
                                            </div>
                                            <i className="bi bi-chevron-right setting__item-icon" />
                                        </div>
                                    </div>
                                    <div className="setting__subnav">
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-exclamation-circle setting__item-icon" />
                                                <span>Giới thiệu</span>
                                            </div>
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-flag setting__item-icon" />
                                                <span>Góp ý</span>
                                            </div>
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-telephone setting__item-icon" />
                                                <span>Liên hệ</span>
                                            </div>
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-badge-ad setting__item-icon" />
                                                <span>Quảng cáo</span>
                                            </div>
                                        </div>
                                        <div className="setting__item">
                                            <div className="setting__item-content">
                                                <i className="bi bi-file-text setting__item-icon" />
                                                <span>Thỏa thuận sử dụng</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li className="header__nav-item">
                            <img
                                src="/assets/img/avatars/avatar.jpg"
                                alt=""
                                className="header__nav-btn"
                                onClick={() => setOpenLogout(!isOpenLogout)}
                            />
                            <div className= {`option__log-out ${isOpenLogout ? "open" : ""}`}>
                                <i className="bi bi-box-arrow-right log-out__icon" />
                                <span>Đăng xuất</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </header >

        </>
    )
}