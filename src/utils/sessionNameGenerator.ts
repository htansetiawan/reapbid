// Lists of names for random selection
const animals = [
  'panda', 'tiger', 'lion', 'elephant', 'giraffe', 'dolphin', 'penguin', 'koala',
  'kangaroo', 'zebra', 'cheetah', 'gorilla', 'wolf', 'bear', 'fox', 'deer',
  'owl', 'eagle', 'falcon', 'whale', 'octopus', 'butterfly', 'peacock', 'jaguar',
  'leopard', 'rhino', 'hippo', 'raccoon', 'otter', 'seal', 'lynx', 'panther',
  'gazelle', 'antelope', 'bison', 'moose', 'beaver', 'badger', 'squirrel', 'rabbit',
  'hedgehog', 'platypus', 'lemur', 'meerkat', 'sloth', 'armadillo', 'alpaca', 'llama',
  'capybara', 'porcupine'
];

const flowers = [
  'rose', 'lily', 'tulip', 'daisy', 'orchid', 'sunflower', 'dahlia', 'iris',
  'peony', 'lotus', 'jasmine', 'violet', 'poppy', 'magnolia', 'daffodil', 'carnation',
  'marigold', 'hibiscus', 'lavender', 'chrysanthemum', 'azalea', 'bluebell', 'camellia', 'gardenia',
  'hydrangea', 'primrose', 'snapdragon', 'zinnia', 'anemone', 'begonia', 'buttercup', 'cosmos',
  'delphinium', 'foxglove', 'geranium', 'hollyhock', 'larkspur', 'nasturtium', 'pansy', 'ranunculus',
  'sweetpea', 'verbena', 'wisteria', 'yarrow', 'amaryllis', 'aster', 'calendula', 'clematis',
  'freesia', 'gladiolus'
];

const cars = [
  'mustang', 'corvette', 'ferrari', 'porsche', 'tesla', 'jaguar', 'bentley', 'maserati',
  'lamborghini', 'aston', 'mclaren', 'bugatti', 'rolls', 'lexus', 'mercedes', 'bmw',
  'audi', 'acura', 'infiniti', 'cadillac', 'lincoln', 'genesis', 'volvo', 'alpine',
  'lotus', 'pagani', 'koenigsegg', 'rimac', 'rivian', 'lucid', 'maybach', 'defender',
  'range', 'bronco', 'wrangler', 'viper', 'shelby', 'charger', 'camaro', 'challenger',
  'supra', 'skyline', 'miata', 'carrera', 'vantage', 'phantom', 'wraith', 'dawn',
  'ghost', 'cullinan'
];

const cities = [
  'paris', 'tokyo', 'venice', 'london', 'sydney', 'rome', 'dubai', 'singapore',
  'amsterdam', 'barcelona', 'prague', 'vienna', 'istanbul', 'athens', 'cairo', 'madrid',
  'berlin', 'florence', 'seoul', 'kyoto', 'bangkok', 'mumbai', 'rio', 'lisbon',
  'dublin', 'oslo', 'monaco', 'seattle', 'boston', 'austin', 'denver', 'montreal',
  'toronto', 'vancouver', 'geneva', 'zurich', 'milan', 'naples', 'porto', 'seville',
  'granada', 'valencia', 'munich', 'hamburg', 'stockholm', 'helsinki', 'copenhagen', 'brussels',
  'antwerp', 'bruges'
];

type NameCategory = 'animals' | 'flowers' | 'cars' | 'cities';

const categories: Record<NameCategory, string[]> = {
  animals,
  flowers,
  cars,
  cities
};

const getRandomItem = (array: string[]): string => {
  return array[Math.floor(Math.random() * array.length)];
};

const sanitizeForFirebase = (str: string): string => {
  // Remove any Firebase-unsafe characters (., #, $, [, ]) and replace with underscore
  return str.replace(/[.#$\[\]]/g, '_');
};

export const generateSessionName = (category: NameCategory = 'animals'): string => {
  const now = new Date();
  const timePrefix = [
    (now.getMonth() + 1).toString().padStart(2, '0'),
    now.getDate().toString().padStart(2, '0'),
    now.getFullYear().toString().slice(2),
    now.getHours().toString().padStart(2, '0'),
    now.getMinutes().toString().padStart(2, '0')
  ].join('');

  const randomName = getRandomItem(categories[category]);
  return `${timePrefix}-${randomName}`;
};

export const getNextCategory = (current: NameCategory): NameCategory => {
  const allCategories: NameCategory[] = ['animals', 'flowers', 'cars', 'cities'];
  const currentIndex = allCategories.indexOf(current);
  return allCategories[(currentIndex + 1) % allCategories.length];
};
