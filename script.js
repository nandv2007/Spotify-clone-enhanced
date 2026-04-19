const audio = document.getElementById("audioPlayer");
let audioCtx, analyser, source, dataArray;

// Setup Web Audio API for canvas visualizer
function setupAudioContext() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source = audioCtx.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioCtx.destination);
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        drawCanvas();
    } catch(e) { console.log("AudioContext not available"); }
}

function drawCanvas() {
    const canvas = document.getElementById("canvasViz");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth;
    canvas.height = 70;

    function draw() {
        requestAnimationFrame(draw);
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barW = (canvas.width / dataArray.length) * 2.5;
        let x = 0;
        const isLight = document.body.classList.contains('light-mode');
        for (let i = 0; i < dataArray.length; i++) {
            const barH = (dataArray[i] / 255) * canvas.height;
            const hue = isLight ? 140 + i * 0.3 : 120 + i * 0.5;
            ctx.fillStyle = `hsla(${hue},70%,50%,0.7)`;
            ctx.fillRect(x, canvas.height - barH, barW - 1, barH);
            x += barW;
        }
    }
    draw();
}

const songs = [
    { id:1, name:"Chem Trials Over the Country club", artist:"Lana Del Rey", src:"songs/song1.mp3", img:"https://i.pinimg.com/736x/0f/04/4b/0f044b266c8924e39c1bb20b8a18b469.jpg", category:"travel", mood:"chill" },
    { id:2, name:"Tere Hawale", artist:"Shreya Ghoshal", src:"songs/song2.mp3", img:"https://i.pinimg.com/736x/7b/b8/20/7bb8203089ba5de795d4a707d2a7d64f.jpg", category:"study", mood:"focus" },
    { id:3, name:"Gasolina", artist:"Daddy Yankee", src:"songs/song3.mp3", img:"https://i.pinimg.com/736x/61/76/4d/61764d01651001f660aa7330e3393293.jpg", category:"party", mood:"hype" },
    { id:4, name:"Paayum Theeye", artist:"Sanjith Hegde", src:"songs/song4.mp3", img:"https://i.pinimg.com/1200x/97/97/1e/97971eb344f82e4b60be6d2793ee1c19.jpg", category:"tamil", mood:"love" },
    { id:5, name:"Kanukkula", artist:"Jonita Gandhi", src:"songs/song5.mp3", img:"https://i.pinimg.com/1200x/68/e4/b0/68e4b0ac5ccc82236c6314cc59a35f14.jpg", category:"monsoon", mood:"sad" },
    { id:6, name:"Okey Oka Lokam", artist:"Sid Sriram", src:"songs/song6.mp3", img:"https://i.pinimg.com/1200x/8d/e1/65/8de165d1a96b30b4fd640679db44a2cb.jpg", category:"telugu", mood:"love" },
    { id:7, name:"Finding Her", artist:"Thanishka Bahl", src:"songs/song7.mp3", img:"https://i.pinimg.com/736x/17/a6/70/17a670674e2b03e40e05dca7d198e08e.jpg", category:"selfcare", mood:"chill" },
    { id:8, name:"Pudhu Mazha", artist:"Sakthi Shree", src:"songs/song8.mp3", img:"https://i.pinimg.com/1200x/db/4e/cc/db4ecc8bab754a72667ba3cf0c0f8faa.jpg", category:"onam", mood:"chill" },
    { id:9, name:"Naal Nachna", artist:"Shashwat Sachdev", src:"songs/song9.mp3", img:"https://i.pinimg.com/736x/c3/14/81/c31481ca1aa4c9bb3760e9414c30aa32.jpg", category:"bollywood", mood:"hype" },
];

const playlists = {
    melodyMix: { title:"Melody Mix", img:"https://i.pinimg.com/736x/87/48/e8/8748e811089d6c46448ec0b87d75ecc9.jpg", songs:[{name:"Neethane",artist:"AR Rahman"},{name:"Kaadhal En Kaviye",artist:"Sid Sriram"},{name:"Mental Manadhil",artist:"Jonita Gandhi"}] },
    vintageVibes: { title:"Vintage Vibes", img:"https://i.pinimg.com/736x/21/9d/8c/219d8cb4d95974f1d00608a734dbe0ee.jpg", songs:[{name:"90s ARR",artist:"A.R. Rahman"},{name:"Arjit Hits",artist:"Arijit Singh"},{name:"Unnodu vaazhadha",artist:"KS Chithra"}] },
    devotional: { title:"Devotional", img:"https://i.pinimg.com/736x/1d/cf/6f/1dcf6fb79a87bf3b42224861b97a5e5a.jpg", songs:[{name:"Mukundha Mukundha",artist:"Sadhana Sargam"},{name:"Nama Ramayana",artist:"Various Artists"},{name:"Shrihari Stotram",artist:"M.S. Subbulakshmi"}] },
    suggested: { title:"Suggested", img:"https://i.pinimg.com/736x/3a/c2/94/3ac294153133899bc51123b13ee322fc.jpg", songs:[{name:"Chuttamalle",artist:"Telugu Song"},{name:"Party Hits",artist:"DJ Mix"},{name:"Study Beats",artist:"Lo-Fi Collective"}] },
};

