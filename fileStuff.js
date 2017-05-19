var fs = require('fs');
fs.readFile('help.txt', 'utf8', function(err, data) {
  console.log(data);
  var shit = JSON.parse(data);
  fs.writeFile('help.txt', JSON.stringify(shit), function(err, data) {

  })
})