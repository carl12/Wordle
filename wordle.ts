const fs = require('fs');
const path = require('path');
// Filter out words which end in S. Wordl filters out plurals and past tense `ed` words
const badAntiWords = ['ohhhh', 'ahhhh', 'pffft']
const badNYTWords = ['bonny', 'fondu', 'nonny', 'plumy', 'shish', 'ftped', 'mater', 'caret', 'waspy', 'pasha', 'washy', 'mashy', 'dashy', 'obeah', 'dunno', 'annoy', 'synod', 'nabob', 'unbox', 'bunko'];
const addedNYTWords = ['bliss', 'savoy', 'saggy', 'panko'];
const words: string[] = fs.readFileSync('./wordLists/5words4-lsv-freq-full.txt')
    .toString().split('\n').filter(w => !badAntiWords.includes(w)).concat(addedNYTWords);
const wordsSet = new Set(words);
class WordleGame {
    myWord: string;
    constructor() {
        this.myWord = 'kinky'; // chooseRandom();
        // console.log(this.myWord);
    }

    checkGuess(ans: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
        return checkGuess3(ans, this.myWord);
    }
}

function naiveWordFilter(disallowed: string[], correctChars: string[]): string[] {
    return words.filter(w => {
        if (disallowed.some(c => w.includes(c))) {
            return false;
        } else if (correctChars.some((c, i) => c && w[i] !== c)) {
            return false;
        }
        return true;
    });
}

function checkGuess3(guess: string, solution: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
    const debug = guess === 'pylonaaaa' && solution === 'sally';
    if (debug) {
        console.log('Checking', guess, 'against', solution);
    }
    if (guess.length != 5) return null;
    if (!wordsSet.has(guess)) { return null; }
    const solChrs = Array.from(solution);
    const res: [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] = [0, 0, 0, 0, 0];
    for (const i in solChrs) {
        if (solChrs[i] === guess[i]) {
            solChrs[i] = '';
            res[i] = 2;
        }
    }
    if (debug) {
        console.log(solChrs, res);
    }
    for (const i in solChrs) {
        if (debug) {
            console.log('Checking', guess[i], 'against', solChrs);
            console.log('Index is', solChrs.indexOf(guess[i]));
        }
        if (res[i] === 2) {
            continue;
        }
        const matchIndex = solChrs.indexOf(guess[i]);
        if (matchIndex !==  -1) {
            res[i] = 1;
            solChrs[matchIndex] = '';
        }
        if (debug) {
            console.log(solChrs, res);
        }
    }
    if (debug) {
        console.log(solChrs, res);
    }
    if (debug) {
        console.log('~~~~~~~~~~~~~~~~~~`````');
    }
    return res;
}

function checkGuess2(guess: string, solution: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
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
    return res;
}

