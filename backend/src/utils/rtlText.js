/**
 * Right-to-left text for pdfkit.
 *
 * pdfkit draws text from left to right. The font shaper already joins Arabic letters
 * and reverses a single Arabic word correctly, but a whole line that mixes Arabic words,
 * numbers and English words comes out in the wrong order. These helpers split a line
 * into words, decide the direction of each word, and return the words in the order
 * they must be drawn from left to right (a simplified version of the Unicode bidi rules):
 *   - Arabic words read right-to-left, so their order is reversed;
 *   - numbers and English words keep their own left-to-right order;
 *   - spaces and punctuation take the direction of the words around them.
 */

const ARABIC_LETTER = /[ء-يٮ-ۓۺ-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-ﻼ]/;
const LATIN_OR_DIGIT = /[A-Za-z0-9٠-٩۰-۹À-ɏ]/;
const MIRRORED = { '(': ')', ')': '(', '[': ']', ']': '[', '<': '>', '>': '<', '«': '»', '»': '«', '{': '}', '}': '{' };

// "الغرف:" -> "الغرف" + ":"   |   "-350.00" stays one word   |   "(عاجل)" -> "(" + "عاجل" + ")"
const WORD_WITH_EDGES = /^(.*?)([-+]?[\p{L}\p{N}](?:.*[\p{L}\p{N}\p{M}%])?)([^\p{L}\p{N}\p{M}%]*)$/u;

function tokenize(text) {
  const tokens = [];
  for (const part of String(text ?? '').match(/\s+|\S+/g) || []) {
    if (/^\s+$/.test(part)) {
      tokens.push(part);
      continue;
    }
    const match = part.match(WORD_WITH_EDGES);
    if (!match) {
      tokens.push(part);
      continue;
    }
    if (match[1]) tokens.push(match[1]);
    tokens.push(match[2]);
    if (match[3]) tokens.push(match[3]);
  }
  return tokens;
}

function directionOf(token) {
  if (ARABIC_LETTER.test(token)) return 'R';
  if (LATIN_OR_DIGIT.test(token)) return 'L';
  return 'N';
}

/** The pieces of one line, in the order they are drawn from left to right. */
function visualPieces(text) {
  const tokens = tokenize(text).map((value) => ({ value, dir: directionOf(value) }));

  // Spaces/punctuation between two words of the same direction follow them; otherwise right-to-left
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i].dir !== 'N') continue;
    let end = i;
    while (end < tokens.length && tokens[end].dir === 'N') end += 1;
    const before = i > 0 ? tokens[i - 1].dir : 'R';
    const after = end < tokens.length ? tokens[end].dir : 'R';
    const dir = before === after ? before : 'R';
    for (let k = i; k < end; k += 1) tokens[k].dir = dir;
    i = end - 1;
  }

  const runs = [];
  tokens.forEach((token) => {
    const last = runs[runs.length - 1];
    if (last && last.dir === token.dir) last.tokens.push(token);
    else runs.push({ dir: token.dir, tokens: [token] });
  });

  const pieces = [];
  runs.reverse().forEach((run) => {
    const ordered = run.dir === 'R' ? [...run.tokens].reverse() : run.tokens;
    ordered.forEach(({ value }) => {
      // Punctuation inside Arabic is read the other way, so brackets flip
      const piece = run.dir === 'R' && !ARABIC_LETTER.test(value)
        ? Array.from(value).reverse().map((c) => MIRRORED[c] || c).join('')
        : value;
      pieces.push(piece);
    });
  });
  return pieces;
}

function lineWidth(doc, text) {
  return visualPieces(text).reduce((sum, piece) => sum + doc.widthOfString(piece), 0);
}

/**
 * Draws one line inside [x, x + width] at y with the current font.
 * align: 'right' (default for Arabic), 'left' or 'center'.
 */
function drawLine(doc, text, x, y, width, align = 'right') {
  const pieces = visualPieces(text);
  const total = pieces.reduce((sum, piece) => sum + doc.widthOfString(piece), 0);
  let cursor = x + width - total;
  if (align === 'left') cursor = x;
  if (align === 'center') cursor = x + (width - total) / 2;
  pieces.forEach((piece) => {
    const w = doc.widthOfString(piece);
    if (piece.trim()) doc.text(piece, cursor, y, { lineBreak: false });
    cursor += w;
  });
}

/** Breaks text into lines that fit the width (keeps the reading order of each line). */
function wrapLines(doc, text, width) {
  const lines = [];
  String(text ?? '').split(/\r?\n/).forEach((paragraph) => {
    let line = '';
    (paragraph.match(/\s+|\S+/g) || ['']).forEach((piece) => {
      const candidate = line + piece;
      if (line.trim() && lineWidth(doc, candidate.trim()) > width) {
        lines.push(line.trim());
        line = piece.trim() ? piece : '';
      } else {
        line = candidate;
      }
    });
    lines.push(line.trim());
  });
  return lines;
}

module.exports = { drawLine, wrapLines, lineWidth, visualPieces };
