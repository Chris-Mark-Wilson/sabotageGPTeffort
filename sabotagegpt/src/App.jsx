


import React, { useState, useEffect } from 'react';
import './App.css';

const BOARD_SIZE = 30;
const EXPLOSIVE_BOXES_COUNT = 300;
const EXPLOSION_DELAY = 500; // in milliseconds
const BOMB_COUNTDOWN = 5; // in seconds

function App() {
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [explosiveBoxes, setExplosiveBoxes] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isBombPlaced, setIsBombPlaced] = useState(false);
  const [bombPosition, setBombPosition] = useState({ x: 0, y: 0 });
  const [bombCountdown, setBombCountdown] = useState(0);// why start at 0? why not BOMB_COUNTDOWN as defined above?

//---------------------------------------------------------------------------------------------------
  useEffect(() => {// just runs this one on page load
    initializeExplosiveBoxes();
  }, []);

//--------------------------------------------------------------------------------------------------
  useEffect(() => {//this is looking a bit backwards...... think this is written wrong...
    function handleKeyPress(event) {
      if (!isGameOver) {
        if (!isBombPlaced) {
          console.log("bomb placed", event.key)
          placeBomb(event.key);
        } else {
          console.log("move player")
          movePlayer(event.key);
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress); //so add the event listener on startup and define the keydown handler...
    return () => {
      document.removeEventListener('keydown', handleKeyPress); // then immeditaley return a function that removes the event listener?
    };
  }, [isGameOver, isBombPlaced]); // all depending on gameOver or isBombPlaced??

//----------------------------------------------------------------------------------------------
  useEffect(() => { // seems a bit late to fire this if player position has already changed?
    if (!isGameOver && isBombPlaced) {
      checkCollisions();
    }
  }, [playerPosition, explosiveBoxes, isGameOver, isBombPlaced]);
//---------------------------------------------------------------------------------------------

  useEffect(() => {//countdown funnction  checks to see if isBombPlaced or bombCountdown changes and runs if true/ && >0 respectiely
    if (isBombPlaced) {
      if (bombCountdown > 0) {
        const timer = setTimeout(() => {
          setBombCountdown((prevCountdown) => prevCountdown - 1);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        detonateBomb();
      }
    }
  }, [isBombPlaced, bombCountdown]);
  //====================================================

  const initializeExplosiveBoxes = () => {  //std function to generate an array of uxb's
    const boxes = [];
    while (boxes.length < EXPLOSIVE_BOXES_COUNT) {
      const x = Math.floor(Math.random() * BOARD_SIZE);
      const y = Math.floor(Math.random() * BOARD_SIZE);
      if (!boxes.some((box) => box.x === x && box.y === y) && (x !== 0 || y !== 0)) {
        boxes.push({ x, y }); // clever way of eliminating duplicate boxes
      }
    }
    setExplosiveBoxes(boxes);// same way I did it first time, just an array of objects as opposed to an array of arrays, better this way though
  };

//======================================================
  const movePlayer = (key) => {
    const { x, y } = playerPosition;
    switch (key) {
      case 'q':
        setPlayerPosition({ x, y: Math.max(y - 1, 0) }); // clever this.. basically, if(y>0 && key==="q" move player)
        break;
      case 'a':
        setPlayerPosition({ x, y: Math.min(y + 1, BOARD_SIZE - 1) });
        break;
      case 'o':
        setPlayerPosition({ x: Math.max(x - 1, 0), y });
        break;
      case 'p':
        setPlayerPosition({ x: Math.min(x + 1, BOARD_SIZE - 1), y });
        break;
      default:
        break;
    }
  };
//==========================================================

  const placeBomb = (key) => {
    if (key === ' ') {
      setIsBombPlaced(true);
      setBombPosition({ ...playerPosition });
      setBombCountdown(BOMB_COUNTDOWN);
    } // ok nice, clean code, does what it says on the tin
    // to a point.. why is they keydown element passed in?
  };
//=======================================================

  const checkCollisions = () => {// nice, I like this, bit like index of but you can pass it a function instead of the actual element...very clean..
    const collidedBoxIndex = explosiveBoxes.findIndex(// returns the index of the element in the array that equals the player position
      (box) => playerPosition.x === box.x && playerPosition.y === box.y // should never fire though? 
    );

    if (collidedBoxIndex >= 0) {// i see what its trying to do... it detonates the bomb if i run into a uxb... dangerous place this lol
      detonateBomb();
    }
  };
//=======================================================

  const detonateBomb = () => {
    setIsGameOver(true);// no need for that mate. not yet...
    setTimeout(() => {
      setExplosiveBoxes((prevBoxes) => { // where is it getting prevBoxes from?? eh?? its not a global???
        const newBoxes = [...prevBoxes];  // ok so unpack something you dont have??
        const [collidedBox] = newBoxes.splice( // not seen this syntax but Im gonna guess its trying to place a box in an array at the index it found it at??
          newBoxes.findIndex( // splice(startIndex, deleteCount, item) so splice(index of box at my pos,1) so just delete the item at THAT index.. ok...
            (box) => box.x === bombPosition.x && box.y === bombPosition.y // not really making any sense to me is this??
          ),
          1
        );

        chainReaction(bombPosition.x, bombPosition.y, newBoxes); // ok so we made an array from info we didnt have and called chain reacion with bomb xy and this array?
        return newBoxes; // so in other words setExplosiveBoxes(newBoxes) having just altered the array... but where is it getting prevBoxes from??
      });
    }, EXPLOSION_DELAY);// end of setTimeout, speed of reaction governed by EXPLOSION_DELAY
  };
//==================================================

  const chainReaction = (x, y, boxes) => {// this is looking better, at least we are passing something IN this time..
    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) return; // stops if bomb is outside board?  ah, returns to recurve calls below or finished?
    const index = boxes.findIndex((box) => box.x === x && box.y === y);// ok so get thin index of the box equal to the xy passed in
    if (index >= 0) { // so if box found (not -1) do...
      setTimeout(() => {
        setExplosiveBoxes((prevBoxes) => {// again, where the f*** are we getting prevBoxes from????
          const newBoxes = [...prevBoxes];// I think prevBoxes should just be boxes.... its got its knickers in a twist here.. or change boxes to prevBoxes as its passed in...probably better..
          newBoxes.splice(index, 1); // so delete the box at the index passed in...
          chainReaction(x - 1, y, newBoxes); // oh hang on... base case returns when x < board
          chainReaction(x + 1, y, newBoxes);// so call chain reaction the other way return when >  board
          chainReaction(x, y - 1, newBoxes);// same for y axis
          chainReaction(x, y + 1, newBoxes);// and again..
          return newBoxes;// return new box array is the real base case... clever
        });
      }, EXPLOSION_DELAY);
    }
  };
//================================================


  return (
    <div className="App">
      <h1>{isGameOver ? 'Game Over' : 'Sabotage'}</h1>
      {isBombPlaced && !isGameOver && (
        <div className="countdown">Bomb Countdown: {bombCountdown}</div>
      )}
      <div className="board">
        {[...Array(BOARD_SIZE)].map((_, y) =>
          [...Array(BOARD_SIZE)].map((_, x) => (
            <div
              key={`cell-${x}-${y}`}
              className={`cell ${
                playerPosition.x === x && playerPosition.y === y ? 'player' : ''
              } ${
                explosiveBoxes.some((box) => box.x === x && box.y === y)
                  ? 'explosive-box'
                  : ''
              } ${
                isBombPlaced && bombPosition.x === x && bombPosition.y === y
                  ? 'bomb'
                  : ''
              }`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
