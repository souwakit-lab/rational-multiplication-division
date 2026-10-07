const assert = require("node:assert/strict");
const core = require("./game-core");

function seeded(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

assert.deepEqual(core.LEVEL_XP, { 1:1500, 2:500, 3:500, 4:500 });
assert.equal(core.getLevelXp(1), 1500);
assert.equal(core.getLevelXp(2), 500);
assert.equal(core.getLevelXp(4), 500);

const seenTypes = new Map();
for (let level = 1; level <= 4; level += 1) {
  const rng = seeded(700 + level);
  const types = new Set();
  for (let index = 0; index < 400; index += 1) {
    const item = core.generateQuestion(level, rng);
    assert.equal(item.level, level);
    assert.ok(item.type);
    assert.ok(item.tex);
    assert.ok(item.answer);
    assert.ok(item.answerTex);
    assert.ok(Number.isFinite(item.answer.valueOf()));
    assert.ok(Array.isArray(item.steps) && item.steps.length >= 3);
    assert.equal(core.parseAnswer(item.answer.toFraction()).equals(item.answer), true);
    assert.equal(core.isAnswerCorrect(item.answer.toFraction(), item.answer), true);
    if (level === 1 && item.type === "兩個整數相乘") {
      const operands = item.tex.match(/\d+/g).map(Number);
      assert.ok(operands.every((value) => value >= 1 && value <= 9));
    }
    types.add(item.type);
  }
  seenTypes.set(level, types);
}

assert.deepEqual([...seenTypes.get(1)].sort(), ["兩個整數相乘", "兩個整數相除"]);
assert.deepEqual([...seenTypes.get(2)].sort(), ["三個整數連乘", "三個整數連除", "小數連乘", "帶分數乘除", "簡單分數乘除"]);
assert.deepEqual([...seenTypes.get(3)].sort(), ["分數乘除", "帶分數括號運算", "括號除法"]);
assert.deepEqual([...seenTypes.get(4)].sort(), ["加減乘除混合", "括號混合運算", "雙括號混合運算"]);

assert.equal(core.parseAnswer("0.5").equals(core.parseAnswer("1/2")), true);
assert.equal(core.parseAnswer("-1.25").equals(core.parseAnswer("-5/4")), true);
assert.equal(core.parseAnswer("1/0"), null);
assert.equal(core.parseAnswer("1."), null);
assert.equal(core.parseAnswer("abc"), null);
assert.equal(core.isAnswerCorrect("8/2", core.parseAnswer("4")), false);
assert.equal(core.isAnswerCorrect("2/1", core.parseAnswer("2")), false);
assert.equal(core.isAnswerCorrect("1/2", core.parseAnswer("1/2")), true);
assert.equal(core.isAnswerCorrect("0.5", core.parseAnswer("1/2")), true);

const base = { level:1, xp:1485, total:0, correct:0, streak:0 };
let result = core.applyResult(base, true);
assert.equal(result.leveledUp, true);
assert.equal(result.progress.level, 2);
assert.equal(result.progress.xp, 0);

result = core.applyResult({ ...base, xp:5 }, false);
assert.equal(result.progress.xp, 0);
assert.equal(result.progress.streak, 0);

result = core.applyResult({ ...base, level:2, xp:495 }, true);
assert.equal(result.progress.level, 3);
assert.equal(result.progress.xp, 10);

result = core.applyResult({ ...base, level:4, xp:495 }, true);
assert.equal(result.completed, true);
assert.equal(result.progress.xp, 500);

console.log("All multiplication and division core tests passed.");
