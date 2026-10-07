(function attachCore(root, factory) {
  const FractionClass = typeof module !== "undefined" && module.exports
    ? require("./vendor/fraction.min.js")
    : root.Fraction;
  const api = factory(FractionClass);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RationalGameCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createCore(FractionClass) {
  const LEVEL_XP = Object.freeze({ 1: 1500, 2: 500, 3: 500, 4: 500 });

  function getLevelXp(level) {
    return LEVEL_XP[Math.min(4, Math.max(1, Number(level) || 1))];
  }

  function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  function nonZeroInt(min, max, rng) {
    let value = 0;
    while (value === 0) value = randomInt(min, max, rng);
    return value;
  }

  function randomSign(rng) {
    return rng() < 0.5 ? -1 : 1;
  }

  function integerTex(value, signed = false) {
    if (signed) return `\\left(${value >= 0 ? "+" : "-"}${Math.abs(value)}\\right)`;
    return value < 0 ? `-${Math.abs(value)}` : String(value);
  }

  function fractionTex(value) {
    const fraction = value instanceof FractionClass ? value : new FractionClass(value);
    const text = fraction.toFraction();
    const negative = text.startsWith("-");
    const unsigned = negative ? text.slice(1) : text;
    if (!unsigned.includes("/")) return `${negative ? "-" : ""}${unsigned}`;
    const [numerator, denominator] = unsigned.split("/");
    return `${negative ? "-" : ""}\\frac{${numerator}}{${denominator}}`;
  }

  function signedFractionTex(value) {
    const fraction = value instanceof FractionClass ? value : new FractionClass(value);
    return `\\left(${fraction.s < 0 ? "-" : "+"}${fractionTex(fraction.abs())}\\right)`;
  }

  function decimalTex(value) {
    const fraction = value instanceof FractionClass ? value : new FractionClass(value);
    return Number(fraction.valueOf()).toFixed(1).replace(/\.0$/, "");
  }

  function signRule(values, operation) {
    const negatives = values.filter((value) => value.s < 0).length;
    const result = negatives % 2 ? "負" : "正";
    const label = operation === "\\div" ? "除法" : "乘法";
    return `符號：${label}中有 ${negatives} 個負數，所以結果是${result}數。`;
  }

  function question(level, type, tex, answer, steps, answerTex = fractionTex(answer)) {
    return { level, type, tex, answer, answerTex, steps };
  }

  function generateLevel1(rng) {
    const multiply = rng() < 0.5;
    if (multiply) {
      const left = nonZeroInt(-9, 9, rng);
      const right = nonZeroInt(-9, 9, rng);
      const answer = new FractionClass(left).mul(right);
      return question(1, "兩個整數相乘", `${integerTex(left, true)} \\times ${integerTex(right, true)}`, answer, [
        signRule([new FractionClass(left), new FractionClass(right)], "\\times"),
        `絕對值：${Math.abs(left)} \\times ${Math.abs(right)} = ${Math.abs(left * right)}`,
        `答案：${fractionTex(answer)}`,
      ]);
    }

    const divisor = nonZeroInt(-12, 12, rng);
    const quotient = nonZeroInt(-12, 12, rng);
    const dividend = divisor * quotient;
    const answer = new FractionClass(quotient);
    return question(1, "兩個整數相除", `${integerTex(dividend, true)} \\div ${integerTex(divisor, true)}`, answer, [
      signRule([new FractionClass(dividend), new FractionClass(divisor)], "\\div"),
      `絕對值：${Math.abs(dividend)} \\div ${Math.abs(divisor)} = ${Math.abs(quotient)}`,
      `答案：${fractionTex(answer)}`,
    ]);
  }

  function generateLevel2(rng) {
    const mode = randomInt(0, 2, rng);
    if (mode === 0) {
      const values = [nonZeroInt(-9, 9, rng), nonZeroInt(-9, 9, rng), nonZeroInt(-9, 9, rng)];
      const fractions = values.map((value) => new FractionClass(value));
      const first = fractions[0].mul(fractions[1]);
      const answer = first.mul(fractions[2]);
      return question(2, "三個整數連乘", values.map((value) => integerTex(value, true)).join(" \\times "), answer, [
        signRule(fractions, "\\times"),
        `由左至右：${integerTex(values[0], true)} \\times ${integerTex(values[1], true)} = ${fractionTex(first)}`,
        `${fractionTex(first)} \\times ${integerTex(values[2], true)} = ${fractionTex(answer)}`,
      ]);
    }

    if (mode === 1) {
      const divisor1 = randomSign(rng) * randomInt(2, 6, rng);
      const divisor2 = randomSign(rng) * randomInt(2, 6, rng);
      const quotient = randomSign(rng) * randomInt(1, 10, rng);
      const dividend = quotient * divisor1 * divisor2;
      const first = new FractionClass(dividend).div(divisor1);
      const answer = first.div(divisor2);
      return question(2, "三個整數連除", `${integerTex(dividend, true)} \\div ${integerTex(divisor1, true)} \\div ${integerTex(divisor2, true)}`, answer, [
        "連除沒有括號時，必須由左至右計算。",
        `${integerTex(dividend, true)} \\div ${integerTex(divisor1, true)} = ${fractionTex(first)}`,
        `${fractionTex(first)} \\div ${integerTex(divisor2, true)} = ${fractionTex(answer)}`,
      ]);
    }

    const left = nonZeroInt(-8, 8, rng);
    const middle = nonZeroInt(-8, 8, rng);
    const decimal = new FractionClass(randomSign(rng) * randomInt(2, 9, rng), 10);
    const first = new FractionClass(left).mul(middle);
    const answer = first.mul(decimal);
    const decimalDisplay = `\\left(${decimal.s < 0 ? "-" : "+"}${decimalTex(decimal.abs())}\\right)`;
    return question(2, "小數連乘", `${integerTex(left, true)} \\times ${integerTex(middle, true)} \\times ${decimalDisplay}`, answer, [
      signRule([new FractionClass(left), new FractionClass(middle), decimal], "\\times"),
      `${integerTex(left, true)} \\times ${integerTex(middle, true)} = ${fractionTex(first)}`,
      `${fractionTex(first)} \\times ${decimalDisplay} = ${decimalTex(answer)}`,
    ], decimalTex(answer));
  }

  function generateLevel3(rng) {
    const mode = randomInt(0, 2, rng);
    if (mode === 0) {
      const innerLeft = randomSign(rng) * randomInt(2, 9, rng);
      const innerRight = randomSign(rng) * randomInt(2, 6, rng);
      const outer = randomSign(rng) * randomInt(6, 36, rng);
      const inner = new FractionClass(innerLeft).div(innerRight);
      const answer = new FractionClass(outer).div(inner);
      return question(3, "括號除法", `${integerTex(outer, true)} \\div \\left[${integerTex(innerLeft, true)} \\div ${integerTex(innerRight, true)}\\right]`, answer, [
        "先計算中括號內的除法。",
        `${integerTex(innerLeft, true)} \\div ${integerTex(innerRight, true)} = ${fractionTex(inner)}`,
        `${integerTex(outer, true)} \\div ${fractionTex(inner)} = ${integerTex(outer, true)} \\times ${fractionTex(inner.inverse())} = ${fractionTex(answer)}`,
      ]);
    }

    if (mode === 1) {
      const integer = randomSign(rng) * randomInt(2, 12, rng);
      const numerator = randomSign(rng) * randomInt(1, 8, rng);
      const denominator = randomInt(Math.abs(numerator) + 1, Math.abs(numerator) + 5, rng);
      const fraction = new FractionClass(numerator, denominator);
      const divisor = randomSign(rng) * randomInt(2, 6, rng);
      const first = new FractionClass(integer).mul(fraction);
      const answer = first.div(divisor);
      return question(3, "分數乘除", `${integerTex(integer, true)} \\times ${signedFractionTex(fraction)} \\div ${integerTex(divisor, true)}`, answer, [
        "把整數寫成分數，乘法時分子乘分子、分母乘分母。",
        `${integerTex(integer, true)} \\times ${signedFractionTex(fraction)} = ${fractionTex(first)}`,
        `${fractionTex(first)} \\div ${integerTex(divisor, true)} = ${fractionTex(answer)}`,
      ]);
    }

    const whole = randomInt(1, 4, rng);
    const numerator = randomInt(1, 3, rng);
    const denominator = randomInt(numerator + 1, numerator + 4, rng);
    const mixed = new FractionClass(randomSign(rng) * (whole * denominator + numerator), denominator);
    const multiplier = randomSign(rng) * randomInt(2, 5, rng);
    const outer = randomSign(rng) * randomInt(4, 20, rng);
    const inner = mixed.mul(multiplier);
    const answer = new FractionClass(outer).div(inner);
    const mixedTex = `\\left(${mixed.s < 0 ? "-" : "+"}${whole}\\frac{${numerator}}{${denominator}}\\right)`;
    return question(3, "帶分數括號運算", `${integerTex(outer, true)} \\div \\left[${mixedTex} \\times ${integerTex(multiplier, true)}\\right]`, answer, [
      `先把帶分數化為假分數：${mixedTex} = ${signedFractionTex(mixed)}`,
      `括號內：${signedFractionTex(mixed)} \\times ${integerTex(multiplier, true)} = ${fractionTex(inner)}`,
      `${integerTex(outer, true)} \\div ${fractionTex(inner)} = ${fractionTex(answer)}`,
    ]);
  }

  function generateLevel4(rng) {
    const mode = randomInt(0, 3, rng);
    if (mode === 0) {
      const a = nonZeroInt(-12, 12, rng);
      const b = nonZeroInt(-9, 9, rng);
      const c = nonZeroInt(-9, 9, rng);
      const product = new FractionClass(b).mul(c);
      const answer = new FractionClass(a).add(product);
      return question(4, "加減乘除混合", `${integerTex(a, true)} + ${integerTex(b, true)} \\times ${integerTex(c, true)}`, answer, [
        "先乘除，後加減。",
        `${integerTex(b, true)} \\times ${integerTex(c, true)} = ${fractionTex(product)}`,
        `${integerTex(a, true)} + ${fractionTex(product)} = ${fractionTex(answer)}`,
      ]);
    }

    if (mode === 1) {
      const divisor = nonZeroInt(-8, 8, rng);
      const quotient = nonZeroInt(-8, 8, rng);
      const dividend = divisor * quotient;
      const a = nonZeroInt(-15, 15, rng);
      const answer = new FractionClass(a).sub(quotient);
      return question(4, "加減乘除混合", `${integerTex(a, true)} - ${integerTex(dividend, true)} \\div ${integerTex(divisor, true)}`, answer, [
        "先計算除法。",
        `${integerTex(dividend, true)} \\div ${integerTex(divisor, true)} = ${integerTex(quotient)}`,
        `${integerTex(a, true)} - ${integerTex(quotient, true)} = ${fractionTex(answer)}`,
      ]);
    }

    if (mode === 2) {
      const c = nonZeroInt(-8, 8, rng);
      const difference = nonZeroInt(-12, 12, rng);
      const b = c + difference;
      const outer = nonZeroInt(-12, 12, rng);
      const answer = new FractionClass(outer).mul(difference);
      return question(4, "括號混合運算", `${integerTex(outer, true)} \\times \\left[${integerTex(b, true)} - ${integerTex(c, true)}\\right]`, answer, [
        "先計算中括號。",
        `${integerTex(b, true)} - ${integerTex(c, true)} = ${integerTex(difference)}`,
        `${integerTex(outer, true)} \\times ${integerTex(difference, true)} = ${fractionTex(answer)}`,
      ]);
    }

    const b = nonZeroInt(-10, 10, rng);
    const leftDifference = nonZeroInt(-12, 12, rng);
    const a = b + leftDifference;
    const d = nonZeroInt(-8, 8, rng);
    const rightDifference = nonZeroInt(-10, 10, rng);
    const c = d + rightDifference;
    const answer = new FractionClass(leftDifference).div(rightDifference);
    return question(4, "雙括號混合運算", `\\left[${integerTex(a, true)} - ${integerTex(b, true)}\\right] \\div \\left[${integerTex(c, true)} - ${integerTex(d, true)}\\right]`, answer, [
      "分別計算兩個中括號。",
      `${integerTex(a, true)} - ${integerTex(b, true)} = ${integerTex(leftDifference)}，\\quad ${integerTex(c, true)} - ${integerTex(d, true)} = ${integerTex(rightDifference)}`,
      `${integerTex(leftDifference, true)} \\div ${integerTex(rightDifference, true)} = ${fractionTex(answer)}`,
    ]);
  }

  function generateQuestion(level, rng = Math.random) {
    if (level === 1) return generateLevel1(rng);
    if (level === 2) return generateLevel2(rng);
    if (level === 3) return generateLevel3(rng);
    return generateLevel4(rng);
  }

  function parseAnswer(raw) {
    const text = String(raw || "").trim();
    if (!/^-?(?:\d+(?:\.\d+)?|\d+\/\d+)$/.test(text)) return null;
    if (text.includes("/") && Number(text.split("/")[1]) === 0) return null;
    try {
      return new FractionClass(text);
    } catch {
      return null;
    }
  }

  function isAnswerCorrect(raw, expected) {
    const text = String(raw || "").trim();
    const answer = parseAnswer(text);
    if (!answer || !answer.equals(expected)) return false;
    if (!text.includes("/")) return true;

    const [numeratorText, denominatorText] = text.split("/");
    const numerator = Math.abs(Number(numeratorText));
    const denominator = Number(denominatorText);
    let a = numerator;
    let b = denominator;
    while (b) [a, b] = [b, a % b];
    return denominator > 1 && a === 1;
  }

  function applyResult(progress, isCorrect) {
    const next = { ...progress };
    next.total += 1;
    if (isCorrect) {
      next.correct += 1;
      next.streak += 1;
      next.xp += 15;
    } else {
      next.streak = 0;
      next.xp = Math.max(0, next.xp - 10);
    }

    let leveledUp = false;
    let completed = false;
    const target = getLevelXp(next.level);
    if (next.xp >= target) {
      if (next.level < 4) {
        next.xp -= target;
        next.level += 1;
        leveledUp = true;
      } else {
        next.xp = target;
        completed = true;
      }
    }
    return { progress: next, leveledUp, completed };
  }

  return { LEVEL_XP, getLevelXp, generateQuestion, parseAnswer, isAnswerCorrect, fractionTex, applyResult };
});