function checkGuess(guess: string, solution: string): [(0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2), (0 | 1 | 2)] | null {
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
    misplacedCharLocs: Map<string, Set<number>> = new Map();
    correctChars: [string, string, string, string, string] = ['', '', '', '', ''];

    guesses: [string, number[]][] = [];
    game: WordleGame;
    hasWon = false;
    constructor(game: WordleGame, filterS: boolean = false, excludeWords: string[] = [], strat = 0) {
        this.strat = strat;
        this.possible = new Set(words
            .filter(w => !filterS || !w.endsWith('s'))
            .filter(w => !excludeWords.includes(w))
        );
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
        const scores = getGuessFreqScores(arr, charCounts, this.possible.size);
        return scores[0][0];
    }

    getAnyFreqGuess(): string {
        if (this.possible.size < 3) {
            return Array.from(this.possible)[0];
        }
        const charCounts = getLetterCounts(this.possible);
        // Allow guess of any word
        const scores = getGuessFreqScores(words, charCounts, this.possible.size);
        return scores[0][0];
    }

    handleResult(guess: string, guessCharMatch: [number, number, number, number, number], debug = false) {
        const presentChars = guess.split('').filter((_, i) => guessCharMatch[i] === 1 || guessCharMatch[i] == 2);
        const misplacedChars = guessCharMatch
            .map((val, i) => (val === 1 ? [guess[i], i] : [guess[i], -1]))
            .filter(entry => entry[1] !== -1) as [string, number][];
        const correctChars = guess.split('')
            .map((c, i) => guessCharMatch[i] === 2 ? [c, i] : [c, -1])
            .filter(([_, i]) => i !== -1) as [string, number][];
        const invalidChars = guess.split('')
            .filter((c, i) => guessCharMatch[i] === 0 && !presentChars.includes(c) && !this.misplacedChars.has(c));

        const posArr = Array.from(this.possible).filter(word => {
            return wordIsPossible(word, guess, guessCharMatch, invalidChars, presentChars, misplacedChars, correctChars, debug);
        });
        this.possible = new Set(posArr);
        invalidChars.forEach(c => this.invalidChars.add(c));
        misplacedChars.filter(([c, _]) => !this.correctChars.includes(c)).forEach(([c, _]) => this.misplacedChars.add(c));
        misplacedChars.forEach(([c, i]) => {
            if (!this.misplacedCharLocs.has(c)) {
                this.misplacedCharLocs.set(c, new Set());
            }
            this.misplacedCharLocs.get(c)!.add(i);
        });
        correctChars.forEach(([c, i]) => {
            this.misplacedChars.delete(c);
            this.correctChars[i] = c;
        });
        console.log(`Possible after ${guess} is [${posArr.slice(0, 10)}${posArr.length > 10 ? ',...' : ''}] with length ${posArr.length}`);
        console.log(`Correct letters [${Array.from(this.correctChars)}]. Misplaced letters [${Array.from(this.misplacedChars)}]. Invalid chars [${Array.from(this.invalidChars)}]`);
        console.log('------------------------');
        this.guesses.push([guess, guessCharMatch]);
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

function getLetterCounts(possible: Set<string> | string[]): Map<string, number> {
    const letters = new Map();
    Array.from(possible)
        .forEach(word => Array.from(word)
            .forEach((c, i) => letters.set(c, (letters.get(c) || 0) + 1)));
    return letters;
}

function doLetterCountRanking(candidates: Set<string> | string[], letters: Map<string, number>, log = true): [string, number][] {
    const candidateList = Array.from(candidates);
    const adjustedScores = getGuessFreqScores(words, letters, candidateList.length);
    const rawScores = getGuessFreqScores(candidateList, letters, candidateList.length, false);
    if (log) {
        console.log();
        console.log(`Unfiltered letter counts out of total ${candidateList.length} possible words: `)
        console.log(Array.from(letters).sort((a, b) => b[1] - a[1]));
        console.log();
        console.log('High adjusted scoring words for remaining letters are: ')
        console.log(adjustedScores.slice(0, 3));
        console.log();
        console.log('High raw scoring valid words for remaining letters are: ')
        console.log(rawScores.slice(0, 3));
    }
    return rawScores;
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

type guessOutcome = { guess: string, numOutcomes: number, avgSize: number, outcome: Map<string, string[]>, outcomeStringed: string[], roughAvgGuess: number, recursiveOutcomes: any, largestOutcome: number };
type rateArgs = { potentialGuesses: string[], possible: Set<string>, sort?: 'roughAvgGuess' | 'numOutcomes' | 'avgSize' | 'largestOutcome', recursive?: boolean, logging?: 'none' | 'basic' };
function getWordleGuessOutcomes({potentialGuesses, possible, recursive = false, logging = 'none' }: rateArgs): guessOutcome[] {
    if (logging !== 'none') {
        console.log(`Rating ${potentialGuesses.length} guesses with ${possible.size} possible words`);
    }
    const a = potentialGuesses.map(guess => {
        const outcome = getGuessOutcomes(guess, possible);
        if (!outcome.size) {
            return { guess, numOutcomes: Infinity, avgSize: Infinity, outcome, roughAvgGuess: Infinity, outcomeStringed: [], recursiveOutcomes: [], largestOutcome: Infinity };
        }
        const outcomeStringed = stringifyOutcome(outcome);

        let recursiveOutcomes: any[] = [];
        if (recursive) {
            // TODO: verify this is working correctly and extend functionalty. Maybe add depth?
            console.log('recursing', outcome.size, guess);
            recursiveOutcomes = Array.from(outcome.values()).filter(pos => pos.length > 2).map(possible => getWordleGuessOutcomes({potentialGuesses, possible: new Set(possible), logging })?.[0]).map(res => ({ word: res?.guess, roughAvgGuess: res?.roughAvgGuess }));
        }
        const numOutcomes = outcome.size;
        const avgSize = Array.from(outcome.values()).reduce((sum, val) => sum + (val.length * val.length), 0) / possible.size;
        const largestOutcome = Math.max(...Array.from(outcome.values()).map(val => val.length));
        const roughAvgGuess = getAvgGuess(outcome, possible.size);
        return { guess, numOutcomes, avgSize, outcome, outcomeStringed, roughAvgGuess, recursiveOutcomes, largestOutcome };
    });
    return a;
}

function groupDordleOutcomes(args: rateArgs & { possible2: Set<string>}): {
    guess: string,
    avgGuess1: number,
    avgGuess2: number,
    sumAvgGuess: number,
    maxAvgGuess: number,
    minAvgGuess: number,
    numOutcomes1: number,
    numOutcomes2: number,
    outcomeSizes1: number[],
    outcomeSizes2: number[],
    outcomeStringed1: string[],
    outcomeStringed2: string[],
}[] {
    const { potentialGuesses, possible, possible2, sort = 'roughAvgGuess', recursive = false } = args;
    const mergedOutcomes = potentialGuesses.map(guess => {
        const outcome1 = getGuessOutcomes(guess, possible);
        const outcome2 = getGuessOutcomes(guess, possible2);
        if (!outcome1.size || !outcome2.size) {
            const a = {
                guess,
                avgGuess1: Infinity,
                avgGuess2: Infinity,
                sumAvgGuess: Infinity,
                maxAvgGuess: Infinity,
                minAvgGuess: Infinity,
                numOutcomes1: Infinity,
                numOutcomes2: Infinity,
                outcomeSizes1: [],
                outcomeSizes2: [],
                outcomeStringed1: stringifyOutcome(outcome1),
                outcomeStringed2: stringifyOutcome(outcome2),
            };
            return a;
        }
        const avgGuess1 =  getAvgGuess(outcome1, possible.size);
        const avgGuess2 = getAvgGuess(outcome2, possible2.size);
        return {
            guess,
            avgGuess1: avgGuess1,
            avgGuess2: avgGuess2,
            sumAvgGuess: avgGuess1 + avgGuess2,
            maxAvgGuess: Math.max(avgGuess1, avgGuess2),
            minAvgGuess: Math.min(avgGuess1, avgGuess2),
            numOutcomes1: outcome1.size,
            numOutcomes2: outcome2.size,
            outcomeSizes1: stringifyOutcome(outcome1).map(a => Number(a.split(',')[5])).slice(0, 100),
            outcomeSizes2: stringifyOutcome(outcome2).map(a => Number(a.split(',')[5])).slice(0, 100),
            outcomeStringed1: stringifyOutcome(outcome1),
            outcomeStringed2: stringifyOutcome(outcome2),
        };
    });

    return mergedOutcomes;
}

function groupQuordleOutcomes(args: rateArgs & { possible2: Set<string>, possible3: Set<string>, possible4: Set<string>}): {
    guess: string,
    avgGuessList: number[],
    sumAvgGuess: number,
    maxAvgGuess: number,
    minAvgGuess: number,
    numOutcomesList: number[],
    outcomeSizesList: number[][],
    outcomeStringedList: string,
}[] {
    const { potentialGuesses, possible, possible2, possible3, possible4, sort = 'roughAvgGuess', recursive = false } = args;
    const mergedOutcomes = potentialGuesses.map(guess => {
        const outcome1 = getGuessOutcomes(guess, possible);
        const outcome2 = getGuessOutcomes(guess, possible2);
        const outcome3 = getGuessOutcomes(guess, possible3);
        const outcome4 = getGuessOutcomes(guess, possible4);
        const strOutComes = [outcome1, outcome2, outcome3, outcome4].map(outcome => stringifyOutcome(outcome));
        const avgGuess1 = zeroifyNan(getAvgGuess(outcome1, possible.size));
        const avgGuess2 = zeroifyNan(getAvgGuess(outcome2, possible2.size));
        const avgGuess3 = zeroifyNan(getAvgGuess(outcome3, possible3.size));
        const avgGuess4 = zeroifyNan(getAvgGuess(outcome4, possible4.size));
        return {
            guess,
            avgGuessList: [avgGuess1, avgGuess2, avgGuess3, avgGuess4],
            sumAvgGuess: avgGuess1 + avgGuess2 + avgGuess3 + avgGuess4,
            maxAvgGuess: Math.max(avgGuess1, avgGuess2, avgGuess3, avgGuess4),
            minAvgGuess: Math.min(avgGuess1, avgGuess2, avgGuess3, avgGuess4),
            numOutcomesList: [outcome1.size, outcome2.size, outcome3.size, outcome4.size],
            outcomeSizesList: strOutComes.map(strs => strs.map(a => Number(a.split(',')[5])).slice(0, 100)),
            outcomeStringedList: strOutComes.map(strs => strs.join('\n')).join('\n\n'),
        };
    });

    return mergedOutcomes;
}

function zeroifyNan(a: number): number {
    return isNaN(a) ? 0 : a;
}

function getAvgGuess(outcome: Map<string, string[]>, numPossible: number): number {
    return Array.from(outcome.keys()).reduce((sum, key) => {
        if (key === '2,2,2,2,2') {
            return sum;
        }
        const additionalGuesses = (Math.log(outcome.get(key)!.length) / Math.log(4)) + 1;
        return sum + (additionalGuesses * outcome.get(key)!.length);
    }, 0) / numPossible;
}

function calcExpectedGuess(key: string, result: string[]): number {
    if (key === '2,2,2,2,2') {
        return 0;
    }
    const additionalGuesses = (Math.log(result.length) / Math.log(4)) + 1;
    return additionalGuesses;
}

function getGuessOutcomes(guess: string, possible: Set<string>): Map<string, string[]> {
    const outcomes = new Map();
    Array.from(possible).forEach(word => {
        const outcome = checkGuess3(guess, word);
        if (!outcome) {
            return;
        }
        const outcomeStr = outcome.join(',');
        outcomes.set(outcomeStr, outcomes.get(outcomeStr) ?? []);
        outcomes.get(outcomeStr)?.push(word);
    });
    return outcomes;
}

function stringifyOutcome(outcome: Map<string, string[]>, lineLength = 60, ): string[] {
    const outcomeSummary = Array.from(outcome)
        .map(([key, val]) => [
            key === '2,2,2,2,2' ? 'WIN'.padEnd(9, ' ') : key,
            val.length, val.join(',').length > lineLength ? val.join(',').slice(0, lineLength) + '...' : val.join(',').slice(0, lineLength)
        ] as [string, number, string])
        .sort((a, b) => b[1] - a[1]);

    return outcomeSummary.map((a) => JSON.stringify(a));
}

function makeDouble(g1: WordleGuesser, g2: WordleGuesser) {
    return (guess: string, guessCharMatch1: [number, number, number, number, number], guessCharMatch2: [number, number, number, number, number]) => {
        g1.handleResult(guess, guessCharMatch1);
        g2.handleResult(guess, guessCharMatch2);
    }
}

function makeQuordle(g1: WordleGuesser, g2: WordleGuesser, g3: WordleGuesser, g4: WordleGuesser) {
    return (guess: string, guessCharMatch1: [number, number, number, number, number], guessCharMatch2: [number, number, number, number, number], guessCharMatch3: [number, number, number, number, number], guessCharMatch4: [number, number, number, number, number]) => {
        g1.handleResult(guess, guessCharMatch1);
        g2.handleResult(guess, guessCharMatch2);
        g3.handleResult(guess, guessCharMatch3);
        g4.handleResult(guess, guessCharMatch4);
        console.log('~~~~~~~~~~~~~~~');
    }
}

function makeSingle(g1: WordleGuesser) {
    return function singleHandle(guess: string, guessCharMatch1: [number, number, number, number, number]) {
        g1.handleResult(guess, guessCharMatch1);
    }
}

function sortOutcome(outcomes: guessOutcome[], sorts: [keyof guessOutcome, boolean][]): guessOutcome[] {
    return outcomes.sort((a, b) => {
        for (const sort of sorts) {
            const [key, asc] = sort;
            if (a[key] === b[key]) {
                continue;
            }
            return asc ? a[key] - b[key] : b[key] - a[key]
        }
        return 0;
    });
}

function logGameState(game1: WordleGuesser, game2?: WordleGuesser, guessInfo: guessOutcome[] = []): void {
    let fileName;
    let output;
    const date = new Date().toLocaleString().split(',')[0];
    if (game2) {
        fileName = 'dordleLog.txt';
        output = 'dordleLog.txt';
        console.log('Not implemented yet');
    } else {
        fileName = 'wordleLog.txt';
        const possibleList = Array.from(game1.possible);
        const guesses = guessInfo?.slice(0, 10)
        output = JSON.stringify({
            date,
            guesses: game1.guesses,
            numPossible: game1.possible.size,
            charInfo: { invalid: game1.invalidChars, misplaced: game1.misplacedChars, correct: game1.correctChars },
            possible: possibleList.length > 10 ? possibleList.slice(0, 10).concat([`and ${possibleList.length - 10} more ...`]) : possibleList,
            ...(guesses?.length ? { potentials: guesses.slice(0, 5).map(g => ([ g.guess, g.numOutcomes, g.roughAvgGuess.toFixed(2) ]))} : {})
        });
        console.log('logging game state for single game to ' + fileName);
        fs.appendFileSync(path.join(__dirname, fileName), output + '\n');
    }
}

function verboseLog(res: guessOutcome[], count = 10, stringed = false): void {
    console.log();
    console.log(res.slice(0, count).map(word => ({
        guess: word.guess,
        avg: word.avgSize,
        outcomeCounts: word.outcome.size,
        expGuess: word.roughAvgGuess,
        outcomeSizes: word.outcomeStringed.map(a => Number(a.split(',')[5])).slice(0, 100),
        ...(stringed ? { outComesStringed: word.outcomeStringed.slice(0, 40) } : {}),
        recursive: word.recursiveOutcomes.map((out: any) => JSON.stringify(out)),
    })));
}

function shortLog(res: guessOutcome[], { count1 = 20, count2 = 40, start1 = 0, start2 = count1 } = {}) {
    console.log('Compressed list');
    console.log(JSON.stringify(res.slice(start1, start1 + count1).map(word => ([ word.guess, word.outcome.size, word.roughAvgGuess.toFixed(2) ]))));
    console.log('...');
    console.log(JSON.stringify(res.slice(start2, start2 + count2).map(word => ([ word.guess, word.outcome.size, word.roughAvgGuess.toFixed(2) ]))));
}

playWordle();
function playWordle() {
    console.log('~~~~~~~~~~~~~~~ Starting Wordle ~~~~~~~~~~~~~~~');
    const oldGuessStyle = false;
    const filterS = true;
    const a = new WordleGame();
    const guesser = new WordleGuesser(a, filterS, badNYTWords);
    guesser.handleResult('toile', [0,1,0,0,0]);
    // guesser.handleResult('caron', [0,1,1,1,2]);
    // guesser.handleResult('voter', [0,2,0,2,2]);
    const res0 = getWordleGuessOutcomes({potentialGuesses: words, possible: guesser.possible, recursive: false, logging: 'basic'});
    sortOutcome(res0, [['numOutcomes', false], ['roughAvgGuess', true]])
    // res0.sort((a, b) => a.roughAvgGuess - b.roughAvgGuess);
    const guesses = res0.map(a => a.guess);
    // const letterCount = getLetterCounts(guesses.slice(0, 100));
    // const guessRarity = doLetterCountRanking(guesses.slice(0, 100), letterCount, false);
    // console.log(guessRarity);

    logGameState(guesser, undefined, res0);
    if (guesser.possible.size > 2) {
        if (oldGuessStyle) {
            const letters = getLetterCounts(guesser.possible);
            doLetterCountRanking(guesser.possible, letters);
        }
        const stringed = guesser.possible.size < 40;
        verboseLog(res0, 4, stringed);
        shortLog(res0, { count1: 20, count2: 20 });

    } else {
        console.log();
        if (guesser.possible.size == 1) {
            console.log('We found it!');
        }
        console.log('Possible words:');
        console.log(Array.from(guesser.possible));
    }
}

// playAntiWordle();
function playAntiWordle() {
    console.log('~~~~~~~~~~~~~~~ Starting Anti-Wordle ~~~~~~~~~~~~~~~');
    const oldGuessStyle = false;
    const filterS = true;
    const a = new WordleGame();
    const guesser = new WordleGuesser(a, filterS, badNYTWords);
    // guesser.handleResult('jujus', [0,0,0,0,1]);
    // guesser.handleResult('gypsy', [0,0,0,1,0]);
    // guesser.handleResult('scoff', [2,0,0,0,0]);
    // guesser.handleResult('samba', [2,1,0,0,0]);
    // guesser.handleResult('sisal', [2,0,0,1,0]);
    // guesser.handleResult('dunno', [1,1,0,0,1]);
    // guesser.handleResult('dough', [1,1,1,0,0]);
    const guessable = words
        .filter((word) => !guesser.correctChars.some((c, i) => c && word.charAt(i) !== c))
        .filter((word) => !Array.from(guesser.invalidChars).some(c => word.includes(c)))
        .filter(word => !(Array.from(guesser.misplacedChars)).some(c => !word.includes(c)))
        // Don't wordle doesn't allow yellows in the same place as a previous one
        .filter(word => !Array.from(word).some((c, i) => guesser.misplacedCharLocs.get(c)?.has(i)));
    const res0 = getWordleGuessOutcomes({potentialGuesses: guessable, possible: guesser.possible, recursive: false, logging: 'basic'});
    res0.sort((a, b) => a.numOutcomes - b.numOutcomes);
    verboseLog(res0, 3, true);
    shortLog(res0);
}

// playDordle();

function playDordle() {
    const a1 = new WordleGame();
    const a2 = new WordleGame();

    const guesser1 = new WordleGuesser(a1);
    const guesser2 = new WordleGuesser(a2);
    const handle = makeDouble(guesser1, guesser2);
    handle('raise', [0,0,0,0,0], [0,2,1,0,0]);
    handle('mulct', [0,0,0,0,1], [0,0,1,0,1]);
    handle('latin', [0,0,1,0,1], [2,2,2,2,2]);
    logGameState(guesser1, guesser2);
    console.log();
    console.log('Rated by outcome:');
    // const res1 = rateDordleByOutcome({potentialGuesses: Array.from(guesser1.possible).concat(Array.from(guesser2.possible)), possible: guesser1.possible, possible2: guesser2.possible });
    const res1 = groupDordleOutcomes({potentialGuesses: words, possible: guesser1.possible, possible2: guesser2.possible });
    // const res2 = res1.filter(a => a.guess === 'bumpy');
    res1.sort((a, b) => a.sumAvgGuess - b.sumAvgGuess);
    console.log(res1.slice(0, 5));
}

// playQuordle();
function playQuordle() {
    console.log('~~~~~~~~~~~~~~~ Starting Quordle ~~~~~~~~~~~~~~~');
    const a1 = new WordleGame();
    const a2 = new WordleGame();
    const a3 = new WordleGame();
    const a4 = new WordleGame();

    const guesser1 = new WordleGuesser(a1);
    const guesser2 = new WordleGuesser(a2);
    const guesser3 = new WordleGuesser(a3);
    const guesser4 = new WordleGuesser(a4);
    const handle = makeQuordle(guesser1, guesser2, guesser3, guesser4);
    handle('raise', [0,0,0,0,1], [0,1,1,1,0], [0,0,1,0,0], [0,1,0,2,1]);
    handle('month', [0,0,1,0,0], [0,0,1,0,0], [0,1,2,2,0], [0,0,0,1,0]);
    handle('pinto', [0,0,1,0,0], [0,1,1,0,0], [2,2,2,2,2], [0,0,0,1,0]);
    handle('kneel', [2,2,2,2,0], [0,2,0,0,2], [0,0,0,0,0], [0,0,1,0,0]);
    handle('kneed', [2,2,2,2,2], [0,2,0,0,0], [0,0,0,0,0], [0,0,1,0,0]);
    handle('snail', [2,2,2,2,2], [2,2,2,2,2], [0,0,0,0,0], [1,0,2,0,0]);
    // handle('prank', [0,0,0,0,0], [2,2,2,2,2], [0,0,1,0,1], [0,0,0,0,0]);
    // handle('', [0,0,0,0,0], [0,0,2,0,2], [0,0,0,0,1], [2,2,2,2,2]);


    logGameState(guesser1, guesser2);
    console.log();
    console.log('Rated by outcome:');
    const res1 = groupQuordleOutcomes({potentialGuesses: words, possible: guesser1.possible, possible2: guesser2.possible, possible3: guesser3.possible, possible4: guesser4.possible });
    res1.sort((a, b) => a.sumAvgGuess - b.sumAvgGuess);
    console.log(res1.slice(0, 5));
    console.log('Compressed list');
    console.log(JSON.stringify(res1.slice(0, 10).map(word => ([
            word.guess,
            word.numOutcomesList,
            word.sumAvgGuess.toFixed(2) ]))));
}
