import { readFileSync } from "node:fs";

import { parse as parseCsv, type InfoRecord } from "csv-parse/sync";
import { parse as parseDate } from "date-fns";

import { Transaction } from "../modules/Transaction.js";
import type { TransactionReader } from "./TransactionReader.js";
import { TransactionValidator, type TransactionInput } from "./TransactionValidator.js";

interface CsvTransactionRow {
    Date: string;
    From: string;
    To: string;
    Narrative: string;
    Amount: string;
}

interface ParsedCsvTransactionRow {
    readonly record: CsvTransactionRow;
    readonly info: InfoRecord;
}

export class CsvTransactionReader implements TransactionReader {
    private readonly validator = new TransactionValidator();

    parse(csvText: string): Transaction[] {
        const rows = parseCsv<
            ParsedCsvTransactionRow,
            CsvTransactionRow
        >(csvText, {
            columns: true,
            info: true,
            skip_empty_lines: true,
            trim: true
        });

        const inputs = rows.map(({ record, info }) =>
            this.createInput(record, info.lines)
        );

        return this.validator.createTransactions(inputs);
    }

    read(filePath: string): Transaction[] {
        const csvText = readFileSync(filePath, "utf8");

        return this.parse(csvText);
    }

    private createInput(row: CsvTransactionRow, rowNumber: number): TransactionInput {
        return {
            date: parseDate(row.Date, "dd/MM/yyyy", new Date()),
            dateText: row.Date,
            from: row.From,
            to: row.To,
            narrative: row.Narrative,
            amount: row.Amount === "" ? Number.NaN : Number(row.Amount),
            amountText: row.Amount,
            location: `Line ${rowNumber}`
        };
    }
}
