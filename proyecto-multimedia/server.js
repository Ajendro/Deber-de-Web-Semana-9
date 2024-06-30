const express = require('express');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');



const app = express();
const port = 3000;

app.get('/image', (req, res) => {
    const inputPath = path.join(__dirname, 'media', 'input.jpg');
    sharp(inputPath)
        .resize(300, 300)
        .toBuffer()
        .then(data => {
            res.type('image/jpeg');
            res.send(data);
        })
        .catch(err => {
            res.status(500).send('Error processing image');
        });
});


app.get('/audio', (req, res) => {
    const inputAudioPath = './media/input3.mp3';
    const outputWavPath = './media/output.wav';

    ffmpeg(inputAudioPath)
        .toFormat('wav')
        .on('end', () => {
            res.download(outputWavPath, 'output.wav', err => {
                if (err) {
                    console.error('Error sending WAV file:', err);
                    res.status(500).send('Error sending WAV file');
                } else {
                    fs.unlinkSync(outputWavPath); 
                }
            });
        })
        .on('error', err => {
            console.error('Error converting audio:', err);
            res.status(500).send('Error converting audio');
        })
        .save(outputWavPath);
});


app.get('/video', (req, res) => {
    const inputPath = path.join(__dirname, 'media', 'input2.mp4');
    const stat = fs.statSync(inputPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(inputPath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        fs.createReadStream(inputPath).pipe(res);
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
