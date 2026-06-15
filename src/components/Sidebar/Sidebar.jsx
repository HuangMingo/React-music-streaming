import { useState } from "react"
import { NavLink } from "react-router-dom"
import { CreatePlaylist } from "./CreatePlaylist/CreatePlaylist.jsx";
import {useAuthContext} from "../../context/AuthContext.jsx";
import {showNotificationToast} from "../../toast.js";
export function Sidebar({ onPlaylistsChanged }) {
    const [isOpenForm, setOpenForm] = useState(false);
    const { currentUser } = useAuthContext();
    function toggleOpenForm() {
        const userid = currentUser?.id;
        if (!userid) {
            showNotificationToast("Vui lòng đăng nhập để tạo playlist", "error");
            return;
        }
        setOpenForm(!isOpenForm);
    }   
    return (
        <div className="app__sidebar">
            <div className="sidebar__logo hide-on-mobile">
                <NavLink to="/" className="sidebar__logo-link">
                    <img
                        src="/assets/img/logos/main-logo.png"
                        alt="Logo"
                        className="sidebar__logo-img"
                    />
                </NavLink>
            </div>

            <div className="sidebar__nav">
                <ul className="sidebar__nav-list sidebar__nav-list--separate ">
                    <NavLink to="/personal" className= "sidebar__nav-item">
                        <li className="sidebar__item-link">
                            <i className="bi bi-music-player"></i>
                            <span>Cá nhân</span>
                        </li>

                    </NavLink>

                    <NavLink to="/" className={'sidebar__nav-item'}>
                        <li className="sidebar__item-link">
                            <i className="bi bi-vinyl" />
                            <span>Mood on top</span>
                        </li>
                    </NavLink>



                    <NavLink to="/dream" className="sidebar__nav-item">
                        <li className="sidebar__item-link">
                            <i className="bi bi-music-note-list" />
                            <span>#Dreamchart</span>
                        </li>
                    </NavLink>
                    <NavLink to="/recent" className="sidebar__nav-item">
                        <li className="sidebar__item-link">
                            <i className="bi bi-clock"></i>
                            <span>Gần đây</span>
                        </li>
                    </NavLink>

                </ul>
            </div>
            <div className="sidebar__subnav hide-on-mobile">
                <ul className="sidebar__nav-list">
                    <NavLink to="/new" className="sidebar__nav-item subnab--item">
                        <li className="sidebar__item-link">
                            <i className="bi bi-music-note-beamed" />
                            <span>Nhạc Mới</span>
                        </li>
                    </NavLink>
                    <NavLink to="/genres" className="sidebar__nav-item subnab--item">
                        <li className="sidebar__item-link">
                            <i className="bi bi-slack" />
                            <span>Thể Loại</span>
                        </li>
                    </NavLink>
                    
                    
                </ul>
             
            </div>
            <div className="sidebar__create-playlist">
                <div className="sidebar__create-container hide-on-tablet-mobile" onClick={() =>{toggleOpenForm()} }>
                    <i className="bi bi-plus-lg" />
                    <h2 className="sidebar__create-title">Tạo playlist mới</h2>
                </div>
                {
                    isOpenForm && (
                        <CreatePlaylist
                            onClose={() => setOpenForm(false)}
                            onSuccess={onPlaylistsChanged}
                        />
                    )
                }
                <div className="sidebar__expand">
                    <div className="sidebar__expand-btn btn--expand">
                        <i className="bi bi-chevron-right" />
                    </div>
                    <div className="sidebar__expand-btn btn--shrink">
                        <i className="bi bi-chevron-left" />
                    </div>
                </div>
            </div>
        </div >

    )
}
