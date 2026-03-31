const express = require('express');
const path = require('path');
const { pollDefinition } = require('./config');
const { ensureStorageFile, getResults, submitVote } = require('./storage');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/poll', async (_req, res) => {
  try {
    const results = await getResults();
    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: 'Abstimmung konnte nicht geladen werden.',
      details: error.message
    });
  }
});

app.post('/api/vote', async (req, res) => {
  const { optionId, voterToken, comment } = req.body;

  if (!optionId) {
    return res.status(400).json({ message: 'optionId ist erforderlich.' });
  }

  if (!voterToken) {
    return res.status(400).json({ message: 'voterToken ist erforderlich.' });
  }

  try {
    await submitVote(optionId, voterToken, comment);
    const results = await getResults();
    return res.status(201).json(results);
  } catch (error) {
    const statusCode = error.message === 'Ungültige Option.' || error.message === 'Mit diesem Browser wurde bereits abgestimmt.' ? 400 : 500;
    return res.status(statusCode).json({
      message: 'Stimme konnte nicht gespeichert werden.',
      details: error.message
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', pollId: pollDefinition.id });
});

ensureStorageFile()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server läuft auf http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Speicherdatei konnte nicht vorbereitet werden.');
    console.error(error);
    process.exit(1);
  });
