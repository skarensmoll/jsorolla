/**
 * Created with IntelliJ IDEA.
 * User: imedina
 * Date: 10/8/13
 * Time: 12:42 AM
 *
 * This class stores the events (add put get delete...) in an event queue,
 * so that they are done after creating/opening the database.
 *
 * Each event has to enqueue itself, and when it is done, dequeue itself and call the next event.
 *
 * structure of methods:

method = function () {
    var _this = this;
    var myEvent = {
        func: function () {
            // stuff
            // on complete
            _this._dequeue();
        }
    };
    this._enqueue(myEvent);
 }

 */

var iDBInstances = [];
var iDBVersion = 1;
var putTime = 0;
var getTime= 0;
function IndexedDBStore(args) {

    // Using Underscore 'extend' function to extend and add Backbone Events
    _.extend(this, Backbone.Events);

    this.chunkSize = 50000;
    this.lru = [];

    // Now we set the args parameters
    // must be the last instruction
    _.extend(this, args);

    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    this.db = null;
    this.transactionQueue = [];
    this.version = iDBVersion;
    iDBInstances.push(this);
}

IndexedDBStore.prototype = {
    _enqueue: function(event) {
        var queue = this.transactionQueue;
        console.log("ENqueue: " + this.cacheId, event.type);
        queue.push(event);

        if (queue.length == 1) {
            event.func();
        }
    },
    _dequeue: function () {
        var queue = this.transactionQueue;
        var me = queue.shift(); // remove the just finished event.
        console.log("DEqueue: " + this.cacheId, me);
        console.log( me.type);

        if (queue.length != 0) {
            var next = queue[0];   // run the first in the queue
            next.func();
        }

    },

    _reset : function(){
        //_getConnection()
    },

    init: function(cacheId) {
        var _this = this;
        this.cacheId = cacheId;
        this.size = 0;
        this.cache = {};

//        if (!window.indexedDB) {
//            window.alert("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
//        }
//        debugger;
        console.log("Trying to open database, to use " + _this.cacheId);
        var myEvent = {type: "init", func: function() {
            _this._getConnection(function (db) {
                console.log(db);
            });
        }};
        console.log("end init");
        _this._enqueue(myEvent);
    },

    _getConnection: function (callback, version) {
        var _this = this;
        console.log("new GETCONNECTION");
//        debugger
        if (_this.db && _this.db.objectStoreNames.contains(_this.cacheId)) {
            callback(_this.db);
            return;
        } else {
            try {
                var dbOpenRequest;
                if (version) {
                    dbOpenRequest = window.indexedDB.open("IndexedDBStore", version); // second parameter is the version. increase to modify tables.
//                    dbOpenRequest.onsuccess = success;
                } else {
                    dbOpenRequest = window.indexedDB.open("IndexedDBStore");
                }
                dbOpenRequest.onsuccess = function(event){
//                    debugger;
                    console.log("idbrequest.onsuccess in " + _this.cacheId);
                    _this.db = event.target.result;

                    _this.db.onversionchange = function(e){
//                        debugger;
                        console.log("Version change triggered, so closing database connection " + _this.cacheId + " (old version, new version, db, event)", e.oldVersion, e.newVersion, _this.db, e);
                        if (_this.db) {
                            _this.db.close();
                            _this.db = undefined;
                        }
                    };

                    if(!_this.db.objectStoreNames.contains(_this.cacheId)) {
                        console.log("adding ObjectStore " + _this.cacheId);
                        _this.db.close();
                        iDBVersion = _this.db.version + 1;
                        _this.version = iDBVersion;
                        _this.db = undefined;
                        _this._getConnection(callback, _this.version);
                    } else {
                        console.log("Database Opened for " + _this.cacheId, _this.db, event);
                        callback(_this.db);
                        _this._dequeue();
                    }
                    console.log("endonsuccess " + _this.cacheId);
                };
//                debugger
                dbOpenRequest.onupgradeneeded = function(e){
//        debugger;
                    console.log("Database upgrade needed in " + _this.cacheId);
                    _this.db = e.target.result;

                    if(!_this.db.objectStoreNames.contains(_this.cacheId)) {
                        console.log("onupgradeneeded: createObjectStore" + _this.cacheId);
                        var objectStore = _this.db.createObjectStore(_this.cacheId);
                    }
                };
                dbOpenRequest.onerror = function(e){
//        debugger;
                    console.log("DB Open Request Error in " + _this.cacheId);
                    console.log(e);
                };
                dbOpenRequest.onblocked = function(e){
//        debugger;
                    console.log("DB Open Request Blocked in " + _this.cacheId);
                    console.log(e);
//                    if (_this.db) {
//                        _this.db.close();
//                    }
//                    _this._getConnection(callback)
                };
            } catch (e) {
                console.log("catch error:");
                console.error(e);
            }
        }
    },

    clear: function () {
//        this.db.deleteObjectStore(this.cacheId);

        var _this = this;
        var myEvent = {type: "clear", func: function(){
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            transaction.oncomplete = function(event) {
                console.log("clear success!");
                _this._dequeue();
            };
            var objectStore = transaction.objectStore(_this.cacheId);
            var req = objectStore.clear();
            req.onerror = function (evt) {
                console.error("Error trying to clear the object store " + _this.cacheId);
            }
        }};
        this._enqueue(myEvent);
    },

    count: function (callback) {
        var _this = this;
        var myEvent = {type: "count", func: function(){
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            transaction.oncomplete = function(event) {
                _this._dequeue();
            };
            var objectStore = transaction.objectStore(_this.cacheId);
            var req = objectStore.count();
            req.onerror = function (evt) {
                console.error("Error trying to count the object store " + _this.cacheId);
            }
            req.onsuccess = function (event) {
                callback(event.target.result);
            }
        }};
        this._enqueue(myEvent);
    },

    close: function () {
        var _this = this;
        var myEvent = {type: "close", func: function(){
                _this.db.close();
                _this._dequeue();
            }};
        this._enqueue(myEvent);
    },

    destroyDB: function() {
        var _this = this;
        var myEvent = {type: "destroy", func: function () {
            console.log("Trying to delete database");
            try {
                var dbDeleteRequest = window.indexedDB.deleteDatabase("IndexedDBStore");
                dbDeleteRequest.onsuccess = function (e) {
                    console.log("Database successfully deleted");
                    _this._dequeue();
                };
                dbDeleteRequest.onupgradeneeded = function (e) {
                    var db = dbOpenRequest.result;
                    console.log("Deleting Database upgrade needed");
                    /* Code for ${db.upgrade} */
                };
                dbDeleteRequest.onerror = function (e) {
                    console.log("Error deleting DB");
                    console.log(e);
                };
                dbDeleteRequest.onblocked = function (e) {
                    console.log("Deleting DB Blocked. Try closing the database and then deleting it", dbDeleteRequest.error, e.type);
                };
            } catch (e) {
                console.log(e);
            }
        }
        };

        this._enqueue(myEvent);
    },


    get: function(key, callback) {
        var _this = this;

        var myEvent = {type: "get", func: function () {
            var transaction = _this.db.transaction([_this.cacheId], "readonly");
            transaction.oncomplete = function(event) {
                _this._dequeue();
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction get (" + key + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(_this.cacheId);
            var request = objectStore.get(key);
            request.onsuccess = function (event) {
//                console.log("result of get:");  //
//                console.log(event.target.result);    //
                callback(event.target.result)
            };
        }
        };

        this._enqueue(myEvent);
    },


    /**
     * Calls the callback ONCE. As a parameter there is an Array with all the values.
     * @param keyArray
     * @param callback (valuesArray) The order is the same as in the keyArray.
     */
    getAll: function(keyArray, callback) {
        if (!(keyArray instanceof Array) || !callback) {
            console.error("Bad use of IndexedDBStore: getAll must receive an Array of keys and a callback function.");
            return;
        }
        var _this = this;
        var results = new Array(keyArray.length);

        var myEvent = {
            type: "getCollection",
            func: function () {
                var transaction = _this.db.transaction([_this.cacheId], "readonly");
                console.time("getall");
                transaction.oncomplete = function(event) {
                    console.timeEnd("getall");
                    callback(results);
                    _this._dequeue();
                };
                transaction.onerror = function (event) {
                    console.log("There was an error in the transaction get (" + keyArray + ")");
                    console.log(event);
                };

                var objectStore = transaction.objectStore(_this.cacheId);

                for (var i = 0; i < keyArray.length; i++) {
                    var request = objectStore.get(keyArray[i]);

                    request.onsuccess = function (iteration) {
                        return function (event) {
                            results[iteration] = event.target.result;
                        };
                    } (i);     // to force the closure to have each value of i, and not just the last one
                }
            }
        };

        this._enqueue(myEvent);
    },

    /**
     * Calls the callback with the value of each key. The callback is called keyArray.length times.
     * @param callback (value, key) Receives as parameters the value and its key.
     */
    foreach: function(keyArray, callback) {
        if (!(keyArray instanceof Array) || !callback) {
            console.error("Bad use of IndexedDBStore: getCollection must receive an Array of keys and a callback function.");
            return;
        }
        var _this = this;
        var results = new Array(keyArray.length);

        var myEvent = {
            type: "foreach",
            func: function () {
                var transaction = _this.db.transaction([_this.cacheId], "readonly");
                transaction.oncomplete = function(event) {
                    _this._dequeue();
                };
                transaction.onerror = function (event) {
                    console.log("There was an error in the transaction foreach (" + keyArray + ")");
                    console.log(event);
                };

                var objectStore = transaction.objectStore(_this.cacheId);

                for (var i = 0; i < keyArray.length; i++) {
                    var request = objectStore.get(keyArray[i]);

                    request.onsuccess = function (iteration) {
                        return function (event) {
                            callback(event.target.result, keyArray[iteration]);
                        };
                    } (i);     // to force the closure to have each value of i, and not just the last one
                }
            }
        };

        this._enqueue(myEvent);
    },

    add: function(key, value) {
        var _this = this;

        var myEvent = {type: "add", func: function() {
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            transaction.oncomplete = function(event) {
                _this._dequeue();
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction add (" + key + ", " + value + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(_this.cacheId);
            var request = objectStore.add(value, key);    // as the key is optional depending on the database scheme, it is the 2nd parameter
        }
        };

        this._enqueue(myEvent);
    },
    put: function(key, value) {
        var _this = this;

        var myEvent = {type: "put", func: function() {
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            transaction.oncomplete = function(event) {
                console.log("put");
                _this._dequeue();
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction put(" + key + ", " + value + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(_this.cacheId);
            var request = objectStore.put(value, key);    // as the key is optional depending on the database scheme, it is the 2nd parameter
        }
        };

        this._enqueue(myEvent);
    },

    putAll: function(keyArray, valueArray) {

        if (!(keyArray instanceof Array) || !(valueArray instanceof Array) || (keyArray.length != valueArray.length)) {
            debugger
            console.error("Bad use of IndexedDBStore: putAll must receive two Arrays of the same length.");
            return;
        }

        var _this = this;

        var myEvent = {type: "addCollection", func: function() {
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            console.time("putall");
            transaction.oncomplete = function(event) {
                console.timeEnd("putall");
                _this._dequeue();
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction put(" + key + ", " + value + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(_this.cacheId);

            for (var i = 0; i < keyArray.length; i++) {
                objectStore.put(valueArray[i], keyArray[i]);    // as the key is optional depending on the database scheme, it is the 2nd parameter
            }
        }
        };

        this._enqueue(myEvent);
    },


    delete: function(key) {
        var _this = this;

        var myEvent = {type: "delete", func: function() {
            var transaction = _this.db.transaction([_this.cacheId], "readwrite");
            transaction.oncomplete = function(event) {
                _this._dequeue();
            };
            transaction.onerror = function (event) {
                console.log("There was an error in the transaction delete (" + key + ")");
                console.log(event);
            };

            var objectStore = transaction.objectStore(_this.cacheId);
            var request = objectStore.delete(key);    // as the key is optional depending on the database scheme, it is the 2nd parameter

        }
        };

        this._enqueue(myEvent);
    }

};

console.log("in test");
var idb = new IndexedDBStore();
//debugger
/*
idb.init("feature");
idb.clear();
///*


console.time("creation");
var n = 1000;
var keyArray = new Array(n);
var valueArray = new Array(n);
for (var i = 0; i < n; i++) {
    keyArray[i] = "key" + i;
    valueArray[i] = "value" + i;
}
console.timeEnd("creation");
console.time("put");
idb.putAll(keyArray, valueArray);
// */

/*
idb2 = new IndexedDBStore();
idb2.init("feature");
idb2.count(function(times){
    console.log("numero de lineas rescatadas: " + times);
})
*/
//console.time("creation");

/*
console.time("firstget");
for (var i = 0; i < n; i++) {
    idb.put("key" + i, "value" + i);
}
// */

//        this.idb.add("key00", "value00");
//        this.idb.add("key01", "value01");
//    debugger


/*
idb.count(function(result) {
    console.timeEnd("put");
    console.log("number of rows: " + result);
});

console.time("firstget");
idb.get("key100", function (value){
    console.log("value returned from get is " + value);
    console.timeEnd("firstget");
//    debugger
});

console.time("getcol");
idb.getCollection(["key10", "key70", "key800", "key5"], function (value){
    console.log("value returned from get is " + value);
    console.log(value);
    console.timeEnd("getcol");
//    debugger
});
/*

var f = function (tag, lim){
    console.time(tag);
    var t = idb.db.transaction(["feature"], "readwrite");
    t.oncomplete = function(){
        console.log("Fin");
        console.timeEnd(tag);
    };
    var os = t.objectStore("feature");
    for(i = 0; i < lim; i++){
        var r = os.add(i*2,tag+"_"+i);
        if(i%100000 == 0) {
            console.log(i);
            var fAux = function(mensaje){
                return function(){
                    console.log(mensaje);
                };
            };
            r.onsuccess = fAux("Fin Tramo " + i);
        }
    }
};
*/

/*
console.time("secondget");
idb.get("key50000", function (value){
    console.log("value returned from get is " + value);
    console.timeEnd("secondget");
});
*/

//        for (var i = 0; i < 10000; i++) {
//            this.idb.delete("key" + i);
//        }

//debugger




/* featurechunk cache test
var fcc = new FeatureChunkCache();
fcc.chunkSize = 10;
fcc.store = new IndexedDBStore();
var idb = fcc.store;

idb.init("chunks");
idb.clear();

console.time("creation");
var n = 10;
var keyArray = new Array(n);
var valueArray = new Array(n);
for (var i = 0; i < n; i++) {
    keyArray[i] = fcc.getChunkKey("1", i);
    valueArray[i] = "value" + i;
}
console.log("key for chunk");
console.log(fcc.getChunkKey("1", fcc.getChunkId(15)));
console.timeEnd("creation");
idb.putAll(keyArray, valueArray);

console.time("firstget");
idb.get(fcc.getChunkKey("1", fcc.getChunkId(25)), function (value){
    console.log("value returned from get is " + value);
    console.timeEnd("firstget");
//    debugger
});

fcc.getChunk(fcc.getChunkKey("1", fcc.getChunkId(15)), function (value){
    console.log("value getchunk: " + value);
});

idb.delete(fcc.getChunkKey("1", fcc.getChunkId(65)));
idb.delete(fcc.getChunkKey("1", fcc.getChunkId(59)));
fcc.getAdjustedRegions(
    new Region({start: 45, end: 135, chromosome: "1"})
    , function(results){
        console.log("getAdjustedRegions");
        console.log(results);
    }
);
fcc.getCachedByRegion(
    new Region({start: 45, end: 135, chromosome: "1"})
    , function(results){
        console.log("getcachedbyRegions");
        console.log(results);
    }
);

fcc.getByRegions([
        new Region({start: 45, end: 48, chromosome: "1"})
        , new Region({start: 80, end: 85, chromosome: "1"})]
    , function(results){
        console.log("getbyRegions");
        console.log(results);
    }
);

fcc.getByRegion(new Region({start: 15, end: 120, chromosome:"1"}),function(chunks){
    console.log("getByRegion");
    console.log(chunks);
});
// */



