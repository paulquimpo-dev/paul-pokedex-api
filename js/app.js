const imgContainer = document.getElementById('img-container');
const infoContainer = document.getElementById('info-container');
const searchButton = document.getElementById('searchButton');
const searchInputEl = document.getElementById('search-input');
const upperBlackScreen = document.querySelector('.upper-black-screen');
const miniScreenBoxes = document.querySelectorAll('.mini-screen-box');
const shinyToggle = document.getElementById('shinyToggle');
const evolutionSection = document.querySelector('.evolution-section');

let currentPokemonData = null;

const playAudioCue = (type) => {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'click') {
            osc.frequency.setValueAtTime(600, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'scan') {
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.15);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }
    } catch (e) {
        console.log("AudioContext blocked or unsupported", e);
    }
};

const getTypeClass = (typeName) => `type-${typeName.toLowerCase()}`;

const resetDisplay = () => {
    currentPokemonData = null;
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
    const POKEAPI = `https://pokeapi.co/api/v2/pokemon/${searchedPokemon}`;
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
        const evoDetails = await fetchEvolutionDetails(chainNames);

        let evoHtml = '';
        evoDetails.forEach((evo, index) => {
            evoHtml += `
                <div class="evo-item" data-name="${evo.name}" title="${evo.name}">
                    <img src="${evo.sprite}" alt="${evo.name}">
                    <span>${evo.name}</span>
                </div>
            `;
            if (index < evoDetails.length - 1) {
                evoHtml += `<span class="evo-arrow">▶</span>`;
            }
        });
        if (evolutionSection) {
            evolutionSection.innerHTML = evoHtml;
        }

        document.querySelectorAll('.evo-item').forEach(item => {
            item.addEventListener('click', () => {
                const pokeName = item.getAttribute('data-name');
                searchInputEl.value = pokeName;
                getPokeapi(pokeName.toLowerCase());
            });
        });

        renderPokemonDetails(data);

        if (data.cries && data.cries.latest) {
            const cryAudio = new Audio(data.cries.latest);
            cryAudio.volume = 0.4;
            cryAudio.play().catch(err => console.log("Audio play blocked/failed: ", err));
        }

    } catch (error) {
        console.log(error);
        currentPokemonData = null;
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
    const searchInput = searchInputEl.value.toLowerCase().trim();
    if (!searchInput) {
        resetDisplay();
        return;
    }
    getPokeapi(searchInput);
});

searchInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

shinyToggle.addEventListener('change', () => {
    playAudioCue('click');
    if (currentPokemonData) {
        renderPokemonDetails(currentPokemonData);
    }
});