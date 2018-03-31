var fs = require('fs'),
    PNG = require('pngjs').PNG,
    tinify = require('tinify');
var account = require('./tiny_png_account.js');

tinify.key = account.key;

var SRC = './tiles/',
    DST = './tiny_tiles/',
    TMP_SRC = './tmp_src/',
    TMP_DST = './tmp_dst/',
    ACCOUNT_COMPRESSIONS_LIMIT = 100,
    TILE_WIDTH = 256,
    TILE_HEIGHT = 256,
    SRC_IMG = 'unoptimised_tile.png',
    DST_IMG = 'optimised_tile.png';


if (!fs.existsSync(TMP_SRC)){
    fs.mkdirSync(TMP_SRC);
}
if (!fs.existsSync(TMP_DST)){
    fs.mkdirSync(TMP_DST);
}

var walkSync = function (dir, level) {
    // Create dst directories if they do not exist
    if (!fs.existsSync(dir.replace(SRC, DST))){
        fs.mkdirSync(dir.replace(SRC, DST));
    }

    var files = fs.readdirSync(dir);

    if (level < 2) {        
        files.forEach(function (file) {
            if (fs.statSync(dir + file).isDirectory()) {
                walkSync(dir + file + '/', level + 1);
            }
        });
    } else {
        if (tinify.compressionCount > ACCOUNT_COMPRESSIONS_LIMIT){
            throw new Error('ACCOUNT_COMPRESSIONS_LIMIT (' + ACCOUNT_COMPRESSIONS_LIMIT + ') exceeded.')
        }

        if (files.length === 0) {
            console.log('no files', dir, level);
            return;
        } else if (files.length === 1) {
            // Optimise image if optimised version doesn't exist yet
            var image = dir + files[0];
            if (fs.existsSync(image.replace(SRC, DST))){
                console.log('Image allready optimised: ', image);
            } else {
                var source = tinify.fromFile(image);
                source.toFile(image.replace(SRC, DST));
                console.log('Optimised image: ', image);
            }            
        } else if (files.length === 2) {
            // Check if all images have been optimised
            var allFilesAreOptimised = files.every(function(file) {
                return fs.existsSync((dir + file).replace(SRC, DST));
            });
            if (allFilesAreOptimised) {
                console.log('Tiles allready optimised in folder: ', dir);
            } else {
                console.log('Tiles not yet optimised in folder: ', dir);
    
                // Join tiles to a single image
                var imageFile = optimizeTiles(dir, files);
            }
        }        
    }
    
    return;
};

var optimizeTiles = function (dir, files) {
    var tileImage = new PNG({width: TILE_WIDTH, height: TILE_HEIGHT * files.length});
    var imageFile = Date.now() + '.png';
    
    files.reverse().forEach(function (file, i) {
        fs.createReadStream(dir + file)
            .pipe(new PNG())
            .on('parsed', function() {
                this.bitblt(tileImage, 0, 0, TILE_WIDTH, TILE_HEIGHT, 0, i * TILE_HEIGHT);

                if (i === (files.length - 1)) {
                    var buffer = PNG.sync.write(tileImage);
                    fs.writeFileSync(TMP_SRC + imageFile, buffer);

                    // Optimise image
                    var source = tinify.fromFile(TMP_SRC + imageFile);
                    source.toFile(TMP_DST + imageFile, function () {    
                        // Split optimised image to tiles
                        splitToTiles(imageFile, dir, files);
                    });                  
                }
            });
    });  
    
    return imageFile;
}

var splitToTiles = function (imageFile, dir, files) {
    // Correct directory string
    var dstDir = dir.replace(SRC, DST);

    // Read optimised image data
    fs.createReadStream(TMP_DST + imageFile)
        .pipe(new PNG())
        .on('parsed', function() {
            var optimisedImage = this;

            files.forEach(function (file, i) {
                var tile = new PNG({width: TILE_WIDTH, height: TILE_HEIGHT});

                optimisedImage.bitblt(tile, 0, i * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT, 0, 0);

                tile.pack().pipe(fs.createWriteStream(dstDir + file));

                if (i === (files.length - 1)) {
                    // TODO: delete tmp img
                }
            });
        }); 
}

// First validate tiny PNG API key to check for compression count
tinify.validate(function (err) {
    console.log('Current compression count: ', tinify.compressionCount);

    // Start traversing the src dir
    walkSync(SRC, 0);

    if (err) throw err;
    // Validation of API key failed.
});

