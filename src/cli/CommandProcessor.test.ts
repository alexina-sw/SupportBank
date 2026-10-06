import { describe, expect, test } from "vitest";

import { Transaction } from "../modules/Transaction.js";
import { SupportBank } from "../services/SupportBank.js";
import { CommandProcessor } from "./CommandProcessor.js";

describe("CommandProcessor", () => {
    test("lists all accounts alphabetically", () => {
        const bank = new SupportBank();

        bank.addTransactions([
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
                "Todd",
                "Drinks",
                4
            )
        ]);

        const processor = new CommandProcessor(bank);

        expect(processor.listAll()).toBe([
            "Jon A: -10",
            "Sarah T: 6",
            "Todd: 4"
        ].join("\n"));
    });

    test("lists transactions for an account", () => {
        const bank = new SupportBank();

        bank.addTransactions([
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
                "Todd",
                "Drinks",
                4
            )
        ]);

        const processor = new CommandProcessor(bank);

        expect(processor.listAccount("Sarah T")).toBe([
            "01/01/2014 | Jon A -> Sarah T | Lunch | 10",
            "02/01/2014 | Sarah T -> Todd | Drinks | 4"
        ].join("\n"));
    });

    test("shows a message when an account does not exist", () => {
        const bank = new SupportBank();
        const processor = new CommandProcessor(bank);

        expect(processor.listAccount("Unknown")).toBe(
            'Account "Unknown" not found.'
        );
    });

    test("shows a message when there are no accounts", () => {
        const bank = new SupportBank();
        const processor = new CommandProcessor(bank);

        expect(processor.listAll()).toBe("No accounts found.");
    });

    test("processes the List All command", () => {
        const bank = new SupportBank();

        bank.addTransaction(
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            )
        );

        const processor = new CommandProcessor(bank);

        expect(processor.process("List All")).toBe([
            "Jon A: -10",
            "Sarah T: 10"
        ].join("\n"));
    });

    test("processes a List account command", () => {
        const bank = new SupportBank();

        bank.addTransaction(
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            )
        );

        const processor = new CommandProcessor(bank);

        expect(processor.process("List Sarah T")).toBe(
            "01/01/2014 | Jon A -> Sarah T | Lunch | 10"
        );
    });

    test.each([
        "List All",
        "list all",
        "LIST ALL",
        "  List All  ",
        "List    All"
    ])("accepts the List All variation: %s", (command) => {
        const bank = new SupportBank();
        const processor = new CommandProcessor(bank);

        expect(processor.process(command)).toBe(
            "No accounts found."
        );
    });

    test.each([
        "",
        "List",
        "Show All",
        "Delete Jon A"
    ])("rejects the invalid command: %s", (command) => {
        const bank = new SupportBank();
        const processor = new CommandProcessor(bank);

        expect(processor.process(command)).toBe(
            'Invalid command. Use "List All" or "List <account>".'
        );
    });
});
