var listArtist = [
    {
        id: 1,
        name: "Binz",
        followers: 265000,
        image: "./assets/img/artists/artist1.jpg"
    },
    {
        id: 2,
        name: "Phương Ly",
        followers: 77000,
        image: "./assets/img/artists/artist2.jpg"
    },
    {
        id: 3, 
        name: "AMEE",
        followers: 317000,
        image: "./assets/img/artists/artist3.jpg"
    },
    {
        id: 4,
        name: "MCK",
        followers: 52000,
        image: "./assets/img/artists/artist4.jpg"
    },
    {
        id: 5,
        name: "Sơn Tùng M-TP",
        followers: 2100000,
        image: "./assets/img/artists/artist5.jpg"
    },

    {
        id: 6,
        name: "Mr. Siro",
        followers: 735000,
        image: "./assets/img/artists/artist6.jpg"
    },
    {
        id: 7,
        name: "Han Sara",
        followers: 158000,
        image: "./assets/img/artists/artist7.jpg"
    },
    {
        id: 8,
        name: "Bích Phương",
        followers: 368000,
        image: "./assets/img/artists/artist8.jpg"
    },
    {
        id: 9,
        name: "Soobin",
        followers: 435000,
        image: "./assets/img/artists/artist9.jpg"
    },
    {
        id: 10,
        name: "Chi Dân",
        followers: 516000,
        image: "./assets/img/artists/artist10.jpg"
    },
];

export const ARTIST_STORAGE_KEY = 'ARTIST_STORAGE_KEY';

localStorage.setItem(ARTIST_STORAGE_KEY, JSON.stringify(listArtist));