let currentSong = 0;
let isPlaying = false;
let isShuffled = false;
let isRepeat = false;
let isMuted = false;
let likedSongs = JSON.parse(localStorage.getItem("hq_liked")) || [];
let currentMood = "chill";
let chatHistory = [];
let queue = [...songs];
let songRatings = JSON.parse(localStorage.getItem("hq_ratings")) || {};
let userPlaylists = JSON.parse(localStorage.getItem("hq_userplaylists")) || [];
let selectedEmoji = "note";
let sleepTimer = null;
let sleepEndTime = null;
let songsPlayed = 0;
let minutesListened = parseFloat(localStorage.getItem("hq_minutes")) || 0;
let sessionSeconds = 0;

// ── STATS ──
function updateStats() {
    document.getElementById("statMinutes").innerText = Math.floor(minutesListened);
    document.getElementById("statSongs").innerText = songsPlayed;
    document.getElementById("statLiked").innerText = likedSongs.length;
    document.getElementById("statMinTrend").innerText = `▲ ${Math.floor(sessionSeconds/60)} min today`;
}

setInterval(() => {
    if (isPlaying) {
        sessionSeconds++;
        minutesListened += 1/60;
        localStorage.setItem("hq_minutes", minutesListened.toFixed(2));
        updateStats();
    }
}, 1000);

// ── GRIDS ──
function buildGrids() {
    const qg = document.getElementById("quickGrid");
    const pg = document.getElementById("playlistGrid");
    const categories = [
        { img:"https://i.pinimg.com/1200x/2c/bb/ea/2cbbea8930db13d1461a7d8ff0e9ebb6.jpg", label:"Travel" },
        { img:"https://i.pinimg.com/736x/7b/b8/20/7bb8203089ba5de795d4a707d2a7d64f.jpg", label:"Study" },
        { img:"https://i.pinimg.com/736x/61/76/4d/61764d01651001f660aa7330e3393293.jpg", label:"Party Hits" },
        { img:"https://i.pinimg.com/1200x/97/97/1e/97971eb344f82e4b60be6d2793ee1c19.jpg", label:"Tamil" },
        { img:"https://i.pinimg.com/1200x/68/e4/b0/68e4b0ac5ccc82236c6314cc59a35f14.jpg", label:"Monsoon Melodies" },
        { img:"https://i.pinimg.com/1200x/8d/e1/65/8de165d1a96b30b4fd640679db44a2cb.jpg", label:"Telugu Hits" },
    ];
    qg.innerHTML = categories.map((c,i) => `
        <div class="quick-card" onclick="playSong(${i})">
            <img src="${c.img}" alt="${c.label}">
            <span>${c.label}</span>
            <button class="quick-play" onclick="event.stopPropagation();playSong(${i})"><i class="fa-solid fa-play"></i></button>
        </div>
    `).join("");

    const allCards = [
        { img:"https://i.pinimg.com/1200x/2c/bb/ea/2cbbea8930db13d1461a7d8ff0e9ebb6.jpg", name:"Travel", sub:"9 songs" },
        { img:"https://i.pinimg.com/736x/7b/b8/20/7bb8203089ba5de795d4a707d2a7d64f.jpg", name:"Study", sub:"Lo-fi focus" },
        { img:"https://i.pinimg.com/736x/61/76/4d/61764d01651001f660aa7330e3393293.jpg", name:"Party Hits", sub:"High energy" },
        { img:"https://i.pinimg.com/1200x/97/97/1e/97971eb344f82e4b60be6d2793ee1c19.jpg", name:"Tamil", sub:"Trending songs" },
        { img:"https://i.pinimg.com/1200x/68/e4/b0/68e4b0ac5ccc82236c6314cc59a35f14.jpg", name:"Monsoon Melodies", sub:"Rainy day vibes" },
        { img:"https://i.pinimg.com/1200x/8d/e1/65/8de165d1a96b30b4fd640679db44a2cb.jpg", name:"Telugu Hits", sub:"Tollywood magic" },
        { img:"https://i.pinimg.com/1200x/02/a9/35/02a935f95132660db4b57cb51bbb05d0.jpg", name:"Selfcare", sub:"Feel good" },
        { img:"https://i.pinimg.com/1200x/db/4e/cc/db4ecc8bab754a72667ba3cf0c0f8faa.jpg", name:"Onam Vibes", sub:"Kerala festival" },
        { img:"https://i.pinimg.com/736x/c3/14/81/c31481ca1aa4c9bb3760e9414c30aa32.jpg", name:"Bollywood Beats", sub:"Desi hits" },
    ];
    pg.innerHTML = allCards.map((c,i) => `
        <div class="p-card" id="pcard${i}" onclick="playSong(${i})">
            <img src="${c.img}" alt="${c.name}">
            <h4>${c.name}</h4>
            <p>${c.sub}</p>
            <button class="p-card-play" onclick="event.stopPropagation();playSong(${i})"><i class="fa-solid fa-play"></i></button>
        </div>
    `).join("");
}
buildGrids();

