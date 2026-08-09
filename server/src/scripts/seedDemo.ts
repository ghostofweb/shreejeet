/**
 * DEMO CONTENT ONLY.
 *
 * Everything this writes is generic placeholder text so the six sections have
 * something to render while the site is being built. None of it is real — it is
 * meant to be deleted and replaced with your own content.
 *
 *   npm run seed:demo          add the demo content
 *   npm run seed:demo -- --clear   wipe ALL content (keeps the two accounts)
 */
import type { Model } from 'mongoose';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import {
  AppSetting,
  Confession,
  ImportantDate,
  OpenWhenLetter,
  Reason,
  StoryEvent,
  UniverseStar,
} from '../models/content.js';
import { Media } from '../models/Media.js';

// Typed loosely on purpose: these are six unrelated models and we only ever
// call deleteMany/countDocuments on them.
const COLLECTIONS: Model<any>[] = [
  StoryEvent,
  Reason,
  UniverseStar,
  OpenWhenLetter,
  Confession,
  ImportantDate,
];

/** The relationship start date, read from ANCHOR_DATE. */
const anchor = env.anchorDate ? new Date(env.anchorDate) : new Date('2026-05-03');

/** Days after the anchor date → an ISO date, so the demo timeline stays sensible. */
const day = (offset: number) => new Date(anchor.getTime() + offset * 86_400_000);

/* ── 🏠 Story ─────────────────────────────────────────────────── */
const story = [
  {
    date: day(0),
    title: 'The day we met',
    description:
      'Placeholder memory. Replace this with how it actually happened — where you were, what she was wearing, the first thing she said.',
    sceneType: 'sunrise',
    location: 'Add the place here',
    specialMessage: 'I had no idea yet.',
    createdBy: 'me',
  },
  {
    date: day(6),
    title: 'The first proper conversation',
    description:
      'Placeholder memory. This is where a long late-night conversation would go — the one that made it obvious this was going somewhere.',
    sceneType: 'night',
    createdBy: 'me',
  },
  {
    date: day(21),
    title: 'Our first date',
    description:
      'Placeholder memory. Add the details: the place, the nerves, what you talked about, what you almost said and did not.',
    sceneType: 'blossom',
    location: 'Add the place here',
    specialMessage: 'I remember walking home smiling like an idiot.',
    createdBy: 'both',
  },
  {
    date: day(40),
    title: 'The rainy one',
    description:
      'Placeholder memory. Every relationship has a heavy day. This scene type gives the page rain and a darker mood when she scrolls past.',
    sceneType: 'rain',
    createdBy: 'her',
  },
  {
    date: day(58),
    title: 'A whole day out',
    description:
      'Placeholder memory. Somewhere you went together — the city, the walking, the food, the getting lost.',
    sceneType: 'city',
    location: 'Add the place here',
    createdBy: 'both',
  },
  {
    date: day(75),
    title: 'The first "I love you"',
    description:
      'Placeholder memory. This one uses the glow scene, which is meant for the milestones.',
    sceneType: 'glow',
    specialMessage: 'And I meant it.',
    createdBy: 'me',
  },
  {
    date: day(92),
    title: 'A quiet evening in',
    description:
      'Placeholder memory. Not every good day is a big one. The cozy scene is for the ordinary ones worth keeping.',
    sceneType: 'cozy',
    createdBy: 'her',
  },
];

/* ── 🌹 Reasons ───────────────────────────────────────────────── */
const reasons: { text: string; category: string; createdBy: string }[] = [
  { text: 'Because she smiles with her whole face.', category: 'cute', createdBy: 'me' },
  { text: 'Because she laughs at her own jokes before finishing them.', category: 'funny', createdBy: 'me' },
  { text: 'Because she remembers the small things I mention once.', category: 'appreciate', createdBy: 'me' },
  { text: 'Because she is unreasonably good at being kind to strangers.', category: 'proud', createdBy: 'me' },
  { text: 'Because of the way she says my name when she is half asleep.', category: 'love', createdBy: 'me' },
  { text: 'Because she argues with me and then makes me tea anyway.', category: 'funny', createdBy: 'me' },
  { text: 'Because she is the only person I want to tell things to first.', category: 'love', createdBy: 'me' },
  { text: 'Because she looks incredible in the morning and refuses to believe it.', category: 'attractive', createdBy: 'me' },
  { text: 'Because he listens properly, not just until it is his turn to talk.', category: 'appreciate', createdBy: 'her' },
  { text: 'Because he built an entire website instead of just saying it.', category: 'love', createdBy: 'her' },
  { text: 'Because he gets weirdly excited about things he is learning.', category: 'cute', createdBy: 'her' },
  { text: 'Because he is calm when I am not.', category: 'appreciate', createdBy: 'her' },
  { text: 'A random thought — placeholder. Write the ones that are actually true.', category: 'thought', createdBy: 'both' },
];

