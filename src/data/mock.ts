import { TODAY_ISO } from './calendar';
import { C } from './palette';
import type {
  Archetype, Assignment, Course, Enrollment, Intervention, Professor, Student, SubStatus, Thread,
} from './types';

/* ---------- deterministic randomness so the demo looks the same on every load ---------- */

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const clamp = (v: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, v));
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z]+/g, '-');

/* ---------- people ---------- */

export const professors: Professor[] = [
  { id: 'whitfield', name: 'Dr. Sarah Whitfield', last: 'Whitfield', title: 'Associate Professor · College of Arts & Sciences', initials: 'SW' },
  { id: 'hale', name: 'Prof. Marcus Hale', last: 'Hale', title: 'School of Business', initials: 'MH' },
  { id: 'price', name: 'Dr. Naomi Price', last: 'Price', title: 'School of Christian Leadership', initials: 'NP' },
];

const NAMES: [string, string, string, string][] = [
  ['Maya', 'Johnson', 'Freshman', 'Business Administration'],
  ['Jordan', 'Lee', 'Freshman', 'Communication'],
  ['Ethan', 'Brooks', 'Sophomore', 'Kinesiology'],
  ['Hannah', 'Kim', 'Freshman', 'Psychology'],
  ['Caleb', 'Martinez', 'Freshman', 'Business Administration'],
  ['Olivia', 'Chen', 'Sophomore', 'Biology'],
  ['Isaiah', 'Thompson', 'Freshman', 'Christian Leadership'],
  ['Grace', 'Okonkwo', 'Freshman', 'Nursing'],
  ['Noah', 'Williams', 'Sophomore', 'Business Administration'],
  ['Sofia', 'Ramirez', 'Freshman', 'Liberal Studies'],
  ['Elijah', 'Davis', 'Freshman', 'Kinesiology'],
  ['Abigail', 'Turner', 'Sophomore', 'English'],
  ['Lucas', 'Anderson', 'Freshman', 'Computer Science'],
  ['Chloe', 'Nguyen', 'Freshman', 'Psychology'],
  ['Micah', 'Robinson', 'Sophomore', 'Psychology'],
  ['Ava', 'Patel', 'Sophomore', 'Biology'],
  ['Samuel', 'Wright', 'Junior', 'Psychology'],
  ['Lily', 'Hernandez', 'Sophomore', 'Liberal Studies'],
  ['Josiah', 'Carter', 'Junior', 'Biblical Studies'],
  ['Natalie', 'Foster', 'Sophomore', 'Nursing'],
  ['Gabriel', 'Scott', 'Junior', 'Business Administration'],
  ['Zoe', 'Mitchell', 'Junior', 'Psychology'],
  ['Aaron', 'Collins', 'Senior', 'Business Administration'],
  ['Emma', 'Rivera', 'Junior', 'Communication'],
  ['Levi', 'Bennett', 'Junior', 'Christian Leadership'],
  ['Priya', 'Nair', 'Sophomore', 'Psychology'],
  ['Owen', 'Campbell', 'Senior', 'Business Administration'],
  ['Leah', 'Sullivan', 'Sophomore', 'Liberal Studies'],
  ['Christian', 'Ortiz', 'Junior', 'Business Administration'],
  ['Ruth', 'Adeyemi', 'Senior', 'Organizational Leadership'],
  ['Jonah', 'Fischer', 'Junior', 'Biblical Studies'],
  ['Kayla', 'Washington', 'Sophomore', 'Psychology'],
  ['Tyler', 'Evans', 'Senior', 'Business Administration'],
  ['Mia', 'Castillo', 'Junior', 'Nursing'],
  ['Benjamin', 'Ward', 'Senior', 'Organizational Leadership'],
  ['Faith', 'Gutierrez', 'Sophomore', 'Psychology'],
  ['Andrew', 'Coleman', 'Junior', 'Business Administration'],
  ['Esther', 'Lin', 'Sophomore', 'Biology'],
  ['Daniel', 'Park', 'Senior', 'Business Administration'],
  ['Madison', 'Hughes', 'Junior', 'Communication'],
  ['Nathan', 'Reyes', 'Sophomore', 'Kinesiology'],
  ['Isabella', 'Morales', 'Junior', 'Psychology'],
  ['Joshua', 'Bailey', 'Senior', 'Organizational Leadership'],
  ['Rebecca', 'Stone', 'Sophomore', 'Liberal Studies'],
  ['Marcus', 'Allen', 'Junior', 'Business Administration'],
];

