// Quick self-test (no database needed): npm test
const assert = require('assert');
const { validateEmail, validatePassword } = require('./validators');
const { generate } = require('./scheduler');

// Email checks
['a@b.com', 'hassaan.obaid@gmail.com', 'x_y+z@uni.edu.pk'].forEach((e) => assert.strictEqual(validateEmail(e), null, e));
['', 'abc', 'abc@', '@gmail.com', 'a@b', 'a b@c.com', 'a@@b.com'].forEach((e) => assert.ok(validateEmail(e), 'should reject ' + e));

// Password checks
assert.deepStrictEqual(validatePassword('Abcd@1234'), []);
assert.ok(validatePassword('abcd@1234').length);   // no capital
assert.ok(validatePassword('ABCD@1234').length);   // no small
assert.ok(validatePassword('Abcdefg@').length);    // no number
assert.ok(validatePassword('Abcd12345').length);   // no special
assert.ok(validatePassword('Ab@1').length);        // too short
console.log('Validators OK');

// Scheduler check with demo-sized data
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const times = [['08:30:00', '10:00:00'], ['10:00:00', '11:30:00'], ['11:30:00', '13:00:00'], ['14:00:00', '15:30:00'], ['15:30:00', '17:00:00']];
let id = 1; const slots = [];
days.forEach((d) => times.forEach(([s, e]) => slots.push({ id: id++, day: d, start_time: s, end_time: e })));
const sections = [{ id: 1, name: 'A', size: 40 }, { id: 2, name: 'B', size: 35 }];
const rooms = [{ id: 1, name: 'R1', capacity: 50, is_lab: 0 }, { id: 2, name: 'R2', capacity: 45, is_lab: 0 }, { id: 3, name: 'R3', capacity: 40, is_lab: 0 }, { id: 4, name: 'L1', capacity: 45, is_lab: 1 }];
let cid = 1; const courses = [];
[1, 2].forEach((sec) => [[1, 3, 0], [2, 3, 0], [3, 2, 0], [4, 1, 1]].forEach(([t, n, lab]) =>
  courses.push({ id: cid++, code: 'C' + t, name: 'Course' + t, classes_per_week: n, is_lab: lab, teacher_id: t, teacher_name: 'T' + t, section_id: sec, section_name: 'S' + sec })));
const unavailable = new Set(slots.filter((s) => s.day === 'Monday').map((s) => `1:${s.id}`));

const r = generate({ courses, rooms, slots, sections, unavailable });
assert.strictEqual(r.unplaced.length, 0);
assert.strictEqual(r.placed, r.total);
const seen = { t: new Set(), s: new Set(), r: new Set() };
const byCourse = new Map(courses.map((c) => [c.id, c])); const slotBy = new Map(slots.map((s) => [s.id, s]));
r.assignments.forEach((a) => {
  const c = byCourse.get(a.course_id);
  for (const [k, key] of [['t', `${c.teacher_id}:${a.slot_id}`], ['s', `${c.section_id}:${a.slot_id}`], ['r', `${a.room_id}:${a.slot_id}`]]) {
    assert.ok(!seen[k].has(key), 'double booking ' + key); seen[k].add(key);
  }
  assert.ok(!unavailable.has(`${c.teacher_id}:${a.slot_id}`), 'teacher unavailable slot used');
  assert.strictEqual(!!rooms.find((x) => x.id === a.room_id).is_lab, !!c.is_lab);
});
console.log(`Scheduler OK: ${r.placed}/${r.total} placed, gaps=${r.gaps}, ${r.ms}ms`);

// Impossible case is reported, not crashed
const bad = generate({ courses: [{ ...courses[0], classes_per_week: 5, is_lab: 1 }], rooms: [rooms[0]], slots, sections, unavailable: new Set() });
assert.ok(bad.unplaced.length > 0);
console.log('Unplaceable case reported OK');
