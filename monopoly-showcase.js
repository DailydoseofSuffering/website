// Monopoly Showcase - Displays live properties with dynamic pricing
// console.log('monopoly-showcase.js loaded');

const STORAGE_KEY = 'mssw-state-v1';

// All properties data
const allProperties = [
	{ name: 'Mediterranean Avenue', color: '#5a2a00', base: 60 },
	{ name: 'Baltic Avenue', color: '#5a2a00', base: 60 },
	{ name: 'Oriental Avenue', color: '#5cbef5', base: 100 },
	{ name: 'Vermont Avenue', color: '#5cbef5', base: 100 },
	{ name: 'Connecticut Avenue', color: '#5cbef5', base: 120 },
	{ name: 'St. Charles Place', color: '#ff6fb3', base: 140 },
	{ name: 'States Avenue', color: '#ff6fb3', base: 140 },
	{ name: 'Virginia Avenue', color: '#ff6fb3', base: 160 },
	{ name: 'St. James Place', color: '#f59e0b', base: 180 },
	{ name: 'Tennessee Avenue', color: '#f59e0b', base: 180 },
	{ name: 'New York Avenue', color: '#f59e0b', base: 200 },
	{ name: 'Kentucky Avenue', color: '#ef4444', base: 220 },
	{ name: 'Indiana Avenue', color: '#ef4444', base: 220 },
	{ name: 'Illinois Avenue', color: '#ef4444', base: 240 },
	{ name: 'Atlantic Avenue', color: '#facc15', base: 260 },
	{ name: 'Ventnor Avenue', color: '#facc15', base: 260 },
	{ name: 'Marvin Gardens', color: '#facc15', base: 260 },
	{ name: 'Pacific Avenue', color: '#16a34a', base: 300 },
	{ name: 'North Carolina Avenue', color: '#16a34a', base: 300 },
	{ name: 'Pennsylvania Avenue', color: '#16a34a', base: 320 },
	{ name: 'Park Place', color: '#1f7aff', base: 350 },
	{ name: 'Boardwalk', color: '#1f7aff', base: 400 },
	{ name: 'Reading Railroad', color: '#6b7280', base: 200 },
	{ name: 'Pennsylvania Railroad', color: '#6b7280', base: 200 },
	{ name: 'B. & O. Railroad', color: '#6b7280', base: 200 },
	{ name: 'Short Line', color: '#6b7280', base: 200 },
	{ name: 'Electric Company', color: '#a855f7', base: 150 },
	{ name: 'Water Works', color: '#0ea5e9', base: 150 }
];

const exchanges = ['New York Stock Exchange', 'Frankfurt Stock Exchange', 'Shanghai Stock Exchange'];

// Get random properties
function getRandomProperties(count = 6) {
	const shuffled = [...allProperties].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count);
}

// Load Firebase config and initialize
let db = null;
let useLocalStorageOnly = false;

async function initializeFirebase() {
	try {
		// Import Firebase modules
		const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
		const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

		// Fetch and parse Firebase config
		const response = await fetch('monopoly/firebase-config.js');
		const configText = await response.text();
		
		// Parse the config
		const configMatch = configText.match(/export const firebaseConfig = ({[\s\S]*?});/);
		if (!configMatch) throw new Error('Could not parse firebase config');
		
		const configStr = configMatch[1]
			.replace(/\/\/.*$/gm, '')
			.replace(/,\s*}/g, '}');
		const firebaseConfig = JSON.parse(configStr);

		const app = initializeApp(firebaseConfig);
		db = getFirestore(app);
		//console.log('Firebase initialized successfully');
		return true;
	} catch (err) {
		//console.warn('Firebase initialization failed, using localStorage only:', err.message);
		useLocalStorageOnly = true;
		return false;
	}
}

// Load state from Firebase or localStorage
async function loadState() {
	try {
		if (!useLocalStorageOnly && db) {
			const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
			const docRef = doc(db, 'monopoly-state', 'global-state');
			const docSnap = await getDoc(docRef);
			
			if (docSnap.exists()) {
				const state = docSnap.data().state;
				//console.log('State loaded from Firebase');
				return state;
			}
		}
	} catch (err) {
		//console.warn('Failed to load from Firebase:', err.message);
	}
	
	// Fallback to localStorage
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) {
			//console.log('State loaded from localStorage');
			return JSON.parse(raw);
		}
	} catch (err) {
		//console.error('Failed to load state from localStorage', err);
	}
	
	return null;
}

