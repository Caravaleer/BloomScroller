let currentTag = 'technology';

document.addEventListener('DOMContentLoaded', () => {
    fetchNews();
    
    document.getElementById('dateFilter').addEventListener('change', () => {
        fetchNews();
    });
});

function filterTag(tag, element) {
    document.querySelectorAll('.tag').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    currentTag = tag;
    fetchNews();
}

async function fetchNews() {
    const container = document.getElementById('reel-container');
    const dateFilter = document.getElementById('dateFilter').value;
    
    // Show loader only if we are clearing current view
    container.innerHTML = `
        <div class="loader-screen">
            <div class="spinner"></div>
            <p>Loading reels...</p>
        </div>
    `;

    try {
        const response = await fetch(`/api/news?q=${currentTag}&date=${dateFilter}`);
        const data = await response.json();

        container.innerHTML = ''; // Clear loader

        if (data.articles && data.articles.length > 0) {
            data.articles.forEach(article => {
                // Logic to make it "Bite Sized"
                // 1. Prefer image, if none use a gradient placeholder
                let bgStyle = '';
                if (article.image) {
                    bgStyle = `background-image: url('${article.image}')`;
                } else {
                    bgStyle = `background: linear-gradient(45deg, #1a237e, #000)`;
                }

                // 2. Construct the "Bite": Description + Content Snippet
                // We clean the '[...]' that GNews sometimes adds
                let fullText = article.description || '';
                if(article.content) {
                    // Remove " [1234 chars]" type text
                    const contentClean = article.content.split('[')[0];
                    if (contentClean.length > fullText.length) {
                        fullText = contentClean; 
                    }
                }
                
                // Truncate manually just in case it's huge
                if(fullText.length > 250) fullText = fullText.substring(0, 250) + "...";

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
                            <span class="date-stamp">${new Date(article.publishedAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                `;
                container.appendChild(slide);
            });
        } else {
            container.innerHTML = '<div class="loader-screen"><p>No news found.</p></div>';
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="loader-screen"><p>Error loading feed.</p></div>';
    }
}