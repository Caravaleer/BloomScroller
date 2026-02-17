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
        // Only trigger if: visible AND not currently loading AND has more pages
        if(entries[0].isIntersecting && !isLoading && hasMore) {
            console.log("Sentinel reached! Loading page " + (currentPage + 1));
            currentPage++;
            fetchNews(false);
        }
    }, { root: document.getElementById('reel-container'), threshold: 0.1 }); // explicit root helps
    
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
        document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
        resetAndSearch();
        input.blur(); 
    }
}

function filterTag(tag, element) {
    document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    document.getElementById('searchInput').value = ''; 
    currentQuery = tag;
    resetAndSearch();
}

function resetAndSearch() {
    currentPage = 1;
    hasMore = true;
    isLoading = false;
    
    const container = document.getElementById('reel-container');
    const sentinel = document.getElementById('sentinel');
    
    // Clear everything EXCEPT the sentinel
    // We remove all children that are NOT the sentinel
    Array.from(container.children).forEach(child => {
        if (child.id !== 'sentinel') {
            container.removeChild(child);
        }
    });

    fetchNews(true);
}

async function fetchNews(isFirstLoad) {
    if(isLoading || !hasMore) return;
    
    isLoading = true;
    const container = document.getElementById('reel-container');
    const sentinel = document.getElementById('sentinel'); // Get reference to insert before
    const loader = document.getElementById('page-loader');
    const dateFilter = document.getElementById('dateFilter').value;
    
    if(!isFirstLoad) loader.classList.add('active');

    // Show big loader if first load (inserted before sentinel)
    if(isFirstLoad) {
        const initLoader = document.createElement('div');
        initLoader.className = 'loader-screen';
        initLoader.innerHTML = `<div class="spinner"></div><p>Loading ${currentQuery}...</p>`;
        container.insertBefore(initLoader, sentinel);
    }

    try {
        console.log(`Fetching: ${currentQuery}, Page: ${currentPage}`);
        const response = await fetch(`/api/news?q=${currentQuery}&date=${dateFilter}&page=${currentPage}`);
        const data = await response.json();

        // Remove initial loader
        const existingLoader = container.querySelector('.loader-screen');
        if(existingLoader) existingLoader.remove();

        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                const slide = createSlide(article);
                // Insert BEFORE the sentinel so the sentinel stays at the bottom
                container.insertBefore(slide, sentinel);
            });
            
            // If we got fewer than 10 articles, we reached the end
            if(data.articles.length < 10) {
                hasMore = false;
                console.log("No more articles available.");
            }
            
        } else {
            hasMore = false;
            if(isFirstLoad) {
                const noMsg = document.createElement('div');
                noMsg.className = 'loader-screen';
                noMsg.innerHTML = '<p>No results found.</p>';
                container.insertBefore(noMsg, sentinel);
            }
        }
    } catch (error) {
        console.error(error);
    } finally {
        isLoading = false;
        loader.classList.remove('active');
    }
}

function createSlide(article) {
    let bgStyle = article.image ? `background-image: url('${article.image}')` : `background: linear-gradient(45deg, #1a237e, #000)`;

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