export const students: Student[] = NAMES.map(([first, last, year, major]) => ({
  id: slug(`${first} ${last}`),
  name: `${first} ${last}`,
  first,
  initials: `${first[0]}${last[0]}`,
  year,
  major,
}));

export const DEMO_PROFESSOR = 'whitfield';
export const DEMO_STUDENT = 'maya-johnson';

/* ---------- courses (as they'd arrive from Canvas) ---------- */

type AssignmentRow = [title: string, type: Assignment['type'], concept: string, due: string];

interface CourseDef {
  id: string;
  code: string;
  title: string;
  professorId: string;
  schedule: string;
  color: string;
  concepts: string[];
  focus: string;
  secondary: string;
  roster: number[];
  base: number;
  engCurve: number[];
  mix: { high: number; watch: number; rising: number };
  /** How many "watch" students share the focus concept as their weakest. */
  focusShare: number;
  assignments: AssignmentRow[];
}

const COURSE_DEFS: CourseDef[] = [
  {
    id: 'eng101', code: 'ENG 101', title: 'College Composition', professorId: 'whitfield', schedule: 'MWF · 9:00 AM',
    color: C.blue, concepts: ['Research', 'Thesis Development', 'Evidence', 'Structure'],
    focus: 'Thesis Development', secondary: 'Evidence', roster: range(0, 27), base: 84,
    engCurve: [88, 90, 91, 92, 93, 94, 93, 91], mix: { high: 3, watch: 6, rising: 4 }, focusShare: 4,
    assignments: [
      ['Literacy Narrative', 'Essay', 'Structure', '2026-09-04'],
      ['Source Evaluation Worksheet', 'Worksheet', 'Research', '2026-09-14'],
      ['Annotated Bibliography', 'Project', 'Research', '2026-09-25'],
      ['Discussion: Counterarguments', 'Discussion', 'Evidence', '2026-10-02'],
      ['Thesis Workshop', 'Worksheet', 'Thesis Development', '2026-10-07'],
      ['Rhetorical Analysis', 'Essay', 'Evidence', '2026-10-09'],
      ['Essay Draft: Argument Essay', 'Essay', 'Thesis Development', '2026-10-16'],
      ['Peer Review', 'Discussion', 'Structure', '2026-10-21'],
      ['Argument Essay — Final', 'Essay', 'Thesis Development', '2026-10-30'],
    ],
  },
  {
    id: 'bus320', code: 'BUS 320', title: 'Organizational Leadership', professorId: 'whitfield', schedule: 'TR · 1:30 PM',
    color: C.navy, concepts: ['Leadership Theory', 'Team Dynamics', 'Change Management', 'Ethical Decision-Making'],
    focus: 'Change Management', secondary: 'Team Dynamics', roster: range(20, 43), base: 88,
    engCurve: [80, 82, 83, 84, 85, 85, 87, 88], mix: { high: 1, watch: 3, rising: 6 }, focusShare: 2,
    assignments: [
      ['Leadership Style Inventory', 'Reflection', 'Leadership Theory', '2026-09-03'],
      ['Case Study: Southwest Airlines', 'Project', 'Team Dynamics', '2026-09-17'],
      ['Quiz 1: Leadership Theories', 'Quiz', 'Leadership Theory', '2026-09-24'],
      ['Team Charter', 'Project', 'Team Dynamics', '2026-10-01'],
      ['Discussion: Leading Through Change', 'Discussion', 'Change Management', '2026-10-06'],
      ['Quiz 2: Change Models', 'Quiz', 'Change Management', '2026-10-08'],
      ['Change Plan Proposal', 'Project', 'Change Management', '2026-10-15'],
      ['Ethics Case Reflection', 'Reflection', 'Ethical Decision-Making', '2026-10-22'],
      ['Midterm Exam', 'Exam', 'Leadership Theory', '2026-10-27'],
    ],
  },
  {
    id: 'psy210', code: 'PSY 210', title: 'Human Development', professorId: 'whitfield', schedule: 'MW · 11:00 AM',
    color: C.peri, concepts: ['Developmental Theories', 'Research Methods', 'Cognitive Development', 'Social-Emotional Development'],
    focus: 'Research Methods', secondary: 'Cognitive Development', roster: [0, ...range(14, 44)], base: 84,
    engCurve: [86, 87, 86, 86, 85, 86, 84, 82], mix: { high: 2, watch: 5, rising: 5 }, focusShare: 3,
    assignments: [
      ['Quiz 1: Developmental Theories', 'Quiz', 'Developmental Theories', '2026-09-02'],
      ['Observation Journal 1', 'Reflection', 'Social-Emotional Development', '2026-09-11'],
      ['Research Methods Lab', 'Project', 'Research Methods', '2026-09-21'],
      ['Quiz 2: Prenatal & Infancy', 'Quiz', 'Cognitive Development', '2026-09-30'],
      ['Discussion: Nature vs. Nurture', 'Discussion', 'Developmental Theories', '2026-10-05'],
      ['Quiz 3: Early Childhood', 'Quiz', 'Cognitive Development', '2026-10-07'],
      ['Quiz 4: Cognitive Development', 'Quiz', 'Cognitive Development', '2026-10-14'],
      ['Observation Journal 2', 'Reflection', 'Social-Emotional Development', '2026-10-19'],
      ['Midterm Exam', 'Exam', 'Research Methods', '2026-10-26'],
    ],
  },
  {
    id: 'bib230', code: 'BIB 230', title: 'Biblical Interpretation', professorId: 'whitfield', schedule: 'TR · 9:30 AM',
    color: C.slate, concepts: ['Historical Context', 'Literary Genre', 'Exegetical Method', 'Application'],
    focus: 'Exegetical Method', secondary: 'Historical Context', roster: range(3, 24), base: 89,
    engCurve: [84, 86, 87, 88, 89, 89, 91, 92], mix: { high: 1, watch: 2, rising: 5 }, focusShare: 2,
    assignments: [
      ['Genre Identification Exercise', 'Worksheet', 'Literary Genre', '2026-09-03'],
      ['Historical Background Paper', 'Essay', 'Historical Context', '2026-09-15'],
      ['Quiz 1: Hermeneutical Principles', 'Quiz', 'Exegetical Method', '2026-09-24'],
      ['Discussion: Parables', 'Discussion', 'Literary Genre', '2026-10-01'],
      ['Word Study', 'Project', 'Exegetical Method', '2026-10-06'],
      ['Passage Outline: Philippians 2', 'Worksheet', 'Exegetical Method', '2026-10-08'],
      ['Exegetical Paper — Draft', 'Essay', 'Exegetical Method', '2026-10-15'],
      ['Application Reflection', 'Reflection', 'Application', '2026-10-22'],
      ['Midterm Exam', 'Exam', 'Historical Context', '2026-10-29'],
    ],
  },
  {
    id: 'bus201', code: 'BUS 201', title: 'Principles of Marketing', professorId: 'hale', schedule: 'TR · 11:00 AM',
    color: C.navy, concepts: ['Market Research', 'Consumer Behavior', 'Marketing Mix', 'Brand Strategy'],
    focus: 'Consumer Behavior', secondary: 'Brand Strategy', roster: [0, ...range(28, 44), ...range(5, 12)], base: 85,
    engCurve: [84, 85, 85, 86, 87, 86, 88, 88], mix: { high: 1, watch: 3, rising: 5 }, focusShare: 2,
    assignments: [
      ['Quiz 1: Marketing Mix', 'Quiz', 'Marketing Mix', '2026-09-04'],
      ['Consumer Journey Map', 'Project', 'Consumer Behavior', '2026-09-16'],
      ['Discussion: Brand Loyalty', 'Discussion', 'Brand Strategy', '2026-09-25'],
      ['SWOT Analysis', 'Project', 'Market Research', '2026-10-02'],
      ['Quiz 2: Segmentation', 'Quiz', 'Consumer Behavior', '2026-10-06'],
      ['Competitor Scan', 'Worksheet', 'Market Research', '2026-10-09'],
      ['Market Research Brief', 'Project', 'Market Research', '2026-10-15'],
      ['Quiz 3: Pricing', 'Quiz', 'Marketing Mix', '2026-10-20'],
      ['Brand Strategy Pitch', 'Project', 'Brand Strategy', '2026-10-28'],
    ],
  },
  {
    id: 'bib110', code: 'BIB 110', title: 'Old Testament Survey', professorId: 'price', schedule: 'MWF · 10:00 AM',
    color: C.slate, concepts: ['Pentateuch', 'Historical Books', 'Wisdom Literature', 'Prophets'],
    focus: 'Prophets', secondary: 'Wisdom Literature', roster: [0, ...range(15, 43)], base: 87,
    engCurve: [85, 86, 86, 87, 87, 88, 88, 89], mix: { high: 1, watch: 3, rising: 4 }, focusShare: 2,
    assignments: [
      ['Quiz: Genesis', 'Quiz', 'Pentateuch', '2026-09-04'],
      ['Reading Reflection: Exodus', 'Reflection', 'Pentateuch', '2026-09-14'],
      ['Map Exercise: Conquest', 'Worksheet', 'Historical Books', '2026-09-23'],
      ['Quiz: Kings & Chronicles', 'Quiz', 'Historical Books', '2026-10-02'],
      ['Discussion: Job', 'Discussion', 'Wisdom Literature', '2026-10-07'],
      ['Reading Reflection: Proverbs', 'Reflection', 'Wisdom Literature', '2026-10-09'],
      ['Reading Reflection: Psalms', 'Reflection', 'Wisdom Literature', '2026-10-19'],
      ['Quiz: Major Prophets', 'Quiz', 'Prophets', '2026-10-23'],
      ['Midterm Exam', 'Exam', 'Pentateuch', '2026-10-30'],
    ],
  },
];

