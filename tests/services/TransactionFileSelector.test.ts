import { describe, expect, test } from "vitest";

import { selectTransactionFiles } from "../../src/services/TransactionFileSelector.js";

const TRANSACTION_DIRECTORY = "tests/fixtures/transaction-files";

const normalizePath = (path: string): string => path.replaceAll("\\", "/");

describe("selectTransactionFiles", () => {
    test("selects all supported files alphabetically", () => {
        const files = selectTransactionFiles(
            TRANSACTION_DIRECTORY,
            { type: "all" }
        );

        expect(
            files.map((file) => file.filename)
        ).toEqual([
            "DodgyTransactions2015.csv",
            "Transactions2013.json",
            "Transactions2014.csv"
        ]);

        expect(
            files.map((file) => normalizePath(file.path))
        ).toEqual([
            "tests/fixtures/transaction-files/DodgyTransactions2015.csv",
            "tests/fixtures/transaction-files/Transactions2013.json",
            "tests/fixtures/transaction-files/Transactions2014.csv"
        ]);
    });

    test("ignores unsupported files and directories", () => {
        const files = selectTransactionFiles(
            TRANSACTION_DIRECTORY,
            { type: "all" }
        );

        expect(
            files.map((file) => file.filename)
        ).not.toContain("notes.txt");

        expect(
            files.map((file) => file.filename)
        ).not.toContain("Archive.csv");
    });

    test("selects one existing CSV file", () => {
        const files = selectTransactionFiles(
            TRANSACTION_DIRECTORY,
            {
                type: "file",
                filename: "Transactions2014.csv"
            }
        );

        expect(files).toHaveLength(1);
        expect(files[0]?.filename).toBe("Transactions2014.csv");
        expect(
            normalizePath(files[0]?.path ?? "")
        ).toBe(
            "tests/fixtures/transaction-files/Transactions2014.csv"
        );
    });

    test("selects one existing JSON file", () => {
        const files = selectTransactionFiles(
            TRANSACTION_DIRECTORY,
            {
                type: "file",
                filename: "Transactions2013.json"
            }
        );

        expect(files).toHaveLength(1);
        expect(files[0]?.filename).toBe("Transactions2013.json");
        expect(
            normalizePath(files[0]?.path ?? "")
        ).toBe(
            "tests/fixtures/transaction-files/Transactions2013.json"
        );
    });

    test("rejects a missing CSV file", () => {
        expect(() =>
            selectTransactionFiles(
                TRANSACTION_DIRECTORY,
                {
                    type: "file",
                    filename: "Missing.csv"
                }
            )
        ).toThrow(
            'Transaction file "Missing.csv" was not found.'
        );
    });

    test("rejects a directory with a CSV extension", () => {
        expect(() =>
            selectTransactionFiles(
                TRANSACTION_DIRECTORY,
                {
                    type: "file",
                    filename: "Archive.csv"
                }
            )
        ).toThrow(
            'Transaction file "Archive.csv" was not found.'
        );
    });

    test.for([
        "",
        "../private.csv",
        "..\\private.csv",
        "/private.csv",
        "nested/transactions.csv",
        "nested\\transactions.csv",
        "transactions.txt"
    ])("rejects the invalid filename: %s", (filename) => {
        expect(() =>
            selectTransactionFiles(
                TRANSACTION_DIRECTORY,
                {
                    type: "file",
                    filename
                }
            )
        ).toThrow(
            "is not a valid transaction filename"
        );
    });
});
