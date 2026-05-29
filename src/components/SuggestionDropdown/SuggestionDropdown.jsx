import './SuggestionDropdown.css';

export function SuggestionDropdown({
  suggestions = { songs: [], artists: [], playlists: [] },
  activeIndex = -1,
  onHoverIndex = () => {},
  onSelect = () => {},
}) {
  const { songs = [], artists = [], playlists = [] } = suggestions;

  if (!songs.length && !artists.length && !playlists.length) return null;

  const flatSuggestions = [
    ...songs.map((item) => ({ type: 'song', item })),
    ...artists.map((item) => ({ type: 'artist', item })),
    ...playlists.map((item) => ({ type: 'playlist', item })),
  ];

  const getSuggestionLabel = (type, item) => {
    if (type === 'song') return item.title || '';
    if (type === 'artist') return item.name || '';
    return item.name || item.playlist_name || '';
  };

  return (
    <div className="header__search-history" role="listbox">
      <ul className="header__search-list">
        {flatSuggestions.map(({ type, item }, index) => {
          const isActive = index === activeIndex;
          const label = getSuggestionLabel(type, item);

          return (
            <li
              key={`${type}-${item.id ?? index}`}
              className={`header__search-item ${isActive ? 'active' : ''}`}
              onMouseEnter={() => onHoverIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(type, item, index)}
              role="option"
              aria-selected={isActive}
            >
              <i className="bi bi-search header__item-icon" />
              <a
                href="#"
                className="header__item-link"
                onClick={(event) => {
                  event.preventDefault();
                  onSelect(type, item, index);
                }}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