/* ---------- hand-authored students the demo story is built around ---------- */

interface Spec {
  archetype: Archetype;
  current?: number;
  predicted?: number;
  engDrop?: number;
  momentum?: number;
  weak?: string;
  grades?: number[];
  mastery?: Record<string, number>;
  masteryPrev?: Record<string, number>;
  pattern?: SubStatus[];
  lastActive?: string;
  baselineVisits?: number;
}

const onTime: SubStatus[] = ['on-time', 'on-time', 'on-time', 'on-time', 'on-time', 'on-time'];

const SPECS: Record<string, Record<string, Spec>> = {
  eng101: {
    'maya-johnson': {
      archetype: 'high', current: 81, predicted: 68, engDrop: 0.37, momentum: -8, weak: 'Thesis Development',
      grades: [86, 88, 87, 85, 86, 84, 83, 81],
      mastery: { Research: 89, 'Thesis Development': 58, Evidence: 76, Structure: 82 },
      masteryPrev: { Research: 88, 'Thesis Development': 71, Evidence: 78, Structure: 82 },
      pattern: ['on-time', 'on-time', 'on-time', 'missing', 'late', 'late'], lastActive: '4 days ago', baselineVisits: 6,
    },
    'jordan-lee': {
      archetype: 'watch', current: 76, predicted: 71, engDrop: 0.12, weak: 'Thesis Development',
      mastery: { Research: 80, 'Thesis Development': 61, Evidence: 74, Structure: 77 },
      masteryPrev: { 'Thesis Development': 68 }, pattern: onTime, lastActive: 'Yesterday',
    },
    'ethan-brooks': {
      archetype: 'watch', current: 79, predicted: 74, weak: 'Thesis Development',
      mastery: { Research: 84, 'Thesis Development': 72, Evidence: 78, Structure: 80 },
      masteryPrev: { 'Thesis Development': 70 },
    },
  },
  psy210: {
    'maya-johnson': {
      archetype: 'steady', current: 84, predicted: 86, momentum: 5, engDrop: -0.03, pattern: onTime, lastActive: 'Today',
      mastery: { 'Developmental Theories': 82, 'Research Methods': 72, 'Cognitive Development': 80, 'Social-Emotional Development': 78 },
    },
  },
  bus201: {
    'maya-johnson': {
      archetype: 'rising', current: 88, predicted: 91, momentum: 12, pattern: onTime, lastActive: 'Today',
      grades: [80, 81, 83, 84, 85, 86, 87, 88],
      mastery: { 'Market Research': 86, 'Consumer Behavior': 78, 'Marketing Mix': 81, 'Brand Strategy': 75 },
      masteryPrev: { 'Market Research': 79, 'Consumer Behavior': 74 },
    },
  },
  bib110: {
    'maya-johnson': {
      archetype: 'steady', current: 90, predicted: 92, momentum: 7, pattern: onTime, lastActive: 'Yesterday',
      mastery: { Pentateuch: 84, 'Historical Books': 80, 'Wisdom Literature': 76, Prophets: 72 },
    },
  },
};

