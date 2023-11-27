const fs = require('fs');
// Filter out words which end in S. Wordl filters out plurals and past tense `ed` words
const words: string[] = fs.readFileSync('./wordle/5words.txt')
    .toString().split(',')
    .filter((word: string) => !word.endsWith('s'));
const wordsSet = new Set(words);
class WordleGame {
    myWord: string;
    constructor() {
        this.myWord = 'kinky'; // chooseRandom();
        // console.log(this.myWord);
    }

    checkAnswer(ans: string): (0 | 1 | 2)[] | null {
        if (!wordsSet.has(ans)) { return null; }

        return Array.from(ans).map((c, i) => {
            if (c === this.myWord[i]) {
                return 2;
            } else if (this.myWord.includes(c)) {
                return 1;
            }
            return 0;
        });
    }
}

class WordleGuesser {
    strat: number;
    possible: Set<string>;
    gueses: [string, number[]][] = [];
    game: WordleGame;
    hasWon = false;
    constructor(game: WordleGame, strat = 0) {
        this.strat = strat;
        this.possible = new Set(words);
        this.game = game;
    }

    makeGuess(word: string | null = null) {
        if (this.hasWon) {
            return;
        }

        const guess = word == null ? this.getStratGuess() : word;
        console.log(guess);
        const res = this.game.checkAnswer(guess);
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

    handleResult(guess: string, guessCharMatch: number[], debug = false) {
        const invalidChars = guess.split('')
            .filter((_, i) => guessCharMatch[i] === 0)
            .filter(c => !findAll(guess, c).some(i => guessCharMatch[i] === 2));
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
        console.log(`Possible after ${guess} is [${posArr.slice(0, 10)}${posArr.length > 10 ? ',...' : ''}] with length ${posArr.length}`);
        this.gueses.push([guess, guessCharMatch]);
        this.hasWon = guessCharMatch.every(a => a === 2);
    }
}

function wordIsPossible(word: string, guess: string, guessCharMatch: number[], invalidChars: string[], presentChars: string[], misplacedChars: [string, number][], correctChars: [string, number][], debug = false): boolean {
    if (misplacedChars.some(([c, loc]) => word[loc] === c)) {
        if (debug) { console.log('asdf'); }
        // If word has a character which was marked as not in the right place, it cannot be the word
        return false;
    } else if (invalidChars.some(c => word.includes(c))) {
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

function getGuessFreqScores(words: string[], letters: Map<string, number>, numPossible: number) {
    let scores = words.map(word => {
        const used = new Set();
        const myScore = Array.from(word).reduce((sum, c) => {
            if (used.has(c)) {
                return sum;
            } else {
                used.add(c);
                return convertCountToScore(letters.get(c), numPossible) + sum;
            }
        }, 0);
        return [word, myScore] as [string, number];
    })
    scores.sort((a, b) => b[1] - a[1]);
    scores = scores.map(val => [val[0], val[1]]);
    return scores;
}

function convertCountToScore(val: number | undefined, max: number) {
    if (val == null) {
        return 0;
    }
    if (val < max / 2) {
        return val;
    } else if (val < max) {
        return max - val;
    } else {
        // console.log('weird', val, max);
        return 0;
    }
}

const a = new WordleGame();
const guesser = new WordleGuesser(a, 2);
guesser.handleResult('orate', [0, 0, 1, 1, 0]);
guesser.handleResult('antic', [1, 1, 1, 0, 0]);
// guesser.handleResult('haunt', [0,2,0,2,1]);
// guesser.handleResult('spiky', [2,0,2,1,0]);
// guesser.handleResult('skill', [2,2,2,0,0]);

const letters = getLetterCounts(guesser.possible);
const scores = getGuessFreqScores(words, letters, guesser.possible.size);
console.log();
console.log(`Unfiltered letter counts out of total ${guesser.possible.size} possible words: `)
console.log(Array.from(letters).sort((a, b) => b[1] - a[1]));
// letters.set('y', 0);
// letters.set('u', 0);

if (guesser.possible.size > 3) {
    console.log();
    console.log('High scoring words for remaining letters are: ')
    console.log(scores.slice(0, 10));
    console.log();
    console.log(`Potential frequency guess ${guesser.getAnyFreqGuess()}`);
    console.log(`Potential valid frequency guess ${guesser.getValidFreqGuess()}`);

    console.log(guesser.gueses);
} else {
    console.log();
    if (guesser.possible.size == 1) {
        console.log('We found it!');
    }
    console.log('Possible words:');
    console.log(Array.from(guesser.possible));
}
