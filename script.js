console.log("Lets write javascript");

async function getSongs() {
    let res = await fetch("http://127.0.0.1:3000/songs/");
    let text = await res.text();

    let div = document.createElement("div");
    div.innerHTML = text;

    let anchors = div.getElementsByTagName("a");
    let songs = [];

    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            songs.push(a.href); // FULL URL ONLY
        }
    }
    return songs;

}


async function main() {
    let songs = await getSongs();
    console.log(songs);


    //show all the songs in playlist
    let songUL = document
        .querySelector(".songlist")
        .getElementsByTagName("ul")[0];

    songUL.innerHTML = "";

    for (let song of songs) {
        const name = decodeURIComponent(song)
            .split("/")
            .pop()
            .replace(".mp3", "");

        songUL.innerHTML += `
        <li>
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div>${name}</div>
                <div>Akshita</div>
            </div>
            <div class="playnow">
            <span>Play Now</span>
            <i class="fa-regular fa-circle-play"></i>
            </div>
        </li>`;
    }
}

main();
