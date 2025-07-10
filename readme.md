## Wordle Solver

### How to use

1. Set parameters in `wordle.ts`
    1. Uncomment out the function you want to play and comment out the other games
    3. Fill in any guesses you have made, commenting out later ones
2. Run the script
```
npm run word
```

### Improvements

- Interface improvements
    - Terminal interface
    - Gui interface
    - Screenscrape?
- Logging improvements
    - Logging for durdle/quordle
    - More verbose logging
- Use word frequency as tiebreaker
    - Get list of words sorted by frequency
    - Reorder options based on frequency
- Improve rough average guess calculation
    - Better formula
    - Use recursive?
- Multi game strategy improvements
    - record state of successful guess being made
        - prioritize guessing locked in words
        - Don't guess locked in words once it has been solved
    - Add some recursive layering to game to rate guesses

