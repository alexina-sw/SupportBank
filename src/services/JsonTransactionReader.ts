import { readFileSync } from "node:fs";

import { parseISO } from "date-fns";

import { Transaction } from "../modules/Transaction.js";
import type { TransactionReader } from "./TransactionReader.js";
import { TransactionValidator, type TransactionInput } from "./TransactionValidator.js";
import { TransactionImportValidationError } from "./TransactionImportValidationError.js";

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
    );
}

function requireJsonObject(value: unknown, index: number): JsonObject {
    if (!isJsonObject(value)) {
        throw new TransactionImportValidationError([
            {
                location: `Item ${index + 1}`,
                field: "Transaction",
                message: "Transaction must be a JSON object"
            }
        ]);
    }

    return value;
}

const asText = (value: unknown): string =>
    typeof value === "string"
        ? value.trim()
        : "";

function displayValue(value: unknown): string {
    if (value === undefined || value === null) {
        return "";
    }

    if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
    ) {
        return value.toString();
    }

    return JSON.stringify(value) as string;
}

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
        const row = requireJsonObject(item, index);

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