// ── PLAYER ──
function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec/60), s = Math.floor(sec%60);
    return `${m}:${s<10?"0"+s:s}`;
}

function updateUI(song) {
    document.getElementById("playerSong").innerText   = song.name;
    document.getElementById("playerArtist").innerText = song.artist;
    document.getElementById("playerImg").src          = song.img;
    document.getElementById("npSong").innerText       = song.name;
    document.getElementById("npArtist").innerText     = song.artist;
    document.getElementById("npArt").src              = song.img;
    // Update page title
    document.title = `${song.name} – ${song.artist} | Spotify`;

    const liked = likedSongs.includes(song.id);
    document.getElementById("playerLike").style.color = liked ? "var(--accent)" : "";
    document.getElementById("npLike").style.color     = liked ? "var(--accent)" : "";

    document.querySelectorAll(".p-card").forEach((c,i) => c.classList.toggle("active",i===currentSong));
    updateLyrics(song);
    updateQueue();
    updateRatingStars(song.id);
}

function playSong(idx) {
    currentSong = idx;
    const song = songs[idx];
    audio.src = song.src;
    audio.play().then(() => {
        setupAudioContext();
        if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    }).catch(()=>{});
    isPlaying = true;
    songsPlayed++;
    document.getElementById("playBtn").innerHTML = '<i class="fa-solid fa-pause"></i>';
    document.getElementById("visualizer").classList.remove("paused");
    updateUI(song);
    updateAIInsight(song);
    updateStats();
}

document.getElementById("playBtn").onclick = () => {
    if (audio.paused) {
        audio.play().then(() => {
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
        }).catch(()=>{});
        isPlaying = true;
        document.getElementById("playBtn").innerHTML = '<i class="fa-solid fa-pause"></i>';
        document.getElementById("visualizer").classList.remove("paused");
    } else {
        audio.pause();
        isPlaying = false;
        document.getElementById("playBtn").innerHTML = '<i class="fa-solid fa-play"></i>';
        document.getElementById("visualizer").classList.add("paused");
    }
};

document.getElementById("nextBtn").onclick = () => {
    const next = isShuffled ? Math.floor(Math.random()*songs.length) : (currentSong+1)%songs.length;
    playSong(next);
};
document.getElementById("prevBtn").onclick = () => {
    if (audio.currentTime > 3) { audio.currentTime = 0; }
    else playSong((currentSong-1+songs.length)%songs.length);
};
audio.addEventListener("ended", () => {
    if (isRepeat) { audio.currentTime=0; audio.play(); }
    else document.getElementById("nextBtn").onclick();
});

audio.addEventListener("timeupdate", () => {
    const pct = (audio.currentTime / audio.duration)*100 || 0;
    document.getElementById("progressFill").style.width = pct+"%";
    document.getElementById("progressThumb").style.left = pct+"%";
    document.getElementById("currentTime").innerText = formatTime(audio.currentTime);
    document.getElementById("totalTime").innerText   = formatTime(audio.duration);
});

document.getElementById("progressBar").onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
};

// Draggable progress
let isDragging = false;
document.getElementById("progressBar").addEventListener("mousedown", () => isDragging = true);
document.addEventListener("mouseup", () => isDragging = false);
document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    const bar = document.getElementById("progressBar");
    const rect = bar.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audio.currentTime = pct * audio.duration;
});

document.getElementById("volumeBar").onclick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const v = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    audio.volume = v;
    document.getElementById("volumeFill").style.width = (v*100)+"%";
};

// ── MUTE ──
function toggleMute() {
    isMuted = !isMuted;
    audio.muted = isMuted;
    const btn = document.getElementById("muteBtn");
    btn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
    btn.style.color = isMuted ? "var(--accent3)" : "";
    showToast(isMuted ? "[mute] Muted" : "[vol] Unmuted");
}

