import { readFileSync } from "node:fs";

import { parse as parseCsv } from "csv-parse/sync";
import { isValid, parse as parseDate } from "date-fns";

import { Transaction } from "../modules/Transaction.js";

interface CsvTransactionRow {
    Date: string;
    From: string;
    To: string;
    Narrative: string;
    Amount: string;
}

export class CsvTransactionReader {
    parse(csvText: string): Transaction[] {
        const rows: CsvTransactionRow[] = parseCsv(csvText, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        return rows.map((row, index) => {
            return this.createTransaction(row, index + 2);
        });
    }

    read(filePath: string): Transaction[] {
        const csvText = readFileSync(filePath, "utf8");

        return this.parse(csvText);
    }

    private createTransaction(row: CsvTransactionRow, rowNumber: number) {
        const date = parseDate(row.Date, "dd/MM/yyyy", new Date());
        const amount = Number(row.Amount);
    
        this.validateRow(row, date, amount, rowNumber);
    
        return new Transaction(date, row.From, row.To, row.Narrative, amount);
    }

    private validateRow(row: CsvTransactionRow, date: Date, amount: number, rowNumber: number): void {
        if (!row.From) {
            throw new Error(`Invalid sender at row ${rowNumber}`);
        }

        if (!row.To) {
            throw new Error(`Invalid recipient at row ${rowNumber}`);
        }

        if (!row.Narrative) {
            throw new Error(`Invalid narrative at row ${rowNumber}`);
        }

        if (!isValid(date)) {
            throw new Error(`Invalid date ${row.Date} at row ${rowNumber}`);
        }

        if (row.Amount === "" || !Number.isFinite(amount) || amount < 0) {
            throw new Error(
                `Invalid amount ${row.Amount} at row ${rowNumber}`
            );
        }
    }
}
