import { parse as parseCsv, type InfoRecord } from "csv-parse/sync";
import { parse as parseDate } from "date-fns";

import type { TransactionInput } from "../validation/TransactionValidator.js";
import { BaseTransactionReader } from "./BaseTransactionReader.js";

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

export class CsvTransactionReader extends BaseTransactionReader {
    protected parseInputs(csvText: string): TransactionInput[] {
        const rows = parseCsv<
            ParsedCsvTransactionRow,
            CsvTransactionRow
        >(csvText, {
            columns: true,
            info: true,
            skip_empty_lines: true,
            trim: true
        });

        return rows.map(({ record, info }) =>
            this.createInput(record, info.lines)
        );
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
