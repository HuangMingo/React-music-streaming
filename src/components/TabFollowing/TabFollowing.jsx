import { SingerSlide } from "../TabExplorer/SingerSlide";
import { FollowingNavbar } from "./FollowingNavbar";
import { StoryPosts } from "./StoryPosts";
export function TabFollowing() {
    return (
        <>
            <div className="app__container tab--following">
                <div className="app__container-content">
                    <div className="following__container">
                        <div className="grid">
                            {/* Following Navbar */}
                            <FollowingNavbar />
                            
                            {/* Singer slide */}
                            <SingerSlide />
                            
                            {/* <!-- Story posts --> */}
                            <StoryPosts />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
