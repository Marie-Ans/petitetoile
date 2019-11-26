const db = require("./db");
const ObjectId = require('mongodb').ObjectID
const DB_URL = "mongodb+srv://Marie:jeuback2019@divjs10ma-csygg.gcp.mongodb.net/test?retryWrites=true&w=majority";

function searchPubli (pseudo) {
    return new Promise(function (resolve, reject) {
        db.connect(DB_URL, function(error) {
            if(error) {
                reject(error);
            } else {
                let publications = db.get("toile").collection("publications");
                publications.find({pseudo:pseudo}).sort({date:-1}).toArray()
                .then(function (res) {
                    db.close();
                    resolve(res);
                })
                .catch(function (err) {
                    db.close();
                    console.log('err search',err);
                    reject(err);
                });
            }
        });
    });
};

function insertPubli (publication) {
    return new Promise(function (resolve, reject) {
        db.connect(DB_URL, function(error) {
            if(error) {
                reject(error);
            } else {
                let publications = db.get("toile").collection("publications");
                publications.insertOne(publication)
                .then(function (res) {
                    resolve(res);
                })
                .catch(function (err) {
                    reject(err);
                });
            }

        });
    });
}

function insertComment (comment) {
    return new Promise(function (resolve, reject) {
        db.connect(DB_URL, function(error) {
            if(error) {
                reject(error);
            } else {
                let idPub=new ObjectId(comment.idP)
                let publications = db.get("toile").collection("publications");
                publications.findOne({_id:idPub}, function(errFind,resFind){
                    if(errFind){
                        reject(errFind);
                    } else {
                        let comments = resFind.comments;
                        comments.push(comment);
                        publications.updateOne({_id:idPub},{$set: {comments:newComments}})
                        .then(function (res) {
                            resolve(res);
                        })
                        .catch(function (err) {
                            reject(err);
                        });
                    }
                })
            }
        });
    });
}
  

// async function searchPubli(pseudo){
//     db.connect(DB_URL, function(err) {
//         if (err) {
//            return false;
//         }
//         else {
//             let publications = db.get("toile").collection("publications");
//             publications.find({pseudo:pseudo}).toArray(function(error, result){
//                 if(error){
//                     return false;
//                 } else {
//                     return result;
//                 }

//             });
//         }
//     });
// };

module.exports = {
    searchPubli: searchPubli,
    insertPubli: insertPubli,
    insertComment: insertComment
};
