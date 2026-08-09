import type { ResourceConfig } from '@/components/admin/resource';
import { formatDate } from '@/lib/utils';
import type {
  Confession,
  ImportantDate,
  OpenWhenLetter,
  Reason,
  StoryEvent,
  UniverseStar,
} from '@/lib/types';

const opt = (v: string, l: string) => ({ value: v, label: l });

/* ── 🏠 Story ─────────────────────────────────────────────────── */
export const storyConfig: ResourceConfig<StoryEvent> = {
  path: 'story',
  title: 'Memories',
  icon: '❤️',
  singular: 'Memory',
  blurb: 'Each one becomes a stop on the timeline. The scene decides what the background does when she scrolls past it.',
  fields: [
    { name: 'date', label: 'When', type: 'date', required: true },
    { name: 'title', label: 'Title', type: 'text', required: true, placeholder: 'The day we…' },
    { name: 'description', label: 'What happened', type: 'textarea', rows: 5 },
    { name: 'location', label: 'Where', type: 'text', placeholder: 'optional' },
    {
      name: 'sceneType',
      label: 'Scene',
      type: 'select',
      options: [
        opt('sunrise', '🌅 Sunrise — warm beginnings'),
        opt('blossom', '🌸 Blossom — soft and sweet'),
        opt('sky', '☁️ Sky — travel, distance'),
        opt('night', '🌙 Night — late hours'),
        opt('rain', '🌧️ Rain — the heavy ones'),
        opt('snow', '❄️ Snow — quiet and still'),
        opt('city', '🌆 City — out together'),
        opt('beach', '🏖️ Beach — sun and salt'),
        opt('glow', '✨ Glow — a milestone'),
        opt('cozy', '🕯️ Cozy — home'),
      ],
    },
    { name: 'photos', label: 'Photos', type: 'mediaMulti', max: 20, accept: 'image/*' },
    { name: 'video', label: 'Video', type: 'media', accept: 'video/*' },
    {
      name: 'specialMessage',
      label: 'A line just for her',
      type: 'textarea',
      rows: 2,
      placeholder: 'Shows in handwriting, drawn on as she scrolls past',
    },
    { name: 'order', label: 'Order (same-day tiebreak)', type: 'number' },
  ],
  emptyValues: {
    date: '',
    title: '',
    description: '',
    location: '',
    sceneType: 'sunrise',
    photos: [],
    video: null,
    specialMessage: '',
    order: 0,
    createdBy: 'me',
  },
  primary: (e) => e.title,
  secondary: (e) => [formatDate(e.date), e.location].filter(Boolean).join(' · '),
  thumbnail: (e) => e.photos?.[0] ?? e.video,
};

/* ── 🌹 Reasons ───────────────────────────────────────────────── */
export const reasonsConfig: ResourceConfig<Reason> = {
  path: 'reasons',
  title: 'Reasons',
  icon: '🌹',
  singular: 'Reason',
  blurb: 'Short is better than long. These get pulled one at a time, at random.',
  fields: [
    {
      name: 'text',
      label: 'The reason',
      type: 'textarea',
      rows: 3,
      required: true,
      placeholder: 'Because she smiles with her whole face.',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        opt('love', '❤️ Something I love'),
        opt('funny', '😂 Something funny'),
        opt('cute', '🥺 Something cute'),
        opt('attractive', '🔥 Something attractive'),
        opt('appreciate', '🫶 Something I appreciate'),
        opt('proud', '🌱 Something I am proud of'),
        opt('thought', '💭 A random thought'),
      ],
    },
    {
      name: 'about',
      label: 'This is about',
      type: 'select',
      options: [opt('her', 'Her'), opt('me', 'Me')],
    },
  ],
  emptyValues: { text: '', category: 'love', about: 'her', createdBy: 'me' },
  primary: (r) => r.text,
  secondary: (r) => `${r.category} · about ${r.about} · shown ${r.timesShown}×`,
};

/* ── 🌌 Universe ──────────────────────────────────────────────── */
export const starsConfig: ResourceConfig<UniverseStar> = {
  path: 'stars',
  title: 'Universe Stars',
  icon: '⭐',
  singular: 'Star',
  blurb: 'Each one becomes a real, clickable star in the sky. Position is chosen for you unless you set it.',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true },
    {
      name: 'type',
      label: 'Type',
      type: 'select',
      options: [
        opt('memory', '⭐ Memory'),
        opt('date', '🌙 Important date'),
        opt('love', '💫 Something I love'),
        opt('moment', '❤️ Special moment'),
        opt('secret', '🎁 Secret'),
        opt('photo', '📸 Photo memory'),
        opt('funny', '😂 Funny moment'),
        opt('letter', '💌 Letter'),
        opt('place', '🗺️ Place'),
        opt('note', '📝 Note'),
      ],
    },
    { name: 'message', label: 'Message', type: 'textarea', rows: 4 },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'photos', label: 'Photos', type: 'mediaMulti', max: 12, accept: 'image/*' },
    {
      name: 'visibility',
      label: 'Visibility',
      type: 'select',
      options: [
        opt('visible', 'Visible now'),
        opt('unlock_at', 'Unlocks on a date'),
        opt('hidden', 'Hidden'),
      ],
    },
    { name: 'unlockAt', label: 'Unlocks on', type: 'date' },
    {
      name: 'isSecret',
      label: 'Secret star',
      type: 'toggle',
      hint: 'Only appears once she finds it.',
    },
    {
      name: 'groupKey',
      label: 'Constellation',
      type: 'text',
      placeholder: 'Stars sharing this name get joined by lines',
    },
  ],
  emptyValues: {
    title: '',
    type: 'memory',
    message: '',
    date: '',
    photos: [],
    visibility: 'visible',
    unlockAt: '',
    isSecret: false,
    groupKey: '',
    createdBy: 'me',
  },
  primary: (s) => s.title,
  secondary: (s) =>
    [s.type, s.visibility !== 'visible' ? s.visibility : null, formatDate(s.date)]
      .filter(Boolean)
      .join(' · '),
  thumbnail: (s) => s.photos?.[0],
};

