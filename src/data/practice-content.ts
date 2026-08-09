import type {
  CompleteWordsItem,
  PracticeItem,
  ReadingQuestionItem,
  ReadingStimulus,
  TransferItem,
} from "@/domain/study";

export const completeWordsItems: CompleteWordsItem[] = [
  {
    id: "ctw-01",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Cooling streets",
    paragraphBefore: "Shade from mature street trees can ",
    wordPrefix: "low",
    paragraphAfter:
      " summer surface temperatures. The cooler pavement then releases less stored heat after sunset.",
    answerEnding: "er",
    acceptedAnswers: ["er", "lower"],
    explanation: "The modal verb “can” is followed by the base verb “lower.”",
  },
  {
    id: "ctw-02",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Fog and ferns",
    paragraphBefore:
      "On dry mornings, coastal ferns collect tiny fog droplets. This extra ",
    wordPrefix: "mois",
    paragraphAfter:
      " helps the plants remain active even when rainfall is limited.",
    answerEnding: "ture",
    acceptedAnswers: ["ture", "moisture"],
    explanation: "The noun “moisture” is the subject of the sentence.",
  },
  {
    id: "ctw-03",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "River stones",
    paragraphBefore: "Researchers track the ",
    wordPrefix: "move",
    paragraphAfter:
      " of marked stones after storms. Their positions reveal how strongly the river reshapes its bed.",
    answerEnding: "ment",
    acceptedAnswers: ["ment", "movement"],
    explanation:
      "The article “the” and the phrase “of marked stones” call for a noun.",
  },
  {
    id: "ctw-04",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "A changing market",
    paragraphBefore:
      "The harbor market was once open only during the autumn fishing run. It later became a ",
    wordPrefix: "season",
    paragraphAfter: " gathering that welcomed visitors throughout the year.",
    answerEnding: "al",
    acceptedAnswers: ["al", "seasonal"],
    explanation: "An adjective is needed before the noun “gathering.”",
  },
  {
    id: "ctw-05",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Desert leaves",
    paragraphBefore: "A waxy coating forms a ",
    wordPrefix: "protect",
    paragraphAfter:
      " layer on many desert leaves. It slows the loss of water during the hottest hours.",
    answerEnding: "ive",
    acceptedAnswers: ["ive", "protective"],
    explanation:
      "The blank modifies “layer,” so the adjective “protective” fits.",
  },
  {
    id: "ctw-06",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Night pollinators",
    paragraphBefore: "Camera recordings show the ",
    wordPrefix: "activ",
    paragraphAfter:
      " of moths around pale flowers. Most visits occur in the first two hours after dark.",
    answerEnding: "ity",
    acceptedAnswers: ["ity", "activity"],
    explanation: "The phrase “the activity of moths” requires a noun.",
  },
  {
    id: "ctw-07",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Listening to ice",
    paragraphBefore: "Several ",
    wordPrefix: "scient",
    paragraphAfter:
      " placed sensors beneath the glacier. The instruments recorded small cracks before any surface change appeared.",
    answerEnding: "ists",
    acceptedAnswers: ["ists", "scientists"],
    explanation: "“Several” calls for the plural count noun “scientists.”",
  },
  {
    id: "ctw-08",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "A forest returns",
    paragraphBefore: "After grazing ended, young trees ",
    wordPrefix: "grad",
    paragraphAfter:
      " spread across the hillside. Within two decades, they connected patches of older forest.",
    answerEnding: "ually",
    acceptedAnswers: ["ually", "gradually"],
    explanation: "The adverb “gradually” describes how the trees spread.",
  },
  {
    id: "ctw-09",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Bright roofs",
    paragraphBefore: "White roof tiles increase the ",
    wordPrefix: "reflect",
    paragraphAfter:
      " of sunlight. As a result, the rooms below require less cooling.",
    answerEnding: "ion",
    acceptedAnswers: ["ion", "reflection"],
    explanation: "The object of “increase” is the noun “reflection.”",
  },
  {
    id: "ctw-10",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Counting seals",
    paragraphBefore: "Aerial photographs provide a ",
    wordPrefix: "reli",
    paragraphAfter:
      " record of seal colonies. Teams can compare the images without disturbing the animals.",
    answerEnding: "able",
    acceptedAnswers: ["able", "reliable"],
    explanation:
      "The article and noun phrase require the adjective “reliable.”",
  },
  {
    id: "ctw-11",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Following cranes",
    paragraphBefore: "Lightweight tags allow biologists to map the ",
    wordPrefix: "migra",
    paragraphAfter:
      " of cranes. The routes show where the birds pause to feed during long flights.",
    answerEnding: "tion",
    acceptedAnswers: ["tion", "migration"],
    explanation: "The phrase “the migration of cranes” requires a noun.",
  },
  {
    id: "ctw-12",
    kind: "complete-words",
    taskType: "complete-the-words",
    mistakeCategory: "word-form",
    title: "Saving water",
    paragraphBefore: "The new irrigation schedule proved ",
    wordPrefix: "effect",
    paragraphAfter:
      ". Farms used less water while producing nearly the same harvest.",
    answerEnding: "ive",
    acceptedAnswers: ["ive", "effective"],
    explanation:
      "After the linking verb “proved,” the adjective “effective” fits.",
  },
];

