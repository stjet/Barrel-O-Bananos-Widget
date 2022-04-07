const mongo = require('mongodb');

let client = new mongo.MongoClient(process.env.connection_string, { useNewUrlParser: true, useUnifiedTopology: true })

async function getDb() {
  await client.connect();
  return client.db('db');
}

let db = getDb();
db.then((db) => {collection = db.collection("collection"); 
});

module.exports = {
  insert: async function(address,last_claim) {
    await collection.insertOne({"address":address,"last_claim":last_claim});
  },
  replace: async function(address,last_claim) {
    await collection.replaceOne({"address":address}, {"address":address,"last_claim":last_claim});
  },
  find: async function(address) {
    return await collection.findOne({"address":address});
  },
  count: async function(query) {
    return await collection.count(query);
  }
};