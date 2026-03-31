const fs = require('node:fs/promises');
const path = require('node:path');
const { pollDefinition } = require('./config');

const dataDirectory = path.join(__dirname, '..', 'data');
const votesFilePath = path.join(dataDirectory, 'votes.txt');
const validOptionIds = new Set(pollDefinition.options.map((option) => option.id));

async function ensureStorageFile() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(votesFilePath);
  } catch {
    await fs.writeFile(votesFilePath, '', 'utf8');
  }
}

async function readVotes() {
  await ensureStorageFile();
  const content = await fs.readFile(votesFilePath, 'utf8');
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [pollId, optionId, voterToken, createdAt, encodedComment = ''] = line.split('|');
      let comment = '';

      if (encodedComment) {
        try {
          comment = Buffer.from(encodedComment, 'base64').toString('utf8');
        } catch {
          comment = '';
        }
      }

      return { pollId, optionId, voterToken, createdAt, comment };
    })
    .filter((entry) => entry.pollId === pollDefinition.id && validOptionIds.has(entry.optionId));
}

async function submitVote(optionId, voterToken, comment = '') {
  if (!validOptionIds.has(optionId)) {
    throw new Error('Ungültige Option.');
  }

  const votes = await readVotes();
  const alreadyVoted = votes.some((vote) => vote.voterToken === voterToken);
  if (alreadyVoted) {
    throw new Error('Mit diesem Browser wurde bereits abgestimmt.');
  }

  const safeComment = typeof comment === 'string' ? comment.trim().slice(0, 280) : '';
  const encodedComment = safeComment ? Buffer.from(safeComment, 'utf8').toString('base64') : '';
  const line = [pollDefinition.id, optionId, voterToken, new Date().toISOString(), encodedComment].join('|');
  await fs.appendFile(votesFilePath, `${line}\n`, 'utf8');
}

async function getResults() {
  const votes = await readVotes();
  const options = pollDefinition.options.map((option) => {
    const count = votes.filter((vote) => vote.optionId === option.id).length;
    return {
      ...option,
      votes: count
    };
  });

  const weightedTotal = options.reduce((sum, option) => sum + option.votes * Number(option.beers || 0), 0);
  const totalVotes = votes.length;
  const averageBeers = totalVotes === 0 ? 0 : Number((weightedTotal / totalVotes).toFixed(1));
  const leadingOption = [...options].sort((left, right) => {
    if (right.votes !== left.votes) {
      return right.votes - left.votes;
    }
    return Number(right.beers || 0) - Number(left.beers || 0);
  })[0] || null;
  const comments = votes
    .filter((vote) => vote.comment)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((vote) => {
      const matchingOption = pollDefinition.options.find((option) => option.id === vote.optionId);
      return {
        text: vote.comment,
        beers: Number(matchingOption?.beers || 0),
        createdAt: vote.createdAt
      };
    });

  return {
    pollId: pollDefinition.id,
    title: pollDefinition.title,
    description: pollDefinition.description,
    totalVotes,
    averageBeers,
    leadingOption,
    comments,
    options
  };
}

module.exports = {
  ensureStorageFile,
  getResults,
  submitVote,
  votesFilePath
};
