const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); //for uuid in ad
const store = require('./store');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const CATEGORIES = ['Buy & Sell', 'Events', 'Rent', 'Services', 'Travel', 'Other'];

// Haversine function to calculate distance between two points on earth
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // radius of earth
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


const checkAdData = (body) => {
  const errors = {};
  const category = body.category;
  let description = '';
  let title = '';
  let contact = '';
  let location = null;
  
  // Validation
  if (typeof body.title === 'string') {
    title = body.title.trim();
  }
  if (title.length === 0 || title.length > 100) {
    errors.title = 'Title must be 1-100 characters';
  }

  if (typeof body.description === 'string') {
    description = body.description.trim();
  }
  if (description.length === 0 || description.length > 200) {
    errors.description = 'Description must be 1-200 characters';
  }

  if (CATEGORIES.indexOf(category) === -1) {
    errors.category = 'Category must be one of: ' + CATEGORIES.join(', ');
  }

  if (typeof body.contact === 'string') {
    contact = body.contact.trim();
  }

  if (body.location) {
    const lat = body.location.lat;
    const lng = body.location.lng;
    const latOk = typeof lat === 'number' && lat >= -90 && lat <= 90;
    const lngOk = typeof lng === 'number' && lng >= -180 && lng <= 180;
    if (latOk && lngOk) {
      let address = '';
      if (typeof body.location.address === 'string') {
        address = body.location.address.trim();
      }
      location = { lat: lat, lng: lng, address: address };
    } else {
      errors.location = 'Location needs a valid lat and lng';
    }
  }

  const data = {
    title: title,
    description: description,
    category: category,
    contact: contact,
    location: location,
  };
  return { data: data, errors: errors };
}


app.get('/api/categories', async (req, res) => {
  res.json(CATEGORIES);
});

// getting all the ads, from oninit, search, crud
app.get('/api/ads', async (req, res) => {
  const search = String(req.query.q || '').trim().toLowerCase();
  const category = String(req.query.category || '');
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);
  const radius = parseFloat(req.query.radius) || 10; // default km
  const filterByLocation = !isNaN(lat) && !isNaN(lng);

  const allAds = await store.readAds();
  const result = [];

  for (let i = 0; i < allAds.length; i++) {
    const ad = allAds[i];

    if (category !== '' && ad.category !== category) {
      continue; 
    }
    if (search !== '') {
      let text = ad.title + ' ' + ad.description;
      if (ad.location) {
        text = text + ' ' + ad.location.address;
      }
      if (text.toLowerCase().indexOf(search) === -1) {
        continue;
      }
    }

    if (filterByLocation) {
      if (!ad.location) {
        continue; 
      }
      const dist = haversineKm(lat, lng, ad.location.lat, ad.location.lng);
      if (dist > radius) {
        continue;
      }
    }


    result.push(ad);
  }

  // sorting ads, from new to old
  result.sort(function (a, b) {
    if (a.createdAt < b.createdAt) return 1;
    if (a.createdAt > b.createdAt) return -1;
    return 0;
  });

  res.json(result);
});

// getting one ad from id
app.get('/api/ads/:id', async function (req, res) {
  const allAds = await store.readAds();

  for (let i = 0; i < allAds.length; i++) {
    if (allAds[i].id === req.params.id) {
      return res.json(allAds[i]);
    }
  }
  res.status(404).json({ error: 'Ad not found' });
});

// creating new ad
app.post('/api/ads', async function (req, res) {
  // check body validation
  const checked = checkAdData(req.body);
  // if there is an errors (length > 0) - return 400 validation failed message
  if (Object.keys(checked.errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: checked.errors });
  }

  const now = new Date().toISOString();
  const newAd = {
    id: crypto.randomUUID(),
    title: checked.data.title,
    description: checked.data.description,
    category: checked.data.category,
    contact: checked.data.contact,
    location: checked.data.location,
    createdAt: now,
    updatedAt: now,
  };

  const allAds = await store.readAds();
  allAds.push(newAd);
  store.writeAds(allAds);

  res.status(201).json(newAd);
});

// for editing ads
app.put('/api/ads/:id', async function (req, res) {
  // check body validation
  const checked = checkAdData(req.body);
  // if there is an errors (length > 0) - return 400 validation failed message
  if (Object.keys(checked.errors).length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: checked.errors });
  }

  const allAds = await store.readAds();
  for (let i = 0; i < allAds.length; i++) {
    const ad = allAds[i];
    if (ad.id === req.params.id) {
      ad.title = checked.data.title;
      ad.description = checked.data.description;
      ad.category = checked.data.category;
      ad.contact = checked.data.contact;
      ad.location = checked.data.location;
      ad.updatedAt = new Date().toISOString();

      store.writeAds(allAds);
      return res.json(ad);
    }
  }
  res.status(404).json({ error: 'Ad not found' });
});

// for delete ads
app.delete('/api/ads/:id', async function (req, res) {
  const allAds = await store.readAds();
  for (let i = 0; i < allAds.length; i++) {
    const ad = allAds[i];
    if (ad.id === req.params.id) {
      allAds.splice(i, 1); // מסירים את המודעה מהמערך
      store.writeAds(allAds);
      return res.status(204).end();
    }
  }
  res.status(404).json({ error: 'Ad not found' });
});


app.listen(PORT, function () {
  console.log('API listening on http://localhost:' + PORT);
});