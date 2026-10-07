import readlineSync from "readline-sync";

import { CommandProcessor } from "./cli/CommandProcessor.js";
import { getLogger } from "./logger.js";
import { CsvImportValidationError } from "./services/CsvTransactionReaderErrors.js";
import { CsvTransactionReader } from "./services/CsvTransactionReader.js";
import { SupportBank } from "./services/SupportBank.js";

const logger = getLogger("index");

const TRANSACTION_FILE = "DodgyTransactions2015.csv";

function handleImportFailure(error: unknown, filePath: string): void {
    if (error instanceof CsvImportValidationError) {
        console.error(`Could not import ${filePath}.`);
        console.error("");

        for (const issue of error.issues) {
            console.error(
                `Line ${issue.line}, ${issue.field}: ${issue.message}`
            );
        }

        console.error("");
        console.error(
            "No transactions were imported. Correct the file and try again."
        );

        logger.warn(
            `Import rejected: file=${filePath} issues=${error.issues.length} imported=0`
        );
    } else {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown import error";

        console.error(
            `Could not read or parse ${filePath}: ${message}`
        );
        console.error("No transactions were imported.");

        logger.error(
            `Unexpected import failure: file=${filePath}`,
            error
        );
    }

    process.exitCode = 1;
}

function main(): void {
    logger.info("SupportBank started");
    logger.info(`Import started: file=${TRANSACTION_FILE}`);

    const reader = new CsvTransactionReader();
    let bank: SupportBank;

    try {
        const transactions = reader.read(TRANSACTION_FILE);

        bank = new SupportBank();
        bank.recordTransactions(transactions);

        logger.info(`Import completed: file=${TRANSACTION_FILE} imported=${transactions.length}`);
    } catch (error) {
        handleImportFailure(error, TRANSACTION_FILE);
        return;
    }

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
