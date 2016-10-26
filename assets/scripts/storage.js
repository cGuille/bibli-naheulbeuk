(function (globalScope) {
    "use strict";

    const TRANSACTION_TYPE_READONLY = 'readonly';
    const TRANSACTION_TYPE_READWRITE = 'readwrite';

    class DbDefinition {
        constructor(name, version) {
            this.name = name;
            this.version = version;
        }

        getName() {
            return this.name;
        }

        getVersion() {
            return this.version;
        }
    }

    class ObjectStoreDefinition {
        constructor(name, options, indexes) {
            this.name = name;
            this.options = options || {};
            this.indexes = indexes || [];
        }

        getName() {
            return this.name;
        }

        getOptions() {
            return this.options;
        }

        getIndexes() {
            return this.indexes;
        }
    }

    class IndexDefinition {
        constructor(name, options) {
            this.name = name;
            this.options = options || {};
        }

        getName() {
            return this.name;
        }

        getOptions() {
            return this.options;
        }
    }

    class Store {
        constructor(dbHandler, name) {
            this.dbHandler = dbHandler;
            this.name = name;
        }

        save(record) {
            const transaction = this.dbHandler.transaction([this.name], TRANSACTION_TYPE_READWRITE);
            const objectStore = transaction.objectStore(this.name);
            const addRequest = objectStore.put(record);

            return new Promise((resolve, reject) => {
                addRequest.onerror = function (event) {
                    reject(event.target.error);
                }
                addRequest.onsuccess = function (event) {
                    resolve(event.target.result);
                }
            });
        }

        fetch(recordKey) {
            const transaction = this.dbHandler.transaction([this.name], TRANSACTION_TYPE_READONLY);
            const objectStore = transaction.objectStore(this.name);
            const getRequest = objectStore.get(recordKey);

            return new Promise((resolve, reject) => {
                getRequest.onerror = function (event) {
                    reject(event.target.error);
                }
                getRequest.onsuccess = function (event) {
                    resolve(event.target.result);
                }
            });
        }
    }

    class Storage {
        constructor(dbDefinition, objectStoreDefinitions) {
            this.dbHandler = null;
            this.dbDefinition = dbDefinition;
            this.objectStoreDefinitions = objectStoreDefinitions;

            this.stores = {};
        }

        open() {
            return new Promise((resolve, reject) => {
                const openRequest = window.indexedDB.open(
                    this.dbDefinition.getName(),
                    this.dbDefinition.getVersion()
                );

                openRequest.onupgradeneeded = (event) => {
                    const dbHandler = event.target.result;

                    this.objectStoreDefinitions.forEach(objectStoreDefinition => {
                        if (dbHandler.objectStoreNames.contains(objectStoreDefinition.getName())) {
                            return;
                        }

                        const objectStore = dbHandler.createObjectStore(objectStoreDefinition.getName(), objectStoreDefinition.getOptions());
                        objectStoreDefinition.getIndexes().forEach(index => {
                            objectStore.createIndex(index.getName(), index.getName(), index.getOptions());
                        });
                    });
                }

                openRequest.onsuccess = (event) => {
                    this.dbHandler = event.target.result;
                    resolve();
                }

                openRequest.onerror = (event) => {
                    reject(event.target.result);
                }
            });
        }

        store(name) {
            if (!this.stores[name]) {
                this.stores[name] = new Store(this.dbHandler, name);
            }

            return this.stores[name];
        }
    }

    globalScope.Storage = Storage;
    globalScope.Storage.Db = DbDefinition;
    globalScope.Storage.ObjectStore = ObjectStoreDefinition;
    globalScope.Storage.Index = IndexDefinition;
}(window));
