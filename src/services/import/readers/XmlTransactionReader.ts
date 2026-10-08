import { XMLParser, XMLValidator } from "fast-xml-parser";

import type { TransactionInput } from "../validation/TransactionValidator.js";
import { BaseTransactionReader } from "./BaseTransactionReader.js";
import { asText } from "./TransactionValueParser.js";

interface XmlTransaction {
    readonly "@_Date"?: string;
    readonly Description?: string;
    readonly Value?: string;
    readonly Parties?: {
        readonly From?: string;
        readonly To?: string;
    };
}

interface XmlDocument {
    readonly TransactionList?: {
        readonly SupportTransaction?: XmlTransaction | XmlTransaction[];
    } | string;
}

const parser = new XMLParser({
    ignoreAttributes: false,
    parseAttributeValue: false,
    parseTagValue: false,
    trimValues: true
});

const excelDateToDate = (serial: number): Date => new Date(1899, 11, 30 + serial);

export class XmlTransactionReader extends BaseTransactionReader {
    protected parseInputs(xmlText: string): TransactionInput[] {
        const validationResult = XMLValidator.validate(xmlText);

        if (validationResult !== true) {
            throw new SyntaxError(`Invalid XML: ${validationResult.err.msg}`);
        }

        const document = parser.parse(xmlText) as XmlDocument;
        const transactionList = document.TransactionList;

        if (transactionList === undefined) {
            throw new Error("XML transaction data must contain a TransactionList element.");
        }

        if (transactionList === "") {
            return [];
        }

        if (typeof transactionList !== "object") {
            throw new Error("XML TransactionList must be an element.");
        }

        const parsedTransactions = transactionList.SupportTransaction;

        if (parsedTransactions === undefined) {
            return [];
        }

        const transactions = Array.isArray(parsedTransactions)
            ? parsedTransactions
            : [parsedTransactions];

        return transactions.map((transaction, index) =>
            this.createInput(transaction, index)
        );
    }

    private createInput(transaction: XmlTransaction, index: number): TransactionInput {
        const dateText = asText(transaction["@_Date"]);
        const amountText = asText(transaction.Value);
        const dateSerial = Number(dateText);

        return {
            date: dateText === ""
                ? new Date(Number.NaN)
                : excelDateToDate(dateSerial),
            dateText,
            from: asText(transaction.Parties?.From),
            to: asText(transaction.Parties?.To),
            narrative: asText(transaction.Description),
            amount: amountText === ""
                ? Number.NaN
                : Number(amountText),
            amountText,
            location: `Transaction ${index + 1}`
        };
    }
}
