import type { Transaction } from "../../../modules/Transaction.js";

export interface TransactionReader {
    parse(text: string): Transaction[];
    read(filePath: string): Transaction[];
}
