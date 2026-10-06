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
});
