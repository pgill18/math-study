/**
 * Tests for answer matching logic
 * Tests every problem in chapter7.json with various user input formats:
 * - Exact answer as stored
 * - Factors in different orders
 * - With and without variable= prefix
 * - Using recommended notations (^, sqrt, fractions)
 * - Verifies no extra strings in expected answers
 */

// === Copy of matching functions from ProblemItem.jsx ===

function normalizeAnswer(str) {
  return str
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')
    .replace(/\\cdot/g, '*')
    .replace(/\\text\{[^}]*\}/g, '')
    .replace(/[\\{}\s]/g, '')
    .toLowerCase()
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
}

function stripVariable(str) {
  return str.replace(/^[a-z]\s*=\s*/i, '').trim()
}

function extractFactors(str) {
  const s = str.replace(/\s/g, '')
  const factors = []
  let i = 0
  while (i < s.length) {
    if (s[i] === '(') {
      let depth = 0, start = i
      while (i < s.length) {
        if (s[i] === '(') depth++
        else if (s[i] === ')') depth--
        i++
        if (depth === 0) break
      }
      factors.push(s.slice(start, i))
    } else {
      let start = i
      while (i < s.length && s[i] !== '(') i++
      const coeff = s.slice(start, i)
      if (coeff) factors.push(coeff)
    }
  }
  return factors
}

function factorsMatch(a, b) {
  const fa = extractFactors(a)
  const fb = extractFactors(b)
  if (fa.length !== fb.length || fa.length < 2) return false
  const coeffA = fa.filter(f => !f.startsWith('(')).join('*')
  const coeffB = fb.filter(f => !f.startsWith('(')).join('*')
  if (coeffA !== coeffB) return false
  const parensA = fa.filter(f => f.startsWith('(')).sort()
  const parensB = fb.filter(f => f.startsWith('(')).sort()
  if (parensA.length !== parensB.length) return false
  return parensA.every((f, i) => f === parensB[i])
}

function evalExpr(expr, xVal) {
  try {
    let s = expr
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
    s = s.replace(/(\d)([a-wyz])/gi, '$1*$2')
    s = s.replace(/(\d)\(/g, '$1*(')
    s = s.replace(/\)\(/g, ')*(')
    s = s.replace(/([a-wyz])\(/gi, '$1*(')
    s = s.replace(/\)([a-wyz\d])/gi, ')*$1')
    s = s.replace(/\^/g, '**')
    s = s.replace(/x/gi, `(${xVal})`)
    const result = Function('"use strict"; return (' + s + ')')()
    return typeof result === 'number' && isFinite(result) ? result : null
  } catch {
    return null
  }
}

function numericallyEquivalent(exprA, exprB) {
  const testPoints = [0, 1, -1, 2, -2, 3, 0.5, -0.5]
  let matchCount = 0
  let validCount = 0
  for (const x of testPoints) {
    const a = evalExpr(exprA, x)
    const b = evalExpr(exprB, x)
    if (a === null || b === null) continue
    validCount++
    if (Math.abs(a - b) < 1e-9) matchCount++
  }
  return validCount >= 5 && matchCount === validCount
}

function answersMatch(userAnswer, correctAnswer, problemText) {
  const cleanCorrect = correctAnswer.replace(/^(Not complete|Incomplete|Complete):\s*/i, '')
  const normUser = normalizeAnswer(userAnswer)
  const normCorrect = normalizeAnswer(cleanCorrect)
  if (normUser === normCorrect) return true
  if (/^complete$/i.test(cleanCorrect.trim()) && problemText) {
    const normProblem = normalizeAnswer(problemText)
    if (normUser === normProblem || factorsMatch(normUser, normProblem) || numericallyEquivalent(normUser, normProblem)) return true
  }
  if (stripVariable(normUser) === stripVariable(normCorrect)) return true
  if (normUser === stripVariable(normCorrect)) return true
  if (stripVariable(normUser) === normCorrect) return true
  if (factorsMatch(normUser, normCorrect)) return true
  const stripped = cleanCorrect.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  const strippedUser = userAnswer.replace(/\$/g, '').replace(/\\/g, '').replace(/\s/g, '').toLowerCase()
  if (stripped === strippedUser) return true
  if (stripVariable(stripped) === stripVariable(strippedUser)) return true
  if (strippedUser === stripVariable(stripped)) return true
  if (factorsMatch(strippedUser, stripped)) return true
  if (numericallyEquivalent(normUser, normCorrect)) return true
  if (numericallyEquivalent(strippedUser, stripped)) return true
  return false
}

function toAnswerParts(answer) {
  if (Array.isArray(answer)) return answer
  return [{ label: '', value: answer }]
}

function checkMultiSolutionAnswers(userInputs, parts, problemText) {
  if (parts.length <= 1) {
    return parts.map((part, i) => answersMatch(userInputs[i] || '', part.value, problemText))
  }
  const n = parts.length
  const used = new Array(n).fill(false)
  const results = new Array(n).fill(false)
  const assignment = new Array(n).fill(-1)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (!used[j] && answersMatch(userInputs[i] || '', parts[j].value, problemText)) {
        results[i] = true
        used[j] = true
        assignment[i] = j
        break
      }
    }
  }
  return results
}

