import { listThemes } from '../../public/data/listThemes.js'
import { useEffect, useRef } from 'react';

export function ThemeModal({ onClose, onApplyTheme, currentTheme }) {
    const appRef = useRef(null);
    useEffect(() => {
        function handleClickOutside(event) {
            if (appRef.current && !appRef.current.contains(event.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const data = listThemes;
    function handleApplyTheme(theme) {
        onApplyTheme(theme);
        onClose();
    }

    return (

        <>
            {/* Theme */}
            < div className="modal-theme grid">
                <div className="modal-container" ref={appRef}>
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
                                    <div className="row sm-gutter theme__list" key={`${item.name}-${index}`}>
                                        <div className="col l-12 m-12 c-12">
                                            <div className="theme__container-info">
                                                <h3 className="theme__info-name">{item.type}</h3>
                                            </div>

                                        </div>
                                        {item.themes.map(function (theme, index) {
                                            return (
                                                <div className="col l-2 m-4 c-6 mb-20" key={`${theme.name}-${index}`}>
                                                    <div className="theme__container-item">
                                                        <div className="theme__item-display row__item-display br-5">
                                                            <div className="theme__item-img row__item-img" style={{ "background": `url(${theme.image}) no-repeat center center / cover` }}></div>
                                                            <div className="overlay"></div>
                                                            <div className="theme__item-actions row__item-actions">
                                                                {
                                                                    currentTheme?.name !== theme.name &&
                                                                    (<button className="button theme__actions-btn btn--apply-theme button-primary" onClick={() => handleApplyTheme(theme)}>
                                                                        <span className="theme__btn-title">
                                                                            Áp dụng
                                                                        </span>
                                                                    </button>)
                                                                }

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
