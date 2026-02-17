let currentQuery = 'technology';
let currentPage = 1;
let isLoading = false;
let hasMore = true;

document.addEventListener('DOMContentLoaded', () => {
    // Initial Load
    fetchNews(true);
    
    // Setup Infinite Scroll Observer
    const sentinel = document.getElementById('sentinel');
    const observer = new IntersectionObserver((entries) => {
        if(entries[0].isIntersecting && !isLoading && hasMore) {
            currentPage++;
            fetchNews(false); // false = append, don't clear
        }
    }, { threshold: 0.1 });
    
    observer.observe(sentinel);

    // Date Filter Listener
    document.getElementById('dateFilter').addEventListener('change', () => {
        resetAndSearch();
    });
});

function handleSearch(e) {
    e.preventDefault();
    const input = document.getElementById('searchInput');
    if(input.value.trim()) {
        currentQuery = input.value.trim();
        // Remove active class from tags since we are using custom search
        document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
        resetAndSearch();
        input.blur(); // Hide keyboard on mobile
    }
}

function filterTag(tag, element) {
    document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('searchInput').value = ''; // Clear search text
    currentQuery = tag;
    resetAndSearch();
}

function resetAndSearch() {
    currentPage = 1;
    hasMore = true;
    document.getElementById('reel-container').innerHTML = ''; // Clear feed
    fetchNews(true);
}

async function fetchNews(isFirstLoad) {
    if(isLoading || !hasMore) return;
    
    isLoading = true;
    const container = document.getElementById('reel-container');
    const loader = document.getElementById('page-loader');
    const dateFilter = document.getElementById('dateFilter').value;
    
    if(!isFirstLoad) loader.classList.add('active');

    // Create Initial Loading Screen if first load
    if(isFirstLoad) {
        container.innerHTML = `
            <div class="loader-screen">
                <div class="spinner"></div>
                <p>Loading ${currentQuery}...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`/api/news?q=${currentQuery}&date=${dateFilter}&page=${currentPage}`);
        const data = await response.json();

        // Clear initial loader if it exists
        const initLoader = container.querySelector('.loader-screen');
        if(initLoader) initLoader.remove();

        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                const slide = createSlide(article);
                container.appendChild(slide);
            });
        } else {
            hasMore = false; // Stop trying to fetch
            if(isFirstLoad) {
                container.innerHTML = '<div class="loader-screen"><p>No results found.</p></div>';
            }
        }
    } catch (error) {
        console.error(error);
        if(isFirstLoad) container.innerHTML = '<div class="loader-screen"><p>Error loading feed.</p></div>';
    } finally {
        isLoading = false;
        loader.classList.remove('active');
    }
}

function createSlide(article) {
    // Background Logic
    let bgStyle = article.image ? `background-image: url('${article.image}')` : `background: linear-gradient(45deg, #1a237e, #000)`;

    // Content Cleaning
    let fullText = article.description || '';
    if(article.content) {
        const contentClean = article.content.split('[')[0];
        if (contentClean.length > fullText.length) fullText = contentClean; 
    }
    if(fullText.length > 300) fullText = fullText.substring(0, 300) + "...";

    const slide = document.createElement('div');
    slide.className = 'news-slide';
    slide.style = bgStyle;

    slide.innerHTML = `
        <div class="slide-content">
            <span class="source-badge">${article.source.name}</span>
            <h1 class="slide-title">${article.title}</h1>
            <p class="slide-body">${fullText}</p>
            <div class="slide-actions">
                <a href="${article.url}" target="_blank" class="read-more-btn">
                    Read Article 
                    <span class="material-symbols-outlined" style="font-size:16px;">open_in_new</span>
                </a>
            </div>
        </div>
    `;
    return slide;
}
