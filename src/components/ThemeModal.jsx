import { THEME_LIST_STORAGE_KEY } from '../../public/data/listThemes.js'
import { useState, useEffect } from 'react';
export function applyTheme(theme) {
    const app = document.querySelector(".app");
    const player = document.querySelector(".player");
    const closeModalBtn = document.querySelector('.modal__close-btn');
    document.documentElement.style.setProperty('--bg-content-color', theme.colors.bgContentColor)
    document.documentElement.style.setProperty('--border-box', theme.colors.borderBox)
    document.documentElement.style.setProperty('--border-primary', theme.colors.borderPrimary)
    document.documentElement.style.setProperty('--layout-bg', theme.colors.layoutBg)
    document.documentElement.style.setProperty('--link-text-hover', theme.colors.linkTextHover)
    document.documentElement.style.setProperty('--modal-scrollbar', theme.colors.modalScrollbar)
    document.documentElement.style.setProperty('--player-bg', theme.colors.playerBg)
    document.documentElement.style.setProperty('--purple-primary', theme.colors.purplePrimary)
    document.documentElement.style.setProperty('--primary-bg', theme.colors.primaryBg)
    document.documentElement.style.setProperty('--sidebar-popup-bg', theme.colors.sidebarPopupBg)
    document.documentElement.style.setProperty('--text-color', theme.colors.textColor)
    document.documentElement.style.setProperty('--text-item-hover', theme.colors.textItemHover)
    document.documentElement.style.setProperty('--text-secondary', theme.colors.textSecondary)
    document.documentElement.style.setProperty('--navigation-text', theme.colors.navigationText)
    document.documentElement.style.setProperty('--placeholder-text', theme.colors.placeholderText)

    app.style.backgroundImage = `url(${theme.backgroundImage})`;
    app.classList.add('has__theme-img');
    if (theme.playerImage) {
        player.style.background = `url(${theme.playerImage})`;
    }
    localStorage.setItem("theme", JSON.stringify(theme));
}
export function ThemeModal({ onClose }) {
    const data = JSON.parse(localStorage.getItem(THEME_LIST_STORAGE_KEY));
    return (

        <>
            {/* Theme */}
            < div className="modal-theme grid" >
                <div className="modal-container">
                    <div className="modal__close-btn" onClick={onClose}>
                        <i className="bi bi-x-lg close close__btn-icon" />
                    </div>
                    <div className="theme__header">
                        <h3 className="theme__header-title">Giao Diện</h3>
                    </div>
                    <div className="theme__content">
                        <div className="grid theme__container">
                            {data.map(function (item, index) {
                                return (
                                    <div className="row sm-gutter theme__list">
                                        <div className="col l-12 m-12 c-12">
                                            <div className="theme__container-info">
                                                <h3 className="theme__info-name">{item.type}</h3>
                                            </div>

                                        </div>
                                        {item.themes.map(function (theme, index) {
                                            return (
                                                <div className="col l-2 m-4 c-6 mb-20">
                                                    <div className="theme__container-item">
                                                        <div className="theme__item-display row__item-display br-5">
                                                            <div className="theme__item-img row__item-img" style={{ "background": `url(${theme.image}) no-repeat center center / cover` }}></div>
                                                            <div className="overlay"></div>
                                                            <div className="theme__item-actions row__item-actions">
                                                                <button className="button theme__actions-btn btn--apply-theme button-primary" onClick={() => applyTheme(theme)}>
                                                                    <span className="theme__btn-title">Áp dụng</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="theme__item-info">
                                                            <div className="theme__item-name">{theme.name}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div >
        </>
    )
}