export function Mv() {
    return (
        <>
            <div className="container__section row mt-50">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>MV&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon"></i>
                        </a>
                        <h3 className="container__header-subtitle">MV</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--mv button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon"></i>
                            </div>
                            <div className="container__move-btn move-btn--mv">
                                <i className="bi bi-chevron-right container__move-btn-icon"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap mv--container">
                    </div>
                </div>
            </div>
        </>
    )
}