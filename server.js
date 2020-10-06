const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const Loki = require("lokijs");

// EXPRESS APP
const app = express();

// MIDDLEWARE
app.use("/", express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({ extended: true }));

// LOKI DATABASE SETUP
const DB_NAME = "db.json";
const COLLECTION_NAME = "files";
const UPLOAD_PATH = "uploads";
const db = new Loki(`${UPLOAD_PATH}/${DB_NAME}`, { persistenceMethod: "fs" });

// FIND or ADD Collection to database
const loadCollection = function (colName, db) {
  return new Promise((resolve) => {
    db.loadDatabase({}, () => {
      const _collection =
        db.getCollection(colName) || db.addCollection(colName);
      resolve(_collection);
    });
  });
};

// MULTER LOCALSTORAGE SETUP
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_PATH);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

// // Duplicate file filter
// const dupFilter = function (req, file, cb) {
  
  

//   if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
//       return cb(new Error('Only image files are allowed!'), false);
//   }
//   cb(null, true);
// };

// ROUTES
// @desc Get index.html (landing)
// @route GET /
app.get("/", function (req, res) {
  res.sendFile(__dirname + "/public/index.html");
});

// @desc Upload Images
// @route POST /uploadfile
app.post("/uploadfile", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) {
    // if not a file
    alert("Please upload a file");
    res.sendStatus(400);
  }

  try {
    // retrieving collection and load the file
    const col = await loadCollection(COLLECTION_NAME, db);
    const data = col.insert(file);

    // saving changes to database
    db.saveDatabase();

    const returnedVal = {
      id: data.$loki,
      fileName: data.filename,
      originalName: data.originalname,
    };
    res.send(returnedVal);
  } catch (err) {
    console.error(err);
    res.sendStatus(400);
  }
});

// @desc Get all files
// @route GET /uploaded
app.get("/uploaded", async (req, res) => {
  try {
    const col = await loadCollection(COLLECTION_NAME, db);
    res.send(col.data);
  } catch (err) {
    res.sendStatus(400);
    console.error(err);
  }
});

// @desc Get files by ID
// @route GET /uploaded/:id
app.get("/uploaded/:id", async (req, res) => {
  try {
    const col = await loadCollection(COLLECTION_NAME, db);
    const result = col.get(parseInt(req.params.id, 10));

    if (!result) {
      // if file not found
      res.sendStatus(404);
      console.error("File not found");
      return;
    }

    // returning file as download prompt
    res.download(path.join(UPLOAD_PATH, result.filename));
  } catch (err) {
    res.sendStatus(400);
    console.error(err);
  }
});

// SERVER LISTENING
app.listen(8181, function () {
  console.log("Server is listening on port 8181");
});