console.log("Lets write javascript");

// Audio object to play songs
let currentSong = new Audio();

// Fetch all mp3 songs from server
async function getSongs() {
    let res = await fetch("http://127.0.0.1:3000/songs/");
    let text = await res.text();

    // Temporary div to read folder HTML
    let div = document.createElement("div");
    div.innerHTML = text;

    let anchors = div.getElementsByTagName("a");
    let songs = [];

    // Store only mp3 files
    for (let a of anchors) {
        if (a.href.endsWith(".mp3")) {
            songs.push(a.href);
        }
    }
    return songs;
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

// Play selected song
const playMusic = (track, pause=false) => {
    currentSong.src = track
    if(!pause){
        currentSong.play();
    }

    // Show song name in playbar
    document.querySelector(".songinfo").innerHTML =
        decodeURIComponent(track.split("/").pop());

    // Reset time when new song starts
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};


async function main() {

    // Get all songs
    let songs = await getSongs();
    playMusic(songs[0], true)

    // Select playlist UL
    let songUL = document
        .querySelector(".songlist")
        .getElementsByTagName("ul")[0];

    songUL.innerHTML = "";

    // Add songs to playlist
    for (let song of songs) {
        const name = decodeURIComponent(song)
            .split("\\")
            .pop()
            .replace(".mp3", "");
//songUL.innerHTML += `<li>${decodeURIComponent(song).split("\\").pop().replace(".mp3", "")}</li>`;
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

    // Add click event to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li"))
        .forEach(e => {
            e.addEventListener("click", () => {
                let songUrl = e.getAttribute("data-src");
                playMusic(songUrl);
            });
        });

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
        document.querySelector(".songtime").innerHTML = `${secondsToMinutes(currentSong.currentTime)}/${secondsToMinutes(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime/ currentSong.duration)*100 + "%";
    })

    //Add event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e=>{
        let percent = (e.offsetX/e.target.getBoundingClientRect().width)*100 
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration)*percent)/100;
    })

    //Add an event listner for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0"
    })

    //Add event listner for close
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "-115%"
    })
}

main();

