import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { JsonTransactionReader } from "../../src/services/import/readers/JsonTransactionReader.js";
import { TransactionImportValidationError } from "../../src/services/import/validation/TransactionImportValidationError.js";

const createJson = (
    ...transactions: Record<string, unknown>[]
): string => JSON.stringify(transactions);

const captureError = (action: () => unknown): unknown => {
    try {
        action();
    } catch (error) {
        return error;
    }

    throw new Error("Expected action to throw");
};

const captureValidationError = (
    action: () => unknown
): TransactionImportValidationError => {
    const error = captureError(action);

    if (error instanceof TransactionImportValidationError) {
        return error;
    }

    throw error;
};

const firstJsonTransaction = {
    Date: "2013-01-01T00:00:00",
    FromAccount: "Jon A",
    ToAccount: "Gergana I",
    Narrative: "Sandbox Help",
    Amount: 2.14
};

const secondJsonTransaction = {
    Date: "2013-01-04T00:00:00",
    FromAccount: "Chris W",
    ToAccount: "Dan W",
    Narrative: "Coffee",
    Amount: 10.53
};

const test = baseTest
    .extend(
        "reader",
        () => new JsonTransactionReader()
    );

describe("JsonTransactionReader", () => {
    describe("parse", () => {
        test("parses a JSON transaction",
            ({ reader }) => {
                const json = createJson(firstJsonTransaction);

                expect(reader.parse(json)).toEqual([
                    new Transaction(
                        new Date(2013, 0, 1),
                        "Jon A",
                        "Gergana I",
                        "Sandbox Help",
                        2.14
                    )
                ]);
            }
        );

        test("parses multiple JSON transactions",
            ({ reader }) => {
                const json = createJson(
                    firstJsonTransaction,
                    secondJsonTransaction
                );

                expect(reader.parse(json)).toEqual([
                    new Transaction(
                        new Date(2013, 0, 1),
                        "Jon A",
                        "Gergana I",
                        "Sandbox Help",
                        2.14
                    ),
                    new Transaction(
                        new Date(2013, 0, 4),
                        "Chris W",
                        "Dan W",
                        "Coffee",
                        10.53
                    )
                ]);
            }
        );

        test("returns no transactions for an empty array",
            ({ reader }) => {
                expect(reader.parse("[]")).toEqual([]);
            }
        );

        test("reports JSON array item locations",
            ({ reader }) => {
                const json = createJson(
                    firstJsonTransaction,
                    {
                        ...secondJsonTransaction,
                        Amount: "invalid"
                    }
                );

                const error = captureValidationError(
                    () => reader.parse(json)
                );

                expect(error.issues).toEqual([
                    {
                        location: "Item 2",
                        field: "Amount",
                        message: '"invalid" is not a valid amount'
                    }
                ]);
            }
        );

        test("reports null JSON property values",
            ({ reader }) => {
                const json = createJson({
                    Date: null,
                    FromAccount: null,
                    ToAccount: null,
                    Narrative: null,
                    Amount: null
                });

                const error = captureValidationError(() => reader.parse(json));

                expect(error.issues).toHaveLength(5);
                expect(error.issues).toContainEqual({
                    location: "Item 1",
                    field: "Date",
                    message: '"" is not a valid date'
                });
                expect(error.issues).toContainEqual({
                    location: "Item 1",
                    field: "Amount",
                    message: '"" is not a valid amount'
                });
            }
        );

        test("reports an object used as an amount",
            ({ reader }) => {
                const json = createJson({
                    ...firstJsonTransaction,
                    Amount: {
                        value: 2.14
                    }
                });

                const error = captureValidationError(() => reader.parse(json));

                expect(error.issues).toEqual([
                    {
                        location: "Item 1",
                        field: "Amount",
                        message: '"{"value":2.14}" is not a valid amount'
                    }
                ]);
            }
        );

        test.for([
            {
                description: "null",
                item: null
            },
            {
                description: "nested array",
                item: []
            },
            {
                description: "number",
                item: 42
            }
        ])("rejects a $description array item",
            ({ item }, { reader }) => {
                const json = JSON.stringify([item]);

                const error = captureValidationError(() => reader.parse(json));

                expect(error.issues).toEqual([
                    {
                        location: "Item 1",
                        field: "Transaction",
                        message: "Transaction must be a JSON object"
                    }
                ]);
            }
        );

        test("rejects a non-array JSON value",
            ({ reader }) => {
                const json = JSON.stringify(firstJsonTransaction);

                expect(() =>
                    reader.parse(json)
                ).toThrow(
                    "JSON transaction data must be an array."
                );
            }
        );

        test("rejects malformed JSON",
            ({ reader }) => {
                const error = captureError(
                    () => reader.parse("[{")
                );

                expect(error).toBeInstanceOf(SyntaxError);
                expect(error).not.toBeInstanceOf(TransactionImportValidationError);
            }
        );
    });

    describe("read", () => {
        test("reads transactions from a JSON file",
            ({ reader }) => {
                const filePath = "src/mocks/mock-transactions.json";

                expect(reader.read(filePath)).toEqual([
                    new Transaction(
                        new Date(2013, 0, 1),
                        "Jon A",
                        "Gergana I",
                        "Sandbox Help",
                        2.14
                    )
                ]);
            }
        );

        test("rejects a missing JSON file",
            ({ reader }) => {
                const filePath = "src/mocks/does-not-exist.json";

                expect(() =>
                    reader.read(filePath)
                ).toThrow();
            }
        );
    });
});
