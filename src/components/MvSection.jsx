export function MvSection() {
    return (
        <>
            <div class="container__section row mt-50">
                <div class="col l-12 m-12 c-12 mb-16">
                    <div class="container__header">
                        <a href="#" class="container__header-title">
                            <h3>MV&nbsp;</h3>
                            <i class="bi bi-chevron-right container__header-icon"></i>
                        </a>
                        <h3 class="container__header-subtitle">MV</h3>
                        <div class="container__header-actions hide-on-tablet-mobile">
                            <div class="container__move-btn move-btn--mv button--disabled">
                                <i class="bi bi-chevron-left container__move-btn-icon"></i>
                            </div>
                            <div class="container__move-btn move-btn--mv">
                                <i class="bi bi-chevron-right container__move-btn-icon"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col l-12 m-12 c-12">
                    <div class="row no-wrap mv--container">
                    </div>
                </div>
            </div>
        </>
    )
}