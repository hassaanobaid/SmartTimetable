// Timetable scheduler: greedy placement + backtracking.
// Hard rules: no teacher/section/room double-booking, teacher availability,
// lab courses in lab rooms, room capacity >= section size.
// Soft rules (scored): fewer gaps for sections, same course on different days.
const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const STEP_LIMIT = 200000;

function generate({ courses, rooms, slots, sections, unavailable }) {
  const t0 = Date.now();
  const secSize = new Map(sections.map((s) => [s.id, s.size]));

  const sorted = [...slots].sort(
    (a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || String(a.start_time).localeCompare(String(b.start_time))
  );
  const perDay = {};
  sorted.forEach((s) => { perDay[s.day] = perDay[s.day] || 0; s.idx = perDay[s.day]++; });

  // Teacher free-slot counts (used to place the hardest classes first)
  const freeCount = new Map();
  for (const c of courses) {
    if (!freeCount.has(c.teacher_id))
      freeCount.set(c.teacher_id, sorted.filter((s) => !unavailable.has(`${c.teacher_id}:${s.id}`)).length);
  }

  const sessions = [];
  for (const c of courses) for (let k = 0; k < c.classes_per_week; k++) sessions.push({ course: c });
  sessions.sort(
    (a, b) =>
      (b.course.is_lab ? 1 : 0) - (a.course.is_lab ? 1 : 0) ||
      freeCount.get(a.course.teacher_id) - freeCount.get(b.course.teacher_id) ||
      (secSize.get(b.course.section_id) || 0) - (secSize.get(a.course.section_id) || 0)
  );

  const tBusy = new Set(), sBusy = new Set(), rBusy = new Set(), courseDay = new Set();
  const secDay = new Map();

  const place = (c, cd) => {
    tBusy.add(`${c.teacher_id}:${cd.sl.id}`); sBusy.add(`${c.section_id}:${cd.sl.id}`);
    rBusy.add(`${cd.r.id}:${cd.sl.id}`); courseDay.add(`${c.id}:${cd.sl.day}`);
    const k = `${c.section_id}:${cd.sl.day}`;
    if (!secDay.has(k)) secDay.set(k, []);
    secDay.get(k).push(cd.sl.idx);
  };
  const unplace = (c, cd) => {
    tBusy.delete(`${c.teacher_id}:${cd.sl.id}`); sBusy.delete(`${c.section_id}:${cd.sl.id}`);
    rBusy.delete(`${cd.r.id}:${cd.sl.id}`); courseDay.delete(`${c.id}:${cd.sl.day}`);
    const arr = secDay.get(`${c.section_id}:${cd.sl.day}`);
    arr.splice(arr.indexOf(cd.sl.idx), 1);
  };

  function candidates(c) {
    const out = [];
    const size = secSize.get(c.section_id) || 0;
    for (const sl of sorted) {
      if (unavailable.has(`${c.teacher_id}:${sl.id}`) || tBusy.has(`${c.teacher_id}:${sl.id}`) || sBusy.has(`${c.section_id}:${sl.id}`)) continue;
      let base = courseDay.has(`${c.id}:${sl.day}`) ? 100 : 0; // prefer a different day
      const idxs = secDay.get(`${c.section_id}:${sl.day}`) || [];
      if (idxs.length && !idxs.some((i) => Math.abs(i - sl.idx) === 1)) base += 10; // avoid gaps
      base += sl.idx * 0.1;
      for (const r of rooms) {
        if (!!r.is_lab !== !!c.is_lab || r.capacity < size || rBusy.has(`${r.id}:${sl.id}`)) continue;
        out.push({ sl, r, score: base + r.capacity * 0.001 });
      }
    }
    return out.sort((a, b) => a.score - b.score);
  }

  // 1) Backtracking
  let steps = 0, aborted = false;
  const chosen = [];
  function bt(i) {
    if (i === sessions.length) return true;
    const c = sessions[i].course;
    const cands = candidates(c).slice(0, 15);
    for (const cd of cands) {
      if (++steps > STEP_LIMIT) { aborted = true; return false; }
      place(c, cd); chosen[i] = cd;
      if (bt(i + 1)) return true;
      unplace(c, cd);
      if (aborted) return false;
    }
    return false;
  }

  let placements = [];
  const unplaced = [];
  if (bt(0)) {
    placements = sessions.map((s, i) => ({ course: s.course, cd: chosen[i] }));
  } else {
    // 2) Fallback: place as many as possible, report the rest
    for (const s of sessions) {
      const c = s.course;
      const cands = candidates(c);
      if (!cands.length) {
        const size = secSize.get(c.section_id) || 0;
        const roomOk = rooms.some((r) => !!r.is_lab === !!c.is_lab && r.capacity >= size);
        unplaced.push({
          code: c.code, name: c.name, section: c.section_name, teacher: c.teacher_name,
          reason: !roomOk
            ? (c.is_lab ? 'No lab room with enough capacity' : 'No normal room with enough capacity')
            : freeCount.get(c.teacher_id) < c.classes_per_week
              ? 'Teacher has too few available slots'
              : 'No slot where teacher, section and room are all free',
        });
        continue;
      }
      place(c, cands[0]);
      placements.push({ course: c, cd: cands[0] });
    }
  }

  let gaps = 0;
  for (const arr of secDay.values()) if (arr.length) gaps += Math.max(...arr) - Math.min(...arr) + 1 - arr.length;

  return {
    assignments: placements.map((p) => ({ course_id: p.course.id, room_id: p.cd.r.id, slot_id: p.cd.sl.id })),
    unplaced, total: sessions.length, placed: placements.length, gaps, steps,
    ms: Date.now() - t0,
  };
}

module.exports = { generate };