// ── TOGGLES ──
function toggleShuffle() {
    isShuffled = !isShuffled;
    document.getElementById("shuffleBtn").style.color = isShuffled ? "var(--accent)" : "";
    showToast(isShuffled ? "Shuffle on" : "Shuffle off");
}
function toggleRepeat() {
    isRepeat = !isRepeat;
    document.getElementById("repeatBtn").style.color = isRepeat ? "var(--accent)" : "";
    showToast(isRepeat ? "Repeat on" : "Repeat off");
}
function toggleLike() {
    const song = songs[currentSong];
    if (likedSongs.includes(song.id)) {
        likedSongs = likedSongs.filter(id => id !== song.id);
        document.getElementById("playerLike").style.color = "";
        document.getElementById("npLike").style.color = "";
        showToast("Removed from liked songs");
    } else {
        likedSongs.push(song.id);
        document.getElementById("playerLike").style.color = "var(--accent)";
        document.getElementById("npLike").style.color = "var(--accent)";
        showToast("Added to liked songs", true);
    }
    localStorage.setItem("hq_liked", JSON.stringify(likedSongs));
    updateStats();
}

// ── MOOD ──
function setMood(el, mood) {
    document.querySelectorAll(".mood-chip").forEach(c => c.classList.remove("active"));
    el.classList.add("active");
    currentMood = mood;
    showToast(`Mood: ${mood}`, true);
    document.querySelectorAll(".p-card").forEach((c,i) => {
        const song = songs[i] || songs[0];
        const match = !song.mood || song.mood === mood || mood === "chill";
        c.style.opacity = match ? "1" : "0.35";
        c.style.transform = match ? "" : "scale(0.97)";
    });
}

// ── THEME TOGGLE ──
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const icon = document.querySelector("#themeToggle i");
    icon.className = document.body.classList.contains("light-mode") ? "fa-solid fa-sun" : "fa-solid fa-moon";
    showToast(document.body.classList.contains("light-mode") ? "[light] Light mode" : "[dark] Dark mode");
}

// ── SPEED CONTROL ──
function setSpeed(el, rate) {
    audio.playbackRate = rate;
    document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
    el.classList.add("active");
    showToast(`Playback speed: ${rate}×`);
}

// ── STAR RATING ──
function rateSong(rating) {
    const song = songs[currentSong];
    songRatings[song.id] = rating;
    localStorage.setItem("hq_ratings", JSON.stringify(songRatings));
    updateRatingStars(song.id);
    showToast(`Rated ${rating}/5`, true);
}
function updateRatingStars(songId) {
    const stars = document.querySelectorAll("#starRating .star");
    const rating = songRatings[songId] || 0;
    stars.forEach((s, i) => s.classList.toggle("filled", i < rating));
}

// ── QUEUE ──
function updateQueue() {
    const ql = document.getElementById("queueList");
    if (!ql) return;
    ql.innerHTML = songs.map((s, i) => `
        <div class="queue-item ${i === currentSong ? 'current' : ''}" onclick="playSong(${i})">
            <span class="queue-item-num">${i === currentSong ? '▶' : i+1}</span>
            <img src="${s.img}" alt="${s.name}">
            <div class="queue-item-info">
                <h4>${s.name}</h4>
                <p>${s.artist}</p>
            </div>
        </div>
    `).join("");
}
function addToQueue() {
    showToast("Added to queue", true);
}

// ── SHARE ──
function shareCurrentSong() {
    const song = songs[currentSong];
    if (navigator.clipboard) {
        navigator.clipboard.writeText(`♪ Listening to "${song.name}" by ${song.artist} on Spotify!`);
        showToast("Copied to clipboard!", true);
    } else {
        showToast(`♪ ${song.name} – ${song.artist}`);
    }
}

// ── SLEEP TIMER ──
function setSleepTimer(el, minutes) {
    clearInterval(sleepTimer);
    document.querySelectorAll(".sleep-btn").forEach(b => b.classList.remove("active"));
    if (minutes === 0) {
        document.getElementById("sleepDisplay").innerText = "Off";
        showToast("Sleep timer off");
        return;
    }
    el.classList.add("active");
    sleepEndTime = Date.now() + minutes * 60 * 1000;
    function tick() {
        const remaining = sleepEndTime - Date.now();
        if (remaining <= 0) {
            clearInterval(sleepTimer);
            audio.pause();
            isPlaying = false;
            document.getElementById("playBtn").innerHTML = '<i class="fa-solid fa-play"></i>';
            document.getElementById("visualizer").classList.add("paused");
            document.getElementById("sleepDisplay").innerText = "Off";
            document.querySelectorAll(".sleep-btn").forEach(b => b.classList.remove("active"));
            showToast("Sleep timer stopped");
            return;
        }
        const m = Math.floor(remaining/60000), s = Math.floor((remaining%60000)/1000);
        document.getElementById("sleepDisplay").innerText = `${m}:${s<10?"0"+s:s}`;
    }
    tick();
    sleepTimer = setInterval(tick, 1000);
    showToast(`Sleep timer: ${minutes} min`, true);
}

