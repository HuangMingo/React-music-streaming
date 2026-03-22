import { useState } from "react"
import { NavLink } from "react-router-dom";
import { Outlet } from "react-router-dom";
export function Content() {
    return (
        <>
        {/* Đầu mục chung */}
            <div className="content">
                <div className="content__navbar">
                    <div className="content__navbar-container">
                        <ul className="content__navbar-menu">
                            <NavLink to="overview" >
                                <li className="content__navbar-item">
                                    <span>Tổng quan</span>
                                </li>
                            </NavLink>
                            <NavLink to="song" >
                                <li className="content__navbar-item active">
                                    <span>Bài hát</span>
                                </li>
                            </NavLink>
                            <NavLink to="playlist" >
                                <li className="content__navbar-item">
                                    <span>Playlist</span>
                                </li>
                            </NavLink>
                            <NavLink to="album">
                                <li className="content__navbar-item hide-on-mobile">
                                    <span>Album</span>
                                </li>
                            </NavLink>
                            <NavLink to="mv" >
                                <li className="content__navbar-item">
                                    <span>MV</span>
                                </li>
                            </NavLink>
                            <NavLink to="artist" >
                                <li className="content__navbar-item hide-on-mobile">
                                    <span>Nghệ sĩ</span>
                                </li>
                            </NavLink>
                            <NavLink to="upload" >
                                <li className="content__navbar-item hide-on-tablet-mobile">
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