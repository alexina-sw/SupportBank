import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { Transaction } from "../modules/Transaction.js";
import { CsvTransactionReader } from "./CsvTransactionReader.js";

describe("CsvTransactionReader", () => {
    test("parses a CSV row into a transaction", () => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "01/01/2014,Jon A,Sarah T,Pokemon Training,7.8"
        ].join("\n");

        const reader = new CsvTransactionReader();

        const transactions = reader.parse(csv);

        expect(transactions).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Pokemon Training",
                7.8
            )
        ]);
    });

    test("parses multiple CSV rows", () => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "01/01/2014,Jon A,Sarah T,Lunch,10",
            "02/01/2014,Sarah T,Jon A,Repayment,4"
        ].join("\n");

        const reader = new CsvTransactionReader();

        const transactions = reader.parse(csv);

        expect(transactions).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            ),
            new Transaction(
                new Date(2014, 0, 2),
                "Sarah T",
                "Jon A",
                "Repayment",
                4
            )
        ]);
    });

    test("trims values and skips empty lines", () => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "",
            "01/01/2014, Jon A , Sarah T , Lunch , 10 ",
            ""
        ].join("\n");

        const reader = new CsvTransactionReader();

        const transactions = reader.parse(csv);

        expect(transactions).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            )
        ]);
    });

    test("parses a quoted narrative containing a comma", () => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            '01/01/2014,Jon A,Sarah T,"Lunch, coffee",7.8'
        ].join("\n");

        const reader = new CsvTransactionReader();

        const transactions = reader.parse(csv);

        expect(transactions).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch, coffee",
                7.8
            )
        ]);
    });

    test("rejects a transaction with an invalid date", () => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "32/01/2014,Jon A,Sarah T,Lunch,7.8"
        ].join("\n");

        const reader = new CsvTransactionReader();

        expect(() => reader.parse(csv)).toThrow("Invalid date");
    });

    test.each([
        ["non-numeric", "not-a-number"],
        ["empty", ""],
        ["negative", "-5"],
        ["infinite", "Infinity"]
    ])("rejects a transaction with a %s amount", (_description, amount) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            `01/01/2014,Jon A,Sarah T,Lunch,${amount}`
        ].join("\n");

        const reader = new CsvTransactionReader();

        expect(() => reader.parse(csv)).toThrow("Invalid amount");
    });

    test.each([
        {
            role: "sender",
            from: "",
            to: "Sarah T",
            expectedError: "Invalid sender"
        },
        {
            role: "recipient",
            from: "Jon A",
            to: "",
            expectedError: "Invalid recipient"
        }
    ])(
        "rejects a transaction with an empty $role",
        ({ from, to, expectedError }) => {
            const csv = [
                "Date,From,To,Narrative,Amount",
                `01/01/2014,${from},${to},Lunch,7.8`
            ].join("\n");

            const reader = new CsvTransactionReader();

            expect(() => reader.parse(csv)).toThrow(expectedError);
        }
    );

    test.each([
        ["empty", ""],
        ["whitespace-only", "   "]
    ])(
        "rejects a transaction with a %s narrative",
        (_description, narrative) => {
            const csv = [
                "Date,From,To,Narrative,Amount",
                `01/01/2014,Jon A,Sarah T,${narrative},7.8`
            ].join("\n");

            const reader = new CsvTransactionReader();

            expect(() => reader.parse(csv)).toThrow("Invalid narrative");
        }
    );

    test("returns no transactions when the CSV only contains headers", () => {
        const csv = "Date,From,To,Narrative,Amount";

        const reader = new CsvTransactionReader();

        expect(reader.parse(csv)).toEqual([]);
    });

    test("reads and parses transactions from a file", () => {
        const mockPath = fileURLToPath(
            new URL("../mocks/mock-transactions.csv", import.meta.url)
        );

        const reader = new CsvTransactionReader();

        const transactions = reader.read(mockPath);

        expect(transactions).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Pokemon Training",
                7.8
            )
        ]);
    });
});
