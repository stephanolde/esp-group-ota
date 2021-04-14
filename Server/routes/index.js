const express = require('express');
const router = express.Router();
const {sendGo, boards, setName, setGroup, setGroupName, updateFileList} = require('../OTA/server')
const multer = require("multer")
const fs = require("fs")

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files')
  },
  filename: function (req, file, cb) {
    const name = getName("./files/",file.originalname)
    req.newFileName = name;
    cb(null, name + ".bin")
  }
})

const upload = multer({storage: storage})

function getName(folder, filename, increment = 0){
  if (fs.existsSync(`${folder}${filename}${increment?increment:""}.bin`)) {
    return getName(folder, filename, ++increment)
  }
  return `${filename}${increment?increment:""}`
}


/**
 * Returns a list of all the connected clients.
 */
router.get("/clients", ((req, res) => {
  res.json(boards)
}))

router.post("/name", ((req, res) => {
  const client = req.body.client;
  const name = req.body.name;

  setName(boards[client].address, name);

  res.send("Name set")
}))

router.post("/group-name", ((req, res) => {
  const group = req.body.group;
  const name = req.body.name;

  setGroupName(group, name);

  res.json({message: "DONE!"})
}))

router.post("/group", ((req, res) => {
  const client = req.body.client;
  const group = req.body.group;

  setGroup(boards[client].address, group);

  res.send("group set")
}))

/**
 * Uses and already uploaded file and sends the go to all the selected clients.
 */
router.post("/re-upload", (req, res) => {
  const group = req.body.group;
  const version = req.body.version;

  console.log(req.body);

  sendToClients(group, version)


  res.json({message: "DONE!"})
});

/**
 * Upload a file and sends the go to all the selected clients.
 */
router.post("/upload", upload.single("file"), (req, res) => {
  const fileName = req.newFileName;

  res.json({fileName: fileName});
  updateFileList();
});

/**
 * Sends the Go command to all the clients that fit the group list.
 * @param group - The groups to send the go to.
 * @param version - The clients that are connected.
 */
function sendToClients(group, version) {
  const groups = String(group).split(",");
  const all = groups.includes("all");
  for (let client of Object.values(boards)) {
    if (all || groups.includes(client.group)) {
      console.log(`Sending go to ${client.name}`)
      sendGo(client.address, version)
    }
  }
}

/**
 * Get the file.
 * Called by the client when the need the file.
 */
router.get("/file/:version", function (req, res) {
  const fileName = (req.params.version) ? req.params.version : "test.bin"
  const file = `${__dirname}/../files/${fileName}.bin`;
  res.download(file);
});

module.exports = router;