export const readingStimuli: ReadingStimulus[] = [
  {
    id: "daily-seed-library",
    type: "daily-life",
    eyebrow: "Community library notice",
    title: "Seed Exchange Update",
    context: "A notice posted beside a neighborhood library’s seed cabinet.",
    segments: [
      {
        id: "seed-s1",
        text: "The seed cabinet is moving from the lobby to the second-floor reading room on Monday.",
      },
      {
        id: "seed-s2",
        text: "Members may take up to three packets and are welcome to return seeds collected from healthy plants.",
      },
      {
        id: "seed-s3",
        text: "Because volunteers need time to label new donations, please leave returned seeds in the blue tray rather than placing them directly in the cabinet.",
      },
    ],
  },
  {
    id: "daily-bus-detour",
    type: "daily-life",
    eyebrow: "Transit service message",
    title: "Saturday Route 8 Detour",
    context: "A message sent to riders who follow a local bus route.",
    segments: [
      {
        id: "bus-s1",
        text: "Route 8 will skip the Pine Street stop this Saturday while crews repair the crosswalk.",
      },
      {
        id: "bus-s2",
        text: "Riders who usually board there should use the temporary stop outside the post office, one block east.",
      },
      {
        id: "bus-s3",
        text: "Buses will follow the normal schedule, but afternoon trips may take up to five minutes longer because of festival traffic.",
      },
    ],
  },
  {
    id: "daily-museum-volunteers",
    type: "daily-life",
    eyebrow: "Volunteer coordinator email",
    title: "New Gallery Practice Session",
    context: "An email sent to museum volunteers before a gallery opens.",
    segments: [
      {
        id: "museum-s1",
        text: "Thank you for signing up to guide visitors through the new sound exhibition.",
      },
      {
        id: "museum-s2",
        text: "Wednesday’s practice session begins at 5:30 p.m., thirty minutes before the museum closes, so please enter through the staff door.",
      },
      {
        id: "museum-s3",
        text: "You do not need to memorize the full tour; the goal is to test the listening devices and practice answering two common visitor questions.",
      },
    ],
  },
  {
    id: "academic-alpine-moss",
    type: "academic-passage",
    eyebrow: "Short academic passage · Ecology",
    title: "Moss as a Mountain Timekeeper",
    context:
      "An original passage about how ecologists study newly exposed rock.",
    segments: [
      {
        id: "moss-s1",
        text: "When a mountain glacier retreats, it exposes rock that may have been covered for centuries.",
      },
      {
        id: "moss-s2",
        text: "Mosses are among the first plants to establish themselves on this bare surface, but different species arrive at different stages.",
      },
      {
        id: "moss-s3",
        text: "Some ecologists therefore compare moss communities on rocks at known distances from the glacier’s current edge.",
      },
      {
        id: "moss-s4",
        text: "Because farther rocks were generally exposed earlier, a sequence of sites can suggest how plant communities change over time.",
      },
      {
        id: "moss-s5",
        text: "Wind, slope, and moisture also affect moss growth, however, so distance alone cannot provide an exact date for every rock.",
      },
    ],
  },
  {
    id: "academic-clay-tokens",
    type: "academic-passage",
    eyebrow: "Short academic passage · Archaeology",
    title: "Small Tokens, Larger Networks",
    context:
      "An original passage about interpreting objects found at trading sites.",
    segments: [
      {
        id: "clay-s1",
        text: "Archaeologists working near an ancient river crossing have found hundreds of small clay tokens marked with simple lines.",
      },
      {
        id: "clay-s2",
        text: "Because similar marks appear on storage jars, the tokens may have helped traders keep track of goods moving between settlements.",
      },
      {
        id: "clay-s3",
        text: "The clay itself came from several locations, including villages far upstream.",
      },
      {
        id: "clay-s4",
        text: "This variety suggests that the crossing served more than one local community, even though no large market building has been discovered there.",
      },
      {
        id: "clay-s5",
        text: "Researchers caution that the tokens could also have been reused for purposes unrelated to trade, so their interpretation remains provisional.",
      },
    ],
  },
];

