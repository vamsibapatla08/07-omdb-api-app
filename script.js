const API_KEY = "b86c366c";
const API_URL = "https://www.omdbapi.com/";
const WATCHLIST_STORAGE_KEY = "movie-watchlist";

const searchForm = document.getElementById("search-form");
const movieSearchInput = document.getElementById("movie-search");
const movieResults = document.getElementById("movie-results");
const watchlistContainer = document.getElementById("watchlist");

let watchlist = [];

function isMovieInWatchlist(movieId) {
  return watchlist.some((movie) => movie.imdbID === movieId);
}

// Load saved watchlist from localStorage when the page opens.
function loadWatchlist() {
  const savedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY);

  if (savedWatchlist) {
    watchlist = JSON.parse(savedWatchlist);
  }
}

// Save the watchlist after every add or remove action.
function saveWatchlist() {
  localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(watchlist));
}

function getPosterUrl(movie) {
  return movie.Poster && movie.Poster !== "N/A"
    ? movie.Poster
    : "https://placehold.co/400x600/111827/e5e7eb?text=No+Poster";
}

function createMovieCard(movie, buttonText, buttonClass) {
  return `
		<article class="movie-card" data-id="${movie.imdbID}">
			<img
				class="movie-poster"
				src="${getPosterUrl(movie)}"
				alt="Poster for ${movie.Title}"
			/>
			<div class="movie-info">
				<h3 class="movie-title">${movie.Title}</h3>
				<p class="movie-year">${movie.Year}</p>
				<button class="btn ${buttonClass}" data-id="${movie.imdbID}">${buttonText}</button>
			</div>
		</article>
	`;
}

function renderWatchlist() {
  if (watchlist.length === 0) {
    watchlistContainer.innerHTML = "<p class=\"empty-state\">Your watchlist is empty. Search for movies to add!</p>";
    return;
  }

  const watchlistCards = watchlist
    .map((movie) => createMovieCard(movie, "Remove from Watchlist", "btn-remove"))
    .join("");

  watchlistContainer.innerHTML = watchlistCards;
}

function renderResults(movies) {
  if (!movies || movies.length === 0) {
    movieResults.innerHTML = "<p class=\"empty-state\">No movies found. Try another search.</p>";
    return;
  }

  const resultCards = movies
    .map((movie) => {
      const isAlreadySaved = isMovieInWatchlist(movie.imdbID);
      const buttonText = isAlreadySaved ? "In Watchlist" : "Add to Watchlist";
      const buttonClass = isAlreadySaved ? "btn-disabled" : "btn-add";

      return createMovieCard(movie, buttonText, buttonClass);
    })
    .join("");

  movieResults.innerHTML = resultCards;
}

async function fetchMovies(searchTerm) {
  const url = `${API_URL}?apikey=${API_KEY}&s=${encodeURIComponent(searchTerm)}`;

  movieResults.innerHTML = "<p class=\"empty-state\">Searching movies...</p>";

  const response = await fetch(url);

  if (!response.ok) {
    movieResults.innerHTML = "<p class=\"empty-state\">Unable to load movies right now.</p>";
    return;
  }

  const data = await response.json();

  if (data.Response === "False") {
    movieResults.innerHTML = `<p class=\"empty-state\">${data.Error}</p>`;
    return;
  }

  renderResults(data.Search);
}

function addMovieToWatchlist(movieId) {
  const movieCard = movieResults.querySelector(`.movie-card[data-id="${movieId}"]`);

  if (!movieCard) {
    return;
  }

  const title = movieCard.querySelector(".movie-title").textContent;
  const year = movieCard.querySelector(".movie-year").textContent;
  const poster = movieCard.querySelector(".movie-poster").src;

  if (isMovieInWatchlist(movieId)) {
    return;
  }

  const movieToSave = {
    imdbID: movieId,
    Title: title,
    Year: year,
    Poster: poster
  };

  watchlist.push(movieToSave);
  saveWatchlist();
  renderWatchlist();

  const button = movieCard.querySelector("button");
  button.textContent = "In Watchlist";
  button.classList.remove("btn-add");
  button.classList.add("btn-disabled");
}

function removeMovieFromWatchlist(movieId) {
  watchlist = watchlist.filter((movie) => movie.imdbID !== movieId);
  saveWatchlist();
  renderWatchlist();

  const buttonInResults = movieResults.querySelector(`button[data-id="${movieId}"]`);

  if (buttonInResults) {
    buttonInResults.textContent = "Add to Watchlist";
    buttonInResults.classList.remove("btn-disabled");
    buttonInResults.classList.add("btn-add");
  }
}

searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const searchTerm = movieSearchInput.value.trim();

  if (!searchTerm) {
    movieResults.innerHTML = "<p class=\"empty-state\">Type a movie name to start searching.</p>";
    return;
  }

  await fetchMovies(searchTerm);
});

movieResults.addEventListener("click", function (event) {
  if (!event.target.classList.contains("btn")) {
    return;
  }

  if (event.target.classList.contains("btn-disabled")) {
    return;
  }

  const movieId = event.target.dataset.id;
  addMovieToWatchlist(movieId);
});

watchlistContainer.addEventListener("click", function (event) {
  if (!event.target.classList.contains("btn-remove")) {
    return;
  }

  const movieId = event.target.dataset.id;
  removeMovieFromWatchlist(movieId);
});

loadWatchlist();
renderWatchlist();
