export function Radio() {
    return (
        <>
            <div className="row container__section mt-30">
                <div className="col l-12 m-12 c-12 mb-16">
                    <div className="container__header">
                        <a href="#" className="container__header-title">
                            <h3>Radio Nổi bật&nbsp;</h3>
                            <i className="bi bi-chevron-right container__header-icon" />
                        </a>
                        <h3 className="container__header-subtitle">Radio Nổi bật</h3>
                        <div className="container__header-actions hide-on-tablet-mobile">
                            <div className="container__move-btn move-btn--radio button--disabled">
                                <i className="bi bi-chevron-left container__move-btn-icon" />
                            </div>
                            <div className="container__move-btn move-btn--radio">
                                <i className="bi bi-chevron-right container__move-btn-icon" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col l-12 m-12 c-12">
                    <div className="row no-wrap radio--container"></div>
                </div>
            </div>
        </>)
}