export const dailyLifeQuestions: ReadingQuestionItem[] = [
  {
    id: "daily-01",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "purpose-confusion",
    title: "Seed Exchange · Purpose",
    stimulusId: "daily-seed-library",
    prompt: "Why does the notice mention the blue tray?",
    options: [
      { id: "a", label: "To limit how many packets members take" },
      { id: "b", label: "To keep unprocessed donations separate" },
      { id: "c", label: "To show where the cabinet will move" },
      { id: "d", label: "To protect seeds from the reading room" },
    ],
    correctOptionId: "b",
    correctEvidenceSegmentIds: ["seed-s3"],
    explanation:
      "The tray gives volunteers time to label returned seeds before filing them.",
  },
  {
    id: "daily-02",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "inference-overreach",
    title: "Seed Exchange · Action",
    stimulusId: "daily-seed-library",
    prompt: "What may a member do after taking seed packets?",
    options: [
      { id: "a", label: "Return seeds from healthy plants" },
      { id: "b", label: "Move the cabinet back to the lobby" },
      { id: "c", label: "Label every new donation" },
      { id: "d", label: "Take any number of packets" },
    ],
    correctOptionId: "a",
    correctEvidenceSegmentIds: ["seed-s2"],
    explanation:
      "The notice explicitly welcomes seeds collected from healthy plants.",
  },
  {
    id: "daily-03",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "evidence-drift",
    title: "Bus Detour · Alternative",
    stimulusId: "daily-bus-detour",
    prompt: "Where should a Pine Street rider board on Saturday?",
    options: [
      { id: "a", label: "At the festival entrance" },
      { id: "b", label: "Beside the repair crew" },
      { id: "c", label: "Outside the post office" },
      { id: "d", label: "At the stop one block west" },
    ],
    correctOptionId: "c",
    correctEvidenceSegmentIds: ["bus-s2"],
    explanation: "The second sentence names the temporary boarding location.",
  },
  {
    id: "daily-04",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "purpose-confusion",
    title: "Bus Detour · Timing",
    stimulusId: "daily-bus-detour",
    prompt: "Why might some trips take longer?",
    options: [
      { id: "a", label: "The route will use fewer buses" },
      { id: "b", label: "A festival may slow afternoon traffic" },
      { id: "c", label: "The post office closes early" },
      { id: "d", label: "Crews will board at Pine Street" },
    ],
    correctOptionId: "b",
    correctEvidenceSegmentIds: ["bus-s3"],
    explanation:
      "The schedule stays the same, but festival traffic may create a delay.",
  },
  {
    id: "daily-05",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "evidence-drift",
    title: "Museum Volunteers · Entry",
    stimulusId: "daily-museum-volunteers",
    prompt: "Why should volunteers use the staff door?",
    options: [
      { id: "a", label: "The museum will be close to closing" },
      { id: "b", label: "The main gallery has no entrance" },
      { id: "c", label: "Visitors will be testing the devices" },
      { id: "d", label: "The exhibition opens at 5:30 p.m." },
    ],
    correctOptionId: "a",
    correctEvidenceSegmentIds: ["museum-s2"],
    explanation:
      "The session begins shortly before closing, so staff entry is required.",
  },
  {
    id: "daily-06",
    kind: "reading-question",
    taskType: "daily-life",
    mistakeCategory: "inference-overreach",
    title: "Museum Volunteers · Goal",
    stimulusId: "daily-museum-volunteers",
    prompt: "What is the main goal of the practice session?",
    options: [
      { id: "a", label: "To memorize the entire tour" },
      { id: "b", label: "To recruit visitors as volunteers" },
      { id: "c", label: "To rehearse two practical guide tasks" },
      { id: "d", label: "To replace the listening devices" },
    ],
    correctOptionId: "c",
    correctEvidenceSegmentIds: ["museum-s3"],
    explanation:
      "The session focuses on device testing and two common questions.",
  },
];

