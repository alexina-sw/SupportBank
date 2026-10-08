import type { Transaction } from "../modules/Transaction.js";

export interface TransactionReader {
    read(filePath: string): Transaction[];
}
