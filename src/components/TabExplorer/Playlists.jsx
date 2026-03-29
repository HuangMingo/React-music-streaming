import { useEffect, useState } from "react"
export function Playlists({playlists}) {
    useEffect(
        () => {
            // return (
            //     <>
            //         {
            //             playlists.map((playlist, playlistIndex) => {
            //                 <div className={`col l-2-4 m-3 c-4 ${playlistIndex === 1 && 'mb-30'}`}>
            //                     <div className="row__item  playlist--create item--playlist">
            //                         <div className="row__item-container flex--center item-create--properties">
            //                             <i className="bi bi-plus-lg album__create-icon"></i>
            //                             <span className="album__create-annotate text-center">Tạo playlist mới</span>
            //                         </div>
            //                     </div>
            //                 </div>
            //             })
            //         }
            //     </>

            // )
        }, []);
    return (
        <>
            <div className="row container__section normal-playlist--section mt-30"></div>
            <div className="row container__section normal-playlist--section mt-30"></div>
            <div className="row container__section normal-playlist--section mt-30"></div>
            <div className="row container__section special-playlist--section mt-30"></div>
        </>
    )
}