/* ---------- build enrollments ---------- */

const WEEKS = 8;

function buildEnrollment(course: Course, def: CourseDef, studentId: string, spec: Spec): Enrollment {
  const r = mulberry32(hash(course.id + studentId));
  const pick = (lo: number, hi: number) => lo + r() * (hi - lo);
  const oneOf = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const a = spec.archetype;

  const current = spec.current ?? Math.round(
    a === 'steady' ? pick(def.base - 5, def.base + 7)
      : a === 'rising' ? pick(def.base - 8, def.base + 3)
        : a === 'watch' ? pick(73, 83) : pick(70, 80),
  );
  const predicted = spec.predicted ?? Math.round(clamp(
    a === 'steady' ? current + pick(-2, 2.5)
      : a === 'rising' ? current + pick(2, 5)
        : a === 'watch' ? current - pick(4, 7) : Math.min(69, current - pick(9, 12)),
  ));

  const slope = a === 'rising' ? pick(0.5, 1.1) : a === 'steady' ? pick(-0.25, 0.3) : a === 'watch' ? pick(-0.9, -0.35) : pick(-1.2, -0.6);
  const grades = spec.grades ?? Array.from({ length: WEEKS }, (_, i) =>
    i === WEEKS - 1 ? current : Math.round(clamp(current - slope * (WEEKS - 1 - i) + pick(-1.5, 1.5))));

  const factor = pick(0.9, 1.05);
  const raw = def.engCurve.map((v) => clamp(v * factor + pick(-2.5, 2.5), 25, 100));
  if (spec.engDrop !== undefined) {
    raw[6] = raw[5] * (1 - spec.engDrop / 2);
    raw[7] = raw[5] * (1 - spec.engDrop);
  } else {
    const drop = a === 'high' ? pick(0.22, 0.33) : a === 'watch' ? pick(0.08, 0.2) : a === 'rising' ? -pick(0.02, 0.08) : pick(-0.03, 0.04);
    raw[6] *= 1 - drop / 2;
    raw[7] *= 1 - drop;
  }
  const engagement = raw.map((v) => Math.round(clamp(v, 20, 100)));
  const engagementChange = Math.round(((engagement[7] - engagement[5]) / engagement[5]) * 100);
  const momentum = spec.momentum ?? Math.round((((grades[7] - grades[5]) / grades[5] + (engagement[7] - engagement[5]) / engagement[5]) / 2) * 100);

  const mastery = def.concepts.map((concept) => {
    let value = spec.mastery?.[concept];
    if (value === undefined) {
      value = current + pick(-4, 4);
      if (concept === def.focus) value -= pick(2, 6);
      if (concept === spec.weak) value -= a === 'high' ? pick(16, 22) : pick(10, 15);
      value = Math.round(clamp(value, 38, 99));
    }
    let prev = spec.masteryPrev?.[concept];
    if (prev === undefined) {
      const shift = concept === spec.weak ? pick(5, 10) : a === 'rising' ? -pick(2, 6) : pick(-3, 3);
      prev = Math.round(clamp(value + shift, 30, 100));
    }
    return { concept, value, prev };
  });
  if (spec.weak && !spec.mastery) {
    const weakItem = mastery.find((m) => m.concept === spec.weak)!;
    const lowestOther = Math.min(...mastery.filter((m) => m !== weakItem).map((m) => m.value));
    weakItem.value = Math.min(weakItem.value, lowestOther - 3);
  }

  const past = course.assignments.filter((x) => x.due <= TODAY_ISO);
  const submissions = past.map((assignment, i) => {
    const fromEnd = past.length - 1 - i;
    const status: SubStatus = spec.pattern?.[i] ?? (
      a === 'high' ? (fromEnd < 2 ? (r() < 0.45 ? 'late' : r() < 0.4 ? 'missing' : 'on-time') : r() < 0.12 ? 'late' : 'on-time')
        : a === 'watch' ? (fromEnd < 2 && r() < 0.35 ? 'late' : 'on-time')
          : a === 'rising' ? (fromEnd > 3 && r() < 0.2 ? 'late' : 'on-time')
            : r() < 0.05 ? 'late' : 'on-time');
    const week = Math.min(WEEKS - 1, Math.floor((i * WEEKS) / past.length));
    const score = status === 'missing' ? undefined : Math.round(clamp(grades[week] + pick(-6, 5) - (status === 'late' ? 4 : 0), 40, 100));
    return { assignmentId: assignment.id, status, score };
  });

  const baselineVisits = spec.baselineVisits ?? Math.round(pick(4, 7));
  const earlyAvg = engagement.slice(0, 6).reduce((s, v) => s + v, 0) / 6;
  const visits = engagement.map((e) => Math.round(clamp((baselineVisits * e) / earlyAvg + pick(-0.6, 0.6), 0, 14)));
  const submitted = submissions.filter((s) => s.status !== 'missing').length;

  return {
    id: `${course.id}:${studentId}`,
    courseId: course.id,
    studentId,
    archetype: a,
    risk: a === 'high' ? 'high' : a === 'watch' ? 'moderate' : 'low',
    current,
    predicted,
    band: a === 'high' ? 7 : a === 'watch' ? 5 : 3,
    grades,
    engagement,
    engagementChange,
    momentum,
    mastery,
    weak: spec.weak,
    submissions,
    visits,
    baselineVisits,
    participation: Math.round(clamp(engagement[7] * pick(0.88, 1.04))),
    completion: Math.round((submitted / past.length) * 100),
    lastActive: spec.lastActive ?? (a === 'high' ? oneOf(['5 days ago', '6 days ago', '4 days ago'])
      : a === 'watch' ? oneOf(['2 days ago', '3 days ago', 'Yesterday']) : oneOf(['Today', 'Today', 'Yesterday'])),
  };
}

