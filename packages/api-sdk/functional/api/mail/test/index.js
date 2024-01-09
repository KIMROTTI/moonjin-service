"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailTest = void 0;
const PlainFetcher_1 = require("@nestia/fetcher/lib/PlainFetcher");
/**
 * @controller MailController.mailTest
 * @path GET /api/mail/test
 * @nestia Generated by Nestia - https://github.com/samchon/nestia
 */
async function mailTest(connection) {
    return PlainFetcher_1.PlainFetcher.fetch(connection, {
        ...mailTest.METADATA,
        path: mailTest.path(),
    });
}
exports.mailTest = mailTest;
(function (mailTest) {
    mailTest.METADATA = {
        method: "GET",
        path: "/api/mail/test",
        request: null,
        response: {
            type: "application/json",
            encrypted: false,
        },
        status: null,
    };
    mailTest.path = () => {
        return `/api/mail/test`;
    };
})(mailTest || (exports.mailTest = mailTest = {}));
