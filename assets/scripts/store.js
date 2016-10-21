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
        constructor(dbDefinition, objectStoreDefinition) {
            this.dbHandler = null;
            this.dbDefinition = dbDefinition;
            this.objectStoreDefinition = objectStoreDefinition;
        }

        open() {
            return new Promise((resolve, reject) => {
                const openRequest = window.indexedDB.open(
                    this.dbDefinition.getName(),
                    this.dbDefinition.getVersion()
                );

                openRequest.onupgradeneeded = (event) => {
                    const dbHandler = event.target.result;

                    if (dbHandler.objectStoreNames.contains(this.objectStoreDefinition.getName())) {
                        return;
                    }

                    const objectStore = dbHandler.createObjectStore(this.objectStoreDefinition.getName(), this.objectStoreDefinition.getOptions());

                    this.objectStoreDefinition.getIndexes().forEach((index) => {
                        objectStore.createIndex(index.getName(), index.getName(), index.getOptions());
                    });
                }

                openRequest.onsuccess = (event) => {
                    this.dbHandler = event.target.result;
                    resolve();
                }

                openRequest.onerror = (event) => {
                    reject(event);
                }
            });
        }

        add(record) {
            const transaction = this.dbHandler.transaction([this.objectStoreDefinition.getName()], TRANSACTION_TYPE_READWRITE);
            const objectStore = transaction.objectStore(this.objectStoreDefinition.getName());
            const addRequest = objectStore.add(record);

            return new Promise((resolve, reject) => {
                addRequest.onerror = function (event) {
                    reject(event.target.error);
                }
                addRequest.onsuccess = function (event) {
                    resolve(event);
                }
            });
        }

        fetch(recordKey) {
            const transaction = this.dbHandler.transaction([this.objectStoreDefinition.getName()], TRANSACTION_TYPE_READONLY);
            const objectStore = transaction.objectStore(this.objectStoreDefinition.getName());
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

    globalScope.Store = Store;
    globalScope.Store.Db = DbDefinition;
    globalScope.Store.ObjectStore = ObjectStoreDefinition;
    globalScope.Store.Index = IndexDefinition;
}(window));
