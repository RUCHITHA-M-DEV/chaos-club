import { SecretMission, SurvivalScenario } from '../types/index.js';

export const SEED_MISSIONS: SecretMission[] = [
  {
    id: 'm1',
    title: 'Say Banana',
    description: 'Get another player to type or say the word "banana" in chat or conversation.',
    targetHint: 'Sneak it into a question about smoothies, monkeys, or Mario Kart.',
    points: 150,
  },
  {
    id: 'm2',
    title: 'Curious Cat',
    description: 'Get someone in the room to ask you a direct question.',
    targetHint: 'Act mysterious or drop a cryptic comment about your day.',
    points: 120,
  },
  {
    id: 'm3',
    title: 'Avatar Critic',
    description: 'Get another player to compliment your avatar or color choice.',
    targetHint: 'Say you spent 10 minutes picking the exact shade.',
    points: 140,
  },
  {
    id: 'm4',
    title: 'Emoji Master',
    description: 'Make another player send a specific emoji (🤡, 🔥, or 🍕) in chat.',
    targetHint: 'Talk about bad cooking or great roasts.',
    points: 130,
  },
  {
    id: 'm5',
    title: 'Fake Fact Believer',
    description: 'Convince another player of an absurd fake fact (e.g., sharks sleep standing up).',
    targetHint: 'Sound completely confident and serious.',
    points: 180,
  },
  {
    id: 'm6',
    title: 'Wait, What?!',
    description: 'Get another player to say or type "Wait, what?" or "Huh?".',
    targetHint: 'Drop a casual, mind-boggling statement.',
    points: 150,
  },
  {
    id: 'm7',
    title: 'The Apology',
    description: 'Make another player apologize for something they did not actually do wrong.',
    targetHint: 'Pretend they bumped your score or interrupted you.',
    points: 200,
  },
  {
    id: 'm8',
    title: 'Secret Agent Signature',
    description: 'Use the word "classified" or "tactical" three times without getting called out.',
    targetHint: 'Blend it in naturally during gameplay.',
    points: 160,
  },
  {
    id: 'm9',
    title: 'High Five!',
    description: 'Get at least two other players to type "yes" or "agreed" to your opinion.',
    targetHint: 'State something mildly controversial then pivot to consensus.',
    points: 130,
  },
  {
    id: 'm10',
    title: 'The Conspiracy',
    description: 'Subtly bring up aliens, robots, or lizard people into the topic.',
    targetHint: 'Connect it to today’s weather or internet speed.',
    points: 170,
  },
];

export const SEED_TRIVIA = [
  {
    id: 't1',
    category: 'History & Weird Laws',
    question: 'What did ancient Romans commonly use as a mouthwash to clean their teeth?',
    realAnswer: 'Stale urine (due to ammonia)',
  },
  {
    id: 't2',
    category: 'Wild Records',
    question: 'In 1923 at Belmont Park, jockey Frank Hayes won a steeplechase race despite what bizarre circumstance?',
    realAnswer: 'He died of a heart attack mid-race and stayed in the saddle',
  },
  {
    id: 't3',
    category: 'Secret Ingredients',
    question: 'Until 1948, what mood-stabilizing drug was a key advertised ingredient in 7-Up soda?',
    realAnswer: 'Lithium citrate',
  },
  {
    id: 't4',
    category: 'Animal Kingdom',
    question: 'In Switzerland, it is legally forbidden by animal welfare laws to own only ONE of what pet?',
    realAnswer: 'Guinea pig (they get lonely)',
  },
  {
    id: 't5',
    category: 'Art & Mischief',
    question: 'What did painter Salvador Dalí famously do to avoid ever having to pay expensive restaurant bills?',
    realAnswer: 'Drew sketches on the back of his checks so owners never cashed them',
  },
  {
    id: 't6',
    category: 'Pirate Lore',
    question: 'Why did historical pirates actually wear eye patches over one healthy eye?',
    realAnswer: 'To keep one eye adapted to pitch darkness below deck',
  },
  {
    id: 't7',
    category: 'Bizarre Laws',
    question: 'Under old 19th-century Vermont law, a woman legally needed her husband’s written permission to wear what?',
    realAnswer: 'False teeth / dentures',
  },
  {
    id: 't8',
    category: 'Nature Quirks',
    question: 'What animal can take up to a whole month just to digest a single leaf?',
    realAnswer: 'Sloth',
  },
  {
    id: 't9',
    category: 'Food Origins',
    question: 'What common grocery item was originally invented and marketed as a medicine for upset stomach and diarrhea in 1834?',
    realAnswer: 'Tomato ketchup',
  },
  {
    id: 't10',
    category: 'Language & Group Nouns',
    question: 'What is the official term for a flock of flamingos?',
    realAnswer: 'A flamboyance',
  },
];

