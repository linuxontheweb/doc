const apiData = {};
let lastProcessedSequenceId = -1;

self.onmessage = async ({ data }) => {
	const response = {};
	if (data.seq !== undefined) {/* « */
		response.seq = data.seq;
	}/* » */

	if (data.load) {/* « */
		if (apiData[data.load]) {/* « */
			return self.postMessage({ success: data.load, message: "Already loaded", seq: data.seq });
		}/* » */
		try {
			const opfs = await navigator.storage.getDirectory();
			const fileHandle = await opfs.getFileHandle(`/blobs/${data.load}`, { create: false });
			const file = await fileHandle.getFile();
			const text = await file.text();
			try {
				apiData[data.load] = JSON.parse(text);
				const keys = Object.keys(apiData[data.load]);
				self.postMessage({ success: data.load, keys, seq: data.seq });
			} 
			catch (e) {
				self.postMessage({ error: `Failed to parse JSON for API ${data.load}: ${e.message}`, seq: data.seq });
			}
		} catch (e) {
			self.postMessage({ error: `Failed to load file for API ${data.load}: ${e.message}`, seq: data.seq });
		}
	}/* » */
	else if (data.search) {/* « */
		if (!data.value) {
			return self.postMessage({ error: "Search string must contain at least one character", seq: data.seq });
		}
		const api = apiData[data.search];
		if (!api) {
			return self.postMessage({ error: `API ${data.search} not loaded`, seq: data.seq });
		}
		const keys = Object.keys(api);
		let regex;
		if (data.strictStart) {
			regex = new RegExp(`^${data.value}`, 'i');
		} else if (data.strictInternal) {
			regex = new RegExp(data.value, 'i');
		} else {
			regex = new RegExp(data.value.split('').join('.*'), 'i');
		}
		const results = keys.filter(key => regex.test(key));
		self.postMessage({ search: data.search, results, seq: data.seq });
	}/* » */
	else if (data.get) {/* « */
		const api = apiData[data.api];
		if (!api || !(data.key in api)) {
			return self.postMessage({ api: data.api, key: data.key, error: "Not found", seq: data.seq });
		}
		self.postMessage({ api: data.api, key: data.key, value: api[data.key], seq: data.seq });
	}/* » */
};