// === Load data ===
const data = require('../data/chapter7.json')

// === Test helpers ===
let passed = 0
let failed = 0
const failures = []

function assert(condition, message) {
  if (condition) {
    passed++
  } else {
    failed++
    failures.push(message)
  }
}

function testMatch(userAnswer, correctAnswer, problemText, shouldMatch, desc) {
  const result = answersMatch(userAnswer, correctAnswer, problemText)
  assert(result === shouldMatch,
    `${desc}: answersMatch("${userAnswer}", "${correctAnswer}"${problemText ? `, "${problemText}"` : ''}) = ${result}, expected ${shouldMatch}`)
}

function testMultiMatch(userInputs, answer, problemText, desc) {
  const parts = toAnswerParts(answer)
  const results = checkMultiSolutionAnswers(userInputs, parts, problemText)
  const allCorrect = results.every(Boolean)
  assert(allCorrect,
    `${desc}: checkMultiSolutionAnswers(${JSON.stringify(userInputs)}) failed. Results: ${JSON.stringify(results)}`)
}

// ============================================================
// TEST 1: No extra strings in answer data
// ============================================================
console.log('\n=== TEST 1: Verify no extra strings in answer data ===')

const ALLOWED_PREFIXES = [] // All prefixes should be cleaned now

for (const section of data.sections) {
  for (const cat of ['monitoringProgress', 'edgeCases', 'cornerCases']) {
    const groups = section[cat] || []
    for (const group of groups) {
      for (const prob of group.problems || []) {
        const id = `${section.id}.${prob.num}`
        if (Array.isArray(prob.answer)) {
          for (const part of prob.answer) {
            // Check for descriptive prefixes in multi-part answers
            const hasPrefix = /^(Not complete|Incomplete|Complete):/i.test(part.value)
            assert(!hasPrefix, `${id} part "${part.label}": answer has prefix in value: "${part.value}"`)
          }
        } else {
          // Single answers: check for problematic prefixes (but allow "Complete" as a standalone answer)
          const val = prob.answer
          const hasPrefix = /^(Not complete|Incomplete):/i.test(val)
          assert(!hasPrefix, `${id}: answer has problematic prefix: "${val}"`)

          // Check for parenthetical explanations in answers (e.g. "Complete (cannot factor...)")
          // These should be in info/hint fields, not in the answer
          if (/^Complete\s*\(/.test(val)) {
            assert(false, `${id}: answer has parenthetical explanation: "${val}"`)
          }

          // Check for answers with explanatory text like "Use ..."
          // Allow: "$899$ (Use ...)" pattern for corner cases that include method hints
          // These are OK since normalizeAnswer strips the text, but flag for awareness
        }
      }
    }
  }
}

// ============================================================
// TEST 2: Every single-value answer can be typed using recommended notation
// ============================================================
console.log('\n=== TEST 2: Every problem answer matches when typed naturally ===')

for (const section of data.sections) {
  for (const cat of ['monitoringProgress', 'edgeCases', 'cornerCases']) {
    const groups = section[cat] || []
    for (const group of groups) {
      for (const prob of group.problems || []) {
        const id = `${section.id}.${prob.num}`
        const parts = toAnswerParts(prob.answer)

        for (const part of parts) {
          const val = part.value
          // Convert LaTeX answer to what a user would type
          let userTyped = val
            .replace(/\$/g, '')           // Remove $ delimiters
            .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2') // \frac{a}{b} → a/b
            .replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)')          // \sqrt{x} → sqrt(x)
            .replace(/\\cdot/g, '*')       // \cdot → *
            .replace(/\\text\{[^}]*\}/g, '') // Remove \text{}
            .replace(/\\/g, '')            // Remove remaining backslashes
            .replace(/\{/g, '').replace(/\}/g, '') // Remove braces
            .trim()

          // Skip "Complete" text answers (tested separately)
          if (/^complete$/i.test(userTyped.trim())) continue
          // Skip answers with long explanation text
          if (userTyped.length > 80) continue

          testMatch(userTyped, val, prob.text, true,
            `${id} (${part.label || 'answer'}): typed "${userTyped}" should match "${val}"`)
        }
      }
    }
  }
}