export const academicQuestions: ReadingQuestionItem[] = [
  {
    id: "academic-01",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "evidence-drift",
    title: "Alpine Moss · Method",
    stimulusId: "academic-alpine-moss",
    prompt:
      "Why do ecologists compare sites at different distances from the glacier?",
    options: [
      { id: "a", label: "To identify the deepest part of the glacier" },
      { id: "b", label: "To infer a sequence of community change" },
      { id: "c", label: "To remove the effects of wind and slope" },
      { id: "d", label: "To date each rock with complete precision" },
    ],
    correctOptionId: "b",
    correctEvidenceSegmentIds: ["moss-s3", "moss-s4"],
    explanation:
      "Distance helps arrange sites into a likely sequence from earlier to later exposure.",
  },
  {
    id: "academic-02",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "inference-overreach",
    title: "Alpine Moss · Limitation",
    stimulusId: "academic-alpine-moss",
    prompt: "What limitation of the method does the passage identify?",
    options: [
      { id: "a", label: "Moss cannot grow on newly exposed rock" },
      { id: "b", label: "Glaciers never retreat at a steady rate" },
      { id: "c", label: "Local conditions also influence moss growth" },
      { id: "d", label: "Researchers cannot measure distance" },
    ],
    correctOptionId: "c",
    correctEvidenceSegmentIds: ["moss-s5"],
    explanation: "Wind, slope, and moisture make distance an imperfect clock.",
  },
  {
    id: "academic-03",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "purpose-confusion",
    title: "Alpine Moss · First Colonizers",
    stimulusId: "academic-alpine-moss",
    prompt: "What does the passage state about moss species?",
    options: [
      { id: "a", label: "They all arrive as soon as rock appears" },
      { id: "b", label: "They establish at different stages" },
      { id: "c", label: "They grow only beside the glacier edge" },
      { id: "d", label: "They prevent other plants from arriving" },
    ],
    correctOptionId: "b",
    correctEvidenceSegmentIds: ["moss-s2"],
    explanation:
      "The passage directly says different species arrive at different stages.",
  },
  {
    id: "academic-04",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "evidence-drift",
    title: "Clay Tokens · Network",
    stimulusId: "academic-clay-tokens",
    prompt:
      "What evidence suggests the crossing connected multiple communities?",
    options: [
      { id: "a", label: "A large market building stood at the crossing" },
      { id: "b", label: "The tokens were all made in one village" },
      { id: "c", label: "The token clay came from several locations" },
      { id: "d", label: "Every storage jar carried a different mark" },
    ],
    correctOptionId: "c",
    correctEvidenceSegmentIds: ["clay-s3", "clay-s4"],
    explanation:
      "Clay from distant villages points to participation beyond one local group.",
  },
  {
    id: "academic-05",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "inference-overreach",
    title: "Clay Tokens · Caution",
    stimulusId: "academic-clay-tokens",
    prompt: "Why do researchers call the trade interpretation provisional?",
    options: [
      { id: "a", label: "The river crossing has not been located" },
      { id: "b", label: "The tokens may have had other uses" },
      { id: "c", label: "The clay cannot be tested" },
      { id: "d", label: "The storage jars are modern" },
    ],
    correctOptionId: "b",
    correctEvidenceSegmentIds: ["clay-s5"],
    explanation:
      "Possible reuse means the trade explanation is plausible, not certain.",
  },
  {
    id: "academic-06",
    kind: "reading-question",
    taskType: "academic-passage",
    mistakeCategory: "purpose-confusion",
    title: "Clay Tokens · Main Idea",
    stimulusId: "academic-clay-tokens",
    prompt: "Which statement best summarizes the passage?",
    options: [
      { id: "a", label: "Clay tokens prove a large formal market existed" },
      { id: "b", label: "Marked jars replaced all tokens used by traders" },
      {
        id: "c",
        label:
          "Small objects suggest a network but allow other interpretations",
      },
      { id: "d", label: "Upstream villages avoided the river crossing" },
    ],
    correctOptionId: "c",
    correctEvidenceSegmentIds: ["clay-s2", "clay-s4", "clay-s5"],
    explanation: "The passage balances network evidence with a clear caution.",
  },
];

