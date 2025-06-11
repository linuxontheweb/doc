const apiNames = ["HTML", "CSS", "Javascript", "DOM"];
const apiNameToNum = { HTML: 1, CSS: 2, Javascript: 3, DOM: 4 };

class DocBrowser {
	constructor() {/* « */
		this.worker = new Worker('worker.js');
		this.apiKeys = {};
		this.currentApi = null;
		this.currentKeys = [];
		this.currentIndex = -1;
		this.lastSearchString = '';
		this.sequenceId = 0;
		this.lastProcessedSequenceId = -1;
		this.loadApiSelect = document.getElementById('loadApiSelect');
		this.useApiSelect = document.getElementById('useApiSelect');
		this.searchBar = document.getElementById('searchBar');
		this.displayArea = document.getElementById('displayArea');

		this.populateDropdowns();
		this.setupEventListeners();
	}/* » */
	populateDropdowns() {/* « */
		apiNames.forEach(api => {
			const option1 = new Option(api, api);
			const option2 = new Option(api, api);
			this.loadApiSelect.add(option1);
			this.useApiSelect.add(option2);
		});
	}/* » */
	setupEventListeners() {/* « */
		document.getElementById('loadApiButton').onclick = () => this.loadApi();
		document.getElementById('useApiButton').onclick = () => this.useApi();
		this.searchBar.oninput = () => this.handleSearch();
		this.worker.onmessage = ({ data }) => this.handleWorkerMessage(data);
	}/* » */
	loadApi() {/* « */
		const api = this.loadApiSelect.value;
		const apiNum = apiNameToNum[api];
		if (this.apiKeys[apiNum]) {
			console.warn(`API ${api} already loaded`);
			return;
		}
		this.worker.postMessage({ load: apiNum, seq: this.sequenceId++ });
	}/* » */
	useApi() {/* « */
		const api = this.useApiSelect.value;
		const apiNum = apiNameToNum[api];
		if (!this.apiKeys[apiNum]) {
			console.warn(`API ${api} not loaded`);
			return;
		}
		this.currentApi = apiNum;
		this.currentKeys = this.apiKeys[apiNum];
		this.currentIndex = -1;
		this.searchBar.disabled = false;
		this.displayKeys();
	}/* » */
	handleSearch() {/* « */
		const value = this.searchBar.value;
		if (!this.currentApi) return;
		if (value && (value.length >= 4 || value.length < this.lastSearchString.length)) {
			if (!this.isSearchStringValid(value)) return;
			this.worker.postMessage({ search: this.currentApi, value, seq: this.sequenceId++ });
			this.lastSearchString = value;
		}
	}/* » */
	isSearchStringValid(newStr) {/* « */
		if (!this.lastSearchString || !this.currentKeys.length) return true;
		return !newStr.startsWith(this.lastSearchString);
	}/* » */
	handleWorkerMessage(data) {/* « */
		if (data.seq <= this.lastProcessedSequenceId) {
			console.warn(`Dropping stale message with sequence ID ${data.seq}`);
			return;
		}
		this.lastProcessedSequenceId = data.seq;

		if (data.error) {
			console.error(data.error);
			return;
		}
		if (data.success) {
			this.apiKeys[data.success] = data.keys || [];
			if (data.message !== "Already loaded") {
				this.displayKeys();
			}
		} else if (data.search) {
			this.currentKeys = data.results;
			this.currentIndex = -1;
			this.displayKeys();
		} else if (data.value) {
			this.displayArea.innerHTML = data.value;
			this.searchBar.disabled = true;
		}
	}/* » */
	displayKeys() {/* « */
		this.displayArea.innerHTML = this.currentKeys.map((key, i) =>
			`<div class="key-item${i === this.currentIndex ? ' selected' : ''}">${key}</div>`
		).join('');
	}/* » */
	selectKey(index) {/* « */
		if (index >= 0 && index < this.currentKeys.length) {
			this.currentIndex = index;
			this.displayKeys();
		}
	}/* » */
	getKey() {/* « */
		if (this.currentIndex >= 0) {
			this.worker.postMessage({
				get: true,
				api: this.currentApi,
				key: this.currentKeys[this.currentIndex],
				seq: this.sequenceId++
			});
		}
	}/* » */
	resetDisplay() {/* « */
		this.currentIndex = -1;
		this.displayKeys();
		this.searchBar.disabled = false;
		this.searchBar.select();
	}/* » */
}

const browser = new DocBrowser();
console.log(browser);
document.addEventListener('keydown', e => {//«
	if (e.key === 'ArrowUp') {
		browser.selectKey(browser.currentIndex - 1);
	} else if (e.key === 'ArrowDown') {
		browser.selectKey(browser.currentIndex + 1);
	} else if (e.key === 'Enter' && !e.altKey && !e.ctrlKey) {
		if (browser.searchBar === document.activeElement) {
			if (browser.searchBar.value) {
				browser.worker.postMessage({ search: browser.currentApi, value: browser.searchBar.value, seq: browser.sequenceId++ });
				browser.lastSearchString = browser.searchBar.value;
			}
		} else if (browser.currentIndex >= 0) {
			browser.getKey();
		}
	} else if (e.key === 'Enter' && e.altKey && !e.ctrlKey) {
		if (browser.searchBar.value) {
			browser.worker.postMessage({ search: browser.currentApi, value: browser.searchBar.value, strictInternal: true, seq: browser.sequenceId++ });
			browser.lastSearchString = browser.searchBar.value;
		}
	} else if (e.key === 'Enter' && e.ctrlKey && e.altKey) {
		if (browser.searchBar.value) {
			browser.worker.postMessage({ search: browser.currentApi, value: browser.searchBar.value, strictStart: true, seq: browser.sequenceId++ });
			browser.lastSearchString = browser.searchBar.value;
		}
	} else if (e.key === 'Escape') {
		browser.resetDisplay();
	}
});//»
