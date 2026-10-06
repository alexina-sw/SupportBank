import { readFileSync } from "node:fs";

import { parse as parseCsv } from "csv-parse/sync";
import { parse as parseDate } from "date-fns";

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

        return rows.map((row) => {
            const date = parseDate(row.Date, "dd/MM/yyyy", new Date());
            const amount = Number(row.Amount);

            return new Transaction(date, row.From, row.To, row.Narrative, amount);
        });
    }

    read(filePath: string): Transaction[] {
        const csvText = readFileSync(filePath, "utf8");

        return this.parse(csvText);
    }
}
