export function createArtistSlug(artist) {
  const rawSlug = typeof artist === "string" ? artist : artist?.slug || artist?.name || "";

  return String(rawSlug)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getArtistPath(artist) {
  const slug = createArtistSlug(artist);
  return slug ? `/${slug}` : "/";
}
