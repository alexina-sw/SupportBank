import { readFileSync } from "node:fs";

import type { Transaction } from "../../../modules/Transaction.js";
import {
    TransactionValidator,
    type TransactionInput
} from "../validation/TransactionValidator.js";
import type { TransactionReader } from "./TransactionReader.js";

export abstract class BaseTransactionReader implements TransactionReader {
    private readonly validator = new TransactionValidator();

    parse(text: string): Transaction[] {
        return this.validator.createTransactions(
            this.parseInputs(text)
        );
    }

    read(filePath: string): Transaction[] {
        return this.parse(readFileSync(filePath, "utf8"));
    }

    protected abstract parseInputs(text: string): TransactionInput[];
}
