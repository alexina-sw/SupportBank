import { fileURLToPath } from "node:url";

import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { CsvTransactionReader } from "../../src/services/CsvTransactionReader.js";

const test = baseTest
    .extend("reader", () => new CsvTransactionReader())
    .extend(
        "lunchTransaction",
        new Transaction(
            new Date(2014, 0, 1),
            "Jon A",
            "Sarah T",
            "Lunch",
            10
        )
    )
    .extend(
        "repaymentTransaction",
        new Transaction(
            new Date(2014, 0, 2),
            "Sarah T",
            "Jon A",
            "Repayment",
            4
        )
    );

describe("CsvTransactionReader", () => {
    test("parses a CSV row into a transaction",
        ({ reader, lunchTransaction }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "01/01/2014,Jon A,Sarah T,Lunch,10"
        ].join("\n");

        expect(reader.parse(csv)).toEqual([lunchTransaction]);
    });

    test("parses multiple CSV rows",
        ({ reader, lunchTransaction, repaymentTransaction }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "01/01/2014,Jon A,Sarah T,Lunch,10",
            "02/01/2014,Sarah T,Jon A,Repayment,4"
        ].join("\n");

        expect(reader.parse(csv)).toEqual([
            lunchTransaction,
            repaymentTransaction
        ]);
    });

    test("trims values and skips empty lines",
        ({ reader, lunchTransaction }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "",
            "01/01/2014, Jon A , Sarah T , Lunch , 10 ",
            ""
        ].join("\n");

        expect(reader.parse(csv)).toEqual([lunchTransaction]);
    });

    test("parses a quoted narrative containing a comma",
        ({ reader }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            '01/01/2014,Jon A,Sarah T,"Lunch, coffee",7.8'
        ].join("\n");

        expect(reader.parse(csv)).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch, coffee",
                7.8
            )
        ]);
    });

    test("rejects a transaction with an invalid date",
        ({ reader }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            "32/01/2014,Jon A,Sarah T,Lunch,7.8"
        ].join("\n");

        expect(() => reader.parse(csv)).toThrow("Invalid date");
    });

    test.for([
        ["non-numeric", "not-a-number"],
        ["empty", ""],
        ["negative", "-5"],
        ["infinite", "Infinity"]
    ])("rejects a transaction with a %s amount",
        ([_description, amount], { reader }) => {
        const csv = [
            "Date,From,To,Narrative,Amount",
            `01/01/2014,Jon A,Sarah T,Lunch,${amount}`
        ].join("\n");

        expect(() => reader.parse(csv)).toThrow("Invalid amount");
    });

    test.for([
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
        (
            { from, to, expectedError },
            { reader }
        ) => {
            const csv = [
                "Date,From,To,Narrative,Amount",
                `01/01/2014,${from},${to},Lunch,7.8`
            ].join("\n");

            expect(() => reader.parse(csv)).toThrow(expectedError);
        }
    );

    test.for([
        ["empty", ""],
        ["whitespace-only", "   "]
    ])(
        "rejects a transaction with a %s narrative",
        ([_description, narrative], { reader}) => {
            const csv = [
                "Date,From,To,Narrative,Amount",
                `01/01/2014,Jon A,Sarah T,${narrative},7.8`
            ].join("\n");

            expect(() => reader.parse(csv)).toThrow("Invalid narrative");
        }
    );

    test("returns no transactions when the CSV only contains headers",
        ({ reader }) => {
        const csv = "Date,From,To,Narrative,Amount";

        expect(reader.parse(csv)).toEqual([]);
    });

    test("reads and parses transactions from a file",
        ({ reader, lunchTransaction }) => {
        const mockPath = fileURLToPath(
            new URL("../../src/mocks/mock-transactions.csv", import.meta.url)
        );

        expect(reader.read(mockPath)).toEqual([lunchTransaction]);
    });
});
