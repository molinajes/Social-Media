var nodeID3 = require('node-id3');

//tags.image is the path to the image (only png/jpeg files allowed)
var tags = {
  title: "Soshite Bokura wa",
  artist: "Ray",
  album: "Nagi no Asukara",
  composer: "Nakazawa Tomoyuki",
  image: "albumart.png"
}

var success = nodeID3.write(tags, "songsong.mp3"); //Pass tags and filepath
console.log(success);