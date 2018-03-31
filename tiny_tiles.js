var fs = require('fs'),
    imagemin = require('image-min'),
    path = require('path');

var SRC = './tiles/',
    DST = './tiny_tiles_image-min/';

var walkSync = function (dir) {
    // Create dst directories if they do not exist
    var dstDir = dir.replace(SRC, DST);
    if (!fs.existsSync(dstDir)){
        fs.mkdirSync(dstDir);
    }

    var files = fs.readdirSync(dir);
        
    files.slice(0,3).forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            walkSync(dir + file + '/');
        } else {
            if (fs.existsSync(dstDir + file)){
                console.log('Image allready optimised: ', dir + file);
            } else {                
                var src = fs.createReadStream(dir + file);
                console.log(typeof src.path, src.path);
                var ext = path.extname(src.path);
                
                src
                    .pipe(imagemin({ ext: ext }))
                    .pipe(fs.createWriteStream(dstDir + file));
            }  
        }
    });
    
    return;
};

walkSync(SRC, 0);