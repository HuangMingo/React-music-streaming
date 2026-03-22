import { Content } from './Content';
import { User } from './User';

export function TabPersonal() {
    return (
        <>
            <div className="app__container tab--personal active">
                {/* User */}
                <User />

                {/* Content */}
                <Content />
            </div>
        </>
    )
}