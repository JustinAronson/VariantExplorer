
exports.readJSONArray = function readJSONArray(fileName){
    var fs = require('fs');
    var file = JSON.parse(fs.readFileSync(fileName, 'utf8'));
    return file;
}
