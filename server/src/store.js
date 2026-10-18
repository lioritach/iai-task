//Reading and writing to ads.json file

const fs = require('fs');
const path = require('path');

// הנתיב לקובץ הנתונים
const DATA_FILE = path.join(__dirname, '..', 'data', 'ads.json');

// read all the ads from file ads.json
function readAds() {
  // check if there is a existing file ads.json
  if (!fs.existsSync(DATA_FILE)) {
    return [];
  }
  const text = fs.readFileSync(DATA_FILE, 'utf8');
  // if the ads.json is empty, there is no ads
  if (text.trim() === '') {
    return [];
  }
  return JSON.parse(text);
}

// write to ads.json using stringify
function writeAds(ads) {
  const text = JSON.stringify(ads, null, 2);
  fs.writeFileSync(DATA_FILE, text, 'utf8');
}

module.exports = { readAds, writeAds };