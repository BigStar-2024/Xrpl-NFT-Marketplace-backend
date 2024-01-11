const moment = require('moment');
const log = require('./logger')();
const Encode = require('xrpl-tagged-address-codec');

const EPOCH_OFFSET = 946684800;
const XRP_BASE = 1000000;
const BILLION = 1000000000;

const ACCOUNT_FLAGS = {
    0x00010000: 'lsfPasswordSpent',
    0x00020000: 'lsfRequireDestTag',
    0x00040000: 'lsfRequireAuth',
    0x00080000: 'lsfDisallowXRP',
    0x00100000: 'lsfDisableMaster',
    0x00200000: 'lsfNoFreeze',
    0x00400000: 'lsfGlobalFreeze',
    0x00800000: 'lsfDefaultRipple',
    0x01000000: 'lsfDepositAuth',
};

const CURRENCY_ISSUERS = {
    USD: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', // bitstamp
    BTC: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', // bitstamp
    CNY: 'rKiCet8SdvWxPXnAgYarFUXMh1zCPz432Y', // ripplefox
    EUR: 'rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq', // gatehub
    JPY: 'r94s8px6kSw1uZ1MV98dhSRTvc6VMPoPcN', // tokyojpy
    XRP: ''
}

const isValidXRPAddress = address => {
    try {
        //log.info("encoding address: " + address);
        let xAddress = Encode({account: address});
        //log.info("xAddress: " + xAddress);
        return xAddress && xAddress.length > 0;
    } catch(err) {
        //no valid address
        //log.info("err encoding " + err);
        return false;
    }
}

const hex32 = d => {
    const int = d & 0xffffffff;
    const hex = int.toString(16).toUpperCase();
    return `0x${`00000000${hex}`.slice(-8)}`;
};

const zeroPad = (num, size, back = false) => {
    let s = String(num);
    while (s.length < (size || 2)) {
        s = back ? `${s}0` : `0${s}`;
    }

    return s;
};

const buildFlags = flags => {
    const bits = zeroPad((flags || 0).toString(2), 32).split('');

    return bits.map((value, i) => {
        const bin = zeroPad(1, 32 - i, true);
        const int = parseInt(bin, 2);
        return value === '1' ? ACCOUNT_FLAGS[int] || hex32(int) : undefined;
    }).filter(d => Boolean(d));
};

const convertRippleDate = date =>
    moment
        .unix(date + EPOCH_OFFSET)
        .utc()
        .format();

const formatSignerList = data => ({
  quorum: data.SignerQuorum,
  max: data.SignerEntries.reduce((total, d) => total + d.SignerEntry.SignerWeight, 0),
  signers: data.SignerEntries.map(d => ({
    account: d.SignerEntry.Account,
    weight: d.SignerEntry.SignerWeight,
  })),
});

const formatAccountInfo = (info, reserve) => ({
    sequence: info.Sequence,
    ticketCount: info.TicketCount,
    ownerCount: info.OwnerCount,
    reserve: reserve.base ? reserve.base + info.OwnerCount * reserve.inc : undefined,
    tick: info.TickSize,
    rate: info.TransferRate ? (info.TransferRate - BILLION) / BILLION : undefined,
    domain: info.Domain ? Buffer.from(info.Domain, 'hex').toString() : undefined,
    emailHash: info.EmailHash,
    flags: buildFlags(info.Flags),
    balance: info.Balance,
    gravatar: info.urlgravatar,
    previousTxn: info.PreviousTxnID,
    previousLedger: info.PreviousTxnLgrSeq,
});

const formatTransaction = tx => {
    const txn = tx.tx || tx;
    return {
        tx: {
            ...txn,
            metaData: undefined,
            meta: undefined,
            hash: undefined,
            inLedger: undefined,
            ledger_index: undefined,
            status: undefined,
            validated: undefined,
            date: txn.date ? convertRippleDate(txn.date) : undefined,
        },
        meta: tx.meta || tx.metaData,
        hash: txn.hash,
        ledger_index: txn.ledger_index,
        date: txn.date ? convertRippleDate(txn.date) : undefined,
    };
};

function CustomError(message, code) {
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
    this.code = code;
}

require('util').inherits(CustomError, Error);

module.exports.CURRENCY_ISSUERS = CURRENCY_ISSUERS;
module.exports.EPOCH_OFFSET = EPOCH_OFFSET;
module.exports.XRP_BASE = XRP_BASE;
module.exports.Error = CustomError;
module.exports.isValidXRPAddress = isValidXRPAddress;
module.exports.convertRippleDate = convertRippleDate;
module.exports.formatTransaction = formatTransaction;
module.exports.formatSignerList = formatSignerList;
module.exports.formatAccountInfo = formatAccountInfo;