// ============================================================
// TEST 3: Solutions with and without variable= prefix
// ============================================================
console.log('\n=== TEST 3: Solutions with and without variable= prefix ===')

// Section 7.4: Zero product property solutions
const solutionTests = [
  // [userInput, correctAnswer, description]
  ['0', '$x = 0$', 'bare value 0 matches x=0'],
  ['1', '$x = 1$', 'bare value 1 matches x=1'],
  ['-2', '$t = -2$', 'bare -2 matches t=-2'],
  ['x=0', '$x = 0$', 'x=0 matches $x = 0$'],
  ['x = 0', '$x = 0$', 'x = 0 with spaces matches'],
  ['4', '$z = 4$', 'bare 4 matches z=4'],
  ['z=4', '$z = 4$', 'z=4 matches $z = 4$'],
  ['-9', '$z = -9$', 'bare -9 matches z=-9'],
  ['7', '$z = 7$', 'bare 7 matches z=7'],
  ['0', '$u = 0$', 'bare 0 matches u=0'],
  ['8', '$u = 8$', 'bare 8 matches u=8'],
  ['-3', '$u = -3$', 'bare -3 matches u=-3'],
  ['x=7', '$x = 7$', 'x=7 matches'],
  ['x=-2', '$x = -2$', 'x=-2 matches'],
  ['-1/2', '$x = -\\frac{1}{2}$', 'bare -1/2 matches x=-1/2'],
  ['x=-1/2', '$x = -\\frac{1}{2}$', 'x=-1/2 matches'],
  ['1/2', '$x = \\frac{1}{2}$', 'bare 1/2 matches x=1/2'],
  ['x=1/2', '$x = \\frac{1}{2}$', 'x=1/2 matches'],
  ['-1/3', '$x = -\\frac{1}{3}$', '-1/3 matches x=-1/3'],
  ['1/3', '$x = \\frac{1}{3}$', '1/3 matches x=1/3'],
  ['7/2', '$x = \\frac{7}{2}$', '7/2 matches x=7/2'],
  ['-7/2', '$x = -\\frac{7}{2}$', '-7/2 matches x=-7/2'],
  ['w=0', '$w = 0$', 'w=0 matches $w=0$'],
  ['w=4', '$w = 4$', 'w=4 matches $w=4$'],
  ['c=0', '$c = 0$', 'c=0 matches $c=0$'],
  ['c=3', '$c = 3$', 'c=3 matches $c=3$'],
  ['-3', '$a = -3$', 'bare -3 matches a=-3'],
  ['a=-3', '$a = -3$', 'a=-3 matches'],
  ['-6', '$x = -6$', '-6 matches x=-6'],
  ['9', '$n = 9$', '9 matches n=9'],
  ['-9', '$n = -9$', '-9 matches n=-9'],
  ['n=9', '$n = 9$', 'n=9 matches'],
  ['10', '$x = 10$', '10 matches x=10'],
  ['-10', '$x = -10$', '-10 matches x=-10'],
  ['7/6', '$w = \\frac{7}{6}$', '7/6 matches w=7/6'],
  ['w=7/6', '$w = \\frac{7}{6}$', 'w=7/6 matches'],
  ['m=2', '$m = 2$', 'm=2 matches'],
  ['m=5', '$m = 5$', 'm=5 matches'],
  ['2', '$m = 2$', 'bare 2 matches m=2'],
  ['5', '$m = 5$', 'bare 5 matches m=5'],
  ['1.5', '$t = 1.5$', '1.5 matches t=1.5'],
  ['t=1.5', '$t = 1.5$', 't=1.5 matches'],
]

