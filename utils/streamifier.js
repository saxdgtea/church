// Note: This is a workaround since streamifier might not be installed
// If you have issues, install it: npm install streamifier

const { Readable } = require("stream");

function createReadStream(buffer) {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

module.exports = {
  createReadStream,
};