// Render showcase
async function renderShowcase() {
	//console.log('renderShowcase called');
	const state = await loadState();
	const container = document.getElementById('properties-container');
	
	if (!container) {
		console.error('Container not found');
		return;
	}
	
	//console.log('State loaded:', state);
	const selectedProperties = getRandomProperties(6);
	//console.log('Selected properties:', selectedProperties.length);
	
	if (!state) {
		//console.log('No state found, using default prices');
		container.innerHTML = selectedProperties.map(prop => {
			const propertyData = allProperties.find(p => p.name === prop.name);
			if (!propertyData) return '';
			
			return `
				<div class="property-card">
					<div class="property-header">
						<div class="property-swatch" style="background-color: ${propertyData.color}"></div>
						<div>
							<div class="property-name">${prop.name}</div>
							<div class="property-exchange">Base: $${propertyData.base}</div>
						</div>
					</div>
					<div class="property-prices">
						${exchanges.map(ex => `
							<div class="price-item">
								<span class="price-label">${ex.split(' ')[0]}</span>
								<span class="price-value">$${Math.round(prop.base)}</span>
								<span class="price-change">→ 0%</span>
							</div>
						`).join('')}
					</div>
					<div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between;">
						<span>Avg: $${Math.round(prop.base)}</span>
						<span>Spread: $0</span>
					</div>
				</div>
			`;
		}).join('');
		return;
	}
	
	try {
		container.innerHTML = selectedProperties.map(prop => {
			const propertyData = allProperties.find(p => p.name === prop.name);
			if (!propertyData) return '';
			
			// Get prices from all exchanges
			const prices = exchanges.map(ex => ({
				exchange: ex,
				price: state[ex] && state[ex][prop.name] ? state[ex][prop.name].price : prop.base,
				lastChange: state[ex] && state[ex][prop.name] ? state[ex][prop.name].lastChange : 0
			}));
			
			const avgPrice = Math.round(prices.reduce((sum, p) => sum + p.price, 0) / prices.length);
			const minPrice = Math.min(...prices.map(p => p.price));
			const maxPrice = Math.max(...prices.map(p => p.price));
			const volatility = maxPrice - minPrice;
			
			return `
				<div class="property-card">
					<div class="property-header">
						<div class="property-swatch" style="background-color: ${propertyData.color}"></div>
						<div>
							<div class="property-name">${prop.name}</div>
							<div class="property-exchange">Base: $${propertyData.base}</div>
						</div>
					</div>
					<div class="property-prices">
						${prices.map(p => `
							<div class="price-item">
								<span class="price-label">${p.exchange.split(' ')[0]}</span>
								<span class="price-value">$${Math.round(p.price)}</span>
								<span class="price-change ${p.lastChange > 0 ? 'positive' : p.lastChange < 0 ? 'negative' : ''}">
									${p.lastChange > 0 ? '↑' : p.lastChange < 0 ? '↓' : '→'} ${Math.abs(Math.round(p.lastChange * 10) / 10)}%
								</span>
							</div>
						`).join('')}
					</div>
					<div style="margin-top: 0.75rem; font-size: 0.75rem; color: var(--muted); display: flex; justify-content: space-between;">
						<span>Avg: $${avgPrice}</span>
						<span>Spread: $${volatility}</span>
					</div>
				</div>
			`;
		}).join('');
		//console.log('Rendered', selectedProperties.length, 'properties');
	} catch (err) {
		console.error('Error rendering showcase:', err);
		container.textContent = `Error loading showcase: ${err.message}`;
	}
}

// Initialize showcase
async function init() {
	//console.log('Initializing Monopoly showcase...');
	try {
		await initializeFirebase();
		await renderShowcase();
		//console.log('Showcase initialized successfully');
		
		// Refresh showcase every 3 seconds to stay in sync with Firebase
		setInterval(async () => {
			//console.log('Refreshing showcase...');
			await renderShowcase();
		}, 3000);
		
		// Also listen for storage changes (from monopoly page)
		window.addEventListener('storage', async (e) => {
			if (e.key === STORAGE_KEY) {
				//console.log('Storage updated, refreshing showcase');
				await renderShowcase();
			}
		});
	} catch (err) {
		console.error('Failed to initialize showcase:', err);
	}
}

// Start when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
