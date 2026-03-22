import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { UploadSection } from "./UploadSection";
export function Content() {
    return (
        <>
            {/* Đầu mục chung */}
            <div className="content">
                <div className="content__navbar">
                    <div className="content__navbar-container">
                        <ul className="content__navbar-menu">
                            <NavLink to="overview" className="content__navbar-item">
                                <li >
                                    <span>Tổng quan</span>
                                </li>
                            </NavLink>
                            <NavLink to="song" className="content__navbar-item">
                                <li >
                                    <span>Bài hát</span>
                                </li>
                            </NavLink>
                            <NavLink to="playlist" className="content__navbar-item">
                                <li>
                                    <span>Playlist</span>
                                </li>
                            </NavLink>
                            <NavLink to="album" className="content__navbar-item hide-on-mobile">
                                <li>
                                    <span>Album</span>
                                </li>
                            </NavLink>
                            <NavLink to="mv" className="content__navbar-item">
                                <li >
                                    <span>MV</span>
                                </li>
                            </NavLink>
                            <NavLink to="artist" className="content__navbar-item hide-on-mobile">
                                <li>
                                    <span>Nghệ sĩ</span>
                                </li>
                            </NavLink>
                            <NavLink to="upload" className="content__navbar-item hide-on-tablet-mobile">
                                <li>
                                    <span>Tải lên</span>
                                </li>
                            </NavLink>
                        </ul>
                    </div>
                </div>
                <div className="content__container">
                    <Outlet />

                </div>
            </div>
        </>
    )
}