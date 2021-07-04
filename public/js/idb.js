// create variable to hold db connection
let db;

// establish a connection to IndexedDb database called 'budget_tracker' and set it to version 1, it will auto increment as it's changed
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes
request.onupgradeneeded = function(event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store (table) called `new_transaction`, set it to have an auto incremeneting primary key of sorts
  db.createObjectStore('new_transaction', { autoIncrement: true });
};

request.onsuccess = function(event) {
  // save reference to db in global variable
  db = event.target.result;

  if (navigator.onLine) {
    uploadTransaction();
  }
};

request.onerror = function(event) {
  console.log(event.target.errorCode);
};

// will execute if user attempts to submit new transaction without internet connection
function saveRecord(record) {
  // open a new database transaction with read and write permissions
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access the object store for 'new_transaction'
  const transactionObjectStore = transaction.objectStore('new_transaction');

  // insert data into 'new_transaction' object store
  transactionObjectStore.add(record);
}

function uploadTransaction() {
  // open a db transaction
  const transaction = db.transaction(['new_transaction'], 'readwrite');

  // access your object store
  const transactionObjectStore = transaction.objectStore('new_transaction');

  // get all records from store and set to a variable
  const getAll = transactionObjectStore.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch('/api/transaction/bulk', {  //is this the right route?
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(serverResponse => {
        if (serverResponse.message) {
          throw new Error(serverResponse);
        }
        // open another db transaction
        const transaction = db.transaction(['new_transaction'], 'readwrite');
        // access the new_transaction object store
        const transactionObjectStore = transaction.objectStore('new_transaction');
        //clear all items in your store
        transactionObjectStore.clear();

        alert('All saved transactions have been submitted!');
      })
      .catch(err => {
        console.log(err);
      });
    }
  };
}

window.addEventListener('online', uploadTransaction);


