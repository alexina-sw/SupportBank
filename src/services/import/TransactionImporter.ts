import type { SupportBank } from "../SupportBank.js";
import type { TransactionFile } from "./TransactionFileSelector.js";
import { createTransactionReader } from "./TransactionReaderRegistry.js";

export interface TransactionImportResult {
    readonly filename: string;
    readonly importedCount: number;
}

export class TransactionImporter {
    constructor(private readonly bank: SupportBank) {}

    import(file: TransactionFile): TransactionImportResult {
        const reader = createTransactionReader(file.filename);
        const transactions = reader.read(file.path);

        this.bank.recordTransactions(transactions);

        return {
            filename: file.filename,
            importedCount: transactions.length
        };
    }
}
