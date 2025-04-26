const fs = require('fs');
// Filter out words which end in S. Wordl filters out plurals and past tense `ed` words
const words: string[] = fs.readFileSync('./wordle/5words2.txt')
    .toString().split(',');
const wordsSet = new Set(words);
class WordleGame {
    myWord: string;
    constructor() {
        this.myWord = 'kinky'; // chooseRandom();
        // console.log(this.myWord);
    }

    checkGuess(ans: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
        return checkGuess(ans, this.myWord);
    }
}

function checkGuess(guess: string, solution: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
    if (guess.length != 5) return null;
    if (!wordsSet.has(guess)) { return null; }
    const res = Array.from(guess).map((c, i) => {
        if (c === solution[i]) {
            return 2;
        } else if (solution.includes(c) && Array.from(solution).some((answerChar, i) => answerChar === c && guess[i] !== answerChar)) {
            // only show 1 if the character is present in the answer in a location that is not correct
            // ie a guess with aaxxx for word babbb would be 02000. The first value would be 0 since although a is in the answer, it has
            // already been found by the guess
            // TODO: another behavior, if a guess has a double letter both of which are in the wrong place, only the first is marked as 1
            return 1;
        }
        return 0;
    }) as [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)];
    // const otherRes = checkGuess2(guess, solution);
    // if (otherRes?.some((a, i) => a !== res[i])) {
    //     console.log('they dont match ', guess, solution, res, otherRes, );
    // }
    return res;
}

function checkGuess2(guess: string, solution: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
    if (guess.length != 5) return null;
    if (!wordsSet.has(guess)) { return null; }
    return Array.from(guess).map((c, i) => {
        if (c === solution[i]) {
            return 2;
        } else if (solution.includes(c)) {
            // only show 1 if the character is present in the answer in a location that is not correct
            // ie a guess with aaxxx for word babbb would be 02000. The first value would be 0 since although a is in the answer, it has
            // already been found by the guess
            return 1;
        }
        return 0;
    }) as [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)];
}

class WordleGuesser {
    strat: number;
    possible: Set<string>;
    invalidChars: Set<string> = new Set();
    misplacedChars: Set<string> = new Set();
    correctChars: [string, string, string, string, string] = ['', '', '', '', ''];

    gueses: [string, number[]][] = [];
    game: WordleGame;
    hasWon = false;
    constructor(game: WordleGame, strat = 0) {
        this.strat = strat;
        this.possible = new Set(words.filter(w => !w.endsWith('s')));
        this.game = game;
    }

    makeGuess(word: string | null = null) {
        if (this.hasWon) {
            return;
        }

        const guess = word == null ? this.getStratGuess() : word;
        console.log(guess);
        const res = this.game.checkGuess(guess);
        if (res == null) {
            console.log(`Guess ${guess} is not in the word dictionary. Ignoring`);
        } else {
            this.handleResult(guess, res);
            console.log(`Guessed ${guess} and result was ${res}`);
        }

    }

    getStratGuess() {
        if (this.strat === 0) {
            return this.getValidGuess();
        } else if (this.strat === 1) {
            return this.getRandomGuess();
        } else if (this.strat === 2) {
            return this.getValidFreqGuess();
        } else if (this.strat === 2) {
            return this.getAnyFreqGuess();
        } else {
            return this.getValidGuess();
        }
    }

    getValidGuess() {
        return Array.from(this.possible)[0];
    }

    getRandomGuess() {
        const arr = Array.from(this.possible);
        // console.log(arr.length, ' is length');
        return arr[Math.floor(Math.random() * arr.length)];
    }

    getValidFreqGuess(): string {
        const arr = Array.from(this.possible);
        const charCounts = getLetterCounts(this.possible);
        // restrict options to possible words
        const scores = getGuessFreqScores(arr, letters, guesser.possible.size);
        return scores[0][0];
    }

    getAnyFreqGuess(): string {
        if (this.possible.size < 3) {
            return Array.from(this.possible)[0];
        }
        const charCounts = getLetterCounts(this.possible);
        // Allow guess of any word
        const scores = getGuessFreqScores(words, letters, guesser.possible.size);
        return scores[0][0];
    }

