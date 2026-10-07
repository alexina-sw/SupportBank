import { readFileSync } from "node:fs";

import { parse as parseCsv, type InfoRecord } from "csv-parse/sync";
import { isValid, parse as parseDate } from "date-fns";

import { Transaction } from "../modules/Transaction.js";
import { CsvImportValidationError } from "./CsvTransactionReaderErrors.js";

interface CsvTransactionRow {
    Date: string;
    From: string;
    To: string;
    Narrative: string;
    Amount: string;
}
 
export interface CsvImportValidationIssue {
    readonly line: number;
    readonly field: string;
    readonly message: string;
}

interface ParsedCsvTransactionRow {
    readonly record: CsvTransactionRow;
    readonly info: InfoRecord;
}

export class CsvTransactionReader {
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

        const issues = rows.flatMap(({ record, info }) =>
            this.validateRow(record, info.lines)
        );

        if (issues.length > 0) {
            throw new CsvImportValidationError(issues);
        }

        return rows.map(({ record }) => 
            this.createTransaction(record)
        );
    }

    read(filePath: string): Transaction[] {
        const csvText = readFileSync(filePath, "utf8");

        return this.parse(csvText);
    }

    private createTransaction(row: CsvTransactionRow): Transaction {
        const date = parseDate(row.Date, "dd/MM/yyyy", new Date());
        const amount = Number(row.Amount);
        
        return new Transaction(date, row.From, row.To, row.Narrative, amount);
    }

    private validateRow(row: CsvTransactionRow, rowNumber: number): CsvImportValidationIssue[] {
        const issues: CsvImportValidationIssue[] = [];
        const date = parseDate(row.Date, "dd/MM/yyyy", new Date());
        const amount = Number(row.Amount);

        if (!row.From) {
            issues.push({
                line: rowNumber,
                field: "From",
                message: "Sender is required"
            });
        }

        if (!row.To) {
            issues.push({
                line: rowNumber,
                field: "To",
                message: "Recipient is required"
            });
        }

        if (row.From && row.To && row.From === row.To) {
            issues.push({
                line: rowNumber,
                field: "From/To",
                message: "Sender and recipient must be different"
            });
        }

        if (!row.Narrative) {
            issues.push({
                line: rowNumber,
                field: "Narrative",
                message: "Narrative is required"
            });
        }

        if (!isValid(date)) {
            issues.push({
                line: rowNumber,
                field: "Date",
                message: `"${row.Date}" is not a valid date`
            });
        }

        if (row.Amount === "" || !Number.isFinite(amount) || amount < 0) {
            issues.push({
                line: rowNumber,
                field: "Amount",
                message: `"${row.Amount}" is not a valid amount`
            });
        }

        return issues;
    }
}