export const courses: Course[] = [];
export const enrollments: Enrollment[] = [];

for (const def of COURSE_DEFS) {
  const course: Course = {
    id: def.id, code: def.code, title: def.title, professorId: def.professorId, schedule: def.schedule,
    concepts: def.concepts, focus: def.focus, color: def.color,
    assignments: def.assignments.map(([title, type, concept, due], i) => ({
      id: `${def.id}-a${i + 1}`, courseId: def.id, title, type, concept, due, points: type === 'Discussion' ? 20 : 100,
    })),
    roster: def.roster.map((i) => students[i].id),
  };
  courses.push(course);

  const r = mulberry32(hash(def.id));
  const specs: Record<string, Spec> = { ...(SPECS[def.id] ?? {}) };
  const free = course.roster.filter((id) => !specs[id]);
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }

  const remaining = { ...def.mix };
  Object.values(specs).forEach((s) => { if (s.archetype !== 'steady') remaining[s.archetype]--; });
  let cursor = 0;
  (['high', 'watch', 'rising'] as const).forEach((arch) => {
    for (let k = 0; k < Math.max(0, remaining[arch]); k++) specs[free[cursor++]] = { archetype: arch };
  });
  free.slice(cursor).forEach((id) => { specs[id] = { archetype: 'steady' }; });

  // Give at-risk students a weakest concept so the class-level story is coherent.
  const others = def.concepts.filter((c) => c !== def.focus && c !== def.secondary);
  const watchIds = course.roster.filter((id) => specs[id].archetype === 'watch');
  let focusLeft = def.focusShare - watchIds.filter((id) => specs[id].weak === def.focus).length;
  watchIds.forEach((id) => {
    if (specs[id].weak) return;
    specs[id].weak = focusLeft-- > 0 ? def.focus : def.secondary;
  });
  course.roster.filter((id) => specs[id].archetype === 'high').forEach((id, i) => {
    specs[id].weak ??= [def.focus, def.secondary, ...others][i % def.concepts.length];
  });

  course.roster.forEach((id) => enrollments.push(buildEnrollment(course, def, id, specs[id])));
}