    handleResult(guess: string, guessCharMatch: [number, number, number, number, number], debug = false) {
        const invalidChars = guess.split('')
            .filter((_, i) => guessCharMatch[i] === 0);
        const presentChars = guess.split('').filter((_, i) => guessCharMatch[i] === 1 || guessCharMatch[i] == 2);
        const misplacedChars = guessCharMatch
            .map((val, i) => (val === 1 ? [guess[i], i] : [guess[i], -1]))
            .filter(entry => entry[1] !== -1) as [string, number][];
        const correctChars = guess.split('')
            .map((c, i) => guessCharMatch[i] === 2 ? [c, i] : [c, -1])
            .filter(([_, i]) => i !== -1) as [string, number][];

        const posArr = Array.from(this.possible).filter(word => {
            return wordIsPossible(word, guess, guessCharMatch, invalidChars, presentChars, misplacedChars, correctChars, debug);
        });
        this.possible = new Set(posArr);
        invalidChars.forEach(c => this.invalidChars.add(c));
        misplacedChars.filter(([c, _]) => !this.correctChars.includes(c)).forEach(([c, _]) => this.misplacedChars.add(c));
        correctChars.forEach(([c, i]) => {
            this.misplacedChars.delete(c);
            this.correctChars[i] = c;
        });
        console.log(`Possible after ${guess} is [${posArr.slice(0, 10)}${posArr.length > 10 ? ',...' : ''}] with length ${posArr.length}`);
        console.log(`Correct letters [${Array.from(this.correctChars)}]. Misplaced letters [${Array.from(this.misplacedChars)}]. Invalid chars [${Array.from(this.invalidChars)}]`)
        this.gueses.push([guess, guessCharMatch]);
        this.hasWon = guessCharMatch.every(a => a === 2);
    }
}

function wordIsPossible(word: string, guess: string, guessCharMatch: number[], invalidChars: string[], presentChars: string[], misplacedChars: [string, number][], correctChars: [string, number][], debug = false): boolean {
    if (misplacedChars.some(([c, loc]) => word[loc] === c)) {
        if (debug) { console.log('asdf'); }
        // If word has a character which was marked as not in the right place, it cannot be the word
        return false;
    } else if (hasInvalidChar(word, invalidChars, correctChars)) {
        if (debug) {
            console.log('asdf1'); console.log('invalid chars are ', invalidChars); console.log(guessCharMatch);
            console.log(guess.split(''));
            console.log(guess.split('').filter((_, i) => guessCharMatch[i] === 0));
        }
        // If word has invalid character
        return false;
    } else if (!presentChars.every(c => word.includes(c))) {
        if (debug) { console.log('asdf2'); }
        return false;
    } else if (!correctChars.every(([c1, loc]) => Array.from(word).map((c2, i) => c2 === c1 ? i : -1).includes(loc))) {
        if (debug) { console.log('asdf3'); }
        return false;
    }
    return true;
}

function hasInvalidChar(word: string, invalidChars: string[], correctChars: [string, number][]): boolean {
    const foundInvalids = invalidChars.filter(c => word.includes(c));
    if (!foundInvalids?.length) {
        // No found invalids => false
        return false;
    }
    if (!correctChars.some(([c, _]) => word.includes(c))) {
        // Word has invalid characters with no equivalent valid characters
        return true;
    }
    for (const invalid of foundInvalids) {
        const indexes = findAll(word, invalid);
        for (const index of indexes) {
            if (!correctChars.some(([validChar, validCharLoc]) => validChar === invalid && validCharLoc === index)) {
                // Word has a character marked as invalid which is also marked as valid, but not in same space
                return true;
            }
        }
    }
    return false;
}

function findAll(str: string, val: string): number[] {
    return Array.from(str)
        .map((c, i) => [c, i] as [string, number])
        .filter(([el, _]) => el === val)
        .map(([_, i]) => i);
}

function chooseRandom() {
    return words[Math.floor(Math.random() * words.length)];
}

