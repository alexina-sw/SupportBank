import { fileURLToPath } from "node:url";

import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { XmlTransactionReader } from "../../src/services/import/readers/XmlTransactionReader.js";
import { TransactionImportValidationError } from "../../src/services/import/validation/TransactionImportValidationError.js";

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

const createXml = (...transactions: string[]): string => `
    <TransactionList>
        ${transactions.join("\n")}
    </TransactionList>
`;

const createTransactionXml = ({
    date = "40909",
    description = "Snooker Night",
    value = "9.22",
    from = "Gergana I",
    to = "Jon A"
}: {
    readonly date?: string;
    readonly description?: string;
    readonly value?: string;
    readonly from?: string;
    readonly to?: string;
} = {}): string => `
    <SupportTransaction Date="${date}">
        <Description>${description}</Description>
        <Value>${value}</Value>
        <Parties>
            <From>${from}</From>
            <To>${to}</To>
        </Parties>
    </SupportTransaction>
`;

const test = baseTest.extend(
    "reader",
    () => new XmlTransactionReader()
);

describe("XmlTransactionReader", () => {
    describe("parse", () => {
        test("parses an XML transaction", ({ reader }) => {
            const xml = createXml(createTransactionXml());

            expect(reader.parse(xml)).toEqual([
                new Transaction(
                    new Date(2012, 0, 1),
                    "Gergana I",
                    "Jon A",
                    "Snooker Night",
                    9.22
                )
            ]);
        });

        test("parses multiple XML transactions", ({ reader }) => {
            const xml = createXml(
                createTransactionXml(),
                createTransactionXml({
                    date: "40910",
                    description: "Coffee",
                    value: "6.98",
                    from: "Sam N",
                    to: "Dan W"
                })
            );

            expect(reader.parse(xml)).toEqual([
                new Transaction(
                    new Date(2012, 0, 1),
                    "Gergana I",
                    "Jon A",
                    "Snooker Night",
                    9.22
                ),
                new Transaction(
                    new Date(2012, 0, 2),
                    "Sam N",
                    "Dan W",
                    "Coffee",
                    6.98
                )
            ]);
        });

        test("returns no transactions for an empty transaction list",
            ({ reader }) => {
                expect(
                    reader.parse("<TransactionList />")
                ).toEqual([]);
            }
        );

        test("trims XML values", ({ reader }) => {
            const xml = createXml(
                createTransactionXml({
                    date: " 40909 ",
                    description: " Snooker Night ",
                    value: " 9.22 ",
                    from: " Gergana I ",
                    to: " Jon A "
                })
            );

            expect(reader.parse(xml)).toEqual([
                new Transaction(
                    new Date(2012, 0, 1),
                    "Gergana I",
                    "Jon A",
                    "Snooker Night",
                    9.22
                )
            ]);
        });

        test("decodes XML entities", ({ reader }) => {
            const xml = createXml(
                createTransactionXml({
                    description: "Lunch &amp; coffee"
                })
            );

            expect(reader.parse(xml)).toEqual([
                new Transaction(
                    new Date(2012, 0, 1),
                    "Gergana I",
                    "Jon A",
                    "Lunch & coffee",
                    9.22
                )
            ]);
        });

        test("reports validation issues with transaction locations",
            ({ reader }) => {
                const xml = createXml(
                    createTransactionXml(),
                    createTransactionXml({
                        date: "invalid",
                        description: "   ",
                        value: "not-a-number",
                        from: "",
                        to: ""
                    })
                );

                const error = captureValidationError(() => reader.parse(xml));

                expect(error.issues).toEqual([
                    {
                        location: "Transaction 2",
                        field: "From",
                        message: "Sender is required"
                    },
                    {
                        location: "Transaction 2",
                        field: "To",
                        message: "Recipient is required"
                    },
                    {
                        location: "Transaction 2",
                        field: "Narrative",
                        message: "Narrative is required"
                    },
                    {
                        location: "Transaction 2",
                        field: "Date",
                        message: '"invalid" is not a valid date'
                    },
                    {
                        location: "Transaction 2",
                        field: "Amount",
                        message: '"not-a-number" is not a valid amount'
                    }
                ]);
            }
        );

        test("reports missing XML fields", ({ reader }) => {
            const xml = createXml(`
                <SupportTransaction>
                    <Parties />
                </SupportTransaction>
            `);

            const error = captureValidationError(() => reader.parse(xml));

            expect(error.issues).toEqual([
                {
                    location: "Transaction 1",
                    field: "From",
                    message: "Sender is required"
                },
                {
                    location: "Transaction 1",
                    field: "To",
                    message: "Recipient is required"
                },
                {
                    location: "Transaction 1",
                    field: "Narrative",
                    message: "Narrative is required"
                },
                {
                    location: "Transaction 1",
                    field: "Date",
                    message: '"" is not a valid date'
                },
                {
                    location: "Transaction 1",
                    field: "Amount",
                    message: '"" is not a valid amount'
                }
            ]);
        });

        test("rejects XML without a TransactionList element",
            ({ reader }) => {
                expect(() =>
                    reader.parse("<Transactions />")
                ).toThrow(
                    "XML transaction data must contain a TransactionList element."
                );
            }
        );

        test("rejects a TransactionList containing text", ({ reader }) => {
            expect(() =>
                reader.parse(
                    "<TransactionList>invalid content</TransactionList>"
                )
            ).toThrow(
                "XML TransactionList must be an element."
            );
        });

        test("returns no transactions when the list has no SupportTransaction elements",
            ({ reader }) => {
                const xml = `
                    <TransactionList>
                        <Metadata>Empty transaction file</Metadata>
                    </TransactionList>
                `;

                expect(reader.parse(xml)).toEqual([]);
            }
        );

        test("rejects malformed XML", ({ reader }) => {
            const error = captureError(
                () => reader.parse(`
                    <TransactionList>
                        <SupportTransaction>
                    </TransactionList>
                `)
            );

            expect(error).toBeInstanceOf(SyntaxError);
            expect(error).not.toBeInstanceOf(TransactionImportValidationError);
        });
    });

    describe("read", () => {
        test("reads transactions from an XML file",
            ({ reader }) => {
                const filePath = fileURLToPath(
                    new URL(
                        "../fixtures/transaction-files/Transactions2012.xml",
                        import.meta.url
                    )
                );

                const transactions = reader.read(filePath);

                expect(transactions.length).toBeGreaterThan(0);
                expect(transactions[0]).toEqual(
                    new Transaction(
                        new Date(2012, 0, 1),
                        "Gergana I",
                        "Jon A",
                        "Snooker Night",
                        9.22
                    )
                );
            }
        );

        test("rejects a missing XML file", ({ reader }) => {
            const filePath = fileURLToPath(
                new URL(
                    "../fixtures/transaction-files/does-not-exist.xml",
                    import.meta.url
                )
            );

            expect(() =>
                reader.read(filePath)
            ).toThrow();
        });
    });
});
