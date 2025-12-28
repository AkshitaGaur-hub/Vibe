console.log("Lets write javascript");
let songs;
let currFolder;
// Audio object to play songs
let currentSong = new Audio();

function getSongName(src) {
    try {
        const url = new URL(src);
        return decodeURIComponent(
            url.pathname.split("/").pop()
        ).replace(/\.[^/.]+$/, "");
    } catch {
        return decodeURIComponent(
            src.split("/").pop()
        ).replace(/\.[^/.]+$/, "");
    }
}

// Fetch all mp3 songs from server
async function getSongs(folder) {
    currFolder = folder;
    let res = await fetch(`http://127.0.0.1:3000/${folder}/`);
    let text = await res.text();

    // Temporary div to read folder HTML
    let div = document.createElement("div");
    div.innerHTML = text;

    let anchors = div.getElementsByTagName("a");
    let songs = [];
    const base = 'http://127.0.0.1:3000';

   
    // Store only mp3 files and normalize URLs to absolute http URLs
    for (let a of anchors) {
        // prefer raw href attribute (may contain backslashes)
        let href = a.getAttribute('href') || a.href;
        if (!href) continue;

        // normalize backslashes to forward slashes
        href = href.replace(/\\/g, '/').replace(/\\\\/g, '/');

        // if it's an absolute URL, parse pathname; otherwise keep as-is
        try {
            const u = new URL(href, base);
            if (u.pathname.endsWith('.mp3')) {
                // remove leading slash from pathname
                let path = u.pathname.replace(/^\//, '');
                songs.push(`${base}/${path}`);
            }
        } catch (err) {
            // fallback: simple check
            if (href.endsWith(".mp3")) {
    href = href.replace(/\\/g, "/"); // normalize Windows paths
    if (!href.startsWith("http")) {
        href = `http://127.0.0.1:3000/${href.replace(/^\/+/, "")}`;
    }
    songs.push(href);
}

        }
    }

    return songs;
}

// debug helper
function debugLog(...args){
    try{ console.log(...args); }catch(e){}
}

//conversion function of time
function secondsToMinutes(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = Math.floor(seconds % 60);

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
}

// Render songs to playlist
function renderPlaylist(songsList) {
    debugLog('renderPlaylist called, count=', songsList && songsList.length);
    const songUL = document.querySelector('.songlist ul');
    songUL.innerHTML = '';

    for (const song of songsList) {
        let name = '';
        try {
            const u = new URL(song);
            name = decodeURIComponent(u.pathname.split('/').pop());
        } catch (e) {
            name = decodeURIComponent(song.split('/').pop());
        }
        name = name.replace(/\.mp3$/i, '');

        songUL.innerHTML += `
        <li data-src="${song}">
            <i class="fa-solid fa-music"></i>
            <div class="info">
                <div>${name}</div>
                <div></div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <i class="fa-regular fa-circle-play"></i>
            </div>
        </li>`;
    }

    // attach click handlers
    songUL.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => playMusic(li.dataset.src));
    });
}



    
// Play selected song
const playMusic = (track, pause = false) => {
    // track is expected to be an absolute http URL (from getSongs)
    currentSong.src = track;
    if (!pause) {
        currentSong.play();
    }

    // Show song name in playbar
    try {
        const u = new URL(track);
document.querySelector(".songinfo").innerHTML = getSongName(track);

    } catch (err) {
        document.querySelector('.songinfo').innerHTML = decodeURIComponent(track.split('/').pop());
    }

    // Reset time when new song starts
    document.querySelector('.songtime').innerHTML = '00:00 / 00:00';

    
};

async function displayAlbums() {
    console.log("displaying albums")
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index]; 
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            let folder = e.href.split("/").slice(-2)[0]
            // Get the metadata of the folder
            let a = await fetch(`/songs/${folder}/info.json`)
            let response = await a.json(); 
            cardContainer.innerHTML = cardContainer.innerHTML + ` <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>

            <img src="/songs/${folder}/cover.png" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`
        }
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => { 
        e.addEventListener("click", async item => {
            console.log("Fetching Songs")
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)  
            playMusic(songs[0])

        })
    })
}

async function main() {

    // Get all songs from initial folder
    songs = await getSongs("songs/Aujla-Era");
    renderPlaylist(songs);
    if (songs.length > 0) {
        playMusic(songs[0], true);
    }

    //Display all the albums on the page
    displayAlbums()
  

    // Attach event listener to play/pause button
    let playButton = document.getElementById("play");

    playButton.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            playButton.classList.remove("fa-circle-play");
            playButton.classList.add("fa-pause");
            // document.querySelector(".songinfo").innerHTML = track
            // document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
        } else {
            currentSong.pause();
            playButton.classList.remove("fa-pause");
            playButton.classList.add("fa-circle-play");
        }
    });

    //listen for time update
    currentSong.addEventListener("timeupdate", () => {
        console.log(currentSong.currentTime, currentSong.duration)
        document.querySelector(".songtime").innerHTML = `${secondsToMinutes(currentSong.currentTime)} / ${secondsToMinutes(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //Add event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })

    //Add an event listner for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })

    //Add event listner for close
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-115%"
    })

    //Add an event listner for previous and next
    previous.addEventListener("click", () => {
        console.log("Previous clicked")
        console.log(currentSong)
        let index = songs.indexOf(currentSong.src);
        if (index === -1) {
            // try matching by pathname
            try {
                const u = new URL(currentSong.src);
                index = songs.findIndex(s => s.includes(u.pathname.split('/').pop()));
            } catch (e) { }
        }
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })
    next.addEventListener("click", () => {
        console.log(currentSong)
        console.log("next clicked")
        let index = songs.indexOf(currentSong.src);
        if (index === -1) {
            try {
                const u = new URL(currentSong.src);
                index = songs.findIndex(s => s.includes(u.pathname.split('/').pop()));
            } catch (e) { }
        }
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })
    //Add an event listeneron volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100
    })


    //Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let folderName = item.currentTarget.dataset.folder;
            if (folderName) {
                songs = await getSongs(`songs/${folderName}`);
                renderPlaylist(songs);
                if (songs.length > 0) {
                    playMusic(songs[0], true);
                }
            }
        })
     })
}

main();
 