/* ── 🌌 Universe ──────────────────────────────────────────────── */
const stars = [
  { type: 'moment', title: 'The first time', message: 'Placeholder star. Every one of these is a real point in the sky she can click.', date: day(0), createdBy: 'me' },
  { type: 'memory', title: 'That afternoon', message: 'Placeholder star.', date: day(21), createdBy: 'me' },
  { type: 'funny', title: 'The thing you said', message: 'Placeholder star — the funny ones get their own type.', createdBy: 'her' },
  { type: 'love', title: 'Something I love', message: 'Placeholder star.', createdBy: 'me' },
  { type: 'place', title: 'A place that matters', message: 'Placeholder star.', createdBy: 'both' },
  { type: 'letter', title: 'A short letter', message: 'Placeholder star.', createdBy: 'me' },
  { type: 'note', title: 'Just a note', message: 'Placeholder star.', createdBy: 'her' },
  { type: 'date', title: 'A date worth marking', message: 'Placeholder star.', date: day(75), createdBy: 'me' },
  { type: 'photo', title: 'A photo memory', message: 'Placeholder star — add photos in the admin.', createdBy: 'both' },
  {
    type: 'secret',
    title: 'A secret star',
    message: 'Placeholder star. This one is marked secret, so it only shows up once she finds it.',
    isSecret: true,
    createdBy: 'me',
  },
  {
    type: 'moment',
    title: 'Locked until later',
    message: 'Placeholder star. This one is locked — the server will not send this text until the unlock date passes.',
    visibility: 'unlock_at',
    unlockAt: new Date(Date.now() + 30 * 86_400_000),
    createdBy: 'me',
  },
];

/* ── 💌 Open When ─────────────────────────────────────────────── */
const letters = [
  {
    situation: "you're missing me",
    body: 'Placeholder letter.\n\nThis is where you write the thing you would actually say if she called you at 2am. Long is fine. It only has to make sense to her.\n\nReplace this whole letter in the admin.',
    sealColor: '#c9566b',
    createdBy: 'me',
  },
  {
    situation: "you're sad",
    body: 'Placeholder letter.\n\nSomething steady for the bad days. Not advice — just presence.',
    sealColor: '#9b8bd4',
    createdBy: 'me',
  },
  {
    situation: "you're angry at me",
    body: 'Placeholder letter.\n\nThe hardest one to write and the most useful one to have.',
    sealColor: '#7a5c8a',
    createdBy: 'me',
  },
  {
    situation: "you can't sleep",
    body: 'Placeholder letter.\n\nSomething slow and quiet to read at 3am.',
    sealColor: '#5b6ea8',
    createdBy: 'me',
  },
  {
    situation: 'you need to remember you are capable',
    body: 'Placeholder letter.\n\nList the specific things she has actually done. Specific beats generic every time.',
    sealColor: '#e6bb6a',
    createdBy: 'me',
  },
  {
    situation: "you're happy and I'm not there",
    body: 'Placeholder letter.\n\nThe good-news one.',
    sealColor: '#d98a5a',
    createdBy: 'her',
  },
  {
    situation: 'it has been a year',
    body: 'Placeholder letter.\n\nThis one is locked until a date — she can see it exists but cannot open it yet.',
    unlockRule: 'after_date',
    unlockAt: new Date(anchor.getTime() + 365 * 86_400_000),
    sealColor: '#c9566b',
    createdBy: 'me',
  },
];

