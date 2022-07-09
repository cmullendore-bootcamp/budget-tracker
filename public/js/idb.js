
let db;

const ensureDb = async () => {
    return new Promise((resolve, reject) => {

        const request = indexedDB.open('budget-tracker', 1);

        request.onsuccess = function () {
            db = request.result;
            resolve(db);
        }
        
        request.onupgradeneeded = function (event) {
        
            const db = event.target.result;
        
            db.createObjectStore('synced', { autoIncrement: true });
            db.createObjectStore('pending', { autoIncrement: true });
        };
        
        request.onerror = function (event) {
            reject(db);
        };

    });
}




const addPendingTransaction = async (trans) => {
    const db = await ensureDb();
    const transaction = db.transaction(["pending"], "readwrite");
    const transObStore = transaction.objectStore("pending");
    transObStore.add(trans);
    transaction.commit();
}

const addSyncedTransaction = async (trans) => {
    const db = await ensureDb();
    const transaction = db.transaction(["synced"], "readwrite");
    const transObStore = transaction.objectStore("synced");
    transObStore.add(trans);
    transaction.commit();
}

const getPendingTransactionCount = async () => {
    const db = await ensureDb();
    const transaction = db.transaction(["pending"], "readwrite");
    const transObStore = transaction.objectStore("pending");
    const countResult = transObStore.count();
    countResult.onsuccess = async event => {
        return await countResult.result;
    }
}

const setSyncedTransactions = async (syncedTrans) => {
    const db = await ensureDb();

    const synced = db.transaction(["synced"], "readwrite");
    const syncedStore = synced.objectStore("synced");
    syncedStore.clear();
    for (i = 0; i < syncedTrans.length; i++) {
        syncedStore.add(syncedTrans[i]);
    }
    synced.commit();
}

const clearPendingTransactions = async () => {
    const db = await ensureDb();
    const pending = db.transaction(["pending"], "readwrite");
    const pendingStore = pending.objectStore("pending");
    pendingStore.clear();
    pending.commit();
}

const getPendingTransactions = async () => {
    return new Promise(async (resolve, reject) => {
        const db = await ensureDb();

        const pending = db.transaction(["pending"], "readwrite");
        const pendingStore = pending.objectStore("pending");
        const getAllResponse = pendingStore.getAll();

        getAllResponse.onsuccess = async event => {
            resolve(getAllResponse.result);
        }
    })
}

const getAllTransactions = async () => {
    const db = await ensureDb();
    
    const all = [];

    const syncedPromise = new Promise((resolve, reject) => {
        const synced = db.transaction(["synced"], "readwrite");
        const syncedStore = synced.objectStore("synced");
        const allSynced = syncedStore.getAll();
        allSynced.onsuccess = event => {
            resolve(allSynced.result);
        }
    })

    const pendingPromise = new Promise((resolve, reject) => {
        const cached = db.transaction(["pending"], "readwrite");
        const cachedStore = cached.objectStore("pending");
        const allPending = cachedStore.getAll();
        allPending.onsuccess = event => {
            resolve(allPending.result);
        }
    });

    all.push(await syncedPromise);
    all.push(await pendingPromise);

    return all;
}