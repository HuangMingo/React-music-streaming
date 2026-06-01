import { Link } from "react-router-dom";
import { getArtistPath } from "../../utils/artistNavigation.js";
import "./ArtistNameLink.css";

export function ArtistNameLink({ artist, className = "is-ghost", children }) {
  return (
    <Link
      to={getArtistPath(artist)}
      className={`${className} artist-name-link`.trim()}
      onClick={(event) => event.stopPropagation()}
    >
      {children ?? (typeof artist === "string" ? artist : artist?.name)}
    </Link>
  );
}
