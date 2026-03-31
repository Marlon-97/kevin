const pollDefinition = {
  id: 'kevin-fest-abstimmung',
  title: 'Wie viele Bier bekommt das Curry?',
  description: 'Bierwerte das Curry von 1 bis 5. Wenn du willst, kannst du dem Chefkoch noch einen kurzen Kommentar dalassen.',
  options: [
    { id: '1-beer', label: '1 Bier', beers: 1 },
    { id: '2-beers', label: '2 Bier', beers: 2 },
    { id: '3-beers', label: '3 Bier', beers: 3 },
    { id: '4-beers', label: '4 Bier', beers: 4 },
    { id: '5-beers', label: '5 Bier', beers: 5 }
  ]
};

module.exports = { pollDefinition };
