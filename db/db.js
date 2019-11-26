const MongoClient = require("mongodb").MongoClient;

var state = {
  client: null
};

//Connexion à Mongo
exports.connect = function(url, done) {
  if (state.client) {
    return done();
  }

  MongoClient.connect(
    url,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true
    },
    function(err, client) {
      if (err) {
        return done(err);
      }
      state.client = client;
      done();
    }
  );
};

// Connexion à la base de donnée
exports.get = function(dbName) {
  return state.client.db(dbName);
};

//Ferme la connexion
exports.close = function(done) {
  if (state.client) {
    state.client.close(function(err, result) {
      state.client = null;
      state.mode = null;
      if (err) {
        console.log("TCL: exports.close -> err", err);
        done(err);
      }
    });
  }
};
