export function AlbumSection() {
    return (
        <>
            <div class="container__section row mt-50">
                <div class="col l-12 m-12 c-12 mb-16">
                    <div class="container__header">
                        <a href="#" class="container__header-title">
                            <h3>Album&nbsp;</h3>
                            <i class="bi bi-chevron-right container__header-icon"></i>
                        </a>
                        <h3 class="container__header-subtitle">Album</h3>
                        <div class="container__header-actions hide-on-tablet-mobile">
                            <div class="container__move-btn move-btn--album button--disabled">
                                <i class="bi bi-chevron-left container__move-btn-icon"></i>
                            </div>
                            <div class="container__move-btn move-btn--album">
                                <i class="bi bi-chevron-right container__move-btn-icon"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col l-12 m-12 c-12">
                    <div class="row no-wrap album--container">
                    </div>
                </div>
            </div>
        </>
    )
}