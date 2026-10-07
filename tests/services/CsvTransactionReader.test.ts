import { fileURLToPath } from "node:url";

import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { CsvTransactionReader } from "../../src/services/CsvTransactionReader.js";
import { CsvImportValidationError } from "../../src/services/CsvTransactionReaderErrors.js";

const CSV_HEADER = "Date,From,To,Narrative,Amount";

const createCsv = (...rows: string[]): string => [CSV_HEADER, ...rows].join("\n");

const captureError = (action: () => unknown): unknown => {
    try {
        action();
    } catch (error) {
        return error;
    }
 
    throw new Error("Expected action to throw");
};
 
const captureValidationError = (action: () => unknown): CsvImportValidationError => {
    const error = captureError(action);
 
    if (error instanceof CsvImportValidationError) {
        return error;
    }
 
    throw error;
};

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
    describe("parse", () => {
        test("parses a CSV row into a transaction",
            ({ reader, lunchTransaction }) => {
            const csv = createCsv(
                "01/01/2014,Jon A,Sarah T,Lunch,10"
            );

            expect(reader.parse(csv)).toEqual([lunchTransaction]);
        });

        test("parses multiple CSV rows",
            ({ reader, lunchTransaction, repaymentTransaction }) => {
            const csv = createCsv(
                "01/01/2014,Jon A,Sarah T,Lunch,10",
                "02/01/2014,Sarah T,Jon A,Repayment,4"
            );

            expect(reader.parse(csv)).toEqual([
                lunchTransaction,
                repaymentTransaction
            ]);
        });

        test("trims values and skips empty lines",
            ({ reader, lunchTransaction }) => {
            const csv = createCsv(
                "",
                "01/01/2014, Jon A , Sarah T , Lunch , 10 ",
                ""
            );

            expect(reader.parse(csv)).toEqual([lunchTransaction]);
        });

        test("parses a quoted narrative containing a comma",
            ({ reader }) => {
            const csv = createCsv(
                '01/01/2014,Jon A,Sarah T,"Lunch, coffee",7.8'
            );

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

        test("returns no transactions when the CSV only contains headers",
            ({ reader }) => {
            const csv = "Date,From,To,Narrative,Amount";

            expect(reader.parse(csv)).toEqual([]);
        });
    });

    describe("invalid transactions", () => {
        test("rejects a transaction with an invalid date",
            ({ reader }) => {
            const csv = createCsv(
                "32/01/2014,Jon A,Sarah T,Lunch,7.8"
            );

            expect(() => reader.parse(csv)).toThrow("Invalid date");
        });

        test.for([
            ["non-numeric", "not-a-number"],
            ["empty", ""],
            ["negative", "-5"],
            ["infinite", "Infinity"]
        ])("rejects a transaction with a %s amount",
            ([_description, amount], { reader }) => {
            const csv = createCsv(
                `01/01/2014,Jon A,Sarah T,Lunch,${amount}`
            );

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
                const csv = createCsv(
                    `01/01/2014,${from},${to},Lunch,7.8`
                );

                expect(() => reader.parse(csv)).toThrow(expectedError);
            }
        );

        test.for([
            ["empty", ""],
            ["whitespace-only", "   "]
        ])(
            "rejects a transaction with a %s narrative",
            ([_description, narrative], { reader}) => {
                const csv = createCsv(
                    `01/01/2014,Jon A,Sarah T,${narrative},7.8`
                );

                expect(() => reader.parse(csv)).toThrow("Invalid narrative");
            }
        );

        test("reports all validation issues with physical CSV line numbers",
            ({ reader }) => {
            const csv = createCsv(
                "32/01/2014,Jon A,Sarah T,Lunch,10",
                "",
                "02/01/2014,Sarah T,Jon A,Repayment,not-a-number"
            );

            const error = captureValidationError(() => reader.parse(csv));

            expect(error.issues).toEqual([
                {
                    line: 2,
                    field: "Date",
                    message: '"32/01/2014" is not a valid date'
                },
                {
                    line: 4,
                    field: "Amount",
                    message: '"not-a-number" is not a valid amount'
                }
            ]);
        });

        test("reports all invalid fields on the same row",
            ({ reader }) => {
            const csv = createCsv(
                "32/01/2014,,,,-5"
            );

            const error = captureValidationError(() => reader.parse(csv));

            expect(error.issues).toEqual([
                {
                    line: 2,
                    field: "From",
                    message: "Sender is required"
                },
                {
                    line: 2,
                    field: "To",
                    message: "Recipient is required"
                },
                {
                    line: 2,
                    field: "Narrative",
                    message: "Narrative is required"
                },
                {
                    line: 2,
                    field: "Date",
                    message: '"32/01/2014" is not a valid date'
                },
                {
                    line: 2,
                    field: "Amount",
                    message: '"-5" is not a valid amount'
                }
            ]);
        });

        test("reports matching sender and recipient with its CSV line",
            ({ reader }) => {
            const csv = createCsv(
                "01/01/2014,Jon A,Jon A,Lunch,10"
            );

            const error = captureValidationError(() =>reader.parse(csv));

            expect(error.issues).toEqual([
                {
                    line: 2,
                    field: "From/To",
                    message: "Sender and recipient must be different"
                }
            ]);
        });

        test("reports the physical line after skipped empty lines",
            ({ reader }) => {
            const csv = createCsv(
                "01/01/2014,Jon A,Sarah T,Lunch,10",
                "",
                "32/01/2014,Sarah T,Jon A,Repayment,4"
            );

            expect(() => reader.parse(csv)).toThrow("row 4");
        });
    });

    describe("read", () => {
        test("reads and parses transactions from a file",
            ({ reader, lunchTransaction }) => {
            const mockPath = fileURLToPath(
                new URL("../../src/mocks/mock-transactions.csv", import.meta.url)
            );

            const transactions = reader.read(mockPath);

            expect(transactions).toEqual([lunchTransaction]);
        });

        test("rejects a missing file",
            ({ reader }) => {
            const missingPath = fileURLToPath(
                new URL(
                    "../mocks/does-not-exist.csv",
                    import.meta.url
                )
            );
 
            expect(() => reader.read(missingPath)).toThrow();
        });
    });

    describe("malformed CSV", () => {
        test("rejects an unterminated quoted field",
            ({ reader }) => {
            const csv = createCsv(
                '01/01/2014,Jon A,Sarah T,"Unclosed narrative,10'
            );

            const error = captureError(() => reader.parse(csv));

            expect(error).toBeInstanceOf(Error);
            expect(error).not.toBeInstanceOf(CsvImportValidationError);
        });
    });
});
