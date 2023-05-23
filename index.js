import secureRandom from "secure-random";
import crypto from "crypto";
import readline from "readline";
import chalk from "chalk";
import { printTable } from "console-table-printer";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Start message
const msg = "\nLet's start the game";

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
      chalk.blue("Available moves:\n") +
      chalk.green(rows.join("")) +
      chalk.green("0 - exit\n? - help\n")
    );
  }
}

// create Table
class Table {
  constructor(arr) {
    this.arr = arr;
  }
  getTable() {
    const rules = new GameRules(this.arr);
    const tableFirstColumn = Object.keys(rules);
    const tableRows = Object.values(rules);
    return tableRows.map((row, index) => {
      return { move: tableFirstColumn[index], ...row };
    });
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
  console.log(chalk.green(msg));
  // Create key
  const bytes = secureRandom.randomBuffer(32);
  // Computer move
  const computerMove = moveComputer(arr);
  const hmacObj = new HMAC(bytes, computerMove);
  const hmac = hmacObj.createHMAC();
  const msgHMAC = chalk.magenta(`HMAC:\n${hmac}\n`);
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
      const table = new Table(arr);
      printTable(table.getTable());
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
      console.log(chalk.red("Sorry...incorrect choice,please try again"));
      game(arr);
    }
  });
};

// Start conditions
const isShort = process.argv.length < 5;
const isEven = !(process.argv.length % 2);
const isUnic = new Set(process.argv).size !== process.argv.length;
const msgEven = chalk.red(
  "\nCould you please enter correct input. You need to pass an odd number of strings.\n"
);
const example =
  "\nFor example:\n" +
  chalk.green("Rock Paper Scissors") +
  " or " +
  chalk.green("Rock Paper Scissors Lizard Spock") +
  " or " +
  chalk.green("1 2 3 4 5 6 7 8 9\n");
const msgShort = chalk.red(
  "\nCould you please enter correct input. You need to pass more than 3 strings.\n"
);
const msgUnic = chalk.red(
  "\nCould you please enter correct input. You need to pass different strings.\n"
);

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
