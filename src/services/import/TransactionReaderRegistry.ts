import { extname } from "node:path";

import { CsvTransactionReader } from "./readers/CsvTransactionReader.js";
import { JsonTransactionReader } from "./readers/JsonTransactionReader.js";
import type { TransactionReader } from "./readers/TransactionReader.js";
import { XmlTransactionReader } from "./readers/XmlTransactionReader.js";

type TransactionReaderConstructor = new () => TransactionReader;

const readerTypes: ReadonlyMap<string, TransactionReaderConstructor> = new Map([
    [".csv", CsvTransactionReader],
    [".json", JsonTransactionReader],
    [".xml", XmlTransactionReader]
]);

const getExtension = (filename: string): string =>
    extname(filename).toLowerCase();

export const isSupportedTransactionFile = (filename: string): boolean =>
    readerTypes.has(getExtension(filename));

export function createTransactionReader(filename: string): TransactionReader {
    const Reader = readerTypes.get(getExtension(filename));

    if (!Reader) {
        throw new Error(`Unsupported transaction file type: "${filename}".`);
    }

    return new Reader();
}
