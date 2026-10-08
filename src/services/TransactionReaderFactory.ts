import { extname } from "node:path";

import { CsvTransactionReader } from "./CsvTransactionReader.js";
import { JsonTransactionReader } from "./JsonTransactionReader.js";
import type { TransactionReader } from "./TransactionReader.js";

export function createTransactionReader(filename: string): TransactionReader {
    const extension = extname(filename).toLowerCase();

    switch (extension) {
        case ".csv":
            return new CsvTransactionReader();
        case ".json":
            return new JsonTransactionReader();
        default:
            throw new Error(`Unsupported transaction file type: "${filename}".`);
    }
}
