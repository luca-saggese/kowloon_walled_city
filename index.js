const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 8088;

const host = 'http://www.thingsmind.com:' + PORT;

app.get('/getData.php', (req, res) => {
    const filename = `./json/${req.query['f']}${req.query['chapter'] ? '_' + req.query['chapter'] : ''}.json`;
    const json = fs.readFileSync(filename).toString().replace(/http:\/\/localhost:8088/g,host);
    res.send(JSON.parse(json));
});
 
app.get('/api-video/find_all_videos.asp', (req, res) => {
    const id = req.query.query;
    console.log('find_all_videos', id)
    res.jsonp(require('./json/videos/' + id + '.json'));
});


app.use(express.static(path.join(__dirname, 'kwc')));

app.listen(PORT, '0.0.0.0',()=>{
  console.log('open ' + host + '/index.html')  
});