// ── EQ ──
const eqPresets = {
    flat:   [0, 0, 0, 0, 0],
    bass:   [8, 6, 2, 0, 0],
    treble: [0, 0, 2, 6, 8],
    vocal:  [-2, 4, 6, 4, -2],
    lofi:   [4, 2, -2, -4, -6],
};
function buildEQ() {
    const container = document.getElementById("eqSliders");
    const bands = ['60Hz','250Hz','1kHz','4kHz','16kHz'];
    container.innerHTML = bands.map((band, i) => `
        <div class="eq-band">
            <input type="range" min="-12" max="12" value="0" id="eq${i}"
                oninput="updateEQBand(${i}, this.value)">
        </div>
    `).join("");
}
buildEQ();
function updateEQBand(band, val) {
    showToast(`EQ band ${band+1}: ${val > 0 ? '+' : ''}${val}dB`);
}
function applyEQPreset(el, preset) {
    document.querySelectorAll(".eq-preset").forEach(p => p.classList.remove("active"));
    el.classList.add("active");
    const vals = eqPresets[preset];
    vals.forEach((v, i) => {
        const slider = document.getElementById(`eq${i}`);
        if (slider) slider.value = v;
    });
    showToast(`EQ: ${preset}`, true);
}


// ── AUTH (SPLASH) ──
function showSignUp() {
    document.getElementById('splashMain').style.display = 'none';
    document.getElementById('signInForm').classList.remove('active');
    document.getElementById('signUpForm').classList.add('active');
}
function showSignIn() {
    document.getElementById('splashMain').style.display = 'none';
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('signInForm').classList.add('active');
}
function showMain() {
    document.getElementById('signUpForm').classList.remove('active');
    document.getElementById('signInForm').classList.remove('active');
    document.getElementById('splashMain').style.display = 'flex';
}
function clearAuthErr(id) {
    document.getElementById(id).classList.remove('error');
    const err = document.getElementById(id + '-err');
    if (err) err.classList.remove('show');
}
function handleSignUp() {
    let valid = true;
    const email = document.getElementById('su-email');
    const name  = document.getElementById('su-name');
    const pass  = document.getElementById('su-pass');
    if (!email.value || !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
        email.classList.add('error');
        document.getElementById('su-email-err').classList.add('show');
        valid = false;
    }
    if (!name.value || name.value.trim().length < 2) {
        name.classList.add('error');
        document.getElementById('su-name-err').classList.add('show');
        valid = false;
    }
    if (!pass.value || pass.value.length < 8) {
        pass.classList.add('error');
        document.getElementById('su-pass-err').classList.add('show');
        valid = false;
    }
    if (!valid) return;
    showToast('Account created! Welcome to Spotify', true);
    launchApp();
}
function handleSignIn() {
    let valid = true;
    const email = document.getElementById('si-email');
    const pass  = document.getElementById('si-pass');
    if (!email.value || !/^[^@]+@[^@]+\.[^@]+$/.test(email.value)) {
        email.classList.add('error');
        document.getElementById('si-email-err').classList.add('show');
        valid = false;
    }
    if (!pass.value || pass.value.length < 8) {
        pass.classList.add('error');
        document.getElementById('si-pass-err').classList.add('show');
        valid = false;
    }
    if (!valid) return;
    showToast('Logged in successfully!', true);
    launchApp();
}

// ── SPLASH SCREEN ──
function launchApp() {
    const splash = document.getElementById("splashScreen");
    splash.classList.add("hide");
    setTimeout(() => splash.style.display = "none", 700);
}