/* ── 🫣 Confessions ───────────────────────────────────────────── */
const confessions = [
  {
    prompt: "I've never told you this, but…",
    text: 'Placeholder confession. This section is for the things that are true but never quite got said out loud.',
    createdBy: 'me',
  },
  {
    prompt: 'Something I secretly love about you…',
    text: 'Placeholder confession.',
    createdBy: 'me',
  },
  {
    prompt: 'The first time I realised…',
    text: 'Placeholder confession.',
    date: day(6),
    createdBy: 'me',
  },
  {
    prompt: 'A thought I keep to myself…',
    text: 'Placeholder confession. This one needs holding down to reveal.',
    lockRule: 'hold',
    createdBy: 'her',
  },
  {
    prompt: 'Something you probably do not know…',
    text: 'Placeholder confession.',
    createdBy: 'her',
  },
  {
    prompt: "Something I've always wanted to say…",
    text: 'Placeholder confession.',
    lockRule: 'hold',
    createdBy: 'me',
  },
];

/* ── 🗓️ Important Dates ───────────────────────────────────────── */
const dates = [
  {
    title: 'The day we met',
    date: anchor,
    icon: 'heart',
    description: 'Where the counter starts.',
    isAnchor: true,
    createdBy: 'both',
  },
  { title: 'Our first date', date: day(21), icon: 'tulip', createdBy: 'both' },
  {
    title: 'Our anniversary',
    date: new Date(anchor.getTime() + 365 * 86_400_000),
    icon: 'sparkle',
    recurrence: 'yearly',
    createdBy: 'both',
  },
  {
    title: 'Her birthday',
    date: new Date('2000-01-01'),
    icon: 'gift',
    recurrence: 'yearly',
    description: 'Placeholder — set the real date in the admin.',
    createdBy: 'me',
  },
  {
    title: 'His birthday',
    date: new Date('2000-01-01'),
    icon: 'gift',
    recurrence: 'yearly',
    description: 'Placeholder — set the real date in the admin.',
    createdBy: 'her',
  },
  { title: 'The first trip', date: day(58), icon: 'pin', createdBy: 'both' },
];

async function clearAll() {
  const counts: Record<string, number> = {};
  for (const model of [...COLLECTIONS, Media]) {
    const { deletedCount } = await model.deleteMany({});
    counts[model.modelName] = deletedCount ?? 0;
  }
  console.log('\n🧹 Cleared all content (accounts kept):');
  for (const [name, n] of Object.entries(counts)) console.log(`   · ${name}: ${n} removed`);
  console.log('');
}

async function seed() {
  const existing = await StoryEvent.countDocuments();
  if (existing > 0) {
    console.log(
      '\n⚠️  There is already content in the database.\n' +
        '   Run `npm run seed:demo -- --clear` first if you want to start clean.\n'
    );
    return;
  }

  await StoryEvent.insertMany(story.map((e, i) => ({ ...e, order: i })));
  await Reason.insertMany(reasons.map((r) => ({ ...r, about: r.createdBy === 'her' ? 'me' : 'her' })));
  await UniverseStar.insertMany(stars);
  await OpenWhenLetter.insertMany(letters);
  await Confession.insertMany(confessions);
  await ImportantDate.insertMany(dates);
  await AppSetting.updateOne(
    { key: 'anchorDate' },
    { $set: { value: anchor.toISOString() } },
    { upsert: true }
  );

  console.log('\n🌱 Demo content added:');
  console.log(`   · ${story.length} memories`);
  console.log(`   · ${reasons.length} reasons`);
  console.log(`   · ${stars.length} stars (1 secret, 1 locked)`);
  console.log(`   · ${letters.length} letters (1 locked)`);
  console.log(`   · ${confessions.length} confessions (2 hold-to-reveal)`);
  console.log(`   · ${dates.length} important dates (anchor: ${anchor.toDateString()})`);
  console.log('\n   All of it is placeholder text — replace it in the admin.\n');
}

async function main() {
  await connectDb();
  if (process.argv.includes('--clear')) {
    await clearAll();
  } else {
    await seed();
  }
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
