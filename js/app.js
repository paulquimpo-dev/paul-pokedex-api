const imgContainer = document.getElementById('img-container');
const infoContainer = document.getElementById('info-container');
const searchButton = document.getElementById('searchButton');
const searchInputEl = document.getElementById('search-input');

const resetDisplay = () => {
    imgContainer.innerHTML = `<p>SELECT A POKEMON</p>`;
    infoContainer.innerHTML = `
        <p>No. ---</p>
        <h3>?????</h3>
        <p>Type: ---</p>
    `;
};

const getPokeapi = async (searchedPokemon) => {
    const POKEAPI = `https://pokeapi.co/api/v2/pokemon/${searchedPokemon}`;
    try {
        const response = await fetch(POKEAPI);
        if (!response.ok) throw new Error('Pokemon not found');

        const data = await response.json();
        const sprite = data.sprites.front_default;
        const name = data.name.toUpperCase();
        const id = String(data.id).padStart(3, '0');
        const types = data.types.map(t => t.type.name.toUpperCase()).join(', ');

        // Render visual data
        imgContainer.innerHTML = `<img src="${sprite}" alt="${name}">`;
        infoContainer.innerHTML = `
            <p>No. ${id}</p>
            <h3>${name}</h3>
            <p>Type: ${types}</p>
        `;

        // Play the official Pokémon cry audio if available in the API response
        if (data.cries && data.cries.latest) {
            const cryAudio = new Audio(data.cries.latest);
            cryAudio.volume = 0.4; // Soften volume slightly
            cryAudio.play().catch(err => console.log("Audio play blocked/failed: ", err));
        }

    } catch (error) {
        console.log(error);
        imgContainer.innerHTML = `<p>Pokemon not found!</p>`;
        infoContainer.innerHTML = `
            <p>No. 000</p>
            <h3>UNKNOWN</h3>
            <p>Type: ???</p>
        `;
    }
}

searchButton.addEventListener('click', () => {
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