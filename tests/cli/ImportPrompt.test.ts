import { describe, expect, test } from "vitest";

import { parseImportCommand } from "../../src/cli/ImportPrompt.js";

describe("parseImportCommand", () => {
    test.for([
        "Import All Transactions",
        "import all transactions",
        "IMPORT ALL TRANSACTIONS",
        "  Import All Transactions  ",
        "Import   All   Transactions"
    ])("parses the import-all command: %s", (command) => {
        expect(parseImportCommand(command)).toEqual({
            type: "all"
        });
    });

    test.for([
        "Import File Transactions2014.csv",
        "import file Transactions2014.csv",
        "  Import File Transactions2014.csv  ",
        "Import   File   Transactions2014.csv"
    ])("parses the import-file command: %s", (command) => {
        expect(parseImportCommand(command)).toEqual({
            type: "file",
            filename: "Transactions2014.csv"
        });
    });

    test.for([
        "",
        "Import",
        "Import All",
        "Import File",
        "Load Transactions2014.csv"
    ])("rejects the invalid command: %s", (command) => {
        expect(parseImportCommand(command)).toBeUndefined();
    });
});