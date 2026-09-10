const imgContainer = document.getElementById('img-container');
const infoContainer = document.getElementById('info-container');
const searchButton = document.getElementById('searchButton');
const searchInputEl = document.getElementById('search-input');
const upperBlackScreen = document.querySelector('.upper-black-screen');
const miniScreenBoxes = document.querySelectorAll('.mini-screen-box');
const shinyToggle = document.getElementById('shinyToggle');
const evolutionSection = document.querySelector('.evolution-section');

let currentPokemonData = null;
let currentEvolutionList = [];
let currentEvolutionIndex = 0;

// Background Audio & Playlist Setup (Wav format for rock-solid timestamp precision)
const bgMusic = new Audio('https://github.com/paulquimpo-dev/paul-pokedex-api/releases/download/audio/Chill.Relaxing.Pokemon.Music.Mix.wav');
bgMusic.loop = true;
bgMusic.volume = 0.2;

const trackSelect = document.getElementById('trackSelect');
const nowPlayingEl = document.getElementById('now-playing');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');

let isMusicPlaying = false;

const startBgMusic = () => {
    bgMusic.play().then(() => {
        isMusicPlaying = true;
        playPauseBtn.textContent = "PAUSE";
        window.removeEventListener('click', startBgMusic);
        window.removeEventListener('keydown', startBgMusic);
        window.removeEventListener('touchstart', startBgMusic);
    }).catch(err => {
        console.log("Audio autoplay prevented, waiting for interaction", err);
    });
};

window.addEventListener('click', startBgMusic, { once: true });
window.addEventListener('keydown', startBgMusic, { once: true });
window.addEventListener('touchstart', startBgMusic, { once: true });

// Function to change track by timestamp seconds
const playTrackAtIndex = (index) => {
    if (index < 0) index = trackSelect.options.length - 1;
    if (index >= trackSelect.options.length) index = 0;

    trackSelect.selectedIndex = index;
    const selectedOption = trackSelect.options[index];
    const targetTime = parseFloat(selectedOption.value);

    nowPlayingEl.textContent = `NOW PLAYING: ${selectedOption.text}`;

    bgMusic.pause();
    bgMusic.currentTime = targetTime;

    const attemptPlay = () => {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            playPauseBtn.textContent = "PAUSE";
        }).catch(err => {
            console.log("Playback error", err);
        });
    };

    if (bgMusic.readyState >= 1) {
        attemptPlay();
    } else {
        bgMusic.addEventListener('loadedmetadata', attemptPlay, { once: true });
    }
};

// Toggle Play / Pause
playPauseBtn.addEventListener('click', () => {
    if (isMusicPlaying) {
        bgMusic.pause();
        isMusicPlaying = false;
        playPauseBtn.textContent = "PLAY";
    } else {
        bgMusic.play().then(() => {
            isMusicPlaying = true;
            playPauseBtn.textContent = "PAUSE";
        }).catch(err => console.log("Play error", err));
    }
});