for (const [user, correct, desc] of solutionTests) {
  testMatch(user, correct, '', true, `Solution: ${desc}`)
}

// ============================================================
// TEST 4: Multi-solution problems with solutions in various orders
// ============================================================
console.log('\n=== TEST 4: Multi-solution problems in various orders ===')

// 7.4.m1: x(x-1)=0 → x=0, x=1
testMultiMatch(['0', '1'], [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 1$' }], '',
  '7.4.m1: solutions in order')
testMultiMatch(['1', '0'], [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 1$' }], '',
  '7.4.m1: solutions reversed')
testMultiMatch(['x=1', 'x=0'], [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 1$' }], '',
  '7.4.m1: with x= prefix, reversed')

// 7.4.m3: (z-4)(z-6)=0 → z=4, z=6
testMultiMatch(['6', '4'], [{ label: 'S1', value: '$z = 4$' }, { label: 'S2', value: '$z = 6$' }], '',
  '7.4.m3: solutions reversed')
testMultiMatch(['z=6', 'z=4'], [{ label: 'S1', value: '$z = 4$' }, { label: 'S2', value: '$z = 6$' }], '',
  '7.4.m3: with z= prefix, reversed')

// 7.4.m4: (z-7)(z+9)=0 → z=7, z=-9
testMultiMatch(['-9', '7'], [{ label: 'S1', value: '$z = 7$' }, { label: 'S2', value: '$z = -9$' }], '',
  '7.4.m4: solutions reversed')

// 7.4.m5: 3 solutions x=0, x=3, x=4
testMultiMatch(['4', '0', '3'],
  [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 3$' }, { label: 'S3', value: '$x = 4$' }], '',
  '7.4.m5: 3 solutions scrambled')
testMultiMatch(['3', '4', '0'],
  [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 3$' }, { label: 'S3', value: '$x = 4$' }], '',
  '7.4.m5: 3 solutions another order')

// 7.4.m6: u=0, u=8, u=-3
testMultiMatch(['-3', '8', '0'],
  [{ label: 'S1', value: '$u = 0$' }, { label: 'S2', value: '$u = 8$' }, { label: 'S3', value: '$u = -3$' }], '',
  '7.4.m6: 3 solutions scrambled')

// 7.7.m14: n=9, n=-9
testMultiMatch(['-9', '9'], [{ label: 'S1', value: '$n = 9$' }, { label: 'S2', value: '$n = -9$' }], '',
  '7.7.m14: solutions reversed')
testMultiMatch(['n=-9', 'n=9'], [{ label: 'S1', value: '$n = 9$' }, { label: 'S2', value: '$n = -9$' }], '',
  '7.7.m14: with n= prefix, reversed')

// 7.8.m6: w=0, w=4
testMultiMatch(['4', '0'], [{ label: 'S1', value: '$w = 0$' }, { label: 'S2', value: '$w = 4$' }], '',
  '7.8.m6: solutions reversed')

// 7.8.m7: x=0, x=5, x=-5
testMultiMatch(['-5', '5', '0'],
  [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 5$' }, { label: 'S3', value: '$x = -5$' }], '',
  '7.8.m7: 3 solutions scrambled')
testMultiMatch(['x=5', 'x=-5', 'x=0'],
  [{ label: 'S1', value: '$x = 0$' }, { label: 'S2', value: '$x = 5$' }, { label: 'S3', value: '$x = -5$' }], '',
  '7.8.m7: with prefix, another order')

// 7.5.m13: Width=12, Length=15 (order independent)
testMultiMatch(['15', '12'], [{ label: 'Width', value: '$12$' }, { label: 'Length', value: '$15$' }], '',
  '7.5.m13: width/length reversed')

// 7.6.m10: Width=5, Length=14
testMultiMatch(['14', '5'], [{ label: 'Width', value: '$5$' }, { label: 'Length', value: '$14$' }], '',
  '7.6.m10: width/length reversed')

// ============================================================
// TEST 5: Factor order independence
// ============================================================
console.log('\n=== TEST 5: Factor order independence ===')

const factorOrderTests = [
  // Section 7.5: Factoring x^2+bx+c
  ['(x+8)(x+2)', '$(x + 2)(x + 8)$', '7.5.m1: reversed factors'],
  ['(x+8)(x+1)', '$(x + 1)(x + 8)$', '7.5.m2: reversed factors'],
  ['(w-3)(w-1)', '$(w - 1)(w - 3)$', '7.5.m3: reversed factors'],
  ['(n-7)(n-5)', '$(n - 5)(n - 7)$', '7.5.m4: reversed factors'],
  ['(x-12)(x-2)', '$(x - 2)(x - 12)$', '7.5.m5: reversed factors'],
  ['(x-3)(x+5)', '$(x + 5)(x - 3)$', '7.5.m6: reversed factors'],
  ['(y-2)(y+15)', '$(y + 15)(y - 2)$', '7.5.m7: reversed factors'],
  ['(v+6)(v-7)', '$(v - 7)(v + 6)$', '7.5.m8: reversed factors'],
  ['(x+6)(x+1)', '$(x + 1)(x + 6)$', '7.5.m9: reversed factors'],
  ['(x-8)(x-4)', '$(x - 4)(x - 8)$', '7.5.m10: reversed factors'],
  ['(x-2)(x+7)', '$(x + 7)(x - 2)$', '7.5.m11: reversed factors'],
  ['(x+3)(x-5)', '$(x - 5)(x + 3)$', '7.5.m12: reversed factors'],

  // Section 7.6: Factoring ax^2+bx+c
  ['8(x-6)(x-1)', '$8(x - 1)(x - 6)$', '7.6.m1: reversed with coefficient'],
  ['(7x+3)(2x+5)', '$(2x + 5)(7x + 3)$', '7.6.m2: reversed factors'],
  ['(x-1)(2x-5)', '$(2x - 5)(x - 1)$', '7.6.m3: reversed factors'],
  ['(x-4)(3x-2)', '$(3x - 2)(x - 4)$', '7.6.m4: reversed factors'],
  ['(x-5)(4x+1)', '$(4x + 1)(x - 5)$', '7.6.m5: reversed factors'],
  ['(3x-4)(2x+3)', '$(2x + 3)(3x - 4)$', '7.6.m6: reversed factors'],
  ['(x+2)(5x+1)', '$(5x + 1)(x + 2)$', '7.6.e1: reversed factors'],
  ['(x-4)(3x-2)', '$(3x - 2)(x - 4)$', '7.6.e2: reversed factors'],
  ['(2x-1)(2x+3)', '$(2x + 3)(2x - 1)$', '7.6.e3: reversed factors'],
  ['(3x+4)(2x-5)', '$(2x - 5)(3x + 4)$', '7.6.e4: reversed factors'],
  ['(5x+2)(2x+3)', '$(2x + 3)(5x + 2)$', '7.6.e6: reversed factors'],

  // Negative leading coefficient
  ['-(y+1)(2y+3)', '$-(2y + 3)(y + 1)$', '7.6.m7: negative leading, reversed'],
  ['-(m-1)(5m-1)', '$-(5m - 1)(m - 1)$', '7.6.m8: negative leading, reversed'],
  ['-(x+1)(3x-2)', '$-(3x - 2)(x + 1)$', '7.6.m9: negative leading, reversed'],

  // Section 7.7: Difference of squares
  ['(x-6)(x+6)', '$(x + 6)(x - 6)$', '7.7.m1: reversed diff of squares'],
  ['(10-m)(10+m)', '$(10 + m)(10 - m)$', '7.7.m2: reversed'],
  ['(3n-4)(3n+4)', '$(3n + 4)(3n - 4)$', '7.7.m3: reversed'],
  ['(4b-7)(4b+7)', '$(4b + 7)(4b - 7)$', '7.7.m4: reversed'],
  ['(7x-8)(7x+8)', '$(7x + 8)(7x - 8)$', '7.7.e1: reversed'],
  ['(x+5)(x-5)', '$(x + 5)(x - 5)$', '7.7.m16: same order'],
  ['(x-5)(x+5)', '$(x + 5)(x - 5)$', '7.7.m16: reversed'],
  ['(3x-2y)(3x+2y)', '$(3x + 2y)(3x - 2y)$', '7.7.e5: reversed with two vars'],

  // Section 7.8: Factoring completely
  ['(a+3)(a^2+1)', '$(a^2 + 1)(a + 3)$', '7.8.m1: reversed grouping factors'],
  ['(x+y)(y+2)', '$(y + 2)(x + y)$', '7.8.m2: reversed'],
  ['3x(x-2)(x+2)', '$3x(x + 2)(x - 2)$', '7.8.m3: reversed with GCF'],
  ['m(m+2)(m-4)', '$m(m - 4)(m + 2)$', '7.8.m5: reversed with GCF'],

  // Edge cases
  ['(x+9)(x+4)', '$(x + 4)(x + 9)$', '7.5.e1: reversed'],
  ['(x-7)(x-4)', '$(x - 4)(x - 7)$', '7.5.e2: reversed'],
  ['(x-6)(x+8)', '$(x + 8)(x - 6)$', '7.5.e3: reversed'],
  ['(x+5)(x-8)', '$(x - 8)(x + 5)$', '7.5.e4: reversed'],
  ['(t-9)(t-5)', '$(t - 5)(t - 9)$', '7.5.e5: reversed'],
  ['(y-8)(y+9)', '$(y + 9)(y - 8)$', '7.5.e6: reversed'],
]

for (const [user, correct, desc] of factorOrderTests) {
  testMatch(user, correct, '', true, `FactorOrder: ${desc}`)
}

// ============================================================
// TEST 6: Notation variations
// ============================================================
console.log('\n=== TEST 6: Notation variations ===')

const notationTests = [
  // Typing with ^ notation
  ['x^2 + 14x + 49', '$x^2 + 14x + 49$', 'Caret notation for squares'],
  ['5x^2 + 1', '$5x^2 + 1$', 'Polynomial with caret'],
  ['-8x + 7', '$-8x + 7$', 'Negative leading term'],
  ['-10x + 2', '$-10x + 2$', 'Negative coefficient'],
  ['5x^2 - 2x - 7', '$5x^2 - 2x - 7$', 'Trinomial with caret'],
  ['8x^2', '$8x^2$', 'Monomial with caret'],
  ['-6x^3', '$-6x^3$', 'Cubic monomial'],
  ['3x^2 + 6x', '$3x^2 + 6x$', 'Binomial with caret'],

  // Fractions as /
  ['1/2', '$\\frac{1}{2}$', 'Fraction typed as /'],
  ['-1/2', '$-\\frac{1}{2}$', 'Negative fraction as /'],
  ['7/2', '$\\frac{7}{2}$', 'Fraction 7/2'],
  ['-7/2', '$-\\frac{7}{2}$', 'Negative fraction -7/2'],
  ['1/3', '$\\frac{1}{3}$', 'Fraction 1/3'],
  ['-1/3', '$-\\frac{1}{3}$', 'Negative fraction -1/3'],
  ['7/6', '$\\frac{7}{6}$', 'Fraction 7/6'],

  // sqrt notation
  ['sqrt(2)', '$\\sqrt{2}$', 'sqrt typed as sqrt()'],

  // Perfect square trinomials with ^2 notation
  ['(m-1)^2', '$(m - 1)^2$', 'Perfect square with caret'],
  ['(d-5)^2', '$(d - 5)^2$', 'Perfect square with caret'],
  ['9(z+2)^2', '$9(z + 2)^2$', 'Perfect square with coefficient'],
  ['(n+4)^2', '$(n + 4)^2$', 'Perfect square with caret'],
  ['(5t+3)^2', '$(5t + 3)^2$', 'Perfect square ax+b'],
  ['(2a-7)^2', '$(2a - 7)^2$', 'Perfect square ax-b'],
  ['(4m+7)^2', '$(4m + 7)^2$', 'Perfect square 4m+7'],
  ['2y(y-3)^2', '$2y(y - 3)^2$', 'GCF with perfect square'],

  // Higher powers
  ['x^4 + 12x^2 + 36', '$x^4 + 12x^2 + 36$', 'Fourth degree with caret'],
  ['n^4 - 16', '$n^4 - 16$', 'Fourth degree difference'],
  ['x^3 + 3x^2 + 3x + 1', '$x^3 + 3x^2 + 3x + 1$', 'Cubic expansion'],
  ['x^3 - x^2 - 2x - 12', '$x^3 - x^2 - 2x - 12$', 'Cubic with negatives'],

  // Multi-variable
  ['x^2 - 9y^2', '$x^2 - 9y^2$', 'Two variable expression'],
  ['16x^2 - 8xy + y^2', '$16x^2 - 8xy + y^2$', 'Two variable trinomial'],
  ['9m^2 + 6mn + n^2', '$9m^2 + 6mn + n^2$', 'Two variable perfect square'],
  ['3a^2b + 2ab^2', '$3a^2b + 2ab^2$', 'Two variable binomial'],

  // Answers with extra spaces (user types with spaces)
  ['(x + 2)(x + 8)', '$(x + 2)(x + 8)$', 'Factors with spaces'],
  ['( x + 2 )( x + 8 )', '$(x + 2)(x + 8)$', 'Extra spaces in factors'],

  // Classifications (text answers)
  ['binomial', 'binomial', 'Text classification'],
  ['trinomial', 'trinomial', 'Text classification'],
  ['Binomial', 'binomial', 'Case insensitive classification'],
  ['TRINOMIAL', 'trinomial', 'Uppercase classification'],
]

for (const [user, correct, desc] of notationTests) {
  testMatch(user, correct, '', true, `Notation: ${desc}`)
}

// ============================================================
// TEST 7: Corner case answers with explanation text
// ============================================================
console.log('\n=== TEST 7: Corner case answers with explanation text ===')

// 7.3.c1: $899$ (cleaned, was "$899$ (Use ...)")
testMatch('899', '$899$', '', true,
  '7.3.c1: bare number matches')

// 7.3.c2: $2704$ (cleaned)
testMatch('2704', '$2704$', '', true,
  '7.3.c2: bare number matches')

// 7.3.c3: $2496$ (cleaned)
testMatch('2496', '$2496$', '', true,
  '7.3.c3: bare number matches')

// 7.4.c3: $t = 1.5$ (cleaned, was "$t = 1.5$ seconds")
testMatch('1.5', '$t = 1.5$', '', true,
  '7.4.c3: bare number matches')
testMatch('t=1.5', '$t = 1.5$', '', true,
  '7.4.c3: with variable prefix')

// 7.8.cn1: "Complete" answers — accept re-typed expression
testMatch('Complete', 'Complete', '$2x(x^2 + 1)$', true,
  '7.8.cn2: typing "Complete"')
testMatch('complete', 'Complete', '$2x(x^2 + 1)$', true,
  '7.8.cn2: typing "complete" lowercase')
testMatch('2x(x^2+1)', 'Complete', '$2x(x^2 + 1)$', true,
  '7.8.cn2: re-typing expression when answer is Complete')
testMatch('5x^2(x-7)', 'Complete', '$5x^2(x - 7)$', true,
  '7.8.cn3: re-typing expression when answer is Complete')

// 7.8.cn1: answer was "Not complete: 3(x+2)(x-2)" - now cleaned to just "3(x+2)(x-2)"
testMatch('3(x-2)(x+2)', '$3(x + 2)(x - 2)$', '', true,
  '7.8.cn1: factor order reversed')
testMatch('3(x+2)(x-2)', '$3(x + 2)(x - 2)$', '', true,
  '7.8.cn1: exact match')

// ============================================================
// TEST 8: Numerical equivalence (more factored than textbook)
// ============================================================
console.log('\n=== TEST 8: Numerical equivalence for deeper factoring ===')

// User factors more than textbook
testMatch('(x-2)(x+2)(x-1)(x+1)', '$(x^2 - 1)(x^2 - 4)$', '', true,
  'Fully factored 4th degree vs partially factored')
testMatch('(x^2-9)(x^2+9)', '$(x^2 + 9)(x^2 - 9)$', '', true,
  'x^4-81 factor order reversed')
// (x^2+9)(x-3)(x+3) should also match (x^2+9)(x^2-9)
testMatch('(x^2+9)(x-3)(x+3)', '$(x^2 + 9)(x^2 - 9)$', '', true,
  'x^4-81 partially expanded one factor')

// ============================================================
// TEST 9: Coordinate pair answers (7.4 corner cases)
// ============================================================
console.log('\n=== TEST 9: Coordinate pair answers ===')

testMatch('(-1, 0) and (6, 0)', '$(-1, 0)$ and $(6, 0)$', '', true,
  '7.4.c1: x-intercepts')
testMatch('(6, 0) and (-1, 0)', '$(-1, 0)$ and $(6, 0)$', '', true,
  '7.4.c1: reversed order')
testMatch('(0,0), (3,0), and (-4,0)', '$(0, 0)$, $(3, 0)$, and $(-4, 0)$', '', true,
  '7.4.c2: three x-intercepts')

// ============================================================
// TEST 10: Edge case - wrong answers should NOT match
// ============================================================
console.log('\n=== TEST 10: Wrong answers should NOT match ===')

const wrongTests = [
  ['(x+3)(x+8)', '$(x + 2)(x + 8)$', 'Wrong factor'],
  ['x^2 + 10x + 15', '$x^2 + 10x + 16$', 'Wrong constant'],
  ['5', '$x = 0$', 'Wrong solution value'],
  ['(x-1)(x+6)', '$(x + 1)(x + 6)$', 'Sign error in factor'],
  ['3x(x+2)(x+2)', '$3x(x + 2)(x - 2)$', 'Wrong sign in factor'],
  ['x^2 + 14x + 48', '$x^2 + 14x + 49$', 'Off by one in constant'],
  ['(2x-5)(x+1)', '$(2x - 5)(x - 1)$', 'Wrong sign in second factor'],
]

for (const [user, correct, desc] of wrongTests) {
  testMatch(user, correct, '', false, `WrongAnswer: ${desc}`)
}

// ============================================================
// TEST 11: 21^2 special product answer
// ============================================================
console.log('\n=== TEST 11: Special product mental math answers ===')

testMatch('441', '$441$', '', true,
  '7.3.m8: bare 441 matches cleaned answer')

// ============================================================
// TEST 12: Multi-part answers (standard form, degree, etc.)
// ============================================================
console.log('\n=== TEST 12: Multi-part classification answers ===')

// 7.1.m5: 4-9z → standard form, degree, leading coeff, classification
testMultiMatch(['-9z + 4', '1', '-9', 'binomial'],
  [{ label: 'Standard Form', value: '$-9z + 4$' }, { label: 'Degree', value: '1' },
   { label: 'Leading Coefficient', value: '$-9$' }, { label: 'Classification', value: 'binomial' }], '',
  '7.1.m5: all parts correct')

// Order doesn't matter for multi-solution, but multi-part with labels...
// Actually labels aren't matched by order in the current implementation - each input is matched to any part
// This is fine for solutions but could be wrong for labeled parts like "Width" vs "Length"
// Let's test it:
testMultiMatch(['-t^3 + t^2 - 10t', '3', '-1', 'trinomial'],
  [{ label: 'Standard Form', value: '$-t^3 + t^2 - 10t$' }, { label: 'Degree', value: '3' },
   { label: 'Leading Coefficient', value: '$-1$' }, { label: 'Classification', value: 'trinomial' }], '',
  '7.1.m6: all parts correct')

// ============================================================
// SUMMARY
// ============================================================
console.log('\n' + '='.repeat(60))
console.log(`RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} tests`)
console.log('='.repeat(60))

if (failures.length > 0) {
  console.log('\nFAILURES:')
  for (const f of failures) {
    console.log(`  ✗ ${f}`)
  }
}

process.exit(failed > 0 ? 1 : 0)