// ── MOBILE TABS ──
function mobileTab(tab) {
    document.querySelectorAll(".mob-nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById("mn" + tab.charAt(0).toUpperCase() + tab.slice(1)).classList.add("active");
    const sheet = document.getElementById("mobileSheet");
    const content = document.getElementById("mobileSheetContent");

    if (tab === "ai") {
        content.innerHTML = document.getElementById("panel-chat").innerHTML;
        sheet.classList.add("open");
    } else if (tab === "player") {
        content.innerHTML = document.getElementById("panel-nowplaying").innerHTML;
        sheet.classList.add("open");
    } else if (tab === "library") {
        content.innerHTML = document.querySelector(".sidebar-scroll").innerHTML;
        sheet.classList.add("open");
    } else {
        sheet.classList.remove("open");
    }
}
document.getElementById("mobileSheet").addEventListener("click", e => {
    if (e.target === document.getElementById("mobileSheet")) {
        document.getElementById("mobileSheet").classList.remove("open");
    }
});

// ── CREATE PLAYLIST ──
function openCreatePlaylist() {
    resetForm();
    document.getElementById("createPlaylistModal").classList.add("active");
}

function resetForm() {
    ["plName", "plDesc"].forEach(id => {
        const el = document.getElementById(id);
        el.value = "";
        el.classList.remove("error", "valid");
        const errEl = document.getElementById(id + "-error");
        if (errEl) errEl.classList.remove("show");
    });
    document.getElementById("plNameCount").textContent = "0/40";
    document.getElementById("plDescCount").textContent = "0/120";
    document.getElementById("valSummary").classList.remove("show");
    selectedEmoji = "note";
    document.querySelectorAll(".emoji-opt").forEach((e, i) => {
        e.classList.toggle("selected", i === 0);
    });
}

// Live character counters
document.addEventListener("DOMContentLoaded", () => {
    const plName = document.getElementById("plName");
    const plDesc = document.getElementById("plDesc");
    if (plName) {
        plName.addEventListener("input", () => {
            const len = plName.value.length;
            const counter = document.getElementById("plNameCount");
            counter.textContent = `${len}/40`;
            counter.className = "char-count" + (len >= 36 ? " warn" : "") + (len >= 40 ? " over" : "");
        });
    }
    if (plDesc) {
        plDesc.addEventListener("input", () => {
            const len = plDesc.value.length;
            const counter = document.getElementById("plDescCount");
            counter.textContent = `${len}/120`;
            counter.className = "char-count" + (len >= 100 ? " warn" : "") + (len >= 120 ? " over" : "");
        });
    }
});

function validateField(id) {
    const el = document.getElementById(id);
    const errEl = document.getElementById(id + "-error");
    if (!el || !errEl) return true;
    const val = el.value.trim();
    let valid = true;
    let msg = "";

    if (id === "plName") {
        const nameRegex = /^[a-zA-Z0-9 \-_'!@#$%^&*().,?:;""''–—\u0B80-\u0BFF\u0900-\u097F\u0C00-\u0C7F\u0D00-\u0D7F\u0600-\u06FF]+$/;
        if (!val || val.length < 2) { valid = false; msg = "Playlist name must be at least 2 characters."; }
        else if (val.length > 40) { valid = false; msg = "Playlist name must be under 40 characters."; }
        else if (/<|>|script/i.test(val)) { valid = false; msg = "Name contains invalid characters."; }
    }
    if (id === "plDesc") {
        if (val.length > 120) { valid = false; msg = "Description must be under 120 characters."; }
    }

    if (!valid) {
        el.classList.add("error"); el.classList.remove("valid");
        errEl.textContent = msg; errEl.classList.add("show");
    } else {
        el.classList.remove("error");
        if (val) el.classList.add("valid");
        errEl.classList.remove("show");
    }
    return valid;
}

function selectEmoji(el, emoji) {
    document.querySelectorAll(".emoji-opt").forEach(e => e.classList.remove("selected"));
    el.classList.add("selected");
    selectedEmoji = emoji;
    document.getElementById("emoji-error")?.classList.remove("show");
}

function createPlaylist() {
    // Clear summary
    const summary = document.getElementById("valSummary");
    const valList = document.getElementById("valList");
    summary.classList.remove("show");
    valList.innerHTML = "";

    // Validate all fields
    const nameValid = validateField("plName");
    const descValid = validateField("plDesc");
    const emojiValid = !!selectedEmoji;

    const errors = [];
    if (!nameValid) errors.push("Playlist name is required and must be 2–40 valid characters.");
    if (!descValid) errors.push("Description must be under 120 characters.");
    if (!emojiValid) {
        errors.push("Please select an icon for your playlist.");
        document.getElementById("emoji-error")?.classList.add("show");
    }

    if (errors.length > 0) {
        valList.innerHTML = errors.map(e => `<li>${e}</li>`).join("");
        summary.classList.add("show");
        summary.scrollIntoView({ behavior: "smooth", block: "nearest" });
        return;
    }

    // All valid — submit with loading state
    const btn = document.getElementById("createBtn");
    btn.classList.add("submitting");
    btn.disabled = true;

    setTimeout(() => {
        const name = document.getElementById("plName").value.trim();
        const desc = document.getElementById("plDesc").value.trim();
        const pl = { name, desc, emoji: selectedEmoji, songs: [] };
        userPlaylists.push(pl);
        localStorage.setItem("hq_userplaylists", JSON.stringify(userPlaylists));
        renderUserPlaylists();
        closeModal("createPlaylistModal");
        btn.classList.remove("submitting");
        btn.disabled = false;
        resetForm();
        showToast(`Playlist created: ${name}`, true);
    }, 800);
}
const iconMap = {
    note: '<i class="fa-solid fa-music"></i>',
    guitar: '<i class="fa-solid fa-guitar"></i>',
    drum: '<i class="fa-solid fa-drum"></i>',
    piano: '<i class="fa-solid fa-music"></i>',
    mic: '<i class="fa-solid fa-microphone"></i>',
    headphones: '<i class="fa-solid fa-headphones"></i>',
    moon: '<i class="fa-solid fa-moon"></i>',
    bolt: '<i class="fa-solid fa-bolt"></i>'
};
function renderUserPlaylists() {
    const container = document.getElementById("createdPlaylists");
    container.innerHTML = userPlaylists.map((pl, i) => `
        <div class="lib-item">
            <div style="width:44px;height:44px;border-radius:6px;background:var(--surface3);display:flex;align-items:center;justify-content:justify-content;font-size:1rem;flex-shrink:0;align-items:center;justify-content:center">${iconMap[pl.emoji] || iconMap.note}</div>
            <div class="lib-item-info">
                <h4>${pl.name}</h4>
                <p>${pl.desc || 'Custom playlist'}</p>
            </div>
        </div>
    `).join("");
}
renderUserPlaylists();

// ── RIGHT TABS ──
function switchRightTab(tab) {
    document.querySelectorAll(".right-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".right-panel").forEach(p => p.classList.add("hidden"));
    document.getElementById("tab-"+tab).classList.add("active");
    document.getElementById("panel-"+tab).classList.remove("hidden");
    if (tab === 'queue') updateQueue();
}

// ── MODALS ──
function openPlaylist(key) {
    const pl = playlists[key];
    if (!pl) return;
    document.getElementById("modalImg").src   = pl.img;
    document.getElementById("modalTitle").innerText = pl.title;
    document.getElementById("modalSub").innerText   = "Playlist • Nandhini Venkatesan";
    document.getElementById("modalSongs").innerHTML = pl.songs.map((s,i) => `
        <div class="song-row">
            <span class="song-row-num">${i+1}</span>
            <div class="song-row-info"><strong>${s.name}</strong><span>${s.artist}</span></div>
            <button class="song-row-add" onclick="showToast('Added to queue', true)"><i class="fa-solid fa-plus"></i></button>
        </div>
    `).join("");
    document.getElementById("playlistModal").classList.add("active");
}
function closeModal(id) { document.getElementById(id).classList.remove("active"); }
document.querySelectorAll(".overlay").forEach(o => o.addEventListener("click", e => { if(e.target===o) o.classList.remove("active"); }));

function openDJ() { document.getElementById("djModal").classList.add("active"); }
function selectDJ(el) { document.querySelectorAll(".dj-option").forEach(o=>o.classList.remove("selected")); el.classList.add("selected"); }
function startDJ() {
    closeModal("djModal");
    showToast("AI DJ Session started!", true);
    document.getElementById("aiModePill").style.display = "flex";
}

// ── FOLDER ──
function toggleFolder() {
    const dd = document.getElementById("folderDropdown");
    const isOpen = dd.classList.toggle("open");
    document.getElementById("folderArrow").style.transform = isOpen ? "rotate(180deg)" : "";
}

// ── SEARCH ──
document.getElementById("searchInput").addEventListener("input", e => {
    const val = e.target.value.toLowerCase();
    document.querySelectorAll(".p-card").forEach((card,i) => {
        const song = songs[i] || {name:"",artist:""};
        card.style.display = !val || song.name.toLowerCase().includes(val) || song.artist.toLowerCase().includes(val) ? "" : "none";
    });
    document.querySelectorAll(".quick-card").forEach((card,i) => {
        const song = songs[i] || {name:""};
        card.style.display = !val || song.name.toLowerCase().includes(val) || song.artist.toLowerCase().includes(val) ? "" : "none";
    });
});

// ── KEYBOARD SHORTCUTS ──
document.addEventListener("keydown", e => {
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    if (e.code === "Space") { e.preventDefault(); document.getElementById("playBtn").click(); }
    if (e.code === "ArrowRight") document.getElementById("nextBtn").onclick();
    if (e.code === "ArrowLeft") document.getElementById("prevBtn").onclick();
    if (e.code === "ArrowUp") { audio.volume = Math.min(1, audio.volume+0.1); document.getElementById("volumeFill").style.width = (audio.volume*100)+"%"; showToast(`[vol] Volume: ${Math.round(audio.volume*100)}%`); }
    if (e.code === "ArrowDown") { audio.volume = Math.max(0, audio.volume-0.1); document.getElementById("volumeFill").style.width = (audio.volume*100)+"%"; showToast(`[vol] Volume: ${Math.round(audio.volume*100)}%`); }
    if (e.code === "KeyL") toggleLike();
    if (e.code === "KeyS") toggleShuffle();
    if (e.code === "KeyM") toggleMute();
});

// ── TOAST ──
function showToast(msg, green=false) {
    const t = document.getElementById("toast");
    t.innerText = msg;
    t.className = "toast show" + (green ? " green" : "");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.className = "toast", 2500);
}

// ── AI CHAT ──
async function sendChat() {
    const input = document.getElementById("chatInput");
    const msg = input.value.trim();
    if (!msg) return;
    input.value = "";
    appendChat("user", msg);
    document.getElementById("chatSugs").style.display = "none";

    const btn = document.getElementById("chatSendBtn");
    btn.classList.add("loading");
    btn.innerHTML = '<i class="fa-solid fa-circle-notch"></i>';

    const currentSongInfo = songs[currentSong];
    const systemPrompt = `You are Spotify AI, a witty and knowledgeable music concierge inside a music app. The user is currently listening to "${currentSongInfo.name}" by ${currentSongInfo.artist}. Their current mood is set to "${currentMood}". Their playlist library includes: Tamil, Telugu, Bollywood, Lo-fi, Party, Devotional, Monsoon, and Selfcare playlists. Be conversational, helpful, and music-passionate. Keep responses under 80 words. Use occasional music emojis. Recommend songs from the user's taste profile when relevant.`;

    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                system: systemPrompt,
                messages: [...chatHistory, { role: "user", content: msg }]
            })
        });
        const data = await response.json();
        const reply = data.content?.[0]?.text || "Sorry, I couldn't connect right now. Try again!";
        chatHistory.push({ role:"user", content:msg }, { role:"assistant", content:reply });
        appendChat("ai", reply);
    } catch(err) {
        appendChat("ai", "Oops! Lost the signal. Check your connection and try again ♪");
    }

    btn.classList.remove("loading");
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i>';
}