// Automatically sync dropdown and display as audio progresses through timestamps naturally
bgMusic.addEventListener('timeupdate', () => {
    const currentTime = bgMusic.currentTime;
    let activeIndex = 0;

    for (let i = 0; i < trackSelect.options.length; i++) {
        const trackTime = parseFloat(trackSelect.options[i].value);
        if (currentTime >= trackTime) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (trackSelect.selectedIndex !== activeIndex) {
        trackSelect.selectedIndex = activeIndex;
        nowPlayingEl.textContent = `NOW PLAYING: ${trackSelect.options[activeIndex].text}`;
    }
});

trackSelect.addEventListener('change', () => {
    playTrackAtIndex(trackSelect.selectedIndex);
});

prevTrackBtn.addEventListener('click', () => {
    playTrackAtIndex(trackSelect.selectedIndex - 1);
});

nextTrackBtn.addEventListener('click', () => {
    playTrackAtIndex(trackSelect.selectedIndex + 1);
});

// --- SINGLE GLOBAL AUDIO CONTEXT (Prevents browser audio blocking limits) ---
let sharedAudioCtx = null;
const getAudioContext = () => {
    if (!sharedAudioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        sharedAudioCtx = new AudioContextClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
        sharedAudioCtx.resume();
    }
    return sharedAudioCtx;
};

let lastBackspaceTime = 0;

// Retro Typing Sound Effect Generator (PC & Mobile Optimized)
const playTypingSound = (key) => {
    try {
        if (key === 'Backspace') {
            const nowTime = Date.now();
            if (nowTime - lastBackspaceTime < 100) return;
            lastBackspaceTime = nowTime;
        }

        const audioCtx = getAudioContext();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        if (key === 'Backspace') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(110, now + 0.04);
            gainNode.gain.setValueAtTime(0.04, now);
            osc.start(now);
            osc.stop(now + 0.04);
        } else if (key === ' ') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(320, now);
            gainNode.gain.setValueAtTime(0.04, now);
            osc.start(now);
            osc.stop(now + 0.03);
        } else {
            osc.type = 'sine';
            const pitchVariation = Math.random() * 60;
            osc.frequency.setValueAtTime(750 + pitchVariation, now);
            gainNode.gain.setValueAtTime(0.03, now);
            osc.start(now);
            osc.stop(now + 0.025);
        }
    } catch (e) {
        console.log("Typing audio error", e);
    }
};

const playAudioCue = (type) => {
    try {
        const audioCtx = getAudioContext();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'click') {
            osc.frequency.setValueAtTime(600, now);
            gainNode.gain.setValueAtTime(0.05, now);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'scan') {
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
            gainNode.gain.setValueAtTime(0.08, now);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'error') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
            gainNode.gain.setValueAtTime(0.06, now);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'fire') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(600, now + 0.1);
            gainNode.gain.setValueAtTime(0.06, now);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'water') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(700, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.15);
            gainNode.gain.setValueAtTime(0.06, now);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'grass') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.linearRampToValueAtTime(550, now + 0.1);
            gainNode.gain.setValueAtTime(0.05, now);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'electric') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(400, now + 0.05);
            gainNode.gain.setValueAtTime(0.05, now);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'psychic') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
            gainNode.gain.setValueAtTime(0.04, now);
            osc.start(now);
            osc.stop(now + 0.2);
        } else {
            osc.frequency.setValueAtTime(500, now);
            gainNode.gain.setValueAtTime(0.05, now);
            osc.start(now);
            osc.stop(now + 0.08);
        }
    } catch (e) {
        console.log("AudioContext blocked or unsupported", e);
    }
};

const getTypeClass = (typeName) => `type-${typeName.toLowerCase()}`;

const resetDisplay = () => {
    currentPokemonData = null;
    currentEvolutionList = [];
    currentEvolutionIndex = 0;
    imgContainer.innerHTML = `<p>SELECT A POKEMON</p>`;
    infoContainer.innerHTML = `
        <div class="info-header-row">
            <p>No. ---</p>
            <span style="min-width: 65px; text-align: right;"></span>
        </div>
        <h3>?????</h3>
        <p>Type: ---</p>
    `;
    if (evolutionSection) {
        evolutionSection.innerHTML = `<span style="font-size:0.45rem; color:#a0aec0; font-family:'Press Start 2P', monospace; padding:12px; text-align:center; width:100%;">NO EVOLUTION DATA</span>`;
    }
    upperBlackScreen.innerHTML = `<p>DATABASE READY...</p>`;
    if (miniScreenBoxes.length >= 2) {
        miniScreenBoxes[0].textContent = `HT: ---`;
        miniScreenBoxes[1].textContent = `WT: ---`;
    }
};

const parseEvolutionChain = (chain) => {
    let evoList = [];
    let current = chain;
    do {
        evoList.push(current.species.name);
        let next = current.evolves_to;
        current = next.length ? next[0] : null;
    } while (current);
    return evoList;
};

