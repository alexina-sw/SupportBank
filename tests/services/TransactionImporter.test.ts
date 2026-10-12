import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

import { SupportBank } from "../../src/services/SupportBank.js";
import { TransactionImporter } from "../../src/services/import/TransactionImporter.js";

describe("TransactionImporter", () => {
    test("reads and records transactions", () => {
        const bank = new SupportBank();
        const importer = new TransactionImporter(bank);
        const path = fileURLToPath(
            new URL("../../src/mocks/mock-transactions.csv", import.meta.url)
        );

        const result = importer.import({
            filename: "mock-transactions.csv",
            path
        });

        expect(result).toEqual({
            filename: "mock-transactions.csv",
            importedCount: 1
        });
        expect(bank.getAccount("Jon A").getBalance()).toBe(-10);
        expect(bank.getAccount("Sarah T").getBalance()).toBe(10);
    });
});
