const fs = require('fs'),
    imagemin = require('imagemin'),
    imageminPngquant = require('imagemin-pngquant'),
    path = require('path');

const SRC = './tiles/',
    DST = './tiny_tiles/';

const walkSync = async (dir, level) => {
    // Create dst directories if they do not exist
    const dstDir = dir.replace(SRC, DST);
    if (!fs.existsSync(dstDir)){
        fs.mkdirSync(dstDir);
    }

    const files = fs.readdirSync(dir);
        
    const dirContainsTiles = files.some(file => {
        return path.extname(file).toLowerCase() === '.png';
    });

    if (dirContainsTiles) {
        // Check if all images have been optimised
        const allFilesAreOptimised = files.every(function(file) {
            return fs.existsSync(dstDir + file);
       });
       if (allFilesAreOptimised) {
            console.log('Tiles allready optimised in folder: ', dir);
       } else {
            console.log('Start: ', dir);
            console.time(dir);

            await imagemin([dir + '*.png'], dstDir, {
                plugins: [
                    imageminPngquant({quality: '65-80'})
                ]
            });
           
            console.log('Stop: ', dir);
            console.timeEnd(dir);
       }
    } else {
        for(var i = 0; i < files.length; i+=1) {
            if (fs.statSync(dir + files[i]).isDirectory()) {
                await walkSync(dir + files[i] + '/', level + 1);
            }
        }
    }
    
    return;
};

console.time('Total time');
walkSync(SRC, 0)
    .then(() => {
        console.timeEnd('Total time');
    });