console.log("Lets write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;
let currentIndex = 0;
let play;
let previous;
let next;

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
  currFolder = folder;

  let res = await fetch(`${folder}/songs.json`);
  songs = await res.json();

  let songUL = document.querySelector(".songList ul");
  songUL.innerHTML = "";

  for (const song of songs) {
    const songName = decodeURIComponent(song.split("/").pop());

    songUL.innerHTML += `
    <li data-track="${song}">
        <img class="invert" width="34" src="img/music.svg">
        <div class="info">
            <div>${songName}</div>
            <div>Unknown Artist</div>
        </div>
        <div class="playnow">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg">
        </div>
    </li>`;
  }

  Array.from(songUL.getElementsByTagName("li")).forEach((li) => {
    li.addEventListener("click", () => {
      playMusic(li.dataset.track);
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  currentIndex = songs.findIndex((s) => s === track);
  if (currentIndex === -1) currentIndex = 0;

  // Support both CDN URLs and local files
  currentSong.src = track.startsWith("http") ? track : `${currFolder}/` + track;

  if (!pause) {
    currentSong.play();
    play.src = "img/pause.svg";
  }

  document.querySelector(".songinfo").innerText = decodeURIComponent(
    track.split("/").pop(),
  );
};

async function displayAlbums() {
  let res = await fetch("songs/albums.json");
  let folders = await res.json();

  let cardContainer = document.querySelector(".cardContainer");
  cardContainer.innerHTML = "";

  for (const folder of folders) {
    let info = { title: folder, description: "NCS Music" };

    try {
      const infoRes = await fetch(`songs/${folder}/info.json`);
      if (infoRes.ok) {
        info = await infoRes.json();
      }
    } catch (err) {
      console.warn(`info.json missing for ${folder}`);
    }

    cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" fill="#000" />
                </svg>
            </div>
            <img src="songs/${folder}/cover.jpg">
            <h2>${info.title}</h2>
            <p>${info.description}</p>
        </div>`;
  }

  Array.from(document.getElementsByClassName("card")).forEach((card) => {
    card.addEventListener("click", async () => {
      songs = await getSongs(`songs/${card.dataset.folder}`);
      currentIndex = 0; // 🔥 reset index
      if (songs.length > 0) {
        playMusic(songs[0]);
      } else {
        alert("No songs in this album yet");
      }
    });
  });
}

async function main() {
  play = document.getElementById("play");
  previous = document.getElementById("previous");
  next = document.getElementById("next");

  if (!play || !previous || !next) {
    console.error("Control buttons not found");
    return;
  }

  // Get the list of all the songs
  await getSongs("songs/ncs");
  playMusic(songs[0], true);

  // Display all the albums on the page
  await displayAlbums();

  // Attach an event listener to play, next and previous
  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "img/play.svg";
    }
  });

  // Listen for timeupdate event
  currentSong.addEventListener("timeupdate", () => {
    if (!isNaN(currentSong.duration)) {
      document.querySelector(".songtime").innerHTML =
        `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;

      document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  // Add an event listener to seekbar
  document.querySelector(".seekbar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // Add an event listener for hamburger
  const hamburger = document.querySelector(".hamburger");
  if (hamburger) {
    hamburger.addEventListener("click", () => {
      document.querySelector(".left").style.left = "0";
    });
  }

  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.querySelector(".left").style.left = "-120%";
    });
  }

  // Add an event listener to previous
  previous.addEventListener("click", () => {
    if (currentIndex > 0) {
      playMusic(songs[currentIndex - 1]);
    }
  });

  // Add an event listener to next
  next.addEventListener("click", () => {
    if (currentIndex < songs.length - 1) {
      playMusic(songs[currentIndex + 1]);
    }
  });

  // Add an event to volume
  document
    .querySelector(".range")
    .getElementsByTagName("input")[0]
    .addEventListener("change", (e) => {
      console.log("Setting volume to", e.target.value, "/ 100");
      currentSong.volume = parseInt(e.target.value) / 100;
      if (currentSong.volume > 0) {
        document.querySelector(".volume>img").src = document
          .querySelector(".volume>img")
          .src.replace("mute.svg", "volume.svg");
      }
    });

  // Add event listener to mute the track
  document.querySelector(".volume>img").addEventListener("click", (e) => {
    if (e.target.src.includes("volume.svg")) {
      e.target.src = e.target.src.replace("volume.svg", "mute.svg");
      currentSong.volume = 0;
      document.querySelector(".range").getElementsByTagName("input")[0].value =
        0;
    } else {
      e.target.src = e.target.src.replace("mute.svg", "volume.svg");
      currentSong.volume = 0.1;
      document.querySelector(".range").getElementsByTagName("input")[0].value =
        10;
    }
  });
  currentSong.addEventListener("ended", () => {
    if (currentIndex < songs.length - 1) {
      currentIndex++;
      playMusic(songs[currentIndex]);
    } else {
      play.src = "img/play.svg";
    }
  });
}

main();
