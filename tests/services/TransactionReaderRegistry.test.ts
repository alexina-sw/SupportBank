import { describe, expect, test } from "vitest";

import { createTransactionReader } from "../../src/services/import/TransactionReaderRegistry.js";
import { CsvTransactionReader } from "../../src/services/import/readers/CsvTransactionReader.js";
import { JsonTransactionReader } from "../../src/services/import/readers/JsonTransactionReader.js";
import { XmlTransactionReader } from "../../src/services/import/readers/XmlTransactionReader.js";

describe("createTransactionReader", () => {
    test("creates a CSV reader", () => {
        expect(
            createTransactionReader("Transactions2014.csv")
        ).toBeInstanceOf(CsvTransactionReader);
    });

    test("creates a JSON reader", () => {
        expect(
            createTransactionReader("Transactions2013.json")
        ).toBeInstanceOf(JsonTransactionReader);
    });

    test("creates a XML reader", () => {
        expect(
            createTransactionReader("Transactions2012.xml")
        ).toBeInstanceOf(XmlTransactionReader);
    });

    test("matches extensions case-insensitively",
        () => {
            expect(
                createTransactionReader("Transactions2014.CSV")
            ).toBeInstanceOf(
                CsvTransactionReader
            );

            expect(
                createTransactionReader("Transactions2013.JSON")
            ).toBeInstanceOf(
                JsonTransactionReader
            );
        }
    );

    test("rejects an unsupported file type", () => {
        expect(() =>
            createTransactionReader("Transactions.txt")
        ).toThrow("Unsupported transaction file type");
    });
});