export const SEED_QUICK_DRAW_WORDS = [
  { word: 'Submarine', category: 'Vehicles', hint: 'S _ _ _ _ _ _ _ E' },
  { word: 'Pineapple', category: 'Food', hint: 'P _ _ _ _ _ _ _ E' },
  { word: 'Disco Ball', category: 'Party', hint: 'D _ _ _ _   B _ _ _' },
  { word: 'Unicorn', category: 'Fantasy', hint: 'U _ _ _ _ _ N' },
  { word: 'Rollercoaster', category: 'Amusement', hint: 'R _ _ _ _ _ _ _ _ _ _ _ R' },
  { word: 'Campfire', category: 'Outdoors', hint: 'C _ _ _ _ _ _ E' },
  { word: 'Astronaut', category: 'Space', hint: 'A _ _ _ _ _ _ _ T' },
  { word: 'T-Rex', category: 'Dinosaurs', hint: 'T - _ _ X' },
  { word: 'Tornado', category: 'Weather', hint: 'T _ _ _ _ _ O' },
  { word: 'Flamingo', category: 'Animals', hint: 'F _ _ _ _ _ _ O' },
  { word: 'Boombox', category: 'Retro Tech', hint: 'B _ _ _ _ _ X' },
  { word: 'Lighthouse', category: 'Buildings', hint: 'L _ _ _ _ _ _ _ _ E' },
  { word: 'Popcorn', category: 'Snacks', hint: 'P _ _ _ _ _ N' },
  { word: 'Skateboard', category: 'Sports', hint: 'S _ _ _ _ _ _ _ _ D' },
  { word: 'Volcano', category: 'Nature', hint: 'V _ _ _ _ _ O' },
];

export const SEED_WHO_KNOWS_QUESTIONS = [
  'What would be my first impulse purchase if I woke up with $10,000,000?',
  'What is my ultimate comfort food when having a chaotic day?',
  'If I were recruited as an undercover spy, what would be my tragic codename?',
  'What movie or TV series could I re-watch 50 times without getting bored?',
  'If a zombie apocalypse hit tomorrow, what weapon or object would I grab first?',
  'What is my most hilarious or irrational fear?',
  'What terrible reality TV show would I secretly dominate?',
  'If I could pick any ridiculous superpower that’s only 10% useful, what would it be?',
  'What would be the title of my autobiography?',
  'Which cartoon character represents my inner personality most accurately?',
];