export const transferItems: TransferItem[] = [
  {
    id: "transfer-evidence-01",
    kind: "transfer",
    taskType: "academic-passage",
    mistakeCategory: "evidence-drift",
    title: "Transfer · Match the proof",
    microContext:
      "A passage says that rooftop gardens delayed rainwater from entering city drains during short storms.",
    prompt: "Which claim is directly supported?",
    options: [
      { id: "a", label: "Rooftop gardens prevent every urban flood" },
      { id: "b", label: "Rooftop gardens can slow runoff during some storms" },
      { id: "c", label: "City drains are no longer necessary" },
      { id: "d", label: "Long storms never affect rooftops" },
    ],
    correctOptionId: "b",
    explanation:
      "The supported claim stays within the passage’s limits: delay, not prevention.",
  },
  {
    id: "transfer-inference-01",
    kind: "transfer",
    taskType: "daily-life",
    mistakeCategory: "inference-overreach",
    title: "Transfer · Keep the limit",
    microContext:
      "A workshop notice says extra seats may be released at noon if registered participants cancel.",
    prompt: "What can a reader safely infer?",
    options: [
      { id: "a", label: "Everyone waiting will receive a seat" },
      { id: "b", label: "Some seats could become available at noon" },
      { id: "c", label: "Registered participants must cancel" },
      { id: "d", label: "The workshop begins at noon" },
    ],
    correctOptionId: "b",
    explanation: "“May” supports possibility, not a guarantee.",
  },
  {
    id: "transfer-purpose-01",
    kind: "transfer",
    taskType: "daily-life",
    mistakeCategory: "purpose-confusion",
    title: "Transfer · Notice the reason",
    microContext:
      "An email asks club members to arrive early because name badges must be printed before the doors open.",
    prompt: "Why are members asked to arrive early?",
    options: [
      { id: "a", label: "To print badges before entry begins" },
      { id: "b", label: "To choose a different club name" },
      { id: "c", label: "To keep the doors closed all day" },
      { id: "d", label: "To cancel the event" },
    ],
    correctOptionId: "a",
    explanation:
      "The cause introduced by “because” gives the purpose of arriving early.",
  },
  {
    id: "transfer-word-form-01",
    kind: "transfer",
    taskType: "academic-passage",
    mistakeCategory: "word-form",
    title: "Transfer · Read the grammar signal",
    microContext:
      "The new method produced a ______ improvement in water quality.",
    prompt: "Which word form fits the blank?",
    options: [
      { id: "a", label: "measure" },
      { id: "b", label: "measurably" },
      { id: "c", label: "measurable" },
      { id: "d", label: "measurement" },
    ],
    correctOptionId: "c",
    explanation: "An adjective is needed before the noun “improvement.”",
  },
];

export const practiceItems: PracticeItem[] = [
  ...completeWordsItems,
  ...dailyLifeQuestions,
  ...academicQuestions,
  ...transferItems,
];

export function getPracticeItem(itemId: string): PracticeItem | null {
  return practiceItems.find((item) => item.id === itemId) ?? null;
}

export function getReadingStimulus(stimulusId: string) {
  return readingStimuli.find((stimulus) => stimulus.id === stimulusId) ?? null;
}
