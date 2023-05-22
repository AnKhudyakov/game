import secureRandom from "secure-random";
import crypto from "crypto";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Start message
const msg = "\n\x1b[32mLet's start the game\x1b[0m";

class ComputeWinner {
  constructor(array, user) {
    array.forEach((el) => {
      if (el !== user) {
        const computerIndex = array.indexOf(el);
        const userIndex = array.indexOf(user);
        const middleLength = (array.length - 1) / 2;
        if (
          (computerIndex <= userIndex + middleLength &&
            computerIndex > userIndex) ||
          (computerIndex < userIndex - middleLength &&
            computerIndex < userIndex)
        ) {
          this[el] = "lose";
        } else {
          this[el] = "win";
        }
      } else {
        this[el] = "draw";
      }
    });
  }
}

class GameRules {
  constructor(array) {
    array.forEach((el) => {
      this[el] = new ComputeWinner(array, el);
    });
  }
}

// create HMAC
class HMAC {
  constructor(secret, msg) {
    this.secret = secret;
    this.msg = msg;
  }
  createHMAC() {
    return crypto
      .createHmac("sha3-256", this.secret)
      .update(this.msg)
      .digest("hex");
  }
}

// create Menu
class Menu {
  constructor(arr) {
    this.arr = arr;
  }
  createMenu() {
    let rows = [];
    this.arr.forEach((el, index) => {
      rows.push(`${index + 1} - ${el}\n`);
    });
    return (
      "\x1b[36mAvailable moves:\x1b[0m\n\x1b[32m" +
      rows.join("") +
      "0 - exit\n? - help\x1b[0m\n"
    );
  }
}

// move Computer
const moveComputer = (arr) => {
  // random from 0 to arr.length
  const variant = Math.floor(Math.random() * arr.length);
  return arr[variant];
};

// Main function Game
const game = (arr) => {
  // Start message
  console.log(msg);
  // Create key
  const bytes = secureRandom.randomBuffer(32);
  // Computer move
  const computerMove = moveComputer(arr);
  const hmacObj = new HMAC(bytes, computerMove);
  const hmac = hmacObj.createHMAC();
  const msgHMAC = `\x1b[35mHMAC:\x1b[1m\n${hmac}\n`;
  const menu = new Menu(arr);
  const msgMenu = menu.createMenu();

  // Show HMAC and Read user move
  rl.question(msgHMAC + msgMenu + "Enter your move: ", (input) => {
    // check user choice
    if (input === "0") {
      // Exit
      rl.close();
    } else if (input === "?") {
      // Help
      console.table(new GameRules(arr));
      game(arr);
    } else if (
      Math.round(input) === +input &&
      +input > 0 &&
      +input <= arr.length
    ) {
      // Correct move
      const userMove = arr[input - 1];
      userMove === computerMove
        ? console.log(
            `Your move: ${userMove}\nComputer move: ${computerMove}\n` +
              "Draw!" +
              `\nHMAC key:\n${bytes.toString("hex")}`
          )
        : console.log(
            `Your move: ${userMove}\nComputer move: ${computerMove}\nYou ${
              new GameRules(arr)[userMove][computerMove]
            }!\nHMAC key:\n${bytes.toString("hex")}`
          );
      game(arr);
    } else {
      // Incorrect move
      console.log("\x1b[31mSorry...incorrect choice,please try again\x1b[0m");
      game(arr);
    }
  });
};

// Start conditions
const isShort = process.argv.length < 5;
const isEven = !(process.argv.length % 2);
const isUnic = new Set(process.argv).size !== process.argv.length;
const msgEven =
  "\n\x1b[31mCould you please enter correct input. You need to pass an odd number of strings.\x1b[0m\n";
const example =
  "\nFor example:\n\x1b[32mRock Paper Scissors\x1b[0m or \x1b[32mRock Paper Scissors Lizard Spock\x1b[0m or \x1b[32m1 2 3 4 5 6 7 8 9\x1b[0m\n";
const msgShort =
  "\n\x1b[31mCould you please enter correct input. You need to pass more than 3 strings.\x1b[0m\n";
const msgUnic =
  "\n\x1b[31mCould you please enter correct input. You need to pass different strings.\x1b[0m\n";

const isError = isShort
  ? msgShort + example
  : isUnic
  ? msgUnic + example
  : isEven
  ? msgEven + example
  : "";

if (isError) {
  console.log(isError);
  rl.close();
} else {
  game(process.argv.slice(2));
}
