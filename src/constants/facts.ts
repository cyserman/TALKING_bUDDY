export type Subject = 'Geography' | 'Stars' | 'Math' | 'Phonics' | 'Physics';

export interface Fact {
  title: string;
  content: string;
  subject: Subject;
  emoji: string;
}

export const KNOWLEDGE_BASE: Fact[] = [
  // Geography
  { subject: 'Geography', emoji: '🌎', title: 'Planet Earth', content: 'The Earth is a big blue ball! Almost three quarters of it is covered in water — oceans, lakes, and rivers!' },
  { subject: 'Geography', emoji: '☀️', title: 'Florida Sunshine State', content: 'Florida is called the Sunshine State and that is where big rockets blast off into space!' },
  { subject: 'Geography', emoji: '🌊', title: 'The Pacific Ocean', content: 'The Pacific Ocean is the biggest ocean on Earth. It is even bigger than all the land put together!' },
  { subject: 'Geography', emoji: '🏔️', title: 'Mount Everest', content: 'Mount Everest is the tallest mountain in the whole world. It is so high that it touches the clouds!' },
  { subject: 'Geography', emoji: '🤠', title: 'Texas Is Huge!', content: 'Texas is so big that you could fit the whole country of France inside it!' },
  { subject: 'Geography', emoji: '🦘', title: 'Australia', content: 'Australia is an island AND a continent! It is home to kangaroos, koalas, and the Great Barrier Reef!' },
  { subject: 'Geography', emoji: '🌿', title: 'Amazon River', content: 'The Amazon River in South America carries more water than any other river in the whole world!' },
  { subject: 'Geography', emoji: '🌲', title: 'California Redwoods', content: 'California has the tallest trees in the world called Redwoods. They are taller than a 30-story building!' },
  { subject: 'Geography', emoji: '🗽', title: 'New York', content: 'New York City has a giant green statue called the Statue of Liberty. It was a special gift from the country of France!' },
  { subject: 'Geography', emoji: '🏜️', title: 'The Sahara Desert', content: 'The Sahara Desert in Africa is the biggest hot desert on Earth — it is almost as big as the United States!' },

  // Stars / Astronomy
  { subject: 'Stars', emoji: '💛', title: 'Our Sun', content: 'The Sun is actually a giant star! It is so big you could fit one million Earths inside it, and it keeps us warm every day!' },
  { subject: 'Stars', emoji: '🌙', title: 'The Moon', content: 'The Moon has no air or water. Astronauts walked on it and left footprints that are still there because there is no wind to blow them away!' },
  { subject: 'Stars', emoji: '💍', title: 'Saturn\'s Rings', content: 'Saturn has beautiful rings made of billions of pieces of ice and rock floating around it like a giant hula hoop!' },
  { subject: 'Stars', emoji: '🔴', title: 'The Red Planet Mars', content: 'Mars is called the Red Planet because its dirt is full of rusty iron that makes everything look orange-red!' },
  { subject: 'Stars', emoji: '🌀', title: 'Jupiter the Giant', content: 'Jupiter is the biggest planet in our solar system. It has a giant storm called the Great Red Spot that has been going on for hundreds of years!' },
  { subject: 'Stars', emoji: '🌠', title: 'Shooting Stars', content: 'Shooting stars are not actually stars — they are tiny rocks from space burning up when they zoom into Earth\'s atmosphere!' },
  { subject: 'Stars', emoji: '🚀', title: 'The Milky Way', content: 'We live inside a giant galaxy called the Milky Way! It has more than 200 billion stars in it — that is more than all the grains of sand on a beach!' },

  // Math
  { subject: 'Math', emoji: '🍎', title: 'Adding', content: 'Adding is putting groups together! If you have 3 apples and I give you 2 more, you now have 5 apples!' },
  { subject: 'Math', emoji: '🚗', title: 'Doubling', content: 'Doubling means having two groups that are the same! Two toy cars plus two more toy cars equals four cars — you doubled them!' },
  { subject: 'Math', emoji: '🔢', title: 'The Number Zero', content: 'Zero is a super special number. It means nothing is there — but without zero we could not write numbers like 10 or 100!' },
  { subject: 'Math', emoji: '♾️', title: 'Infinity', content: 'Infinity is not just a big number — it is a number that goes on forever and EVER and never ever stops!' },
  { subject: 'Math', emoji: '⬡', title: 'Shapes', content: 'A triangle has 3 sides, a square has 4 sides, and a hexagon has 6 sides — just like honeycomb in a beehive!' },
  { subject: 'Math', emoji: '⏱️', title: 'One Million', content: 'If you counted one number every second, it would take you almost 12 days without sleeping to reach one million!' },

  // Phonics
  { subject: 'Phonics', emoji: '🍎', title: 'Letter A says "Aah"', content: 'The letter A makes the "aah" sound like in Apple and Astronaut! Say it with me: Aah, Apple, Astronaut!' },
  { subject: 'Phonics', emoji: '🐝', title: 'Letter B says "Buh"', content: 'The letter B makes the "buh" sound like in Ball, Bug, and Bounce! Every time you see a B, say "buh"!' },
  { subject: 'Phonics', emoji: '🐱', title: 'Letter C says "Kuh"', content: 'The letter C usually makes the "kuh" sound like in Cat, Car, and Cookie — yum!' },
  { subject: 'Phonics', emoji: '🦆', title: 'Letter D says "Duh"', content: 'The letter D makes the "duh" sound like in Dog, Duck, and Dance!' },
  { subject: 'Phonics', emoji: '🐘', title: 'Letter E says "Eh"', content: 'The letter E makes the "eh" sound like in Elephant and Egg!' },
  { subject: 'Phonics', emoji: '🐸', title: 'Rhyming Words', content: 'Rhyming words sound the same at the end! Cat, bat, and hat all rhyme. Can you think of more words that rhyme with "run"?' },

  // Physics
  { subject: 'Physics', emoji: '⬇️', title: 'Gravity', content: 'Gravity is an invisible force that pulls everything down towards the ground. That is why when you drop a ball it falls down and not up!' },
  { subject: 'Physics', emoji: '🎱', title: 'Bouncing', content: 'When a ball bounces, it squishes a little when it hits the ground and then springs back up! The bouncier the ball, the higher it bounces!' },
  { subject: 'Physics', emoji: '🌊', title: 'Friction', content: 'Friction is what slows things down when they rub together. Ice is super slippery because there is very little friction — that is why you can slide on it!' },
  { subject: 'Physics', emoji: '⚡', title: 'Speed', content: 'The fastest thing in the universe is light! It travels so fast it could go around the Earth 7 times in just ONE second!' },
  { subject: 'Physics', emoji: '🏎️', title: 'NanoClaw Turbo Mode', content: 'NanoClaw is the fastest robot because he uses physics to zoom! Less air resistance and more engine power means more speed — zoom zoom!' },
];

// Keep backwards-compat exports for voice agent
export const GEOGRAPHY_FACTS = KNOWLEDGE_BASE.filter(f => f.subject === 'Geography').map(f => ({ topic: f.title, fact: f.content }));
export const NUMBER_FACTS = KNOWLEDGE_BASE.filter(f => f.subject === 'Math').map(f => ({ topic: f.title, fact: f.content }));
export const ASTRONOMY_FACTS = KNOWLEDGE_BASE.filter(f => f.subject === 'Stars').map(f => ({ topic: f.title, fact: f.content }));