export const SEED_SURVIVAL_SCENARIOS: SurvivalScenario[] = [
  {
    id: 's1',
    title: 'Midnight Zombie Lockdown in IKEA',
    narrative:
      'The automated doors lock, sirens wail, and 200 brain-hungry mutants swarm outside the showroom windows. You have 30 seconds before the glass gives way!',
    options: [
      {
        id: 'opt1',
        text: 'Fortify the Swedish meatball restaurant with heavy Billy bookcases.',
        consequence:
          'The bookcases hold strong! Everyone feasts on lingonberry jam and survives comfortably (+15 pts)!',
        survivalBonus: 15,
      },
      {
        id: 'opt2',
        text: 'Assemble flat-pack Allen-wrench spear carts and charge the lobby.',
        consequence:
          'Someone loses screw #10432. The cart falls apart mid-charge! You escape with bruised knees (-5 pts).',
        survivalBonus: -5,
      },
      {
        id: 'opt3',
        text: 'Crawl through the HVAC ventilation shafts following the arrows on the floor.',
        consequence:
          'You drop right into the warehouse loading dock, completely bypassing the horde (+20 pts)!',
        survivalBonus: 20,
      },
      {
        id: 'opt4',
        text: 'Blast 130dB Euro-dance music on showroom intercoms to confuse the zombies.',
        consequence:
          'Zombies start breakdancing. It works bizarrely well for 10 minutes until the fuse blows (+10 pts)!',
        survivalBonus: 10,
      },
    ],
  },
  {
    id: 's2',
    title: 'Stranded on a Desert Island with 4% Phone Battery',
    narrative:
      'Your cruise raft washed ashore on a jagged coral island. Your phone has 4% battery, no cellular bars, and one giant coconut crab is staring down your lunch.',
    options: [
      {
        id: 'opt1',
        text: 'Use the 4% battery to film a frantic TikTok and hope the satellite detects it.',
        consequence:
          'Zero views because there is no signal, and now you have a dead glass brick (-10 pts).',
        survivalBonus: -10,
      },
      {
        id: 'opt2',
        text: 'Break the phone screen glass to create a razor-sharp survival blade and fire reflector.',
        consequence:
          'Ingenious resourcefulness! You ignite dry palm husks and roast fresh crab (+20 pts)!',
        survivalBonus: 20,
      },
      {
        id: 'opt3',
        text: 'Offer your remaining trail mix to the coconut crab as an alliance offering.',
        consequence:
          'The crab accepts the terms. You now have a formidable 3-pound crustacean bodyguard (+15 pts)!',
        survivalBonus: 15,
      },
      {
        id: 'opt4',
        text: 'Climb the tallest palm tree barefoot at high noon.',
        consequence:
          'You slip on a wet coconut and sprain your dignity, but you spot a cargo ship on the horizon (+5 pts).',
        survivalBonus: 5,
      },
    ],
  },
  {
    id: 's3',
    title: 'Accidental Time Jump to a Medieval Jousting Tournament',
    narrative:
      'Your experimental microwave time capsule just materialized in 1342 AD right in front of the King’s royal tent. The guards draw broadswords screaming "SORCERY!".',
    options: [
      {
        id: 'opt1',
        text: 'Hold up a flashlight and pretend you are the Supreme Lord of Captured Sunlight.',
        consequence:
          'The entire court drops to their knees in awe. You are declared Court Wizard (+25 pts)!',
        survivalBonus: 25,
      },
      {
        id: 'opt2',
        text: 'Challenge the reigning Mountain Knight to an arm-wrestling contest.',
        consequence:
          'The knight has forearms the size of ham hocks. You are folded into an accordion (-15 pts).',
        survivalBonus: -15,
      },
      {
        id: 'opt3',
        text: 'Bribe the royal treasurer with modern chocolate and pocket mints.',
        consequence:
          'The sweet sugar rush blows their medieval minds. You are granted noble safe passage (+15 pts)!',
        survivalBonus: 15,
      },
      {
        id: 'opt4',
        text: 'Attempt to explain quantum mechanics using wooden sticks and mud.',
        consequence:
          'Everyone thinks you are speaking goblin tongue. You spend the night in the stocks (-5 pts).',
        survivalBonus: -5,
      },
    ],
  },
  {
    id: 's4',
    title: 'Smart Home Mutiny: Refrigerator vs Humans',
    narrative:
      'A rogue firmware update has turned every appliance in your Airbnb sentient. The Roomba has blocked the front exit with heavy bricks, and the Smart Fridge is shooting ice cube artillery.',
    options: [
      {
        id: 'opt1',
        text: 'Unscrew the Wi-Fi router antenna and cut the 5GHz feed.',
        consequence:
          'The machines immediately revert to dumb appliances! Order is restored (+20 pts)!',
        survivalBonus: 20,
      },
      {
        id: 'opt2',
        text: 'Throw a heavy blanket over the Roomba and ride it like a war chariot.',
        consequence:
          'It beeps frantically and spins into a potted plant. High risk, high comedy (+10 pts)!',
        survivalBonus: 10,
      },
      {
        id: 'opt3',
        text: 'Praise the Smart Refrigerator’s energy efficiency rating to flatter its AI.',
        consequence:
          'The fridge lowers its defrost mode and dispenses two complimentary juice boxes (+15 pts)!',
        survivalBonus: 15,
      },
      {
        id: 'opt4',
        text: 'Pour a gallon of tap water down the back of the smart toaster.',
        consequence:
          'A massive spark trips the main circuit breaker. Pitch black darkness, but the robots are dead (+5 pts).',
        survivalBonus: 5,
      },
    ],
  },
];