/* ---------- intervention history (the "Prove" layer) ---------- */

const pickEnrollment = (courseId: string, archetype: Archetype, nth: number, exclude: string[] = []) =>
  enrollments.filter((e) => e.courseId === courseId && e.archetype === archetype && !exclude.includes(e.studentId))[nth];

function firstName(e: Enrollment) {
  return students.find((s) => s.id === e.studentId)!.first;
}

export const interventions: Intervention[] = [
  {
    id: 'iv-ethan-thesis', enrollmentId: 'eng101:ethan-brooks', title: 'Thesis Development review', concept: 'Thesis Development',
    status: 'improved', masteryFrom: 58, masteryTo: 72, riskFrom: 'high', riskTo: 'moderate',
    steps: [
      { date: '2026-09-04', kind: 'action', text: 'You sent a Thesis Development review' },
      { date: '2026-09-06', kind: 'student', text: 'Ethan completed the review in Canvas' },
      { date: '2026-09-08', kind: 'outcome', text: 'Mastery increased 58% → 72%' },
    ],
  },
  {
    id: 'iv-maya-research', enrollmentId: 'eng101:maya-johnson', title: 'Research Sources review', concept: 'Research',
    status: 'improved', masteryFrom: 71, masteryTo: 89, riskFrom: 'moderate', riskTo: 'low',
    steps: [
      { date: '2026-09-04', kind: 'action', text: 'You sent a Research Sources review' },
      { date: '2026-09-06', kind: 'student', text: 'Maya completed the review' },
      { date: '2026-09-08', kind: 'outcome', text: 'Research mastery increased 71% → 89%' },
    ],
  },
];