function getLetterCounts(possible: Set<string>): Map<string, number> {
    const letters = new Map();
    Array.from(possible)
        .forEach(word => Array.from(word)
            .forEach((c, i) => letters.set(c, (letters.get(c) || 0) + 1)));
    return letters;
}

function getGuessFreqScores(words: string[], letters: Map<string, number>, numPossible: number, adjusted = true) {
    let scores = words.map(word => {
        const used = new Set();
        const myScore = Array.from(word).reduce((sum, c) => {
            if (used.has(c)) {
                return sum;
            } else {
                used.add(c);
                if (adjusted) {
                    return convertToAdjustedScore(letters.get(c), numPossible) + sum;
                } else {
                    return getScore(letters.get(c)) + sum;
                }
            }
        }, 0);
        return [word, myScore] as [string, number];
    })
    scores.sort((a, b) => b[1] - a[1]);
    scores = scores.map(val => [val[0], val[1]]);
    return scores;
}

function getScore(val: number | undefined): number {
    return val ?? 0;
}

function convertToAdjustedScore(val: number | undefined, max: number): number {
    if (val == null) {
        return 0;
    }
    // if (max < 10) {
    //     return val;
    // }
    if (val < max / 2) {
        return val;
    } else if (val < max) {
        return max - val;
    } else {
        // console.log('weird', val, max);
        return 0;
    }
}

type guessOutcome = { guess: string, numOutcomes: number, avgSize: number, outcome: Map<string, string[]>, outcomeStringed: string[], roughAvgGuess: number, recursiveOutcomes: any };

function rateGuessByOutcome({guesses, possible, sort = 'roughAvgGuess', recursive = false }:
    { guesses: string[], possible: Set<string>, sort?: 'roughAvgGuess' | 'numOutcomes' | 'avgSize', recursive?: boolean }): guessOutcome[] {
    const a = guesses.map(guess => {
        const outcome = getGuessOutcomes(guess, possible);

        const outcomeSummary = Array.from(outcome).map(([key, val]) => [key, val.length, val.join(',').slice(0, 100)] as [string, number, string]).sort((a, b) => b[1] - a[1]);
        const outcomeStringed = outcomeSummary.map((a) => JSON.stringify(a));
        if (!outcome.size) {
            return { guess, numOutcomes: Infinity, avgSize: Infinity, outcome, roughAvgGuess: Infinity, outcomeStringed, recursiveOutcomes: [] };
        }
        let recursiveOutcomes: any[] = [];
        if (recursive) {
            console.log('recursing', outcome.size, guess);
            recursiveOutcomes = Array.from(outcome.values()).filter(pos => pos.length > 2).map(possible => rateGuessByOutcome({guesses, possible: new Set(possible), sort })?.[0]).map(res => ({ word: res?.guess, roughAvgGuess: res?.roughAvgGuess }));
        }
        const numOutcomes = outcome.size;
        const avgSize = Array.from(outcome.values()).reduce((sum, val) => sum + (val.length * val.length), 0) / possible.size;
        const roughAvgGuess = Array.from(outcome.keys()).reduce((sum, key) => {
            if (key === '2,2,2,2,2') {
                return sum;
            }
            const additionalGuesses = (Math.log(outcome.get(key)!.length) / Math.log(4)) + 1;
            return sum + (additionalGuesses * outcome.get(key)!.length);
        }, 0) / possible.size;
        return { guess, numOutcomes, avgSize, outcome, outcomeStringed, roughAvgGuess, recursiveOutcomes };
    }).sort((a, b) => {
        return a[sort] - b[sort];
    });
    return a;
}


function getGuessOutcomes(guess: string, possible: Set<string>): Map<string, string[]> {
    const outcomes = new Map();
    Array.from(possible).forEach(word => {
        const outcome = checkGuess(guess, word);
        if (!outcome) {
            return;
        }
        const outcomeStr = outcome.join(',');
        outcomes.set(outcomeStr, outcomes.get(outcomeStr) ?? []);
        outcomes.get(outcomeStr)?.push(word);
    });
    return outcomes;
}

