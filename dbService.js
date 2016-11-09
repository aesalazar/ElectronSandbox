const socket = require('socket.io-client');
const messageIDRegex = /"id":(\d+),/i;

function newConnection(wsurl) {
	let serviceSubs = {};
	let onOpenSubs = {};
	let messageQueue = Object.create(null); // Avoid Object prototype overwrites
	let isWindowActive = !document.hidden;
	let ws;

	function open() {
		ws = new WebSocket(wsurl);

		// Message Parsing Timer, for throttling:
		let subTimer = setInterval(() => {
			// Go through each queued message:
			for (const messageID in messageQueue) {
				let message = messageQueue[messageID];

				// Parse message:
				try {
					message = JSON.parse(message);
				} catch(err) {
					return console.error("Failed to parse message:", err, message);
				}

				// Notify subscribers:
				for (let subscriberId in serviceSubs) {
					serviceSubs[subscriberId](message);
				}
			}
			// Clean object:
			messageQueue = Object.create(null);
		}, 100); //, windowfactory.isMobile ? 500 : 100); // Mobile is slower, so increase interval timer

		ws.onmessage = (event) => {
			let messageID = (messageIDRegex.exec(event.data) || [])[1];
			if (messageID == null) return; // Bad message, so return.

			messageQueue[messageID] = event.data; // Leave message in raw form, to reduce amount of JSON.parse.
		};
		ws.onopen = (event) => {
			for (let id in onOpenSubs) {
				onOpenSubs[id](event);
				//delete onOpenSubs[id];
			}
		};
		ws.onclose = (event) => {
			clearInterval(subTimer);
			const timerID = setInterval(() => {
				if (isWindowActive) {
					console.debug("Active");
					clearInterval(timerID);
					open();
				} else {
					console.debug("Inactive");
				}
			}, 1000);
		};
	}

	function subscribeToService(callback) {
		let id = new Date().getTime().toString();
		serviceSubs[id] = callback;
		return id;
	}

	function unsubscribeToService(id) {
		return delete serviceSubs[id];
	}

	function sendQuery (query) {
		if (isClosed()) return;
		let queryMssg = {
			id: 0,
			call: "getOrderView",
			args: [query.start, query.end, query.sortDirection, query.sortColName, query.filterObject]
		}
		ws.send(JSON.stringify(queryMssg));
	}

	//Sample message sent to server
	/*{
		id: 0,
		call: "getOrderView",
		args: [
			0,
			39,
			"DESC",
			"emsblotterTime",
			{
				emsAccount: {
					value: "a",
					op: "startsWith"
				},
				orderSide: {
					value: "b",
					op: "startsWith"
				}
			}
		]
	}*/

	function close() {
		ws.close();
		onOpenSubs = null;
		serviceSubs = null;
		document.removeEventListener("visibilitychange", _handleVisibility);
	}

	function isOpen() {
		return ws.readyState === ws.OPEN;
	}

	function isClosed() {
		return ws.readyState !== ws.OPEN;
	}

	function onOpened(callback) {
		if (isOpen()) {
			callback();
		} else {
			let id = new Date().getTime().toString();
			onOpenSubs[id] = callback;
			return id;
		}
	}

	function _handleVisibility() {
		isWindowActive = !document.hidden;
		if (!isWindowActive) ws.close();
	}

	open(); // Start connection

	return {
		subscribeToService: subscribeToService,
		onOpened: onOpened,
		sendQuery: sendQuery,
		close: close,
		isOpen: isOpen,
		isClosed: isClosed
	}
}

module.exports = {
	newConnection
}