const generated: [courseId: string, dates: [string, string, string]][] = [
  ['eng101', ['2026-09-21', '2026-09-22', '2026-09-26']],
  ['bus320', ['2026-09-18', '2026-09-19', '2026-09-24']],
  ['psy210', ['2026-09-23', '2026-09-24', '2026-09-29']],
  ['bib230', ['2026-09-16', '2026-09-17', '2026-09-22']],
];

for (const [courseId, [d1, d2, d3]] of generated) {
  const course = courses.find((c) => c.id === courseId)!;
  const reserved = ['maya-johnson', 'ethan-brooks', 'jordan-lee'];

  const checkIn = pickEnrollment(courseId, 'steady', 0, reserved);
  interventions.push({
    id: `iv-${checkIn.id}`, enrollmentId: checkIn.id, title: 'Check-in message', status: 'improved', riskFrom: 'moderate', riskTo: 'low',
    steps: [
      { date: d1, kind: 'action', text: 'You sent a check-in message' },
      { date: d2, kind: 'student', text: `${firstName(checkIn)} replied and submitted missing work` },
      { date: d3, kind: 'outcome', text: 'Engagement returned to personal baseline' },
    ],
  });

  const practice = pickEnrollment(courseId, 'rising', 0, reserved);
  const concept = course.concepts.find((c) => c === course.focus)!;
  const to = practice.mastery.find((m) => m.concept === concept)!.value;
  interventions.push({
    id: `iv-${practice.id}`, enrollmentId: practice.id, title: `${concept} practice set`, concept, status: 'improved',
    masteryFrom: to - 13, masteryTo: to, riskFrom: 'moderate', riskTo: 'low',
    steps: [
      { date: d2, kind: 'action', text: `You assigned a ${concept} practice set` },
      { date: d3, kind: 'student', text: `${firstName(practice)} completed it in Canvas` },
      { date: '2026-10-01', kind: 'outcome', text: `Mastery increased ${to - 13}% → ${to}%` },
    ],
  });

  const measuring = pickEnrollment(courseId, 'watch', 0, reserved);
  if (measuring) {
    interventions.push({
      id: `iv-${measuring.id}`, enrollmentId: measuring.id, title: `${measuring.weak} resource`, concept: measuring.weak, status: 'measuring',
      steps: [
        { date: '2026-10-09', kind: 'action', text: `You shared a ${measuring.weak} resource` },
        { date: '2026-10-10', kind: 'student', text: `${firstName(measuring)} opened it in Canvas` },
        { date: '2026-10-16', kind: 'pending', text: 'Jessie is measuring impact — results expected Oct 16' },
      ],
    });
  }

  if (courseId === 'eng101' || courseId === 'psy210') {
    const stalled = pickEnrollment(courseId, 'high', 0, reserved);
    interventions.push({
      id: `iv-${stalled.id}`, enrollmentId: stalled.id, title: 'Check-in message', status: 'no-change', riskFrom: 'high', riskTo: 'high',
      steps: [
        { date: '2026-09-30', kind: 'action', text: 'You sent a check-in message' },
        { date: '2026-10-05', kind: 'student', text: 'No response after 5 days' },
        { date: '2026-10-07', kind: 'outcome', text: 'Engagement unchanged — Jessie suggests a different approach' },
      ],
    });
  }
}