// function getHighScorers(guesser: WordleGuesser) {
//     const letters = getLetterCounts(guesser);
//     const letters2 = letters.forEach((v, k) => letters.set(k, Math.abs((guesser.possible.size / 2) - v) + 0.5))
//     console.log();
//     console.log('Parsed letter counts for total poss: ', guesser.possible.size);
//     console.log(Array.from(letters).sort((a,b) => b[1] - a[1]));
//     const scores = Array.from(guesser.possible).map(word =>{
//       const used = new Set();
//       const myScore = Array.from(word).reduce((sum, c) => {
//         if (used.has(c)) {
//           return sum;
//         } else {
//           used.add(c);
//           return (letters.get(c) || 0) + sum;
//         }
//       }, 0);
//       return  [word, myScore] as [string, number];
//     }).sort((a,b) => b[1] - a[1]);
//     console.log();
//     console.log('High scoring words for remaining letters are: ')
//     console.log(scores.slice(0,10));
//     return scores;
// }

// function getLetterCounts(guesser: WordleGuesser) {
//     const letters = new Map();
//     Array.from(guesser.possible).forEach(word => Array.from(word).forEach(c => letters.set(c, (letters.get(c) || 0) + 1)));
//     console.log();
//     console.log('Unfiltered letter counts: ')
//     console.log(Array.from(letters).sort((a,b) => b[1] - a[1]));
//     return letters;
// }


const a = new WordleGame();
const guesser = new WordleGuesser(a, 2);
guesser.handleResult('caret', [0,0,0,0,0]);
guesser.handleResult('sonly', [0,1,1,0,0]);
// guesser.handleResult('blown', [0,0,2,2,2]);
// guesser.handleResult('spiky', [2,0,2,1,0]);
// guesser.handleResult('skill', [2,2,2,0,0]);

const letters = getLetterCounts(guesser.possible);
const adjustedScores = getGuessFreqScores(words, letters, guesser.possible.size);
const rawScores = getGuessFreqScores(Array.from(guesser.possible), letters, guesser.possible.size, false);
console.log();
console.log(`Unfiltered letter counts out of total ${guesser.possible.size} possible words: `)
console.log(Array.from(letters).sort((a, b) => b[1] - a[1]));
// letters.set('y', 0);
// letters.set('u', 0);

if (guesser.possible.size > 3) {
    console.log();
    console.log('High adjusted scoring words for remaining letters are: ')
    console.log(adjustedScores.slice(0, 3));
    console.log();
    console.log('High raw scoring valid words for remaining letters are: ')
    console.log(rawScores.slice(0, 3));
    console.log();
    console.log(`Potential frequency guess ${guesser.getAnyFreqGuess()}`);
    console.log(`Potential valid frequency guess ${guesser.getValidFreqGuess()}`);

    console.log();
    console.log('Rated by outcome:');
    const res1 = rateGuessByOutcome({guesses: Array.from(guesser.possible), possible: guesser.possible, recursive: false});
    console.log(res1.slice(0, 5).map(word => ({
        guess: word.guess,
        avg: word.avgSize,
        count: word.outcome.size,
        expGuess: word.roughAvgGuess,
        outcomeSizes: word.outcomeStringed.map(a => Number(a.split(',')[5])).slice(0, 100),
        outComesStringed: word.outcomeStringed.slice(0, 40),
        recursive: word.recursiveOutcomes.map((out: any) => JSON.stringify(out)),
    })));

    // console.log();
    // console.log('Valid rated by outcome:');
    // const res = rateGuessByOutcome({guesses: Array.from(guesser.possible), possible: guesser.possible});
    // console.log(res.slice(0, 10).map(word => ({ guess: word.guess, avg: word.avgSize, expGuess: word.roughAvgGuess, outComesStringed: word.outcomeStringed.slice(0, 20) })));

    console.log(guesser.gueses);
} else {
    console.log();
    if (guesser.possible.size == 1) {
        console.log('We found it!');
    }
    console.log('Possible words:');
    console.log(Array.from(guesser.possible));
}
