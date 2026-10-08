import { describe, expect, test } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { TransactionImportValidationError } from "../../src/services/TransactionImportValidationError.js";
import { TransactionValidator, type TransactionInput } from "../../src/services/TransactionValidator.js";

const validator = new TransactionValidator();

const createInput = (
    changes: Partial<TransactionInput> = {}
): TransactionInput => ({
    date: new Date(2014, 0, 1),
    dateText: "01/01/2014",
    from: "Jon A",
    to: "Sarah T",
    narrative: "Lunch",
    amount: 10,
    amountText: "10",
    location: "Line 2",
    ...changes
});

const captureValidationError = (
    inputs: readonly TransactionInput[]
): TransactionImportValidationError => {
    try {
        validator.createTransactions(inputs);
    } catch (error) {
        if (error instanceof TransactionImportValidationError) {
            return error;
        }

        throw error;
    }

    throw new Error("Expected transaction validation to fail");
};

describe("TransactionValidator", () => {
    test("creates transactions from valid inputs", () => {
        const input = createInput();

        expect(
            validator.createTransactions([input])
        ).toEqual([
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            )
        ]);
    });

    test.for([
        {
            description: "sender",
            changes: { from: "" },
            field: "From",
            message: "Sender is required"
        },
        {
            description: "recipient",
            changes: { to: "" },
            field: "To",
            message: "Recipient is required"
        },
        {
            description: "narrative",
            changes: { narrative: "" },
            field: "Narrative",
            message: "Narrative is required"
        }
    ])("rejects an empty $description",
        ({ changes, field, message }) => {
            const error = captureValidationError([createInput(changes)]);

            expect(error.issues).toEqual([
                {
                    location: "Line 2",
                    field,
                    message
                }
            ]);
        }
    );

    test("rejects matching accounts", () => {
        const error = captureValidationError([
            createInput({to: "Jon A"})
        ]);

        expect(error.issues).toEqual([
            {
                location: "Line 2",
                field: "From/To",
                message: "Sender and recipient must be different"
            }
        ]);
    });

    test("rejects an invalid date", () => {
        const error = captureValidationError([
            createInput({
                date: new Date(Number.NaN),
                dateText: "invalid-date"
            })
        ]);

        expect(error.issues).toEqual([
            {
                location: "Line 2",
                field: "Date",
                message: '"invalid-date" is not a valid date'
            }
        ]);
    });

    test.for([
        {
            description: "non-numeric",
            amount: Number.NaN,
            amountText: "not-a-number"
        },
        {
            description: "negative",
            amount: -5,
            amountText: "-5"
        },
        {
            description: "infinite",
            amount: Number.POSITIVE_INFINITY,
            amountText: "Infinity"
        }
    ])("rejects a $description amount",
        ({ amount, amountText }) => {
            const error = captureValidationError([
                createInput({
                    amount,
                    amountText
                })
            ]);

            expect(error.issues).toEqual([
                {
                    location: "Line 2",
                    field: "Amount",
                    message: `"${amountText}" is not a valid amount`
                }
            ]);
        }
    );

    test("reports every issue and rejects the batch",
        () => {
            const error = captureValidationError([
                createInput(),
                createInput({
                    from: "",
                    location: "Item 2"
                }),
                createInput({
                    amount: Number.NaN,
                    amountText: "invalid",
                    location: "Item 3"
                })
            ]);

            expect(error.issues).toEqual([
                {
                    location: "Item 2",
                    field: "From",
                    message: "Sender is required"
                },
                {
                    location: "Item 3",
                    field: "Amount",
                    message: '"invalid" is not a valid amount'
                }
            ]);
        }
    );
});
