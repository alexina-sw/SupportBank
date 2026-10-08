import { readFileSync } from "node:fs";

import { parseISO } from "date-fns";

import { Transaction } from "../modules/Transaction.js";
import type { TransactionReader } from "./TransactionReader.js";
import { TransactionValidator, type TransactionInput } from "./TransactionValidator.js";

type JsonObject = Record<string, unknown>;

const asObject = (value: unknown): JsonObject =>
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
        ? value as JsonObject
        : {};

const asText = (value: unknown): string =>
    typeof value === "string"
        ? value.trim()
        : "";

const displayValue = (value: unknown): string =>
    value === undefined || value === null
        ? ""
        : String(value);

export class JsonTransactionReader implements TransactionReader {
    private readonly validator = new TransactionValidator();

    parse(jsonText: string): Transaction[] {
        const parsed: unknown = JSON.parse(jsonText);

        if (!Array.isArray(parsed)) {
            throw new Error("JSON transaction data must be an array.");
        }

        const inputs = parsed.map((item, index) =>
            this.createInput(item, index)
        );

        return this.validator.createTransactions(inputs);
    }

    read(filePath: string): Transaction[] {
        const jsonText = readFileSync(
            filePath,
            "utf8"
        );

        return this.parse(jsonText);
    }

    private createInput(item: unknown, index: number): TransactionInput {
        const row = asObject(item);
        const dateText = displayValue(row.Date);
        const amountText = displayValue(row.Amount);

        return {
            date:
                typeof row.Date === "string"
                    ? parseISO(row.Date)
                    : new Date(Number.NaN),
            dateText,
            from: asText(row.FromAccount),
            to: asText(row.ToAccount),
            narrative: asText(row.Narrative),
            amount:
                typeof row.Amount === "number"
                    ? row.Amount
                    : Number.NaN,
            amountText,
            location: `Item ${index + 1}`
        };
    }
}
