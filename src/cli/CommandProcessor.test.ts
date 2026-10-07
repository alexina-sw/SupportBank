import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../modules/Transaction.js";
import { SupportBank } from "../services/SupportBank.js";
import { CommandProcessor } from "./CommandProcessor.js";

const test = baseTest
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
        "drinksTransaction",
        new Transaction(
            new Date(2014, 0, 2),
            "Sarah T",
            "Todd",
            "Drinks",
            4
        )
    )
    .extend("bank", () => new SupportBank())
    .extend(
        "processor",
        ({ bank }) => new CommandProcessor(bank)
    );

describe("CommandProcessor", () => {
    test("lists all accounts alphabetically",
        ({
            bank,
            processor,
            lunchTransaction,
            drinksTransaction
        }) => {
        bank.recordTransactions([
            lunchTransaction,
            drinksTransaction
        ]);

        expect(processor.listAll()).toBe([
            "Jon A: -10.00",
            "Sarah T: 6.00",
            "Todd: 4.00"
        ].join("\n"));
    });

    test(
        "lists transactions for an account",
        ({
            bank,
            processor,
            lunchTransaction,
            drinksTransaction
        }) => {
            bank.recordTransactions([
                lunchTransaction,
                drinksTransaction
            ]);
    
            expect(processor.listAccount("Sarah T")).toBe([
                "01/01/2014 | Jon A -> Sarah T | Lunch | 10",
                "02/01/2014 | Sarah T -> Todd | Drinks | 4"
            ].join("\n"));
        }
    );

    test("shows a message when an account does not exist",
        ({ processor }) => {
        expect(processor.listAccount("Unknown")).toBe(
            'Account "Unknown" not found.'
        );
    });

    test("shows a message when there are no accounts",
        ({ processor }) => {
        expect(processor.listAll()).toBe("No accounts found.");
    });

    test("processes the List All command",
        ({ bank, processor, lunchTransaction}) => {
        bank.recordTransaction(lunchTransaction);

        expect(processor.process("List All")).toBe([
            "Jon A: -10.00",
            "Sarah T: 10.00"
        ].join("\n"));
    });

    test("processes a List account command",
        ({ bank, processor, lunchTransaction }) => {
        bank.recordTransaction(lunchTransaction );

        expect(processor.process("List Sarah T")).toBe(
            "01/01/2014 | Jon A -> Sarah T | Lunch | 10"
        );
    });

    test.for([
        "List All",
        "list all",
        "LIST ALL",
        "  List All  ",
        "List    All"
    ])("accepts the List All variation: %s",
        (command, { processor }) => {
            expect(processor.process(command)).toBe(
                "No accounts found."
            );
        }
    );

    test.for([
        "",
        "List",
        "Show All",
        "Delete Jon A"
    ])("rejects the invalid command: %s",
        (command, { processor }) => {
        expect(processor.process(command)).toBe(
            'Invalid command. Use "List All" or "List <account>".'
        );
    });
});
