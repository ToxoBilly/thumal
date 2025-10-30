// Global variables
        let dictionary = {};
        let reverseDictionary = {};
        let favorites = new Set();
        let recentSearches = [];
        let currentLanguage = 'english';
        let deferredPrompt;

        // Initialize the application
        async function initializeApp() {
            try {
                // Load dictionary
                const response = await fetch('dictionary.json');
                dictionary = await response.json();
                
                // Create reverse dictionary
                createReverseDictionary();
                
                // Load user data
                loadUserData();
                
                // Initialize word of the day
                initializeWordOfTheDay();
                
                // Update UI
                updateStats();
                updateSidebar();
                
                console.log(`Dictionary loaded with ${Object.keys(dictionary).length} words`);
                
            } catch (error) {
                console.error('Error loading dictionary:', error);
                showError('Error loading dictionary data.');
            }
        }

        // Create Mizo to English reverse dictionary
        function createReverseDictionary() {
            reverseDictionary = {};
            
            for (const [englishWord, mizoDefinition] of Object.entries(dictionary)) {
                const mizoWords = extractMizoWords(mizoDefinition);
                
                mizoWords.forEach(mizoWord => {
                    if (!reverseDictionary[mizoWord]) {
                        reverseDictionary[mizoWord] = [];
                    }
                    reverseDictionary[mizoWord].push({
                        english: englishWord,
                        fullDefinition: mizoDefinition
                    });
                });
            }
        }

        function extractMizoWords(definition) {
            const words = definition
                .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ')
                .split(/\s+/)
                .filter(word => 
                    word.length > 2 && 
                    !word.match(/^[0-9]/) && 
                    !word.match(/[A-Z]/) &&
                    word.match(/^[a-z\u1000-\u109F]+$/)
                );
            
            return [...new Set(words)];
        }

        // Word of the Day functionality
        function initializeWordOfTheDay() {
            const today = new Date().toDateString();
            let wotd = localStorage.getItem('currentWotd');
            let wotdDate = localStorage.getItem('wotdDate');
            
            if (!wotd || wotdDate !== today) {
                const words = Object.keys(dictionary);
                const randomWord = words[Math.floor(Math.random() * words.length)];
                wotd = randomWord;
                localStorage.setItem('currentWotd', wotd);
                localStorage.setItem('wotdDate', today);
                addToWotdHistory(randomWord);
            }
            
            updateWotdDisplay(wotd);
        }

        function addToWotdHistory(word) {
            let history = JSON.parse(localStorage.getItem('wotdHistory') || '[]');
            const today = new Date().toISOString().split('T')[0];
            
            history = history.filter(item => item.date !== today);
            history.unshift({
                date: today,
                word: word,
                definition: dictionary[word]
            });
            
            history = history.slice(0, 7);
            localStorage.setItem('wotdHistory', JSON.stringify(history));
        }

        function updateWotdDisplay(word) {
            const definition = dictionary[word] || '';
            document.getElementById('sidebarWotdWord').textContent = word;
            document.getElementById('sidebarWotdDef').textContent = truncateDefinition(definition, 80);
            
            // Update WOTD view if active
            if (document.getElementById('wotdView').classList.contains('active')) {
                displayWotdView(word, definition);
            }
        }

        function displayWotdView(word, definition) {
            const history = JSON.parse(localStorage.getItem('wotdHistory') || '[]');
            
            let html = `
                <div class="word-card">
                    <div class="word-header">
                        <div class="word-main">
                            <div class="word-text">${word}</div>
                        </div>
                        <div class="word-actions">
                            <button class="action-btn favorite ${favorites.has(word) ? 'active' : ''}" 
                                    onclick="toggleFavorite('${word}')">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    <div class="definition">${definition}</div>
                </div>
            `;

            if (history.length > 1) {
                html += `<div style="margin-top: 30px;">
                    <h3 style="color: var(--primary-dark); margin-bottom: 15px;">Recent Words of the Day</h3>
                    <div class="recent-words">`;
                
                history.slice(1).forEach(item => {
                    html += `
                        <div class="recent-word" onclick="searchWord('${item.word}')">
                            <strong>${item.word}</strong>
                            <div style="font-size: 12px; color: var(--text-light); margin-top: 2px;">
                                ${truncateDefinition(item.definition, 60)}
                            </div>
                        </div>
                    `;
                });
                
                html += `</div></div>`;
            }

            document.getElementById('wotdContent').innerHTML = html;
        }

        function truncateDefinition(definition, length) {
            return definition.length > length ? definition.substring(0, length) + '...' : definition;
        }

        // Favorites functionality
        function loadUserData() {
            const savedFavorites = localStorage.getItem('dictionaryFavorites');
            const savedRecent = localStorage.getItem('recentSearches');
            
            if (savedFavorites) favorites = new Set(JSON.parse(savedFavorites));
            if (savedRecent) recentSearches = JSON.parse(savedRecent);
        }

        function saveUserData() {
            localStorage.setItem('dictionaryFavorites', JSON.stringify([...favorites]));
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        }

        function toggleFavorite(word) {
            if (favorites.has(word)) {
                favorites.delete(word);
            } else {
                favorites.add(word);
                addToRecentSearches(word);
            }
            saveUserData();
            updateSidebar();
            updateFavoritesView();
        }

        function addToRecentSearches(word) {
            recentSearches = recentSearches.filter(w => w !== word);
            recentSearches.unshift(word);
            recentSearches = recentSearches.slice(0, 10);
            saveUserData();
            updateSidebar();
        }

        function updateSidebar() {
            // Update favorites in sidebar
            const sidebarFavorites = document.getElementById('sidebarFavorites');
            const favoriteWords = [...favorites].slice(0, 5);
            
            if (favoriteWords.length === 0) {
                sidebarFavorites.innerHTML = `
                    <div class="empty-state" style="padding: 20px 0;">
                        <i class="fas fa-star" style="font-size: 24px;"></i>
                        <p style="font-size: 12px;">No favorites yet</p>
                    </div>
                `;
            } else {
                sidebarFavorites.innerHTML = favoriteWords.map(word => `
                    <div class="favorite-item" onclick="searchWord('${word}')">
                        <strong>${word}</strong>
                        <div style="font-size: 12px; color: var(--text-light); margin-top: 2px;">
                            ${truncateDefinition(dictionary[word] || '', 50)}
                        </div>
                    </div>
                `).join('');
            }

            // Update recent searches
            const recentContainer = document.getElementById('recentSearches');
            if (recentSearches.length === 0) {
                recentContainer.innerHTML = `
                    <div class="empty-state" style="padding: 10px 0;">
                        <p style="font-size: 12px;">No recent searches</p>
                    </div>
                `;
            } else {
                recentContainer.innerHTML = recentSearches.map(word => `
                    <div class="recent-word" onclick="searchWord('${word}')">
                        ${word}
                    </div>
                `).join('');
            }
        }

        function updateFavoritesView() {
            const container = document.getElementById('favoritesList');
            const favoriteWords = [...favorites].filter(word => dictionary[word]);
            
            if (favoriteWords.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-star"></i>
                        <h3>No favorites yet</h3>
                        <p>Click the star icon on any word to add it to your favorites</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = favoriteWords.map(word => `
                <div class="word-card">
                    <div class="word-header">
                        <div class="word-main">
                            <div class="word-text">${word}</div>
                        </div>
                        <div class="word-actions">
                            <button class="action-btn favorite active" onclick="toggleFavorite('${word}')">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    <div class="definition">${dictionary[word]}</div>
                </div>
            `).join('');
        }

        // Search functionality
        function performSearch() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
            
            if (searchTerm === '') {
                showEmptyState();
                return;
            }

            addToRecentSearches(searchTerm);
            showLoadingState();

            setTimeout(() => {
                let results = [];
                
                if (currentLanguage === 'english') {
                    // English to Mizo search
                    const exactMatch = dictionary[searchTerm];
                    if (exactMatch) {
                        results.push({ word: searchTerm, definition: exactMatch, exact: true });
                    }

                    const partialMatches = Object.entries(dictionary)
                        .filter(([word, definition]) => 
                            word.startsWith(searchTerm) || word.includes(searchTerm)
                        )
                        .slice(0, 10)
                        .map(([word, definition]) => ({ 
                            word, 
                            definition,
                            exact: word === searchTerm
                        }));

                    results = [...results, ...partialMatches.filter(r => !r.exact)];
                } else {
                    // Mizo to English search
                    const exactMatch = reverseDictionary[searchTerm];
                    if (exactMatch) {
                        exactMatch.forEach(match => {
                            results.push({ 
                                word: match.english, 
                                definition: match.fullDefinition,
                                mizoWord: searchTerm,
                                exact: true 
                            });
                        });
                    }

                    const partialMatches = Object.entries(reverseDictionary)
                        .filter(([mizoWord, englishEntries]) => 
                            mizoWord.startsWith(searchTerm) || mizoWord.includes(searchTerm)
                        )
                        .slice(0, 8)
                        .flatMap(([mizoWord, englishEntries]) => 
                            englishEntries.map(entry => ({
                                word: entry.english,
                                definition: entry.fullDefinition,
                                mizoWord: mizoWord,
                                exact: mizoWord === searchTerm
                            }))
                        );

                    results = [...results, ...partialMatches.filter(r => !r.exact)];
                }

                displaySearchResults(results, searchTerm);
            }, 100);
        }

        function displaySearchResults(results, searchTerm) {
            const container = document.getElementById('dictionaryResults');
            const title = document.getElementById('resultsTitle');
            const subtitle = document.getElementById('resultsSubtitle');
            const searchStats = document.getElementById('searchStats');

            if (results.length === 0) {
                title.textContent = 'No results found';
                subtitle.textContent = `We couldn't find any matches for "${searchTerm}"`;
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>No matches found</h3>
                        <p>Try searching for a different word or check the spelling</p>
                    </div>
                `;
                searchStats.textContent = '';
                return;
            }

            const exactMatch = results.find(r => r.exact);
            const partialMatches = results.filter(r => !r.exact);

            title.textContent = exactMatch ? 'Definition' : 'Similar Words';
            subtitle.textContent = exactMatch ? 
                `Meaning of "${searchTerm}" in Mizo` : 
                `We found these similar words for "${searchTerm}"`;
            
            searchStats.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found`;

            let html = '';

            if (exactMatch) {
                html += createWordCard(exactMatch);
            }

            if (partialMatches.length > 0) {
                if (!exactMatch) {
                    html += `<div style="margin-bottom: 20px; color: var(--text-light);">
                        <i class="fas fa-lightbulb"></i> Did you mean one of these words?
                    </div>`;
                }
                
                partialMatches.forEach(result => {
                    html += createWordCard(result);
                });
            }

            container.innerHTML = html;
        }

        function createWordCard(result) {
            return `
                <div class="word-card">
                    <div class="word-header">
                        <div class="word-main">
                            <div class="word-text">${result.word}</div>
                            ${result.mizoWord ? `<div class="phonetic">${result.mizoWord}</div>` : ''}
                        </div>
                        <div class="word-actions">
                            <button class="action-btn favorite ${favorites.has(result.word) ? 'active' : ''}" 
                                    onclick="toggleFavorite('${result.word}')">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    <div class="definition">${result.definition}</div>
                </div>
            `;
        }

        function showLoadingState() {
            document.getElementById('dictionaryResults').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-spinner fa-spin"></i>
                    <h3>Searching...</h3>
                    <p>Looking up the word in our dictionary</p>
                </div>
            `;
        }

        function showEmptyState() {
            document.getElementById('resultsTitle').textContent = 'Dictionary Results';
            document.getElementById('resultsSubtitle').textContent = 'Type a word to begin your search';
            document.getElementById('dictionaryResults').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>Search the Dictionary</h3>
                    <p>Enter a word in the search bar above to find its Mizo definition</p>
                </div>
            `;
            document.getElementById('searchStats').textContent = '';
        }

        function showError(message) {
            document.getElementById('dictionaryResults').innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Something went wrong</h3>
                    <p>${message}</p>
                </div>
            `;
        }

        // Tab navigation
        function switchTab(tabName) {
            // Update tabs
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.tab === tabName);
            });
            
            // Update views
            document.querySelectorAll('.content-area').forEach(view => {
                view.classList.toggle('active', view.id === tabName + 'View');
            });
            
            // Load tab-specific content
            if (tabName === 'favorites') {
                updateFavoritesView();
            } else if (tabName === 'wotd') {
                const wotd = localStorage.getItem('currentWotd');
                displayWotdView(wotd, dictionary[wotd]);
            }
        }

        // Language toggle
        function toggleLanguage(lang) {
            currentLanguage = lang;
            document.querySelectorAll('.lang-option').forEach(option => {
                option.classList.toggle('active', option.dataset.lang === lang);
            });
            
            const searchInput = document.getElementById('searchInput');
            searchInput.placeholder = lang === 'english' ? 
                "Enter a word to look up..." : 
                "Enter a Mizo word to translate...";
            
            // Clear and perform new search if there's text
            if (searchInput.value.trim()) {
                performSearch();
            }
        }

        function searchWord(word) {
            document.getElementById('searchInput').value = word;
            performSearch();
            switchTab('dictionary');
        }

        function updateStats() {
            document.getElementById('wordCount').textContent = 
                `Mizo Dictionary • ${Object.keys(dictionary).length} words • ${Object.keys(reverseDictionary).length} Mizo terms`;
        }

        // PWA Installation
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installButton').style.display = 'flex';
        });

        async function installPWA() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    document.getElementById('installButton').style.display = 'none';
                }
                deferredPrompt = null;
            }
        }

        // Event listeners
        document.getElementById('searchInput').addEventListener('input', performSearch);
        document.getElementById('searchBtn').addEventListener('click', performSearch);
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        document.getElementById('installButton').addEventListener('click', installPWA);
        document.getElementById('sidebarWotd').addEventListener('click', () => switchTab('wotd'));

        // Tab click listeners
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => switchTab(tab.dataset.tab));
        });

        // Language toggle listeners
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', () => toggleLanguage(option.dataset.lang));
        });

        // Initialize the app
        window.addEventListener('load', initializeApp); 