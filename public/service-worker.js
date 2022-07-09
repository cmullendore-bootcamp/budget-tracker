importScripts("./js/idb.js");

const APP_PREFIX = 'budget-tracker-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;

const FILES_TO_CACHE = [
    "./index.html",
    "./css/styles.css",
    "./js/index.js",
    "./js/idb.js",
    "./icons/icon-72x72.png",
    "./icons/icon-96x96.png",
    "./icons/icon-128x128.png",
    "./icons/icon-144x144.png",
    "./icons/icon-152x152.png",
    "./icons/icon-192x192.png",
    "./icons/icon-384x384.png",
    "./icons/icon-512x512.png",
    "./fonts/fontawesome-webfont.ttf",
    "./fonts/fontawesome-webfont.woff",
    "./fonts/fontawesome-webfont.woff2"
];



self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log("Installing Cache");
            return cache.addAll(FILES_TO_CACHE);
        })
    )
})

self.addEventListener('activate', function (e) {
    e.waitUntil(
        caches.keys().then(function (keyList) {
            let cacheKeeplist = keyList.filter(function (key) {
                return key.indexOf(APP_PREFIX);
            });
            cacheKeeplist.push(CACHE_NAME);

            return Promise.all(
                keyList.map(function (key, i) {
                    if (cacheKeeplist.indexOf(key) === -1) {
                        console.log('deleting cache : ' + keyList[i]);
                        return caches.delete(keyList[i]);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Prevent the default, and handle the request ourselves.
    event.respondWith(async function () {
        // Try to get the response from a cache.
        const cachedResponse = await caches.match(event.request);
        // Return it if we found one.
        if (cachedResponse) return cachedResponse;
        // If we're online use the network.
        if (navigator.onLine) return fetch(event.request);

        // At this point we're neither cached nor online. 
        // Use indexeddb content

        if (event.request.method === "GET" && event.request.url.includes("/api/transaction")) {
            return getAllTransactions();
        }

        if (event.request.method === "POST" && event.request.url.includes("/api/transaction/bulk")) {
            const transactions = await event.request.json();

            for (i = 0; i < transactions.length; i++) {
                addPendingTransaction(transactions[i]);
            }

            const resp = new Response({ message: "Response cached" });
            resp.status = 200;
            return resp;

        }

        if (event.request.method === "POST" && event.request.url.includes("/api/transaction")) {
            const transaction = await event.request.json();

            addPendingTransaction(transaction);
            const resp = new Response({ message: "Response cached" });
            resp.status = 200;
            return resp;
        }

        console.log("Got to the unknown");
        // If we get this far we don't know what happened, return 500
        const resp = new Response({ message: "Cache failed" });
        resp.status = 404;
        return resp;
    }());
});