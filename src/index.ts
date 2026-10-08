import readlineSync from "readline-sync";
import { fileURLToPath } from "node:url";

import { CommandProcessor } from "./cli/CommandProcessor.js";
import { promptForImport } from "./cli/ImportPrompt.js";
import { getLogger } from "./logger.js";
import { TransactionImportValidationError } from "./services/TransactionImportValidationError.js";
import { CsvTransactionReader } from "./services/CsvTransactionReader.js";
import { SupportBank } from "./services/SupportBank.js";
import { selectTransactionFiles, type TransactionFile } from "./services/TransactionFileSelector.js";

const logger = getLogger("index");

const TRANSACTION_DIRECTORY = fileURLToPath(
    new URL("../transactions", import.meta.url)
);

function handleImportFailure(error: unknown, filePath: string): void {
    if (error instanceof TransactionImportValidationError) {
        console.error(`Could not import ${filePath}.`);
        console.error("");

        for (const issue of error.issues) {
            console.error(`${issue.location}, ${issue.field}: ${issue.message}`);
        }

        console.error("");
        console.error("No transactions were imported. Correct the file and try again.");
        console.error("");

        logger.warn(`Import rejected: file=${filePath} issues=${error.issues.length} imported=0`);
    } else {
        const message =
            error instanceof Error
                ? error.message
                : "Unknown import error";

        console.error(`Could not read or parse ${filePath}: ${message}`);
        console.error("No transactions were imported.");

        logger.error(
            `Unexpected import failure: file=${filePath}`,
            error
        );
    }

    process.exitCode = 1;
}

function getTransactionFilesFromPrompt(): TransactionFile[] {
    while (true) {
        const selection = promptForImport();

        try {
            const files = selectTransactionFiles(
                TRANSACTION_DIRECTORY,
                selection
            );

            if (files.length === 0) {
                console.log("No CSV transaction files were found.");
                continue;
            }

            return files;
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Could not select transaction files.";

            console.error(message);
        }
    }
}

function main(): void {
    logger.info("SupportBank started");

    const transactionFiles = getTransactionFilesFromPrompt();
    const reader = new CsvTransactionReader();
    const bank = new SupportBank();

    for (const file of transactionFiles) {
        logger.info(`Import started: file=${file.filename}`);

        try {
            const transactions = reader.read(file.path);

            bank.recordTransactions(transactions);

            console.log(`${file.filename} was imported successfully: (${transactions.length} transactions).`);
            console.log("");

            logger.info(`Import completed: file=${file.filename} imported=${transactions.length}`);
        } catch (error) {
            handleImportFailure(error, file.filename);
        }
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
