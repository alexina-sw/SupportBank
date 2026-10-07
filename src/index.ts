import readlineSync from "readline-sync";

import { CommandProcessor } from "./cli/CommandProcessor.js";
import { getLogger } from "./logger.js";
import { CsvTransactionReader } from "./services/CsvTransactionReader.js";
import { SupportBank } from "./services/SupportBank.js";

const logger = getLogger("index");

function main(): void {
    logger.info("SupportBank started");

    const reader = new CsvTransactionReader();
    const transactions = reader.read("DodgyTransactions2015.csv");

    const bank = new SupportBank();
    bank.recordTransactions(transactions);

    const processor = new CommandProcessor(bank);

    console.log('Commands: "List All", "List <account>", or "Exit".');

    while (true) {
        const command = readlineSync.question("> ");

        if (command.trim().toLowerCase() === "exit") {
            break;
        }

        const output = processor.process(command);

        console.log(output);
    }
}

main();