/* ── 💌 Open When ─────────────────────────────────────────────── */
export const lettersConfig: ResourceConfig<OpenWhenLetter> = {
  path: 'letters',
  title: 'Open When…',
  icon: '💌',
  singular: 'Letter',
  blurb: 'Write it the way you would actually say it. She only sees the situation until she opens it.',
  fields: [
    {
      name: 'situation',
      label: 'Open when…',
      type: 'text',
      required: true,
      placeholder: "you're missing me",
    },
    { name: 'body', label: 'The letter', type: 'textarea', rows: 10, required: true },
    { name: 'photos', label: 'Photos', type: 'mediaMulti', max: 8, accept: 'image/*' },
    { name: 'audio', label: 'Voice note', type: 'media', accept: 'audio/*' },
    {
      name: 'unlockRule',
      label: 'When can it be opened',
      type: 'select',
      options: [
        opt('always', 'Any time'),
        opt('after_date', 'After a date'),
        opt('once', 'Once only'),
      ],
    },
    { name: 'unlockAt', label: 'Opens after', type: 'date' },
    { name: 'sealColor', label: 'Wax seal colour', type: 'color' },
  ],
  emptyValues: {
    situation: '',
    body: '',
    photos: [],
    audio: null,
    unlockRule: 'always',
    unlockAt: '',
    sealColor: '#c9566b',
    createdBy: 'me',
  },
  primary: (l) => `Open when ${l.situation}`,
  secondary: (l) => (l.unlockRule === 'always' ? 'any time' : l.unlockRule.replace('_', ' ')),
  thumbnail: (l) => l.photos?.[0],
};

/* ── 🫣 Confessions ───────────────────────────────────────────── */
export const confessionsConfig: ResourceConfig<Confession> = {
  path: 'confessions',
  title: 'Confessions',
  icon: '🫣',
  singular: 'Confession',
  blurb: 'The prompt sets it up; the confession lands it.',
  fields: [
    {
      name: 'prompt',
      label: 'Prompt',
      type: 'text',
      required: true,
      placeholder: "I've never told you this, but…",
    },
    { name: 'text', label: 'The confession', type: 'textarea', rows: 6, required: true },
    { name: 'photo', label: 'Photo', type: 'media', accept: 'image/*' },
    { name: 'date', label: 'When this was true', type: 'date' },
    {
      name: 'lockRule',
      label: 'Reveal',
      type: 'select',
      options: [
        opt('none', 'Straight away'),
        opt('hold', 'Hold to reveal'),
        opt('after_date', 'After a date'),
      ],
    },
    { name: 'unlockAt', label: 'Unlocks on', type: 'date' },
  ],
  emptyValues: {
    prompt: '',
    text: '',
    photo: null,
    date: '',
    lockRule: 'none',
    unlockAt: '',
    createdBy: 'me',
  },
  primary: (c) => c.prompt,
  secondary: (c) => (c.text ?? '').slice(0, 90),
  thumbnail: (c) => c.photo,
};

/* ── 🗓️ Important Dates ───────────────────────────────────────── */
export const datesConfig: ResourceConfig<ImportantDate> = {
  path: 'dates',
  title: 'Important Dates',
  icon: '🗓️',
  singular: 'Date',
  blurb: 'Mark one as the anchor — that is the date the "days together" counter runs from.',
  fields: [
    { name: 'title', label: 'What is it', type: 'text', required: true },
    { name: 'date', label: 'The date', type: 'date', required: true },
    { name: 'emoji', label: 'Emoji', type: 'text', placeholder: '❤️' },
    { name: 'description', label: 'Description', type: 'textarea', rows: 3 },
    { name: 'message', label: 'A message for the day', type: 'textarea', rows: 3 },
    { name: 'location', label: 'Where', type: 'text' },
    { name: 'photo', label: 'Photo', type: 'media', accept: 'image/*' },
    {
      name: 'recurrence',
      label: 'Repeats',
      type: 'select',
      options: [opt('none', 'Once'), opt('yearly', 'Every year')],
    },
    {
      name: 'isAnchor',
      label: 'This is our anchor date',
      type: 'toggle',
      hint: 'Only one date can be the anchor — setting this clears the others.',
    },
  ],
  emptyValues: {
    title: '',
    date: '',
    emoji: '❤️',
    description: '',
    message: '',
    location: '',
    photo: null,
    recurrence: 'none',
    isAnchor: false,
    createdBy: 'me',
  },
  primary: (d) => `${d.emoji} ${d.title}`,
  secondary: (d) =>
    [formatDate(d.date), d.recurrence === 'yearly' ? 'yearly' : null, d.isAnchor ? '⚓ anchor' : null]
      .filter(Boolean)
      .join(' · '),
  thumbnail: (d) => d.photo,
};