const fetchEvolutionDetails = async (chainNames) => {
    const evoData = [];
    for (const name of chainNames) {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`);
            const data = await res.json();
            evoData.push({
                name: name.toUpperCase(),
                sprite: data.sprites.front_default
            });
        } catch (e) {
            console.log("Error fetching evolution sprite", e);
        }
    }
    return evoData;
};

const renderEvolutionCarousel = () => {
    if (!evolutionSection || currentEvolutionList.length === 0) return;

    const currentEvo = currentEvolutionList[currentEvolutionIndex];
    const hasPrev = currentEvolutionIndex > 0;
    const hasNext = currentEvolutionIndex < currentEvolutionList.length - 1;

    evolutionSection.innerHTML = `
        <button class="evo-nav-btn" id="prevEvoBtn" ${!hasPrev ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>◀</button>
        <div class="evo-item single-evo-card" data-name="${currentEvo.name}" title="${currentEvo.name}">
            <img src="${currentEvo.sprite}" alt="${currentEvo.name}">
            <span>${currentEvo.name}</span>
        </div>
        <button class="evo-nav-btn" id="nextEvoBtn" ${!hasNext ? 'style="opacity: 0.3; pointer-events: none;"' : ''}>▶</button>
    `;

    const prevBtn = document.getElementById('prevEvoBtn');
    const nextBtn = document.getElementById('nextEvoBtn');
    const cardItem = evolutionSection.querySelector('.evo-item');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentEvolutionIndex > 0) {
                currentEvolutionIndex--;
                playAudioCue('click');
                renderEvolutionCarousel();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentEvolutionIndex < currentEvolutionList.length - 1) {
                currentEvolutionIndex++;
                playAudioCue('click');
                renderEvolutionCarousel();
            }
        });
    }

    if (cardItem) {
        cardItem.addEventListener('click', () => {
            playAudioCue('click');
            const pokeName = currentEvo.name.toLowerCase();
            searchInputEl.value = pokeName;
            getPokeapi(pokeName);
        });
    }
};

const renderPokemonDetails = (data) => {
    const isShiny = shinyToggle.checked;
    const sprite = isShiny ? data.sprites.front_shiny : data.sprites.front_default;
    const name = data.name.toUpperCase();
    const id = String(data.id).padStart(3, '0');

    const typesHtml = data.types
        .map(t => `<span class="type-badge ${getTypeClass(t.type.name)}">${t.type.name}</span>`)
        .join(' ');

    const heightM = (data.height / 10).toFixed(1);
    const weightKg = (data.weight / 10).toFixed(1);

    const statsMap = {};
    data.stats.forEach(s => {
        statsMap[s.stat.name] = s.base_stat;
    });

    imgContainer.innerHTML = `<img src="${sprite || data.sprites.front_default}" alt="${name}">`;
    infoContainer.innerHTML = `
        <div class="info-header-row">
            <span>No. ${id}</span>
            <span style="min-width: 65px; text-align: right; color: #ecc94b;">${isShiny ? '✨ SHINY' : ''}</span>
        </div>
        <h3>${name}</h3>
        <div>Type: ${typesHtml}</div>
        <div class="stats-container">
            <div class="stat-row"><span class="stat-name">HP</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${Math.min(statsMap.hp || 50, 100)}%;"></div></div></div>
            <div class="stat-row"><span class="stat-name">ATK</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${Math.min(statsMap.attack || 50, 100)}%;"></div></div></div>
            <div class="stat-row"><span class="stat-name">DEF</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${Math.min(statsMap.defense || 50, 100)}%;"></div></div></div>
            <div class="stat-row"><span class="stat-name">SPD</span><div class="stat-bar-bg"><div class="stat-bar-fill" style="width: ${Math.min(statsMap.speed || 50, 100)}%;"></div></div></div>
        </div>
    `;

    upperBlackScreen.innerHTML = `<p style="color: #34c759;">DATA VERIFIED</p>`;
    if (miniScreenBoxes.length >= 2) {
        miniScreenBoxes[0].textContent = `HT: ${heightM}m`;
        miniScreenBoxes[1].textContent = `WT: ${weightKg}kg`;
    }
};

const getPokeapi = async (searchedPokemon) => {
    console.log(`pokemon: ${searchedPokemon}`);

    const POKEAPI = `https://pokeapi.co/api/v2/pokemon/${searchedPokemon}`;
    console.log(`POKEAPI: ${POKEAPI}`);
    try {
        playAudioCue('scan');
        imgContainer.innerHTML = `<div class="pokeball-loader"></div>`;
        upperBlackScreen.innerHTML = `<p class="animate-pulse">SCANNING...</p>`;

        const response = await fetch(POKEAPI);
        if (!response.ok) throw new Error('Pokemon not found');

        const data = await response.json();
        currentPokemonData = data;

        const speciesRes = await fetch(data.species.url);
        const speciesData = await speciesRes.json();
        const evoChainRes = await fetch(speciesData.evolution_chain.url);
        const evoChainData = await evoChainRes.json();

        const chainNames = parseEvolutionChain(evoChainData.chain);
        currentEvolutionList = await fetchEvolutionDetails(chainNames);

        const foundIndex = currentEvolutionList.findIndex(e => e.name.toLowerCase() === data.name.toLowerCase());
        currentEvolutionIndex = foundIndex !== -1 ? foundIndex : 0;

        renderEvolutionCarousel();
        renderPokemonDetails(data);

        if (data.types && data.types.length > 0) {
            const primaryType = data.types[0].type.name;
            playAudioCue(primaryType);
        }

        if (data.cries && data.cries.latest) {
            const cryAudio = new Audio(data.cries.latest);
            cryAudio.volume = 0.4;
            cryAudio.play().catch(err => console.log("Audio play blocked/failed: ", err));
        }

    } catch (error) {
        playAudioCue('error');
        console.log(error);
        currentPokemonData = null;
        currentEvolutionList = [];
        currentEvolutionIndex = 0;
        imgContainer.innerHTML = `<p>Not Found!</p>`;
        infoContainer.innerHTML = `
            <div class="info-header-row">
                <p>No. 000</p>
                <span style="min-width: 65px; text-align: right;"></span>
            </div>
            <h3>UNKNOWN</h3>
            <p>Type: ???</p>
        `;
        if (evolutionSection) {
            evolutionSection.innerHTML = `<span style="font-size:0.45rem; color:#ff3b30; font-family:'Press Start 2P', monospace; padding:12px; text-align:center; width:100%;">NO DATA AVAILABLE</span>`;
        }
        upperBlackScreen.innerHTML = `<p style="color: #ff3b30;">ERROR: 404</p>`;
        if (miniScreenBoxes.length >= 2) {
            miniScreenBoxes[0].textContent = `HT: ---`;
            miniScreenBoxes[1].textContent = `WT: ---`;
        }
    }
};

searchButton.addEventListener('click', () => {
    playAudioCue('click');
    const searchInput = searchInputEl.value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replaceAll(".", "")
        .replaceAll(":", "")
        .replaceAll("'", "")
        .replaceAll("’", "");
    if (!searchInput) {
        resetDisplay();
        return;
    }
    getPokeapi(searchInput);
});

searchInputEl.addEventListener('keydown', (e) => {
    const ignoredKeys = ['Shift', 'Control', 'Alt', 'Meta', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'CapsLock', 'Escape'];
    if (ignoredKeys.includes(e.key)) return;

    if (e.key === 'Enter') {
        searchButton.click();
        return;
    }

    playTypingSound(e.key);
});

let previousInputLength = searchInputEl.value.length;
searchInputEl.addEventListener('input', (e) => {
    const currentLength = searchInputEl.value.length;
    if (currentLength < previousInputLength) {
        playTypingSound('Backspace');
    } else if (currentLength > previousInputLength) {
        const lastChar = searchInputEl.value.slice(-1);
        playTypingSound(lastChar === ' ' ? ' ' : 'char');
    }
    previousInputLength = currentLength;
});

shinyToggle.addEventListener('change', () => {
    playAudioCue('click');
    if (currentPokemonData) {
        renderPokemonDetails(currentPokemonData);
    }
});