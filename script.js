console.log("Lets write javascript");

let songs = [];
let currFolder = "";
let currentSong = new Audio();

// ===================== HELPERS =====================
function getSongName(src) {
    try {
        const url = new URL(src, location.origin);
        return decodeURIComponent(url.pathname.split("/").pop()).replace(/\.[^/.]+$/, "");
    } catch {
        return decodeURIComponent(src.split("/").pop()).replace(/\.[^/.]+$/, "");
    }
}

function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function normalize(src) {
    return decodeURIComponent(src.split('/').pop());
}

// ===================== SONG LOADER =====================
async function getSongs(folder) {
    currFolder = folder;
    const res = await fetch(`/${folder}/songs.json`);
    const list = await res.json();
    return list.map(song => `/${folder}/${encodeURIComponent(song)}`);
}

// ===================== PLAYLIST RENDER =====================
function renderPlaylist(songsList) {
    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    for (const song of songsList) {
        const name = getSongName(song);
        songUL.innerHTML += `
        <li data-src="${song}">
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div>${name}</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <i class="fa-regular fa-circle-play"></i>
            </div>
        </li>`;
    }

    // Attach click listeners
    songUL.querySelectorAll("li").forEach(li => {
        li.addEventListener("click", () => playMusic(li.dataset.src));
    });
}

// ===================== PLAYER =====================
function playMusic(track, pause = false) {
    currentSong.src = track;
    if (!pause) currentSong.play();
    document.querySelector(".songinfo").innerHTML = getSongName(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

// ===================== ALBUMS =====================
async function displayAlbums() {
    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    const res = await fetch("/songs/albums.json");
    const albums = await res.json();

    for (const folder of albums) {
        try {
            const infoRes = await fetch(`/songs/${folder}/info.json`);
            if (!infoRes.ok) throw new Error("info.json missing");

            const info = await infoRes.json();

            cardContainer.innerHTML += `
  <div class="card" data-folder="${folder}">
    <div class="play-overlay">
      <i class="fa-solid fa-play"></i>
    </div>
    <img src="/songs/${folder}/cover.png" alt="${info.title}">
    <h2>${info.title}</h2>
    <p>${info.description}</p>
  </div>`;


        } catch (err) {
            console.error(`Album skipped: ${folder}`, err);
        }
    }

    // Attach click listeners to all cards
    document.querySelectorAll(".card").forEach(card => {
        card.addEventListener("click", async () => {
            const folder = card.dataset.folder;
            songs = await getSongs(`songs/${folder}`);
            if (!songs || songs.length === 0) return;

            renderPlaylist(songs);
            playMusic(songs[0], true);
        });
    });
}

// ===================== HAMBURGER =====================
function attachHamburger() {
    const hamburger = document.querySelector(".hamburger");
    const closeBtn = document.querySelector(".close");
    const leftPanel = document.querySelector(".left");

    hamburger.addEventListener("click", () => {
        leftPanel.style.left = "0";
    });

    closeBtn.addEventListener("click", () => {
        leftPanel.style.left = "-115%";
    });
}

// ===================== MAIN =====================
async function main() {
    attachHamburger();

    songs = await getSongs("songs/Aujla-Era");
    renderPlaylist(songs);
    playMusic(songs[0], true);

    displayAlbums();

    const playBtn = document.getElementById("play");
    const previous = document.getElementById("previous");
    const next = document.getElementById("next");

    // Play/Pause
    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playBtn.classList.replace("fa-circle-play", "fa-pause");
        } else {
            currentSong.pause();
            playBtn.classList.replace("fa-pause", "fa-circle-play");
        }

    });

    // Time update
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML =
            `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`;
        document.querySelector(".circle").style.left =
            (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // Seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        const percent = e.offsetX / e.target.offsetWidth;
        currentSong.currentTime = currentSong.duration * percent;
    });

    // Next / Previous
    previous.addEventListener("click", () => {
        const current = normalize(currentSong.src);
        const index = songs.findIndex(s => normalize(s) === current);
        if (index > 0) playMusic(songs[index - 1]);
    });

    next.addEventListener("click", () => {
        const current = normalize(currentSong.src);
        const index = songs.findIndex(s => normalize(s) === current);
        if (index < songs.length - 1 && index !== -1) playMusic(songs[index + 1]);
    });

    // Volume
    document.querySelector(".range input").addEventListener("change", e => {
        currentSong.volume = e.target.value / 100;
    });

   const loopBtn = document.getElementById("loop");
let isLooping = false;

loopBtn.addEventListener("click", () => {
    isLooping = !isLooping;
    currentSong.loop = isLooping;

    if(isLooping){
        loopBtn.style.color = "#ff66cc"; 
        loopBtn.style.transform = "scale(1.2)";
    } else {
        loopBtn.style.color = "";
        loopBtn.style.transform = "";
    }
});

Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async item => {
            let folderName = item.currentTarget.dataset.folder;
            if (folderName) {
                songs = await getSongs(`songs/${folderName}`);
                renderPlaylist(songs);
                if (songs.length > 0) playMusic(songs[0], true);
            }
        });
    });

}

main();
