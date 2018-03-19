const fs = require('fs');
const cp = require('child_process');
const thumbs = require('..');
const filesize = require('filesize');
const timecodeutils = require('timecodeutils');

const matchIdRow = (rows, key) => {
    const matched = rows.find(row => row.startsWith(key + '='));
    if (!matched) { throw new RangeError('No ' + key); }
    return matched.substr(key.length + 1);
};

const generate = fileName => {
    cp.exec('mplayer -vo null -ao null -frames 0 -identify \'' + fileName.replace(/'/g, '\'"\'"\'')  + '\'', (err, stdout) => {
        if (err) { throw err; }
        const rows = stdout.split('\n');
        const grid = thumbs(fileName);

        const size = filesize(fs.statSync(fileName).size);

        const file = matchIdRow(rows, 'ID_FILENAME');
        const width = parseInt(matchIdRow(rows, 'ID_VIDEO_WIDTH'));
        const height = parseInt(matchIdRow(rows, 'ID_VIDEO_HEIGHT'));
        grid.width(width / 4);
        grid.height(height / 4);

        const length = parseFloat(matchIdRow(rows, 'ID_LENGTH'));
        const COUNT = 6;
        grid.count(COUNT);
        grid.interval(Math.round(length / (COUNT + 1)));
        grid.start(Math.round(grid.interval() / 2));
        grid.headerfontsize(16);
        grid.headertext([
            file,
            'Size: ' + size,
            'Dimensions: ' + width + 'x' + height,
            'Duration: ' + timecodeutils.secondsToTC(length)
        ]);

        grid.render((err, stream) => {
            if (err) throw err;
            stream.pipe(fs.createWriteStream(file + '.jpg'));
        });
        grid.quality(70);
    });
};

generate('sample.mp4');