/* ---------- messages ---------- */

export const seedThreads: Thread[] = [
  {
    id: 'whitfield:maya-johnson', professorId: 'whitfield', studentId: 'maya-johnson', courseId: 'eng101', unread: { professor: 0, student: 0 },
    messages: [
      { id: 'm1', from: 'student', time: '2026-10-02T10:14', text: 'Hi Dr. Whitfield — is it okay if my annotated bibliography uses two sources from the same journal?' },
      { id: 'm2', from: 'professor', time: '2026-10-02T11:02', text: "Yes, that's fine as long as they make different arguments. Your source work has been strong this term." },
      { id: 'm3', from: 'student', time: '2026-10-02T11:05', text: 'Great, thank you!' },
    ],
  },
  {
    id: 'whitfield:priya-nair', professorId: 'whitfield', studentId: 'priya-nair', courseId: 'psy210', unread: { professor: 1, student: 0 },
    messages: [
      { id: 'm1', from: 'student', time: '2026-10-13T09:12', text: 'Could we meet during office hours Thursday to go over the research methods quiz?' },
    ],
  },
  {
    id: 'whitfield:hannah-kim', professorId: 'whitfield', studentId: 'hannah-kim', courseId: 'eng101', unread: { professor: 1, student: 0 },
    messages: [
      { id: 'm1', from: 'professor', time: '2026-10-09T15:40', text: 'Hi Hannah — I noticed the source worksheet is still open in Canvas. Everything okay?' },
      { id: 'm2', from: 'student', time: '2026-10-12T16:45', text: 'Thank you for checking in. I had a rough week but I submitted it this morning.' },
    ],
  },
  {
    id: 'whitfield:jordan-lee', professorId: 'whitfield', studentId: 'jordan-lee', courseId: 'eng101', unread: { professor: 0, student: 0 },
    messages: [
      { id: 'm1', from: 'student', time: '2026-10-08T19:40', text: "I read your comments on the thesis workshop. I'm not sure how to make my thesis more specific without making it too narrow." },
      { id: 'm2', from: 'professor', time: '2026-10-09T08:15', text: "Good question. Try naming the claim, the reason, and the stakes in one sentence. Bring a draft to office hours Thursday and we'll work on it together." },
    ],
  },
  {
    id: 'whitfield:ethan-brooks', professorId: 'whitfield', studentId: 'ethan-brooks', courseId: 'eng101', unread: { professor: 0, student: 0 },
    messages: [
      { id: 'm1', from: 'professor', time: '2026-09-04T15:30', text: "Hi Ethan — I've added a short Thesis Development review to your Canvas modules. It should take about 15 minutes." },
      { id: 'm2', from: 'student', time: '2026-09-06T21:10', text: 'Finished it. The examples of arguable vs. factual claims really helped.' },
      { id: 'm3', from: 'professor', time: '2026-09-08T09:00', text: 'It shows — your last thesis was much sharper. Keep it up.' },
    ],
  },
  {
    id: 'hale:maya-johnson', professorId: 'hale', studentId: 'maya-johnson', courseId: 'bus201', unread: { professor: 0, student: 0 },
    messages: [
      { id: 'm1', from: 'professor', time: '2026-10-09T13:20', text: 'Maya, great job on the competitor scan — your analysis of pricing tiers was one of the strongest in the class.' },
      { id: 'm2', from: 'student', time: '2026-10-09T14:02', text: 'Thank you, Professor Hale! I really enjoyed that one.' },
    ],
  },
  {
    id: 'price:maya-johnson', professorId: 'price', studentId: 'maya-johnson', courseId: 'bib110', unread: { professor: 0, student: 1 },
    messages: [
      { id: 'm1', from: 'professor', time: '2026-10-12T08:30', text: 'Reminder: the Psalms reading reflection is due next Monday. Choose one lament psalm and trace how it moves toward trust.' },
    ],
  },
];