function appendChat(role, text) {
    const msgs = document.getElementById("chatMsgs");
    const div = document.createElement("div");
    div.className = "chat-bubble " + role;
    if (role === "ai") div.innerHTML = `<div class="chat-ai-name"><i class="fa-solid fa-robot" style="font-size:0.65rem"></i> Spotify AI</div>${text}`;
    else div.innerText = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
}

function sendSuggestion(el) {
    document.getElementById("chatInput").value = el.innerText;
    sendChat();
}

// ── AI INSIGHT ──
async function updateAIInsight(song) {
    const el = document.getElementById("aiInsight");
    el.innerHTML = `<span style="color:var(--accent)"><i class="fa-solid fa-circle-notch fa-spin"></i> Analyzing...</span>`;
    try {
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [{ role: "user", content: `Give a 2-sentence music insight about "${song.name}" by ${song.artist}. Include the vibe/mood and who might enjoy it. Be poetic and concise.` }]
            })
        });
        const data = await response.json();
        el.innerText = data.content?.[0]?.text || "A beautiful piece worth exploring.";
    } catch(e) {
        el.innerText = "Connect to AI to get insights about this track.";
    }
}

// ── LYRICS ──
const lyricsMap = {
    0: "♪ Long ago, in a different life\nOn the dark side of the moon\nYou and I were inseparable…\n\n♪ Even on the darkest days\nI would find a way to cope\nLooking for someone to rescue me…",
    1: "♪ Tere hawale mere dil ko kiya\nTere hawale mere dil ko kiya…",
    2: "♪ Llamen a la policia\nGasolina, gasolina…",
    3: "♪ Paayum theeye, paayum theeye\nEn nenjil thaangum uyire…",
    4: "♪ Kanukkula kanukkula\nChilaka chilipi cheliya…",
    5: "♪ Okey oka lokam nuvve\nNee oka manasaina nenu…",
    6: "♪ Finding her in the little things\nIn the songs she used to sing…",
    7: "♪ Pudhu mazha peyume\nEn maname malarume…",
    8: "♪ Naal nachna yaad aaya mujhe\nYaad aaya, yaad aaya…"
};
function updateLyrics(song) {
    const idx = songs.findIndex(s=>s.id===song.id);
    document.getElementById("lyricsContent").innerHTML = (lyricsMap[idx] || "Lyrics not available for this track.\n\nRequest AI-powered lyrics sync by connecting your account.") + '\n\n<em style="color:var(--muted);font-size:0.75rem">AI-assisted lyrics — may not be 100% accurate</em>';
}

// init
updateUI(songs[0]);
updateStats();
updateQueue();