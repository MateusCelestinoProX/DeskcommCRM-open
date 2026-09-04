"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_JID = exports.NOWEBEngineMediaProcessor = exports.WhatsappSessionNoWebCore = exports.BaileysEvents = void 0;
exports.buildMessageId = buildMessageId;
exports.getFromToParticipant = getFromToParticipant;
exports.getDestination = getDestination;
exports.extractBody = extractBody;
const baileys_1 = require("@adiwajshing/baileys");
const LabelAssociation_1 = require("@adiwajshing/baileys/lib/Types/LabelAssociation");
const jid_utils_1 = require("@adiwajshing/baileys/lib/WABinary/jid-utils");
const common_1 = require("@nestjs/common");
const session_abc_1 = require("../../abc/session.abc");
const groups_noweb_1 = require("./groups.noweb");
const noweb_buttons_1 = require("./noweb.buttons");
const noweb_newsletter_1 = require("./noweb.newsletter");
const NowebAuthFactoryCore_1 = require("./NowebAuthFactoryCore");
const NowebInMemoryStore_1 = require("./store/NowebInMemoryStore");
const exceptions_1 = require("../../exceptions");
const vcard_1 = require("../../vcard");
const helpers_proxy_1 = require("../../helpers.proxy");
const LottieMediaProcessorWrapper_1 = require("../../media/LottieMediaProcessorWrapper");
const QR_1 = require("../../QR");
const acks_1 = require("../../utils/acks");
const pairs_1 = require("../../../utils/pairs");
const convertors_1 = require("../../utils/convertors");
const ids_1 = require("../../utils/ids");
const jids_1 = require("../../utils/jids");
const reactive_1 = require("../../utils/reactive");
const helpers_1 = require("../../../helpers");
const channels_dto_1 = require("../../../structures/channels.dto");
const chats_dto_1 = require("../../../structures/chats.dto");
const chatting_buttons_dto_1 = require("../../../structures/chatting.buttons.dto");
const chatting_dto_1 = require("../../../structures/chatting.dto");
const chatting_list_dto_1 = require("../../../structures/chatting.list.dto");
const contacts_dto_1 = require("../../../structures/contacts.dto");
const enums_dto_1 = require("../../../structures/enums.dto");
const groups_dto_1 = require("../../../structures/groups.dto");
const labels_dto_1 = require("../../../structures/labels.dto");
const sessions_dto_1 = require("../../../structures/sessions.dto");
const timehelper_1 = require("../../../utils/timehelper");
const status_dto_1 = require("../../../structures/status.dto");
const promiseTimeout_1 = require("../../../utils/promiseTimeout");
const exclude_1 = require("../../../utils/reactive/ops/exclude");
const SingleDelayedJobRunner_1 = require("../../../utils/SingleDelayedJobRunner");
const SinglePeriodicJobRunner_1 = require("../../../utils/SinglePeriodicJobRunner");
const StatusTracker_1 = require("../../../utils/StatusTracker");
const lodash = require("lodash");
const NodeCache = require("node-cache");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const NowebClient_1 = require("./NowebClient");
const NowebPersistentStore_1 = require("./store/NowebPersistentStore");
const NowebStorageFactoryCore_1 = require("./store/NowebStorageFactoryCore");
const utils_1 = require("./utils");
const pwa_1 = require("../../utils/pwa");
const secretEncryptedMessageEdit_1 = require("../../utils/secretEncryptedMessageEdit");
const locaiton_1 = require("../waproto/locaiton");
const vcards_1 = require("../waproto/vcards");
const activity_1 = require("../../abc/activity");
const WAMimeType_1 = require("../../media/WAMimeType");
const env_1 = require("../../env");
const files_1 = require("../../../utils/files");
const esm_1 = require("../../../vendor/esm");
const axios_1 = require("axios");
const axios_retry_1 = require("axios-retry");
const waversion_1 = require("./waversion");
const promiseRetry = require('promise-retry');
(0, axios_retry_1.default)(axios_1.default, { retries: 3 });
exports.BaileysEvents = {
    CONNECTION_UPDATE: 'connection.update',
    CREDS_UPDATE: 'creds.update',
    MESSAGES_UPDATE: 'messages.update',
    MESSAGES_UPSERT: 'messages.upsert',
    MESSAGE_RECEIPT_UPDATE: 'message-receipt.update',
    GROUPS_UPSERT: 'groups.upsert',
    PRESENCE_UPDATE: 'presence.update',
};
const PresenceStatuses = {
    unavailable: enums_dto_1.WAHAPresenceStatus.OFFLINE,
    available: enums_dto_1.WAHAPresenceStatus.ONLINE,
    composing: enums_dto_1.WAHAPresenceStatus.TYPING,
    recording: enums_dto_1.WAHAPresenceStatus.RECORDING,
    paused: enums_dto_1.WAHAPresenceStatus.PAUSED,
};
const ToEnginePresenceStatus = (0, helpers_1.flipObject)(PresenceStatuses);
class WhatsappSessionNoWebCore extends session_abc_1.WhatsappSession {
    constructor(config) {
        super(config);
        this.START_ATTEMPT_DELAY_SECONDS = 2;
        this.AUTO_RESTART_AFTER_SECONDS = 28 * 60;
        this.engine = enums_dto_1.WAHAEngine.NOWEB;
        this.authFactory = new NowebAuthFactoryCore_1.NowebAuthFactoryCore();
        this.storageFactory = new NowebStorageFactoryCore_1.NowebStorageFactoryCore();
        this.statusTracker = new StatusTracker_1.StatusTracker();
        this.shouldRestart = true;
        this.qr = new QR_1.QR();
        this.msgRetryCounterCache = new NodeCache({
            stdTTL: 60 * 60,
            useClones: false,
        });
        this.placeholderResendCache = new NodeCache({
            stdTTL: 60 * 60,
            useClones: false,
        });
        this.engineLogger = this.loggerBuilder.child({
            name: 'NOWEBEngine',
        });
        this.startDelayedJob = new SingleDelayedJobRunner_1.SingleDelayedJobRunner('start-engine', this.START_ATTEMPT_DELAY_SECONDS * enums_dto_1.SECOND, this.logger);
        const shiftSeconds = Math.floor(Math.random() * 30);
        const delay = this.AUTO_RESTART_AFTER_SECONDS + shiftSeconds;
        this.autoRestartJob = new SinglePeriodicJobRunner_1.SinglePeriodicJobRunner('auto-restart', delay * enums_dto_1.SECOND, this.logger);
        this.authNOWEBStore = null;
    }
    set status(value) {
        this.statusTracker.track(value);
        super.status = value;
    }
    get status() {
        return super.status;
    }
    async start() {
        this.status = enums_dto_1.WAHASessionStatus.STARTING;
        this.buildClient().catch((err) => {
            this.logger.error('Failed to start the client');
            this.logger.error(err, err.stack);
            this.status = enums_dto_1.WAHASessionStatus.FAILED;
            this.restartClient();
        });
    }
    async unpair() {
        var _a;
        this.unpairing = true;
        this.shouldRestart = false;
        await ((_a = this.sock) === null || _a === void 0 ? void 0 : _a.logout());
    }
    getSocketConfig(agents, state) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        let browser = ['Ubuntu', 'Chrome', '22.04.4'];
        let deviceName = (_c = (_b = (_a = this.sessionConfig) === null || _a === void 0 ? void 0 : _a.client) === null || _b === void 0 ? void 0 : _b.deviceName) !== null && _c !== void 0 ? _c : env_1.WAHA_CLIENT_DEVICE_NAME;
        let browserName = (_f = (_e = (_d = this.sessionConfig) === null || _d === void 0 ? void 0 : _d.client) === null || _e === void 0 ? void 0 : _e.browserName) !== null && _f !== void 0 ? _f : env_1.WAHA_CLIENT_BROWSER_NAME;
        if (browserName && !deviceName) {
            browser = baileys_1.Browsers.appropriate(browserName);
        }
        else if (!browserName && deviceName) {
            browser = [deviceName, 'Chrome', '22.04.4'];
        }
        else if (browserName && deviceName) {
            switch (deviceName) {
                case 'Mac OS':
                case 'MacOS':
                case 'macos':
                    browser = baileys_1.Browsers.macOS(browserName);
                    break;
                case 'ubuntu':
                case 'Ubuntu':
                    browser = baileys_1.Browsers.ubuntu(browserName);
                    break;
                case 'windows':
                case 'Windows':
                    browser = baileys_1.Browsers.windows(browserName);
                    break;
                default:
                    browser = [deviceName, browserName, '22.04.4'];
            }
        }
        const fullSyncEnabled = ((_j = (_h = (_g = this.sessionConfig) === null || _g === void 0 ? void 0 : _g.noweb) === null || _h === void 0 ? void 0 : _h.store) === null || _j === void 0 ? void 0 : _j.fullSync) || false;
        let markOnlineOnConnect = (_l = (_k = this.sessionConfig) === null || _k === void 0 ? void 0 : _k.noweb) === null || _l === void 0 ? void 0 : _l.markOnline;
        if (markOnlineOnConnect == undefined) {
            markOnlineOnConnect = true;
        }
        const version = (_m = this.engineConfig) === null || _m === void 0 ? void 0 : _m.waVersion;
        return {
            version: version,
            agent: agents === null || agents === void 0 ? void 0 : agents.socket,
            fetchAgent: agents === null || agents === void 0 ? void 0 : agents.fetch,
            auth: state,
            printQRInTerminal: false,
            browser: browser,
            logger: this.engineLogger,
            mobile: false,
            defaultQueryTimeoutMs: 20000,
            keepAliveIntervalMs: 30000,
            getMessage: (key) => this.getMessage(key),
            syncFullHistory: false, shouldSyncHistoryMessage: () => false,
            shouldIgnoreJid: (jid) => !jid ? false : (jid === 'status@broadcast' || jid.endsWith('@broadcast') || jid.endsWith('@newsletter')),
            msgRetryCounterCache: this.msgRetryCounterCache,
            placeholderResendCache: this.placeholderResendCache,
            markOnlineOnConnect: markOnlineOnConnect,
        };
    }
    async makeSocket() {
        if (!this.authNOWEBStore) {
            const store = await this.authFactory.buildAuth(this.sessionStore, this.name);
            store.state.keys = (0, baileys_1.makeCacheableSignalKeyStore)(store.state.keys, this.engineLogger);
            this.authNOWEBStore = store;
        }
        const { state, saveCreds } = this.authNOWEBStore;
        const agents = this.makeProxyAgents();
        const socketConfig = this.getSocketConfig(agents, state);
        this.logger.info(`Connecting using wa.version = ${(0, waversion_1.formatWaVersion)(socketConfig.version)}`);
        const sock = (0, baileys_1.default)(socketConfig);
        sock.ev.on('creds.update', saveCreds);
        return sock;
    }
    makeProxyAgents() {
        if (!this.proxyConfig) {
            return undefined;
        }
        return (0, helpers_proxy_1.createAgentProxy)(this.proxyConfig);
    }
    async ensureStore() {
        var _a, _b, _c;
        if (this.store) {
            return;
        }
        this.logger.debug(`Making a new store...`);
        const storeEnabled = ((_c = (_b = (_a = this.sessionConfig) === null || _a === void 0 ? void 0 : _a.noweb) === null || _b === void 0 ? void 0 : _b.store) === null || _c === void 0 ? void 0 : _c.enabled) || false;
        if (!storeEnabled) {
            this.logger.debug('Using NowebInMemoryStore');
            this.store = new NowebInMemoryStore_1.NowebInMemoryStore();
            return;
        }
        this.logger.debug('Using NowebPersistentStore');
        const storage = this.storageFactory.createStorage(this.sessionStore, this.name);
        this.store = new NowebPersistentStore_1.NowebPersistentStore(this.loggerBuilder.child({ name: NowebPersistentStore_1.NowebPersistentStore.name }), storage, this.jids);
        await this.store.init();
    }
    connectStore() {
        this.logger.debug(`Connecting store...`);
        this.logger.debug(`Binding store to socket...`);
        this.store.bind(this.sock.ev, this.sock);
    }
    resubscribeToKnownPresences() {
        for (const jid in this.store.presences) {
            this.subscribePresence(jid);
        }
    }
    async buildClient() {
        var _a, _b;
        this.shouldRestart = true;
        (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ev) === null || _b === void 0 ? void 0 : _b.removeAllListeners();
        await this.ensureStore();
        this.sock = await this.makeSocket();
        this.fixMessages();
        this.issueMessageUpdateOnEdits();
        this.issueMessageUpdateOnPoll();
        this.issuePresenceUpdateOnMessageUpsert();
        if (this.isDebugEnabled()) {
            this.listenEngineEventsInDebugMode();
        }
        this.connectStore();
        this.listenConnectionEvents();
        this.subscribeEngineEvents2();
        this.listenContactsUpdatePictureProfile();
    }
    enableAutoRestart() {
        this.autoRestartJob.start(async () => {
            var _a, _b, _c;
            this.logger.info('Auto-restarting the client connection...');
            if ((_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ws) === null || _b === void 0 ? void 0 : _b.isConnecting) {
                this.logger.warn('Auto-restart skipped, the client is connecting...');
                return;
            }
            (_c = this.sock) === null || _c === void 0 ? void 0 : _c.end(undefined);
        });
    }
    async getMessage(key) {
        if (!this.store) {
            return baileys_1.proto.Message.create({});
        }
        const msg = await this.store.loadMessage(key.remoteJid, key.id);
        return (msg === null || msg === void 0 ? void 0 : msg.message) || undefined;
    }
    listenEngineEventsInDebugMode() {
        this.sock.ev.process((events) => {
            this.logger.debug({ events: events }, `NOWEB events`);
        });
    }
    restartClient() {
        if (!this.shouldRestart) {
            this.logger.debug('Should not restart the client, ignoring restart request');
            return;
        }
        this.startDelayedJob.schedule(async () => {
            if (!this.shouldRestart) {
                this.logger.warn('Should not restart the client, ignoring restart request');
                return;
            }
            await this.end();
            await this.start();
        });
    }
    listenConnectionEvents() {
        this.logger.debug(`Start listening ${exports.BaileysEvents.CONNECTION_UPDATE}...`);
        this.sock.ev.on('connection.update', async (update) => {
            var _a, _b, _c, _d;
            const { connection, lastDisconnect, qr, isNewLogin } = update;
            if (update.reachoutTimeLock) {
                const timelock = update.reachoutTimeLock;
                const enforcementType = (_a = timelock.enforcementType) !== null && _a !== void 0 ? _a : sessions_dto_1.ReachoutTimelockEnforcementType.DEFAULT;
                let timeEnforcementEnds = null;
                if (timelock.timeEnforcementEnds) {
                    timeEnforcementEnds = (0, timehelper_1.EnsureSeconds)(timelock.timeEnforcementEnds.getTime());
                }
                this.reachoutTimelock.update({
                    enforcementType: enforcementType,
                    isActive: timelock.isActive === true,
                    timeEnforcementEnds: timeEnforcementEnds,
                });
            }
            if (isNewLogin) {
                this.restartClient();
            }
            else if (connection === 'open') {
                this.qr.save('');
                this.status = enums_dto_1.WAHASessionStatus.WORKING;
                (_c = (_b = this.sock) === null || _b === void 0 ? void 0 : _b.fetchAccountReachoutTimelock) === null || _c === void 0 ? void 0 : _c.call(_b).catch((error) => {
                    this.logger.warn(`Failed to fetch reachout timelock: ${error}`);
                });
                return;
            }
            else if (connection === 'close') {
                this.qr.save('');
                const error = lastDisconnect.error;
                const statusCode = (_d = error === null || error === void 0 ? void 0 : error.output) === null || _d === void 0 ? void 0 : _d.statusCode;
                const restartRequired = statusCode === baileys_1.DisconnectReason.restartRequired;
                if (restartRequired) {
                    this.restartClient();
                    return;
                }
                if (this.statusTracker.isStuckInStarting()) {
                    this.logger.error('Session stuck in STARTING status, force stopping the session.');
                    await this.failed();
                    return;
                }
                if (this.status == enums_dto_1.WAHASessionStatus.SCAN_QR_CODE) {
                    this.logger.warn('QR code has not been scanned yet, force stopping the session.');
                    await this.failed();
                    return;
                }
                const shouldReconnect = statusCode !== baileys_1.DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    if (lastDisconnect.error) {
                        this.logger.info(`Connection closed due to '${lastDisconnect.error}', reconnecting...`);
                    }
                    this.restartClient();
                    return;
                }
                this.logger.error(`Connection closed due to '${lastDisconnect.error}', do not reconnect the session.`);
                await this.failed();
            }
            if (qr) {
                this.qr.save(qr);
                this.printQR(this.qr);
                this.status = enums_dto_1.WAHASessionStatus.SCAN_QR_CODE;
            }
        });
    }
    async stop() {
        var _a, _b, _c, _d;
        this.shouldRestart = false;
        this.startDelayedJob.cancel();
        this.autoRestartJob.stop();
        const hasCreds = (_b = (_a = this.authNOWEBStore) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.creds;
        if (hasCreds && this.status == enums_dto_1.WAHASessionStatus.WORKING) {
            this.logger.info('Saving creds before stopping...');
            await this.authNOWEBStore.saveCreds().catch((e) => {
                this.logger.error('Failed to save creds');
                this.logger.error(e, e.stack);
            });
            this.logger.info('Creds saved');
        }
        this.status = enums_dto_1.WAHASessionStatus.STOPPED;
        this.stopEvents();
        this.mediaManager.close();
        await this.end();
        await ((_c = this.store) === null || _c === void 0 ? void 0 : _c.close());
        (_d = this.authNOWEBStore) === null || _d === void 0 ? void 0 : _d.close().catch((err) => {
            this.logger.error('Failed to close NOWEB auth store');
            this.logger.error(err, err.stack);
        });
    }
    async failed() {
        var _a;
        this.shouldRestart = false;
        this.startDelayedJob.cancel();
        this.autoRestartJob.stop();
        this.status = enums_dto_1.WAHASessionStatus.FAILED;
        if (this.unpairing) {
            await (0, promiseTimeout_1.sleep)(1000);
        }
        await this.end();
        await ((_a = this.store) === null || _a === void 0 ? void 0 : _a.close());
    }
    fixMessages() {
        this.sock.ev.on('messages.upsert', ({ messages }) => {
            var _a, _b;
            for (const message of messages) {
                message.status = (_a = message.status) !== null && _a !== void 0 ? _a : (0, acks_1.AckToStatus)(enums_dto_1.WAMessageAck.DEVICE);
                if (message.key.participant === ((_b = this.getSessionMeInfo()) === null || _b === void 0 ? void 0 : _b.lid)) {
                    message.key.fromMe = true;
                }
            }
        });
    }
    issueMessageUpdateOnEdits() {
        this.sock.ev.on('messages.upsert', ({ messages }) => {
            var _a;
            for (const message of messages) {
                if ((0, pwa_1.IsEditedMessage)(message.message)) {
                    const content = (0, baileys_1.normalizeMessageContent)(message.message);
                    const protocolMsg = content === null || content === void 0 ? void 0 : content.protocolMessage;
                    (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ev.emit('messages.update', [
                        {
                            key: Object.assign(Object.assign({}, message.key), { id: protocolMsg.key.id }),
                            update: { message: protocolMsg.editedMessage },
                        },
                    ]);
                }
            }
        });
    }
    issueMessageUpdateOnPoll() {
        this.sock.ev.on('messages.upsert', async ({ messages }) => {
            var _a;
            const me = this.getSessionMeInfo();
            if (!me) {
                this.logger.warn('Cannot issue poll updates, session "me" info not found');
                return;
            }
            for (const message of messages) {
                const content = (0, baileys_1.normalizeMessageContent)(message.message);
                if (!(content === null || content === void 0 ? void 0 : content.pollUpdateMessage)) {
                    continue;
                }
                const creationMsgKey = content.pollUpdateMessage.pollCreationMessageKey;
                const pkey = Object.assign({}, creationMsgKey);
                pkey.remoteJid = null;
                const pollMsg = await this.getMessage(pkey);
                if (!pollMsg) {
                    this.logger.warn({ creationMsgKey }, 'poll creation message not found, cannot decrypt update');
                    continue;
                }
                const key = message.key;
                const myIds = [(0, baileys_1.jidNormalizedUser)(me.id), (0, baileys_1.jidNormalizedUser)(me.lid)];
                const participantIds = [
                    (0, baileys_1.jidNormalizedUser)(key === null || key === void 0 ? void 0 : key.participantAlt),
                    (0, baileys_1.jidNormalizedUser)(key === null || key === void 0 ? void 0 : key.remoteJidAlt),
                    (0, baileys_1.jidNormalizedUser)(key === null || key === void 0 ? void 0 : key.participant),
                    (0, baileys_1.jidNormalizedUser)(key === null || key === void 0 ? void 0 : key.remoteJid),
                ];
                let creators = creationMsgKey.fromMe
                    ? [...myIds, ...participantIds]
                    : [...participantIds, ...myIds];
                let votes = key.fromMe
                    ? [...myIds, ...participantIds]
                    : [...participantIds, ...myIds];
                creators = lodash.uniq(creators.filter(Boolean));
                votes = lodash.uniq(votes.filter(Boolean));
                let found = false;
                for (const [pollCreatorJid, voterJid] of (0, pairs_1.pairs)(creators, votes)) {
                    try {
                        const pollEncKey = (_a = pollMsg.messageContextInfo) === null || _a === void 0 ? void 0 : _a.messageSecret;
                        const voteMsg = (0, baileys_1.decryptPollVote)(content.pollUpdateMessage.vote, {
                            pollCreatorJid: pollCreatorJid,
                            pollMsgId: creationMsgKey.id,
                            pollEncKey: pollEncKey,
                            voterJid: voterJid,
                        });
                        this.sock.ev.emit('messages.update', [
                            {
                                key: creationMsgKey,
                                update: {
                                    pollUpdates: [
                                        {
                                            pollUpdateMessageKey: message.key,
                                            vote: voteMsg,
                                            senderTimestampMs: content.pollUpdateMessage.senderTimestampMs.toNumber(),
                                        },
                                    ],
                                },
                            },
                        ]);
                        found = true;
                        break;
                    }
                    catch (err) {
                        this.logger.trace({
                            err: err.message,
                            key: key,
                            creationsMsgKey: creationMsgKey,
                            pollCreatorJid: pollCreatorJid,
                            voterJid: voterJid,
                        }, 'failed to decrypt poll vote using creator and voter');
                    }
                }
                if (!found) {
                    this.logger.warn({
                        key: key,
                        creationsMsgKey: creationMsgKey,
                        creators: creators,
                        voters: votes,
                    }, 'failed to decrypt poll vote with any combination of creator/voter');
                }
            }
        });
    }
    issuePresenceUpdateOnMessageUpsert() {
        this.sock.ev.on('messages.upsert', ({ messages }) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            const meId = (_d = (_c = (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.authState) === null || _b === void 0 ? void 0 : _b.creds) === null || _c === void 0 ? void 0 : _c.me) === null || _d === void 0 ? void 0 : _d.id;
            for (const message of messages) {
                if (!(0, baileys_1.isRealMessage)(message)) {
                    continue;
                }
                if (message.key.fromMe) {
                    continue;
                }
                const jid = message.key.remoteJid;
                const participant = message.key.participant || jid;
                const jidPresences = (_f = (_e = this.store) === null || _e === void 0 ? void 0 : _e.presences) === null || _f === void 0 ? void 0 : _f[jid];
                const participantPresence = jidPresences === null || jidPresences === void 0 ? void 0 : jidPresences[participant];
                if ((participantPresence === null || participantPresence === void 0 ? void 0 : participantPresence.lastKnownPresence) === 'composing') {
                    this.logger.debug(`Fixing presence for '${participant}' in '${jid} since it's typing`);
                    const presence = { lastKnownPresence: 'available' };
                    (_h = (_g = this.sock) === null || _g === void 0 ? void 0 : _g.ev) === null || _h === void 0 ? void 0 : _h.emit('presence.update', {
                        id: jid,
                        presences: { [participant]: presence },
                    });
                }
            }
        });
    }
    async end() {
        var _a, _b, _c, _d, _e;
        this.cleanupPresenceTimeout();
        this.presence = null;
        this.autoRestartJob.stop();
        (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ev) === null || _b === void 0 ? void 0 : _b.removeAllListeners();
        (_d = (_c = this.sock) === null || _c === void 0 ? void 0 : _c.ws) === null || _d === void 0 ? void 0 : _d.removeAllListeners();
        await (0, promiseTimeout_1.waitUntil)(async () => { var _a, _b; return !((_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ws) === null || _b === void 0 ? void 0 : _b.isConnecting); }, 1000, 10000);
        (_e = this.sock) === null || _e === void 0 ? void 0 : _e.end(undefined);
    }
    getSessionMeInfo() {
        var _a, _b, _c;
        const me = (_c = (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.authState) === null || _b === void 0 ? void 0 : _b.creds) === null || _c === void 0 ? void 0 : _c.me;
        if (!me) {
            return null;
        }
        const meId = (0, baileys_1.jidNormalizedUser)(me.id);
        return {
            id: (0, jids_1.toCusFormat)(meId),
            pushName: me.name,
            lid: (0, baileys_1.jidNormalizedUser)(me.lid),
            reachoutTimelock: this.reachoutTimelock.value,
        };
    }
    getQR() {
        return this.qr;
    }
    async requestCode(phoneNumber, method, params) {
        if (method) {
            const err = `NOWEB engine doesn't support any 'method', remove it and try again`;
            throw new common_1.UnprocessableEntityException(err);
        }
        if (this.status == enums_dto_1.WAHASessionStatus.STARTING) {
            this.logger.debug('Waiting for connection update...');
            await this.sock.waitForConnectionUpdate(async (update) => !!update.qr);
        }
        if (this.status != enums_dto_1.WAHASessionStatus.SCAN_QR_CODE) {
            const err = `Can request code only in SCAN_QR_CODE status. The current status is ${this.status}`;
            throw new common_1.UnprocessableEntityException(err);
        }
        this.logger.info(`Requesting pairing code for '${phoneNumber}'...`);
        const code = await this.sock.requestPairingCode(phoneNumber);
        const parts = (0, helpers_1.splitAt)(code, 4);
        const codeRepr = parts.join('-');
        this.logger.info(`Your code: ${codeRepr}`);
        return { code: codeRepr };
    }
    async getScreenshot() {
        if (this.status === enums_dto_1.WAHASessionStatus.STARTING) {
            throw new common_1.UnprocessableEntityException(`The session is starting, please try again after few seconds`);
        }
        else if (this.status === enums_dto_1.WAHASessionStatus.SCAN_QR_CODE) {
            return this.qr.get();
        }
        else if (this.status === enums_dto_1.WAHASessionStatus.WORKING) {
            throw new common_1.UnprocessableEntityException(`Can not get screenshot for non chrome based engine.`);
        }
        else {
            throw new common_1.UnprocessableEntityException(`Unknown status - ${this.status}`);
        }
    }
    async setProfileName(name) {
        await this.sock.updateProfileName(name);
        return true;
    }
    async setProfileStatus(status) {
        await this.sock.updateProfileStatus(status);
        return true;
    }
    async setProfilePicture(file) {
        const content = await this.fileToBuffer(file);
        const me = this.getSessionMeInfo();
        await this.sock.updateProfilePicture(me.id, content);
        return true;
    }
    async deleteProfilePicture() {
        const me = this.getSessionMeInfo();
        await this.sock.removeProfilePicture(me.id);
        return true;
    }
    async checkNumberStatus(request) {
        let phone = request.phone.split('@')[0];
        phone = phone.replace(/\+/g, '');
        const [result] = await this.sock.onWhatsApp(phone);
        if (!result || !result.exists) {
            return { numberExists: false };
        }
        return {
            numberExists: true,
            chatId: (0, jids_1.toCusFormat)(result.jid),
        };
    }
    async generateNewMessageId() {
        return this.generateMessageID();
    }
    async rejectCall(from, id) {
        const jid = (0, jids_1.toJID)(this.ensureSuffix(from));
        await this.sock.rejectCall(id, jid);
    }
    async sendText(request) {
        var _a;
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const message = {
            text: request.text,
            mentions: (_a = request.mentions) === null || _a === void 0 ? void 0 : _a.map(jids_1.toJID),
            linkPreview: this.getLinkPreview(request),
        };
        const options = await this.getMessageOptions(request);
        options.linkPreviewHighQuality = request.linkPreviewHighQuality;
        return this.sock.sendMessage(chatId, message, options);
    }
    deleteMessage(chatId, messageId) {
        const jid = (0, jids_1.toJID)(this.ensureSuffix(chatId));
        const key = (0, ids_1.parseMessageIdSerialized)(messageId);
        const options = {
            messageId: this.generateMessageID(),
        };
        return this.sock.sendMessage(jid, { delete: key }, options);
    }
    async editMessage(chatId, messageId, request) {
        var _a, _b, _c, _d;
        const jid = (0, jids_1.toJID)(this.ensureSuffix(chatId));
        const key = (0, ids_1.parseMessageIdSerialized)(messageId);
        const stored = await ((_a = this.store) === null || _a === void 0 ? void 0 : _a.loadMessage(key.remoteJid, key.id).catch(() => null));
        const content = (0, baileys_1.extractMessageContent)(stored === null || stored === void 0 ? void 0 : stored.message);
        let editedMessage = undefined;
        if (content === null || content === void 0 ? void 0 : content.imageMessage) {
            editedMessage = {
                imageMessage: {
                    caption: request.text,
                },
            };
        }
        else if (content === null || content === void 0 ? void 0 : content.videoMessage) {
            editedMessage = {
                videoMessage: {
                    caption: request.text,
                },
            };
        }
        else if (content === null || content === void 0 ? void 0 : content.documentMessage) {
            editedMessage = {
                documentMessage: {
                    caption: request.text,
                },
            };
        }
        else if ((_c = (_b = content === null || content === void 0 ? void 0 : content.documentWithCaptionMessage) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.documentMessage) {
            editedMessage = {
                documentWithCaptionMessage: {
                    message: {
                        documentMessage: {
                            caption: request.text,
                        },
                    },
                },
            };
        }
        let message = {
            text: request.text,
            mentions: (_d = request.mentions) === null || _d === void 0 ? void 0 : _d.map(jids_1.toJID),
            edit: key,
            editedMessage: editedMessage,
            linkPreview: this.getLinkPreview(request),
            linkPreviewHighQuality: request.linkPreviewHighQuality,
        };
        const options = {
            messageId: this.generateMessageID(),
        };
        if ((0, jids_1.isJidNewsletter)(jid)) {
            options.messageId = key.id;
        }
        return await this.sock.sendMessage(jid, message, options);
    }
    async sendContactVCard(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const contacts = request.contacts.map((el) => ({ vcard: (0, vcard_1.toVcardV3)(el) }));
        const options = await this.getMessageOptions(request);
        const msg = { contacts: { contacts: contacts } };
        return await this.sock.sendMessage(chatId, msg, options);
    }
    async sendPoll(request) {
        const requestPoll = request.poll;
        const poll = {
            name: requestPoll.name,
            values: requestPoll.options,
            selectableCount: requestPoll.multipleAnswers
                ? requestPoll.options.length
                : 1,
        };
        const message = { poll: poll };
        const remoteJid = (0, jids_1.toJID)(request.chatId);
        const options = await this.getMessageOptions(request);
        const result = await this.sock.sendMessage(remoteJid, message, options);
        return this.toWAMessage(result);
    }
    async reply(request) {
        var _a;
        const options = await this.getMessageOptions(request);
        const message = {
            text: request.text,
            mentions: (_a = request.mentions) === null || _a === void 0 ? void 0 : _a.map(jids_1.toJID),
        };
        return await this.sock.sendMessage(request.chatId, message, options);
    }
    async sendImage(request) {
        var _a;
        const message = await this.fileToMessage(request.file, 'image', request.caption);
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.IMAGE;
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        if ((0, jids_1.isJidNewsletter)(chatId)) {
            try {
                const thumb = await esm_1.default.b.extractImageThumb(message.image, 72);
                message.jpegThumbnail = thumb.buffer;
                message.width = thumb.original.width;
                message.height = thumb.original.height;
            }
            catch (err) {
                this.logger.warn({ error: err }, 'Failed to generate thumbnail for newsletter image');
            }
        }
        if ((_a = request.mentions) === null || _a === void 0 ? void 0 : _a.length) {
            message.mentions = request.mentions.map((mention) => (0, jids_1.toJID)(mention));
        }
        const options = await this.getMessageOptions(request);
        return this.sock.sendMessage(chatId, message, options);
    }
    async sendFile(request) {
        var _a;
        const message = await this.fileToMessage(request.file, 'document', request.caption);
        if (!message.mimetype) {
            message.mimetype = await (0, files_1.detectMimetype)(message['document']);
        }
        if ((_a = request.mentions) === null || _a === void 0 ? void 0 : _a.length) {
            message.mentions = request.mentions.map((mention) => (0, jids_1.toJID)(mention));
        }
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const options = await this.getMessageOptions(request);
        return this.sock.sendMessage(chatId, message, options);
    }
    async sendVoice(request) {
        const message = await this.fileToMessage(request.file, 'audio');
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.VOICE;
        if (request.convert) {
            message['audio'] = await this.mediaConverter.voice(message['audio']);
            message.mimetype = WAMimeType_1.WAMimeType.VOICE;
        }
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const options = await this.getMessageOptions(request);
        return this.sock.sendMessage(chatId, message, options);
    }
    async sendVideo(request) {
        var _a, _b;
        const message = await this.fileToMessage(request.file, 'video', request.caption);
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.VIDEO;
        if (request.convert) {
            message['video'] = await this.mediaConverter.video(message['video']);
            message.mimetype = WAMimeType_1.WAMimeType.VIDEO;
        }
        if ((_a = request.mentions) === null || _a === void 0 ? void 0 : _a.length) {
            message.mentions = request.mentions.map((mention) => (0, jids_1.toJID)(mention));
        }
        const duration = await esm_1.default.b
            .getAudioDuration(message['video'])
            .catch((err) => {
            this.logger.warn({ error: err }, 'Failed to get video duration');
            return undefined;
        });
        message.seconds = duration;
        const isGif = ((_b = request.file) === null || _b === void 0 ? void 0 : _b.mimetype) === 'image/gif';
        if (isGif) {
            message.gifPlayback = true;
            message.externalShareFullVideoDurationInSeconds = 0;
        }
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const options = await this.getMessageOptions(request);
        message.ptv = (0, helpers_1.parseBool)(request.asNote);
        return this.sock.sendMessage(chatId, message, options);
    }
    async sendLinkCustomPreview(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const options = await this.getMessageOptions(request);
        const preview = request.preview;
        const urlInfo = {
            'matched-text': preview.url,
            title: preview.title,
            description: preview.description,
            jpegThumbnail: null,
            highQualityThumbnail: null,
        };
        if (request.preview.image) {
            const content = await this.fileToBuffer(request.preview.image);
            if (!request.linkPreviewHighQuality) {
                const thumbnail = await esm_1.default.b.extractImageThumb(content, 192);
                urlInfo.jpegThumbnail = thumbnail.buffer;
            }
            else {
                const uploadToServer = this.sock.waUploadToServer;
                const uploadThumbnail = async (encFilePath, opts) => {
                    opts.newsletter = (0, jids_1.isJidNewsletter)(chatId);
                    return await uploadToServer(encFilePath, opts);
                };
                const { imageMessage } = await esm_1.default.b.prepareWAMessageMedia({ image: content }, {
                    upload: uploadThumbnail,
                    mediaTypeOverride: 'thumbnail-link',
                    options: { signal: AbortSignal.timeout(10000) },
                    jid: chatId,
                });
                urlInfo.jpegThumbnail = (imageMessage === null || imageMessage === void 0 ? void 0 : imageMessage.jpegThumbnail)
                    ? Buffer.from(imageMessage.jpegThumbnail)
                    : undefined;
                urlInfo.highQualityThumbnail = imageMessage;
            }
        }
        const message = {
            text: request.text,
            linkPreview: urlInfo,
        };
        return this.sock.sendMessage(chatId, message, options);
    }
    async uploadMedia(file, type) {
        if (!file) {
            return;
        }
        if (!('url' in file || 'data' in file)) {
            return;
        }
        const message = await this.fileToMessage(file, type);
        const options = {
            logger: this.engineLogger,
            upload: this.sock.waUploadToServer,
        };
        const { imageMessage } = await esm_1.default.b.prepareWAMessageMedia(message, options);
        return imageMessage;
    }
    get client() {
        return new NowebClient_1.NowebClient(this.sock);
    }
    async fileToMessage(file, type, caption = '') {
        let content;
        if ('url' in file) {
            content = await this.fetch(file.url);
        }
        else if ('data' in file) {
            content = Buffer.from(file.data, 'base64');
        }
        else {
            throw new common_1.UnprocessableEntityException('Either "file.url" or "file.data" must be specified.');
        }
        return {
            [type]: content,
            mimetype: file.mimetype,
            caption: caption,
            fileName: file.filename,
            ptt: type === 'audio',
        };
    }
    async fileToBuffer(file) {
        let content;
        if ('data' in file) {
            content = Buffer.from(file.data, 'base64');
        }
        else if ('url' in file) {
            content = await this.fetch(file.url);
        }
        else {
            throw new common_1.UnprocessableEntityException('Either file.url or file.data must be specified.');
        }
        return content;
    }
    async sendButtons(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const headerImage = await this.uploadMedia(request.headerImage, 'image');
        return await (0, noweb_buttons_1.sendButtonMessage)(this.sock, chatId, request.buttons, request.header, headerImage, request.body, request.footer);
    }
    async sendList(request) {
        const jid = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        if (!(0, jid_utils_1.isLidUser)(jid) && !(0, baileys_1.isPnUser)(jid)) {
            throw new common_1.UnprocessableEntityException(`List message can only be sent to a direct message chat.`);
        }
        const message = request.message;
        const msg = {
            text: message.description || '',
            title: message.title,
            buttonText: message.button,
            footer: message.footer,
            sections: message.sections,
        };
        const options = await this.getMessageOptions(request);
        return await this.sock.sendMessage(jid, msg, options);
    }
    async sendLocation(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const msg = {
            location: {
                name: request.title || null,
                degreesLatitude: request.latitude,
                degreesLongitude: request.longitude,
            },
        };
        const options = await this.getMessageOptions(request);
        return await this.sock.sendMessage(chatId, msg, options);
    }
    async forwardMessage(request) {
        const key = (0, ids_1.parseMessageIdSerialized)(request.messageId);
        const forwardMessage = await this.store.loadMessage(key.remoteJid, key.id);
        if (!forwardMessage) {
            throw new common_1.UnprocessableEntityException(`Message with id '${request.messageId}' not found`);
        }
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const message = {
            forward: forwardMessage,
            force: true,
        };
        const options = await this.getMessageOptions(request);
        const result = await this.sock.sendMessage(chatId, message, options);
        return this.toWAMessage(result);
    }
    async sendLinkPreview(request) {
        const text = `${request.title}\n${request.url}`;
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        const msg = { text: text };
        const options = await this.getMessageOptions(request);
        return this.sock.sendMessage(chatId, msg, options);
    }
    async sendSeen(request) {
        var _a;
        const keys = (0, convertors_1.ExtractMessageKeysForRead)(request);
        if (keys.length === 0) {
            return;
        }
        await this.sock.readMessages(keys);
        const updates = keys.map((key) => ({
            key: key,
            update: { status: (0, acks_1.AckToStatus)(enums_dto_1.WAMessageAck.READ) },
        }));
        (_a = this.sock) === null || _a === void 0 ? void 0 : _a.ev.emit('messages.update', updates);
    }
    async startTyping(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        await this.sock.sendPresenceUpdate('composing', chatId);
    }
    async stopTyping(request) {
        const chatId = (0, jids_1.toJID)(this.ensureSuffix(request.chatId));
        return this.sock.sendPresenceUpdate('paused', chatId);
    }
    async getChatMessages(chatId, query, filter) {
        var _a;
        const downloadMedia = query.downloadMedia;
        const pagination = query;
        const merge = (_a = query.merge) !== null && _a !== void 0 ? _a : true;
        const messages = await this.store.getMessagesByJid((0, jids_1.toJID)(chatId), filter, pagination, merge);
        const promises = [];
        for (const msg of messages) {
            promises.push(this.processIncomingMessage(msg, downloadMedia));
        }
        let result = await Promise.all(promises);
        result = result.filter(Boolean);
        return result;
    }
    readChatMessages(chatId, request) {
        return this.readChatMessagesWSImpl(chatId, request);
    }
    async getChatMessage(chatId, messageId, query) {
        var _a;
        const key = (0, ids_1.parseMessageIdSerialized)(messageId, true);
        const merge = (_a = query.merge) !== null && _a !== void 0 ? _a : true;
        const message = await this.store.getMessageById((0, jids_1.toJID)(chatId), key.id, merge);
        if (!message)
            return null;
        return await this.processIncomingMessage(message, query.downloadMedia);
    }
    async pinMessage(chatId, messageId, duration) {
        const jid = (0, jids_1.toJID)(chatId);
        const key = (0, ids_1.parseMessageIdSerialized)(messageId);
        await this.sock.sendMessage(jid, {
            pin: key,
            type: baileys_1.proto.PinInChat.Type.PIN_FOR_ALL,
            time: duration,
        });
        return true;
    }
    async unpinMessage(chatId, messageId) {
        const jid = (0, jids_1.toJID)(chatId);
        const key = (0, ids_1.parseMessageIdSerialized)(messageId);
        await this.sock.sendMessage(jid, {
            pin: key,
            type: baileys_1.proto.PinInChat.Type.UNPIN_FOR_ALL,
        });
        return true;
    }
    async setReaction(request) {
        const key = (0, ids_1.parseMessageIdSerialized)(request.messageId);
        if ((0, jids_1.isJidNewsletter)(key.remoteJid)) {
            let serverId = Number(key.id);
            if (!serverId) {
                const msg = await this.store.getMessageById(key.remoteJid, key.id);
                if (msg) {
                    serverId = Number(msg.key.server_id);
                }
            }
            if (!serverId) {
                throw new common_1.UnprocessableEntityException(`Unable to get server id for channel message '${key.id}'`);
            }
            return this.sock.newsletterReactMessage(key.remoteJid, serverId.toString(), request.reaction);
        }
        else {
            const reactionMessage = {
                react: {
                    text: request.reaction,
                    key: key,
                },
            };
            return this.sock.sendMessage(key.remoteJid, reactionMessage);
        }
    }
    async setStar(request) {
        const key = (0, ids_1.parseMessageIdSerialized)(request.messageId);
        await this.sock.chatModify({
            star: {
                messages: [{ id: key.id, fromMe: key.fromMe }],
                star: request.star,
            },
        }, (0, jids_1.toJID)(request.chatId));
    }
    async getChats(pagination) {
        var _a;
        const merge = (_a = pagination.merge) !== null && _a !== void 0 ? _a : true;
        const chats = await this.store.getChats(pagination, true, undefined, merge);
        chats.forEach((chat) => delete chat.unreadCount);
        return chats;
    }
    async getChatsOverview(pagination, filter) {
        var _a;
        const merge = (_a = pagination.merge) !== null && _a !== void 0 ? _a : true;
        let jidFilter;
        if ((filter === null || filter === void 0 ? void 0 : filter.ids) && filter.ids.length > 0) {
            jidFilter = {
                ids: filter.ids.map((id) => (0, jids_1.toJID)(id)),
            };
        }
        const chats = await this.store.getChats(pagination, false, jidFilter, merge);
        chats.forEach((chat) => delete chat.unreadCount);
        const promises = [];
        for (const chat of chats) {
            promises.push(this.fetchChatSummary(chat, merge));
        }
        const result = await Promise.all(promises);
        return result;
    }
    async fetchChatSummary(chat, merge) {
        const id = (0, jids_1.toCusFormat)(chat.id);
        let name = chat.name;
        if (!name) {
            const jid = (0, jids_1.toJID)(chat.id);
            const contact = await this.store.getContactById(jid);
            name = (contact === null || contact === void 0 ? void 0 : contact.name) || (contact === null || contact === void 0 ? void 0 : contact.notify);
        }
        const picture = await this.getContactProfilePicture(chat.id, false);
        const lastMessageQuery = {
            limit: 1,
            offset: 0,
            downloadMedia: false,
            merge: merge,
        };
        const messages = await this.getChatMessages(chat.id, lastMessageQuery, {});
        const message = messages.length > 0 ? messages[0] : null;
        return {
            id: id,
            name: name || null,
            picture: picture,
            lastMessage: message,
            _chat: chat,
        };
    }
    async chatsPutArchive(chatId, archive) {
        const jid = (0, jids_1.toJID)(chatId);
        const messages = await this.store.getMessagesByJid(jid, {}, { limit: 1 });
        return await this.sock.chatModify({ archive: archive, lastMessages: messages }, jid);
    }
    chatsArchiveChat(chatId) {
        return this.chatsPutArchive(chatId, true);
    }
    chatsUnarchiveChat(chatId) {
        return this.chatsPutArchive(chatId, false);
    }
    async chatsUnreadChat(chatId) {
        const jid = (0, jids_1.toJID)(chatId);
        const messages = await this.store.getMessagesByJid(jid, {}, { limit: 1 });
        return await this.sock.chatModify({ markRead: false, lastMessages: messages }, jid);
    }
    async getLabels() {
        const labels = await this.store.getLabels();
        return labels.map(this.toLabel);
    }
    async createLabel(label) {
        const labels = await this.store.getLabels();
        const highestLabelId = lodash.max(labels.map((label) => parseInt(label.id)));
        const labelId = highestLabelId ? highestLabelId + 1 : 1;
        const labelAction = {
            id: labelId.toString(),
            name: label.name,
            color: label.color,
            deleted: false,
            predefinedId: undefined,
        };
        await this.sock.addLabel(undefined, labelAction);
        return {
            id: labelId.toString(),
            name: label.name,
            color: label.color,
            colorHex: labels_dto_1.Label.toHex(label.color),
        };
    }
    async updateLabel(label) {
        const labelAction = {
            id: label.id,
            name: label.name,
            color: label.color,
            deleted: false,
            predefinedId: undefined,
        };
        await this.sock.addLabel(undefined, labelAction);
        return label;
    }
    async deleteLabel(label) {
        const labelAction = {
            id: label.id,
            name: label.name,
            color: label.color,
            deleted: true,
            predefinedId: undefined,
        };
        await this.sock.addLabel(undefined, labelAction);
    }
    async getChatsByLabelId(labelId) {
        const chats = await this.store.getChatsByLabelId(labelId);
        chats.forEach((chat) => delete chat.unreadCount);
        return chats;
    }
    async getChatLabels(chatId) {
        const jid = (0, jids_1.toJID)(chatId);
        const labels = await this.store.getChatLabels(jid);
        return labels.map(this.toLabel);
    }
    async putLabelsToChat(chatId, labels) {
        const jid = (0, jids_1.toJID)(chatId);
        const labelsIds = labels.map((label) => label.id);
        const currentLabels = await this.store.getChatLabels(jid);
        const currentLabelsIds = currentLabels.map((label) => label.id);
        const addLabelsIds = lodash.difference(labelsIds, currentLabelsIds);
        const removeLabelsIds = lodash.difference(currentLabelsIds, labelsIds);
        for (const labelId of addLabelsIds) {
            await this.sock.addChatLabel(jid, labelId);
        }
        for (const labelId of removeLabelsIds) {
            await this.sock.removeChatLabel(jid, labelId);
        }
    }
    toLabel(label) {
        const color = label.color;
        return {
            id: label.id,
            name: label.name,
            color: color,
            colorHex: labels_dto_1.Label.toHex(color),
        };
    }
    async toLabelChatAssociation(association) {
        const labelData = await this.store.getLabelById(association.labelId);
        const label = labelData ? this.toLabel(labelData) : null;
        return {
            labelId: association.labelId,
            chatId: (0, jids_1.toCusFormat)(association.chatId),
            label: label,
        };
    }
    async upsertContact(chatId, body) {
        const jid = (0, jids_1.toJID)(chatId);
        let fullName = body.firstName;
        if (body.lastName) {
            fullName = `${body.firstName} ${body.lastName}`;
        }
        const action = {
            fullName: fullName,
            firstName: body.firstName,
            saveOnPrimaryAddressbook: true,
        };
        await this.sock.addOrEditContact(jid, action);
        const updates = [
            {
                id: jid,
                name: fullName,
            },
        ];
        this.sock.ev.emit('contacts.update', updates);
    }
    async getContact(query) {
        const jid = (0, jids_1.toJID)(query.contactId);
        const contact = await this.store.getContactById(jid);
        if (!contact) {
            return null;
        }
        return this.toWAContact(contact);
    }
    async getContacts(pagination) {
        const contacts = await this.store.getContacts(pagination);
        return contacts.map(this.toWAContact);
    }
    async fetchContactProfilePicture(id) {
        const contact = this.ensureSuffix(id);
        try {
            const url = await this.sock.profilePictureUrl(contact, 'image');
            return url;
        }
        catch (err) {
            if (err.message == 'item-not-found') {
                return null;
            }
            if (err.message == 'not-authorized') {
                return null;
            }
            throw err;
        }
    }
    async blockContact(request) {
        throw new exceptions_1.NotImplementedByEngineError();
    }
    async unblockContact(request) {
        throw new exceptions_1.NotImplementedByEngineError();
    }
    async getAllLids(pagination) {
        const lids = await this.store.getAllLids(pagination);
        return lids.map((value) => {
            return {
                lid: value.lid,
                pn: (0, jids_1.toCusFormat)(value.pn),
            };
        });
    }
    async getLidsCount() {
        return this.store.getLidsCount();
    }
    async findPNByLid(lid) {
        const pn = await this.store.findPNByLid(lid);
        return {
            lid: lid,
            pn: pn ? (0, jids_1.toCusFormat)(pn) : null,
        };
    }
    async findLIDByPhoneNumber(phoneNumber) {
        const pn = (0, jids_1.toJID)(phoneNumber);
        const lid = await this.store.findLidByPN(pn);
        return {
            lid: lid || null,
            pn: (0, jids_1.toCusFormat)(pn),
        };
    }
    async setGroupPicture(id, file) {
        const content = await this.fileToBuffer(file);
        await this.sock.updateProfilePicture(id, content);
        return true;
    }
    async deleteGroupPicture(id) {
        await this.sock.removeProfilePicture(id);
        return true;
    }
    createGroup(request) {
        const participants = request.participants.map(getId);
        return this.sock.groupCreate(request.name, participants);
    }
    joinGroup(code) {
        return this.sock.groupAcceptInvite(code);
    }
    joinInfoGroup(code) {
        return this.sock.groupGetInviteInfo(code);
    }
    async getGroups(pagination) {
        const groups = await this.store.getGroups(pagination);
        return lodash.keyBy(groups, 'id');
    }
    removeGroupsFieldParticipant(group) {
        delete group.participants;
    }
    async refreshGroups() {
        this.store.resetGroupsCache();
        await this.store.getGroups({});
        return true;
    }
    async getGroup(id) {
        const groups = await this.getGroups({});
        const group = groups[id];
        if (!group) {
            throw new Error(`Group with id '${id}' not found`);
        }
        return group;
    }
    async getGroupParticipants(id) {
        var _a;
        const group = (await this.getGroup(id));
        if (!((_a = group === null || group === void 0 ? void 0 : group.participants) === null || _a === void 0 ? void 0 : _a.length)) {
            return [];
        }
        return group.participants.map(groups_noweb_1.ToGroupParticipant);
    }
    async deleteGroup(id) {
        throw new exceptions_1.NotImplementedByEngineError();
    }
    async getInfoAdminsOnly(id) {
        const group = await this.getGroup(id);
        return { adminsOnly: group.restrict };
    }
    async setInfoAdminsOnly(id, value) {
        const setting = value ? 'locked' : 'unlocked';
        return await this.sock.groupSettingUpdate(id, setting);
    }
    async getMessagesAdminsOnly(id) {
        const group = await this.getGroup(id);
        return { adminsOnly: group.announce };
    }
    async setMessagesAdminsOnly(id, value) {
        const setting = value ? 'announcement' : 'not_announcement';
        return await this.sock.groupSettingUpdate(id, setting);
    }
    async getMemberAddMode(id) {
        const group = await this.getGroup(id);
        return { membersCanAddNewMember: group.memberAddMode };
    }
    async setMemberAddMode(id, value) {
        const mode = value ? 'all_member_add' : 'admin_add';
        return await this.sock.groupMemberAddMode(id, mode);
    }
    async leaveGroup(id) {
        return this.sock.groupLeave(id);
    }
    async setDescription(id, description) {
        return this.sock.groupUpdateDescription(id, description);
    }
    async setSubject(id, subject) {
        return this.sock.groupUpdateSubject(id, subject);
    }
    async getInviteCode(id) {
        return this.sock.groupInviteCode(id);
    }
    async revokeInviteCode(id) {
        await this.sock.groupRevokeInvite(id);
        return this.sock.groupInviteCode(id);
    }
    async getParticipants(id) {
        const groups = await this.sock.groupFetchAllParticipating();
        return groups[id].participants;
    }
    async addParticipants(id, request) {
        const participants = request.participants.map(getId);
        return this.sock.groupParticipantsUpdate(id, participants, 'add');
    }
    async removeParticipants(id, request) {
        const participants = request.participants.map(getId);
        return this.sock.groupParticipantsUpdate(id, participants, 'remove');
    }
    async promoteParticipantsToAdmin(id, request) {
        const participants = request.participants.map(getId);
        return this.sock.groupParticipantsUpdate(id, participants, 'promote');
    }
    async demoteParticipantsToUser(id, request) {
        const participants = request.participants.map(getId);
        return this.sock.groupParticipantsUpdate(id, participants, 'demote');
    }
    async setPresence(presence, chatId) {
        switch (presence) {
            case enums_dto_1.WAHAPresenceStatus.TYPING:
            case enums_dto_1.WAHAPresenceStatus.RECORDING:
            case enums_dto_1.WAHAPresenceStatus.PAUSED:
                await this.maintainPresenceOnline();
        }
        const enginePresence = ToEnginePresenceStatus[presence];
        if (!enginePresence) {
            throw new exceptions_1.NotImplementedByEngineError(`NOWEB engine doesn't support '${presence}' presence.`);
        }
        if (chatId) {
            chatId = (0, jids_1.toJID)(this.ensureSuffix(chatId));
        }
        await this.sock.sendPresenceUpdate(enginePresence, chatId);
        this.presence = presence;
    }
    async getPresences() {
        const result = [];
        for (const remoteJid in this.store.presences) {
            const storedPresences = this.store.presences[remoteJid];
            result.push(this.toWahaPresences(remoteJid, storedPresences));
        }
        return result;
    }
    async getPresence(chatId) {
        const jid = (0, jids_1.toJID)(chatId);
        await this.subscribePresence(jid);
        if (!(jid in this.store.presences)) {
            this.store.presences[jid] = {};
            await (0, promiseTimeout_1.sleep)(1000);
        }
        const result = this.store.presences[jid];
        return this.toWahaPresences(jid, result);
    }
    subscribePresence(id) {
        const jid = (0, jids_1.toJID)(id);
        return this.sock.presenceSubscribe(jid);
    }
    async sendStatusMessage(message, options, jids, batchSize) {
        if (!batchSize || batchSize == 0) {
            batchSize = 5000;
        }
        const chunks = lodash.chunk(jids, batchSize);
        if (chunks.length == 0) {
            throw new common_1.UnprocessableEntityException('No participants to send status');
        }
        const logger = this.logger.child({
            'message.id': options.messageId,
            chunks: chunks.length,
            size: batchSize,
        });
        logger.info(`Sending status message to ${jids.length} participants`);
        let result = null;
        for (const [index, participants] of chunks.entries()) {
            const batchOptions = Object.assign({}, options);
            batchOptions.statusJidList = participants;
            const r = await this.sendStatusMessageOneChunk(message, batchOptions, logger, index);
            result = result || r;
        }
        logger.info(`Sending status message to ${jids.length} participants - success`);
        return result;
    }
    async sendStatusMessageOneChunk(message, options, logger, index) {
        const retryOptions = {
            retries: 5,
            minTimeout: 1000,
            maxTimeout: 6000,
        };
        try {
            const resp = await promiseRetry((retry, number) => {
                return this.sock
                    .sendMessage(status_dto_1.BROADCAST_ID, message, options)
                    .catch(retry);
            }, retryOptions);
            logger.info(`Sending status message (${index + 1} chunk) - success`);
            return resp;
        }
        catch (err) {
            logger.error(`Sending status message (${index + 1} chunk - failed`);
            logger.error(err, err.stack);
            throw err;
        }
    }
    async sendTextStatus(status) {
        var _a;
        const message = {
            text: status.text,
            linkPreview: this.getLinkPreview(status),
        };
        const jids = await this.prepareJidsForStatus(status.contacts);
        if (!status.id) {
            this.upsertMeInJIDs(jids);
        }
        const messageId = this.prepareMessageIdForStatus(status);
        const options = {
            backgroundColor: status.backgroundColor,
            font: status.font,
            linkPreviewHighQuality: status.linkPreviewHighQuality,
            messageId: messageId,
        };
        return await this.sendStatusMessage(message, options, jids, (_a = status.contacts) === null || _a === void 0 ? void 0 : _a.length);
    }
    async sendImageStatus(status) {
        var _a;
        const message = await this.fileToMessage(status.file, 'image', status.caption);
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.IMAGE;
        const jids = await this.prepareJidsForStatus(status.contacts);
        if (!status.id) {
            this.upsertMeInJIDs(jids);
        }
        const messageId = this.prepareMessageIdForStatus(status);
        const options = {
            messageId: messageId,
        };
        return await this.sendStatusMessage(message, options, jids, (_a = status.contacts) === null || _a === void 0 ? void 0 : _a.length);
    }
    async sendVoiceStatus(status) {
        var _a;
        const message = await this.fileToMessage(status.file, 'audio');
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.VOICE;
        if (status.convert) {
            message['audio'] = await this.mediaConverter.voice(message['audio']);
            message.mimetype = WAMimeType_1.WAMimeType.VOICE;
        }
        const jids = await this.prepareJidsForStatus(status.contacts);
        if (!status.id) {
            this.upsertMeInJIDs(jids);
        }
        const messageId = this.prepareMessageIdForStatus(status);
        const options = {
            backgroundColor: status.backgroundColor,
            messageId: messageId,
        };
        return await this.sendStatusMessage(message, options, jids, (_a = status.contacts) === null || _a === void 0 ? void 0 : _a.length);
    }
    async sendVideoStatus(status) {
        var _a;
        const message = await this.fileToMessage(status.file, 'video', status.caption);
        message.mimetype = message.mimetype || WAMimeType_1.WAMimeType.VIDEO;
        if (status.convert) {
            message['video'] = await this.mediaConverter.video(message['video']);
            message.mimetype = WAMimeType_1.WAMimeType.VIDEO;
        }
        const jids = await this.prepareJidsForStatus(status.contacts);
        if (!status.id) {
            this.upsertMeInJIDs(jids);
        }
        const messageId = this.prepareMessageIdForStatus(status);
        const options = {
            statusJidList: jids,
            messageId: messageId,
        };
        return await this.sendStatusMessage(message, options, jids, (_a = status.contacts) === null || _a === void 0 ? void 0 : _a.length);
    }
    prepareMessageIdForStatus(status) {
        if (status.id) {
            this.saveSentMessageId(status.id);
            return status.id;
        }
        return this.generateMessageID();
    }
    async prepareJidsForStatus(contacts) {
        let jids;
        if ((contacts === null || contacts === void 0 ? void 0 : contacts.length) > 0) {
            jids = contacts.map(jids_1.toJID);
        }
        else {
            jids = await this.fetchMyContactsJids();
        }
        return jids;
    }
    async fetchMyContactsJids() {
        const contacts = await this.store.getContacts({});
        const jids = contacts.map((contact) => contact.id);
        return jids.filter((jid) => jid.endsWith('@s.whatsapp.net'));
    }
    async deleteStatus(request) {
        var _a;
        const messageId = request.id;
        const key = (0, ids_1.parseMessageIdSerialized)(messageId, true);
        key.fromMe = true;
        key.remoteJid = status_dto_1.BROADCAST_ID;
        const jids = await this.prepareJidsForStatus(request.contacts);
        this.upsertMeInJIDs(jids);
        const newMessageId = this.generateMessageID();
        const options = {
            statusJidList: jids,
            messageId: newMessageId,
        };
        return await this.sendStatusMessage({ delete: key }, options, jids, (_a = request.contacts) === null || _a === void 0 ? void 0 : _a.length);
    }
    upsertMeInJIDs(jids) {
        var _a, _b, _c;
        if (!((_c = (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.authState) === null || _b === void 0 ? void 0 : _b.creds) === null || _c === void 0 ? void 0 : _c.me)) {
            return;
        }
        const myJID = (0, baileys_1.jidNormalizedUser)(this.sock.authState.creds.me.id);
        if (!jids.includes(myJID)) {
            jids.unshift(myJID);
        }
    }
    async searchChannelsByView(query) {
        const response = await this.client.searchChannelsByView(query);
        const channels = response.newsletters.map(this.toChannel.bind(this));
        return {
            page: response.page,
            channels: channels,
        };
    }
    async searchChannelsByText(query) {
        const response = await this.client.searchChannelsByText(query);
        const channels = response.newsletters.map(this.toChannel.bind(this));
        return {
            page: response.page,
            channels: channels,
        };
    }
    async previewChannelMessages(inviteCode, query) {
        const downloadMedia = query.downloadMedia;
        const updates = await this.sock.newsletterFetchPreviewMessages('invite', inviteCode, query.limit, null);
        const promises = [];
        for (const update of updates) {
            promises.push(this.NewsletterFetchedUpdateToChannelMessage(update, downloadMedia));
        }
        let result = await Promise.all(promises);
        result = result.filter(Boolean);
        return result;
    }
    async NewsletterFetchedUpdateToChannelMessage(update, downloadMedia) {
        let reactions = Object.fromEntries(update.reactions.map(({ code, count }) => [code, count]));
        reactions = (0, helpers_1.sortObjectByValues)(reactions) || {};
        const message = await this.processIncomingMessage(update.message, downloadMedia);
        return {
            message: message,
            reactions: reactions,
            viewCount: update.views,
        };
    }
    toChannel(newsletter) {
        var _a, _b;
        const role = ((_a = newsletter.viewer_metadata) === null || _a === void 0 ? void 0 : _a.role) ||
            ((_b = newsletter.viewer_metadata) === null || _b === void 0 ? void 0 : _b.view_role) ||
            channels_dto_1.ChannelRole.GUEST;
        const preview = newsletter.preview
            ? (0, session_abc_1.getPublicUrlFromDirectPath)(newsletter.preview)
            : null;
        const picture = newsletter.picture
            ? (0, session_abc_1.getPublicUrlFromDirectPath)(newsletter.picture)
            : null;
        return {
            id: newsletter.id,
            name: newsletter.name,
            description: newsletter.description,
            invite: (0, session_abc_1.getChannelInviteLink)(newsletter.invite),
            preview: preview || picture,
            picture: picture || preview,
            verified: newsletter.verification === 'VERIFIED',
            role: role,
            subscribersCount: newsletter.subscribers,
        };
    }
    async channelsList(query) {
        const newsletters = await this.sock.newsletterSubscribed();
        let channels = newsletters
            .map(noweb_newsletter_1.toNewsletterMetadata)
            .filter(Boolean)
            .map(this.toChannel);
        if (query.role) {
            channels = channels.filter((channel) => channel.role === query.role);
        }
        return channels;
    }
    async channelsCreateChannel(request) {
        const newsletter = await this.sock.newsletterCreate(request.name, request.description);
        const channel = this.toChannel((0, noweb_newsletter_1.toNewsletterMetadata)(newsletter));
        if (request.picture) {
            let file = request.picture;
            let picture;
            if (file.url) {
                file = file;
                picture = await esm_1.default.b.getStream({ url: file.url });
            }
            else if (file.data) {
                file = file;
                picture = Buffer.from(file.data, 'base64');
            }
            await this.sock.newsletterUpdatePicture(channel.id, picture);
        }
        return channel;
    }
    async channelsGetChannel(id) {
        const newsletter = await this.sock.newsletterMetadata('jid', id);
        return this.toChannel((0, noweb_newsletter_1.toNewsletterMetadata)(newsletter));
    }
    async channelsGetChannelByInviteCode(inviteCode) {
        const newsletter = await this.sock.newsletterMetadata('invite', inviteCode);
        return this.toChannel((0, noweb_newsletter_1.toNewsletterMetadata)(newsletter));
    }
    async channelsDeleteChannel(id) {
        return await this.sock.newsletterDelete(id);
    }
    async channelsFollowChannel(id) {
        return await this.sock.newsletterFollow(id);
    }
    async channelsUnfollowChannel(id) {
        return await this.sock.newsletterUnfollow(id);
    }
    async channelsMuteChannel(id) {
        return await this.sock.newsletterMute(id);
    }
    async channelsUnmuteChannel(id) {
        return await this.sock.newsletterUnmute(id);
    }
    subscribeEngineEvents2() {
        const all$ = new rxjs_1.Observable((subscriber) => {
            return this.sock.ev.process((events) => {
                for (const event in events) {
                    const data = events[event];
                    subscriber.next({ event: event, data: data });
                }
            });
        });
        this.events2.get(enums_dto_1.WAHAEvents.ENGINE_EVENT).switch(all$);
        const messagesUpsert$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'messages.upsert').pipe((0, operators_1.map)((event) => event.messages), (0, rxjs_1.mergeAll)(), (0, rxjs_1.filter)((msg) => this.jids.include(msg.key.remoteJid)), (0, rxjs_1.share)());
        let [messagesFromMe$, messagesFromOthers$] = (0, rxjs_1.partition)(messagesUpsert$, isMine);
        messagesFromMe$ = messagesFromMe$.pipe((0, rxjs_1.mergeMap)((msg) => this.processIncomingMessage(msg, true)), (0, rxjs_1.filter)(Boolean), (0, reactive_1.DistinctMessages)(), (0, rxjs_1.share)());
        messagesFromOthers$ = messagesFromOthers$.pipe((0, rxjs_1.mergeMap)((msg) => this.processIncomingMessage(msg, true)), (0, rxjs_1.filter)(Boolean), (0, reactive_1.DistinctMessages)(), (0, rxjs_1.share)());
        const messagesFromAll$ = (0, rxjs_1.merge)(messagesFromMe$, messagesFromOthers$);
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE).switch(messagesFromOthers$);
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE_ANY).switch(messagesFromAll$);
        const messagesRevoked$ = messagesUpsert$.pipe((0, rxjs_1.filter)((message) => {
            var _a, _b;
            return ((_b = (_a = message.message) === null || _a === void 0 ? void 0 : _a.protocolMessage) === null || _b === void 0 ? void 0 : _b.type) ===
                baileys_1.proto.Message.ProtocolMessage.Type.REVOKE;
        }), (0, rxjs_1.mergeMap)(async (message) => {
            var _a;
            const afterMessage = this.toWAMessage(message);
            const revokedMessageId = (_a = message.message.protocolMessage.key) === null || _a === void 0 ? void 0 : _a.id;
            return {
                after: afterMessage,
                before: null,
                revokedMessageId: revokedMessageId,
                _data: message,
            };
        }));
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE_REVOKED).switch(messagesRevoked$);
        const messagesEdited$ = messagesUpsert$.pipe((0, rxjs_1.filter)((message) => (0, pwa_1.IsEditedMessage)(message.message) ||
            (0, pwa_1.IsSecretEncryptedMessageEdit)(message.message)), (0, rxjs_1.mergeMap)(async (message) => {
            var _a, _b;
            const waMessage = this.toWAMessage(message);
            let body = '';
            let editedMessageId;
            if ((0, pwa_1.IsEditedMessage)(message.message)) {
                const content = (0, baileys_1.normalizeMessageContent)(message.message);
                body = extractBody(content.protocolMessage.editedMessage) || '';
                editedMessageId = (_a = content.protocolMessage.key) === null || _a === void 0 ? void 0 : _a.id;
            }
            else if ((0, pwa_1.IsSecretEncryptedMessageEdit)(message.message)) {
                const sem = message.message.secretEncryptedMessage;
                editedMessageId = (_b = sem.targetMessageKey) === null || _b === void 0 ? void 0 : _b.id;
                body =
                    (await this.tryDecryptNOWEBSecretMessageEdit(message, sem)) || '';
            }
            return Object.assign(Object.assign({}, waMessage), { body: body, editedMessageId: editedMessageId, _data: message });
        }));
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE_EDITED).switch(messagesEdited$);
        const messageReactions$ = messagesUpsert$.pipe((0, operators_1.map)(this.processMessageReaction.bind(this)), (0, rxjs_1.filter)(Boolean));
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE_REACTION).switch(messageReactions$);
        const messageUpdates$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'messages.update').pipe((0, rxjs_1.mergeAll)(), (0, rxjs_1.filter)((update) => this.jids.include(update.key.remoteJid)), (0, rxjs_1.share)());
        const messageAckDirect$ = messageUpdates$.pipe((0, rxjs_1.filter)(isMine), (0, rxjs_1.filter)(isAckUpdateMessageEvent), (0, operators_1.map)(this.convertMessageUpdateToMessageAck.bind(this)));
        const messageReceiptUpdate$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'message-receipt.update').pipe((0, rxjs_1.mergeAll)(), (0, rxjs_1.filter)((update) => this.jids.include(update.key.remoteJid)), (0, rxjs_1.share)());
        const messageAckGroups$ = messageReceiptUpdate$.pipe((0, rxjs_1.filter)(isMine), (0, operators_1.map)(this.convertMessageReceiptUpdateToMessageAck.bind(this)));
        const messageAckDirectFinal$ = messageAckDirect$.pipe((0, reactive_1.DistinctAck)());
        const messageAckGroupsFinal$ = messageAckGroups$.pipe((0, reactive_1.DistinctAck)());
        this.events2.get(enums_dto_1.WAHAEvents.MESSAGE_ACK).switch(messageAckDirectFinal$);
        this.events2
            .get(enums_dto_1.WAHAEvents.MESSAGE_ACK_GROUP)
            .switch(messageAckGroupsFinal$);
        this.events2
            .get(enums_dto_1.WAHAEvents.STATE_CHANGE)
            .switch((0, rxjs_1.fromEvent)(this.sock.ev, 'connection.update').pipe((0, rxjs_1.share)()));
        const groupsUpsert$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'groups.upsert').pipe((0, rxjs_1.mergeAll)(), (0, rxjs_1.share)());
        const groupsUpdate$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'groups.update').pipe((0, rxjs_1.mergeAll)(), (0, rxjs_1.share)());
        const groupsParticipantsUpdate$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'group-participants.update').pipe((0, rxjs_1.share)());
        this.events2.get(enums_dto_1.WAHAEvents.GROUP_JOIN).switch(groupsUpsert$);
        const groupV2Join$ = groupsUpsert$.pipe((0, operators_1.map)((group) => (0, groups_noweb_1.ToGroupV2JoinEvent)(group)));
        this.events2.get(enums_dto_1.WAHAEvents.GROUP_V2_JOIN).switch(groupV2Join$);
        const groupV2Update$ = (0, rxjs_1.merge)(groupsUpdate$).pipe((0, operators_1.map)(groups_noweb_1.ToGroupV2UpdateEvent));
        this.events2.get(enums_dto_1.WAHAEvents.GROUP_V2_UPDATE).switch(groupV2Update$);
        const groupV2Participants$ = groupsParticipantsUpdate$.pipe((0, operators_1.map)(groups_noweb_1.ToGroupV2Participants));
        this.events2
            .get(enums_dto_1.WAHAEvents.GROUP_V2_PARTICIPANTS)
            .switch(groupV2Participants$);
        const groupV2Leave$ = groupsParticipantsUpdate$.pipe((0, operators_1.map)((group) => { var _a, _b, _c; return (0, groups_noweb_1.ToGroupV2LeaveEvent)((_c = (_b = (_a = this.sock) === null || _a === void 0 ? void 0 : _a.authState) === null || _b === void 0 ? void 0 : _b.creds) === null || _c === void 0 ? void 0 : _c.me, group); }), (0, rxjs_1.filter)(Boolean));
        this.events2.get(enums_dto_1.WAHAEvents.GROUP_V2_LEAVE).switch(groupV2Leave$);
        this.events2.get(enums_dto_1.WAHAEvents.PRESENCE_UPDATE).switch((0, rxjs_1.fromEvent)(this.sock.ev, 'presence.update').pipe((0, rxjs_1.filter)((presence) => this.jids.include(presence.id)), (0, operators_1.map)((data) => this.toWahaPresences(data.id, data.presences)), (0, rxjs_1.share)()));
        this.events2
            .get(enums_dto_1.WAHAEvents.POLL_VOTE)
            .switch(messageUpdates$.pipe((0, rxjs_1.mergeMap)(this.handleMessagesUpdatePollVote.bind(this)), (0, rxjs_1.filter)(Boolean)));
        this.events2
            .get(enums_dto_1.WAHAEvents.POLL_VOTE_FAILED)
            .switch(messagesUpsert$.pipe((0, rxjs_1.mergeMap)(this.handleMessageUpsertPollVoteFailed.bind(this)), (0, rxjs_1.filter)(Boolean)));
        const calls$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'call');
        const call$ = calls$.pipe((0, rxjs_1.mergeMap)(rxjs_1.identity), (0, rxjs_1.filter)((call) => this.jids.include(call.groupJid || call.chatId)), (0, rxjs_1.share)());
        const acceptedCallIds = new Set();
        this.events2.get(enums_dto_1.WAHAEvents.CALL_RECEIVED).switch(call$.pipe((0, rxjs_1.filter)((call) => call.status === 'offer'), (0, operators_1.map)(this.toCallData.bind(this))));
        this.events2.get(enums_dto_1.WAHAEvents.CALL_ACCEPTED).switch(call$.pipe((0, rxjs_1.filter)((call) => call.status === 'accept'), (0, rxjs_1.tap)((call) => acceptedCallIds.add(call.id)), (0, operators_1.map)(this.toCallData.bind(this))));
        this.events2.get(enums_dto_1.WAHAEvents.CALL_REJECTED).switch(call$.pipe((0, rxjs_1.filter)((call) => call.status === 'reject' || call.status === 'terminate'), (0, exclude_1.exclude)((call) => {
            const shouldSkip = acceptedCallIds.has(call.id);
            if (call.status === 'terminate') {
                acceptedCallIds.delete(call.id);
            }
            return shouldSkip;
        }), (0, exclude_1.exclude)((call) => call.isGroup == null), (0, rxjs_1.groupBy)((call) => call.id || 'unknown'), (0, rxjs_1.mergeMap)((group$) => group$.pipe((0, operators_1.debounceTime)(1000), (0, rxjs_1.tap)((call) => acceptedCallIds.delete(call.id)))), (0, operators_1.map)(this.toCallData.bind(this))));
        const labelsEdit$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'labels.edit').pipe((0, rxjs_1.share)());
        this.events2.get(enums_dto_1.WAHAEvents.LABEL_UPSERT).switch(labelsEdit$.pipe((0, exclude_1.exclude)((data) => data.deleted), (0, operators_1.map)(this.toLabel.bind(this))));
        this.events2.get(enums_dto_1.WAHAEvents.LABEL_DELETED).switch(labelsEdit$.pipe((0, rxjs_1.filter)((data) => data.deleted), (0, operators_1.map)(this.toLabel.bind(this))));
        const labelsAssociation$ = (0, rxjs_1.fromEvent)(this.sock.ev, 'labels.association').pipe((0, rxjs_1.share)());
        const labelsAssociationAdd$ = labelsAssociation$.pipe((0, rxjs_1.filter)(({ type }) => type === 'add'), (0, operators_1.map)((data) => data.association), (0, rxjs_1.filter)((association) => association.type === LabelAssociation_1.LabelAssociationType.Chat));
        const labelsAssociationRemove$ = labelsAssociation$.pipe((0, rxjs_1.filter)(({ type }) => type === 'remove'), (0, operators_1.map)((data) => data.association), (0, rxjs_1.filter)((association) => association.type === LabelAssociation_1.LabelAssociationType.Chat));
        this.events2
            .get(enums_dto_1.WAHAEvents.LABEL_CHAT_ADDED)
            .switch(labelsAssociationAdd$.pipe((0, rxjs_1.mergeMap)(this.toLabelChatAssociation.bind(this))));
        this.events2
            .get(enums_dto_1.WAHAEvents.LABEL_CHAT_DELETED)
            .switch(labelsAssociationRemove$.pipe((0, rxjs_1.mergeMap)(this.toLabelChatAssociation.bind(this))));
    }
    listenContactsUpdatePictureProfile() {
        this.sock.ev.on('contacts.update', async (updates) => {
            for (const update of updates) {
                if (update.imgUrl !== 'changed') {
                    continue;
                }
                this.logger.debug({ jid: update.id }, 'Profile picture updated');
                const url = await this.refreshProfilePicture(update.id);
                if ((0, baileys_1.isPnUser)(update.id) || (0, jid_utils_1.isLidUser)(update.id)) {
                    const cus = (0, jids_1.toCusFormat)(update.id);
                    this.profilePictures.set(cus, url);
                    const phone = update.id.split('@')[0];
                    this.profilePictures.set(phone, url);
                }
            }
        });
    }
    processMessageReaction(message) {
        if (!message)
            return null;
        if (!message.message)
            return null;
        if (!message.message.reactionMessage)
            return null;
        const id = buildMessageId(message.key);
        const fromToParticipant = getFromToParticipant(message.key);
        const reactionMessage = message.message.reactionMessage;
        const messageId = buildMessageId(reactionMessage.key);
        const source = this.getMessageSource(message.key.id);
        const reaction = {
            id: id,
            timestamp: (0, utils_1.ensureNumber)(message.messageTimestamp),
            from: (0, jids_1.toCusFormat)(fromToParticipant.from),
            fromMe: message.key.fromMe,
            source: source,
            to: (0, jids_1.toCusFormat)(fromToParticipant.to),
            participant: (0, jids_1.toCusFormat)(fromToParticipant.participant),
            reaction: {
                text: reactionMessage.text,
                messageId: messageId,
            },
        };
        return reaction;
    }
    shouldProcessIncomingMessage(message) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (!message)
            return;
        if (!message.message && !((_a = message.key) === null || _a === void 0 ? void 0 : _a.isViewOnce))
            return;
        if ((_b = message.message) === null || _b === void 0 ? void 0 : _b.reactionMessage)
            return;
        if ((_c = message.message) === null || _c === void 0 ? void 0 : _c.pollUpdateMessage)
            return;
        if ((_e = (_d = message.message) === null || _d === void 0 ? void 0 : _d.call) === null || _e === void 0 ? void 0 : _e.callKey)
            return;
        if (((_g = (_f = message.message) === null || _f === void 0 ? void 0 : _f.protocolMessage) === null || _g === void 0 ? void 0 : _g.type) ===
            baileys_1.proto.Message.ProtocolMessage.Type.REVOKE)
            return;
        if ((0, pwa_1.IsEditedMessage)(message.message))
            return;
        if ((0, pwa_1.IsSecretEncryptedMessageEdit)(message.message))
            return;
        if ((0, pwa_1.IsHistorySyncNotification)(message.message))
            return;
        if (((_j = (_h = message.message) === null || _h === void 0 ? void 0 : _h.protocolMessage) === null || _j === void 0 ? void 0 : _j.type) ===
            baileys_1.proto.Message.ProtocolMessage.Type.EPHEMERAL_SYNC_RESPONSE)
            return;
        if (((_l = (_k = message.message) === null || _k === void 0 ? void 0 : _k.protocolMessage) === null || _l === void 0 ? void 0 : _l.type) ===
            baileys_1.proto.Message.ProtocolMessage.Type
                .PEER_DATA_OPERATION_REQUEST_RESPONSE_MESSAGE)
            return;
        const normalizedContent = (0, baileys_1.normalizeMessageContent)(message.message);
        const contentType = (0, baileys_1.getContentType)(normalizedContent);
        if (contentType == 'deviceSentMessage') {
            return;
        }
        const hasSomeContent = !!contentType;
        if (!hasSomeContent) {
            if ((_m = message === null || message === void 0 ? void 0 : message.message) === null || _m === void 0 ? void 0 : _m.senderKeyDistributionMessage)
                return;
        }
        return true;
    }
    async tryDecryptNOWEBSecretMessageEdit(editMessage, sem) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const targetKey = sem.targetMessageKey;
        const origMsgId = targetKey === null || targetKey === void 0 ? void 0 : targetKey.id;
        if (!origMsgId) {
            return '';
        }
        const editKey = editMessage.key;
        const jidsToTry = [
            targetKey.remoteJid,
            editKey === null || editKey === void 0 ? void 0 : editKey.remoteJid,
            editKey === null || editKey === void 0 ? void 0 : editKey.remoteJidAlt,
        ].filter(Boolean);
        let stored;
        for (const jid of jidsToTry) {
            stored = await ((_a = this.store) === null || _a === void 0 ? void 0 : _a.loadMessage(jid, origMsgId));
            if (stored) {
                break;
            }
        }
        if (!stored) {
            this.logger.debug({ origMsgId: origMsgId }, 'NOWEB message edit decrypt: original message not found in store');
            return '';
        }
        const secretBytes = (_d = (_c = (_b = (0, baileys_1.normalizeMessageContent)(stored.message)) === null || _b === void 0 ? void 0 : _b.messageContextInfo) === null || _c === void 0 ? void 0 : _c.messageSecret) !== null && _d !== void 0 ? _d : (_f = (_e = stored.message) === null || _e === void 0 ? void 0 : _e.messageContextInfo) === null || _f === void 0 ? void 0 : _f.messageSecret;
        if (!secretBytes || secretBytes.length !== 32) {
            this.logger.debug({ origMsgId: origMsgId }, 'NOWEB message edit decrypt: missing messageSecret on original');
            return '';
        }
        const origSecret = Buffer.from(secretBytes);
        const encPayload = sem.encPayload ? Buffer.from(sem.encPayload) : null;
        const encIv = sem.encIv ? Buffer.from(sem.encIv) : null;
        if (!encPayload || !encIv) {
            return '';
        }
        let modificationSenderJids;
        if (editKey === null || editKey === void 0 ? void 0 : editKey.fromMe) {
            modificationSenderJids = [(_h = (_g = this.sock) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.lid, (_k = (_j = this.sock) === null || _j === void 0 ? void 0 : _j.user) === null || _k === void 0 ? void 0 : _k.id];
        }
        else {
            const editJids = editKey ? (0, jids_1.jidsFromKey)(editKey) : null;
            modificationSenderJids = [
                (editKey === null || editKey === void 0 ? void 0 : editKey.participant) || (editKey === null || editKey === void 0 ? void 0 : editKey.remoteJid),
                editJids === null || editJids === void 0 ? void 0 : editJids.lid,
                editJids === null || editJids === void 0 ? void 0 : editJids.pn,
            ];
        }
        modificationSenderJids = lodash
            .chain(modificationSenderJids)
            .filter(Boolean)
            .map(secretEncryptedMessageEdit_1.jidToNonAD)
            .uniq()
            .value();
        if (modificationSenderJids.length === 0) {
            modificationSenderJids.push('');
        }
        const remoteNonAD = targetKey.remoteJid
            ? (0, secretEncryptedMessageEdit_1.jidToNonAD)(targetKey.remoteJid)
            : '';
        const participantNonAD = targetKey.participant
            ? (0, secretEncryptedMessageEdit_1.jidToNonAD)(targetKey.participant)
            : '';
        const attempts = new Map();
        for (const modificationSenderJid of modificationSenderJids) {
            const primaryOrigSenderJid = (0, secretEncryptedMessageEdit_1.getOrigSenderJidForMsgSecret)({ Chat: editKey === null || editKey === void 0 ? void 0 : editKey.remoteJid, Sender: modificationSenderJid }, {
                fromMe: targetKey.fromMe,
                remoteJID: targetKey.remoteJid,
                participant: targetKey.participant,
            });
            const origSenderJids = [
                primaryOrigSenderJid,
                remoteNonAD,
                participantNonAD,
            ].filter(Boolean);
            for (const origSenderJid of origSenderJids) {
                const attemptKey = `${origSenderJid}|${modificationSenderJid}`;
                attempts.set(attemptKey, {
                    origSenderJid: origSenderJid,
                    modificationSenderJid: modificationSenderJid,
                });
            }
        }
        let lastErr;
        for (const attempt of attempts.values()) {
            try {
                const decoded = (0, secretEncryptedMessageEdit_1.decryptSecretEncryptedMessageEditProto)({
                    encPayload: encPayload,
                    encIv: encIv,
                    origMsgId: origMsgId,
                    origSenderJid: attempt.origSenderJid,
                    modificationSenderJid: attempt.modificationSenderJid,
                    origMsgSecret: origSecret,
                });
                const text = extractBody(decoded) || '';
                if (text) {
                    return text;
                }
            }
            catch (err) {
                lastErr = err;
            }
        }
        this.logger.debug({
            err: lastErr,
            origMsgId: origMsgId,
            attempts: Array.from(attempts.keys()),
        }, 'NOWEB message edit decrypt: AES-GCM or protobuf decode failed');
        return '';
    }
    async processIncomingMessage(message, downloadMedia) {
        var _a;
        if (!this.shouldProcessIncomingMessage(message)) {
            return null;
        }
        const wamessage = this.toWAMessageSafe(message);
        if (!wamessage) {
            return null;
        }
        if (downloadMedia && wamessage.hasMedia) {
            wamessage.media = await this.downloadMediaSafe(message);
        }
        if (downloadMedia && ((_a = wamessage.replyTo) === null || _a === void 0 ? void 0 : _a.hasMedia)) {
            const mediaContent = (0, utils_1.extractMediaContent)(wamessage.replyTo._data);
            const m = {
                message: wamessage.replyTo._data,
                key: {
                    id: wamessage.replyTo.id ||
                        mediaContent.fileSha256 ||
                        mediaContent.fileEncSha256 ||
                        mediaContent.mediaKeyTimestamp,
                    remoteJid: message.key.remoteJid,
                },
            };
            wamessage.replyTo.media = await this.downloadMediaSafe(m);
        }
        return wamessage;
    }
    toWAMessageSafe(message) {
        try {
            return this.toWAMessage(message);
        }
        catch (error) {
            this.logger.error('Failed to process incoming message');
            this.logger.error(error);
            return null;
        }
    }
    toWAMessage(message) {
        var _a;
        const fromToParticipant = getFromToParticipant(message.key);
        const id = buildMessageId(message.key);
        const body = extractBody(message.message);
        const replyTo = this.extractReplyTo(message.message);
        const ack = message.ack || (0, acks_1.StatusToAck)(message.status);
        const mediaContent = (0, utils_1.extractMediaContent)(message.message);
        const source = this.getMessageSource(message.key.id);
        const waproto = message.message;
        return {
            id: id,
            timestamp: (0, utils_1.ensureNumber)(message.messageTimestamp),
            from: (0, jids_1.toCusFormat)(fromToParticipant.from),
            fromMe: message.key.fromMe,
            source: source,
            body: body || null,
            to: (0, jids_1.toCusFormat)(fromToParticipant.to),
            participant: (0, jids_1.toCusFormat)(fromToParticipant.participant),
            hasMedia: Boolean(mediaContent),
            media: null,
            mediaUrl: (_a = message.media) === null || _a === void 0 ? void 0 : _a.url,
            ack: ack,
            ackName: enums_dto_1.WAMessageAck[ack] || enums_dto_1.ACK_UNKNOWN,
            location: (0, locaiton_1.extractWALocation)(waproto),
            vCards: (0, vcards_1.extractVCards)(waproto),
            replyTo: replyTo,
            _data: message,
        };
    }
    extractReplyTo(message) {
        var _a;
        if (!message)
            return null;
        const msgType = (0, baileys_1.getContentType)(message);
        const contextInfo = (_a = message[msgType]) === null || _a === void 0 ? void 0 : _a.contextInfo;
        if (!contextInfo) {
            return null;
        }
        const quotedMessage = contextInfo.quotedMessage;
        if (!quotedMessage) {
            return null;
        }
        const body = extractBody(quotedMessage);
        const mediaContent = (0, utils_1.extractMediaContent)(quotedMessage);
        return {
            id: contextInfo.stanzaId,
            participant: (0, jids_1.toCusFormat)(contextInfo.participant),
            body: body,
            hasMedia: Boolean(mediaContent),
            media: null,
            _data: quotedMessage,
        };
    }
    toWAContact(contact) {
        contact.id = (0, jids_1.toCusFormat)(contact.id);
        contact.pushname = contact.notify;
        delete contact.notify;
        return contact;
    }
    convertMessageUpdateToMessageAck(event) {
        const message = event;
        const fromToParticipant = getFromToParticipant(message.key);
        const id = buildMessageId(message.key);
        const ack = (0, acks_1.StatusToAck)(message.update.status);
        const body = {
            id: id,
            from: (0, jids_1.toCusFormat)(fromToParticipant.from),
            to: (0, jids_1.toCusFormat)(fromToParticipant.to),
            participant: (0, jids_1.toCusFormat)(fromToParticipant.participant),
            fromMe: message.key.fromMe,
            ack: ack,
            ackName: enums_dto_1.WAMessageAck[ack] || enums_dto_1.ACK_UNKNOWN,
        };
        return body;
    }
    convertMessageReceiptUpdateToMessageAck(event) {
        var _a;
        const fromToParticipant = getFromToParticipant(event.key);
        const receipt = event.receipt;
        let ack;
        if (receipt.receiptTimestamp) {
            ack = enums_dto_1.WAMessageAck.SERVER;
        }
        else if (receipt.playedTimestamp) {
            ack = enums_dto_1.WAMessageAck.PLAYED;
        }
        else if (receipt.readTimestamp) {
            ack = enums_dto_1.WAMessageAck.READ;
        }
        const key = Object.assign({}, event.key);
        if (key.fromMe) {
            key.participant = (_a = this.getSessionMeInfo()) === null || _a === void 0 ? void 0 : _a.id;
        }
        else {
            key.participant = event.receipt.userJid;
        }
        const id = buildMessageId(key);
        const body = {
            id: id,
            from: (0, jids_1.toCusFormat)(fromToParticipant.from),
            to: (0, jids_1.toCusFormat)(fromToParticipant.to),
            participant: (0, jids_1.toCusFormat)(fromToParticipant.participant),
            fromMe: event.key.fromMe,
            ack: ack,
            ackName: enums_dto_1.WAMessageAck[ack] || enums_dto_1.ACK_UNKNOWN,
            _data: event,
        };
        return body;
    }
    async handleMessagesUpdatePollVote(event) {
        const { key, update } = event;
        const pollUpdates = update === null || update === void 0 ? void 0 : update.pollUpdates;
        if (!pollUpdates) {
            return;
        }
        const pollCreationMessageKey = key;
        const pkey = Object.assign({}, key);
        pkey.remoteJid = null;
        const pollCreationMessage = await this.getMessage(pkey);
        if (!pollCreationMessage) {
            this.logger.warn({ pollCreationMessageKey }, 'poll creation message not found, cannot aggregate votes');
            return;
        }
        for (const pollUpdate of pollUpdates) {
            const votes = (0, baileys_1.getAggregateVotesInPollMessage)({
                message: pollCreationMessage,
                pollUpdates: [pollUpdate],
            });
            const selectedOptions = [];
            for (const voteAggregation of votes) {
                for (const voter of voteAggregation.voters) {
                    if (voter === (0, baileys_1.getKeyAuthor)(pollUpdate.pollUpdateMessageKey)) {
                        selectedOptions.push(voteAggregation.name);
                    }
                }
            }
            const voteDestination = getDestination(pollUpdate.pollUpdateMessageKey);
            const pollVote = Object.assign(Object.assign({}, voteDestination), { selectedOptions: selectedOptions, timestamp: (0, utils_1.ensureNumber)(pollUpdate.senderTimestampMs) });
            const payload = {
                vote: pollVote,
                poll: getDestination(pollCreationMessageKey),
            };
            return payload;
        }
    }
    async handleMessageUpsertPollVoteFailed(message) {
        var _a;
        const pollUpdateMessage = (_a = message.message) === null || _a === void 0 ? void 0 : _a.pollUpdateMessage;
        if (!pollUpdateMessage) {
            return;
        }
        const pollCreationMessageKey = pollUpdateMessage.pollCreationMessageKey;
        const pkey = Object.assign({}, pollCreationMessageKey);
        pkey.remoteJid = null;
        const pollCreationMessage = await this.getMessage(pkey);
        if (pollCreationMessage) {
            return;
        }
        const pollUpdateMessageKey = message.key;
        const voteDestination = getDestination(pollUpdateMessageKey);
        const pollVote = Object.assign(Object.assign({}, voteDestination), { selectedOptions: [], timestamp: (0, utils_1.ensureNumber)(message.messageTimestamp) });
        const payload = {
            vote: pollVote,
            poll: getDestination(pollCreationMessageKey),
        };
        return payload;
    }
    toCallData(call) {
        const date = new Date(call.date);
        const timestamp = date.getTime() / 1000;
        return {
            id: call.id,
            from: (0, jids_1.toCusFormat)(call.from),
            timestamp: timestamp,
            isVideo: call.isVideo,
            isGroup: call.isGroup,
            _data: call,
        };
    }
    toWahaPresences(remoteJid, storedPresences) {
        const presences = [];
        for (const participant in storedPresences) {
            const data = storedPresences[participant];
            const lastKnownPresence = lodash.get(PresenceStatuses, data.lastKnownPresence, data.lastKnownPresence);
            const presence = {
                participant: (0, jids_1.toCusFormat)(participant),
                lastKnownPresence: lastKnownPresence,
                lastSeen: data.lastSeen || null,
            };
            presences.push(presence);
        }
        const chatId = (0, jids_1.toCusFormat)(remoteJid);
        return { id: chatId, presences: presences };
    }
    async downloadMediaSafe(message) {
        try {
            return await this.downloadMedia(message);
        }
        catch (e) {
            this.logger.error('Failed when tried to download media for a message');
            this.logger.error(e, e.stack);
        }
        return null;
    }
    async downloadMedia(message) {
        let processor = new NOWEBEngineMediaProcessor(this, this.loggerBuilder);
        processor = new LottieMediaProcessorWrapper_1.LottieMediaProcessorWrapper(processor, this.logger);
        return this.mediaManager.processMedia(processor, message, this.name);
    }
    async getMessageOptions(request) {
        const jid = (0, jids_1.toJID)(request.chatId);
        let quoted;
        if (request.reply_to) {
            const key = (0, ids_1.parseMessageIdSerialized)(request.reply_to, true);
            quoted = await this.store.loadMessage(jid, key.id);
        }
        const chat = await this.store.getChat(jid);
        const messageId = request.id ? request.id : this.generateMessageID();
        this.saveSentMessageId(messageId);
        return {
            quoted: quoted,
            ephemeralExpiration: chat === null || chat === void 0 ? void 0 : chat.ephemeralExpiration,
            messageId: messageId,
        };
    }
    getLinkPreview(request) {
        let linkPreview;
        switch (request.linkPreview) {
            case false:
                linkPreview = false;
                break;
            case true:
            default:
                linkPreview = undefined;
        }
        return linkPreview;
    }
    generateMessageID() {
        var _a;
        const id = (0, baileys_1.generateMessageIDV2)((_a = this.sock.user) === null || _a === void 0 ? void 0 : _a.id);
        this.saveSentMessageId(id);
        return id;
    }
}
exports.WhatsappSessionNoWebCore = WhatsappSessionNoWebCore;
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setProfileName", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setProfileStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setProfilePicture", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.CheckNumberStatusQuery]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "checkNumberStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "rejectCall", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageTextRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendText", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], WhatsappSessionNoWebCore.prototype, "deleteMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, chatting_dto_1.EditMessageRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "editMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageContactVcardRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendContactVCard", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessagePollRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendPoll", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageReplyRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "reply", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageImageRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendImage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageFileRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendFile", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageVoiceRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendVoice", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageVideoRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendVideo", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageLinkCustomPreviewRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendLinkCustomPreview", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_buttons_dto_1.SendButtonsRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendButtons", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_list_dto_1.SendListRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendList", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageLocationRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendLocation", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageForwardRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "forwardMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageLinkPreviewRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendLinkPreview", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.SendSeenRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendSeen", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.ChatRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "startTyping", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.ChatRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "stopTyping", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, chats_dto_1.ReadChatMessagesQuery]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "readChatMessages", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "pinMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "unpinMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageReactionRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setReaction", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [chatting_dto_1.MessageStarRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setStar", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Boolean]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "chatsPutArchive", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "chatsArchiveChat", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "chatsUnarchiveChat", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "chatsUnreadChat", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [labels_dto_1.LabelDTO]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "createLabel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [labels_dto_1.Label]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "updateLabel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [labels_dto_1.Label]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "deleteLabel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "putLabelsToChat", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, contacts_dto_1.ContactUpdateBody]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "upsertContact", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "fetchContactProfilePicture", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setGroupPicture", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "deleteGroupPicture", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [groups_dto_1.CreateGroupRequest]),
    __metadata("design:returntype", void 0)
], WhatsappSessionNoWebCore.prototype, "createGroup", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappSessionNoWebCore.prototype, "joinGroup", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WhatsappSessionNoWebCore.prototype, "joinInfoGroup", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "refreshGroups", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setInfoAdminsOnly", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setMessagesAdminsOnly", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setMemberAddMode", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "leaveGroup", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setDescription", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "setSubject", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "getInviteCode", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "revokeInviteCode", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, groups_dto_1.ParticipantsRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "addParticipants", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, groups_dto_1.ParticipantsRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "removeParticipants", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, groups_dto_1.ParticipantsRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "promoteParticipantsToAdmin", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, groups_dto_1.ParticipantsRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "demoteParticipantsToUser", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "subscribePresence", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Array, Number]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendStatusMessage", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [status_dto_1.TextStatus]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendTextStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [status_dto_1.ImageStatus]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendImageStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [status_dto_1.VoiceStatus]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendVoiceStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [status_dto_1.VideoStatus]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "sendVideoStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [status_dto_1.DeleteStatusRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "deleteStatus", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channels_dto_1.ChannelSearchByView]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "searchChannelsByView", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channels_dto_1.ChannelSearchByText]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "searchChannelsByText", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, channels_dto_1.PreviewChannelMessages]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "previewChannelMessages", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [channels_dto_1.CreateChannelRequest]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsCreateChannel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsGetChannelByInviteCode", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsDeleteChannel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsFollowChannel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsUnfollowChannel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsMuteChannel", null);
__decorate([
    (0, activity_1.Activity)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WhatsappSessionNoWebCore.prototype, "channelsUnmuteChannel", null);
function hasPath(url) {
    if (!url) {
        return false;
    }
    try {
        const urlObj = new URL(url);
        return urlObj.pathname !== '/';
    }
    catch (error) {
        return false;
    }
}
class NOWEBEngineMediaProcessor {
    constructor(session, loggerBuilder) {
        this.session = session;
        this.logger = loggerBuilder.child({
            name: NOWEBEngineMediaProcessor.name,
        });
    }
    hasMedia(message) {
        return Boolean((0, utils_1.extractMediaContent)(message.message));
    }
    getMessageId(message) {
        return message.key.id;
    }
    getChatId(message) {
        return (0, jids_1.toCusFormat)(message.key.remoteJid);
    }
    getMimetype(message) {
        const content = (0, utils_1.extractMediaContent)(message.message);
        return content.mimetype;
    }
    async getMediaBuffer(message) {
        var _a, e_1, _b, _c;
        const content = (0, utils_1.extractMediaContent)(message.message);
        const url = content.url;
        if (!hasPath(url)) {
            content.url = null;
        }
        if ((0, jids_1.isJidNewsletter)(message.key.remoteJid) && content.directPath) {
            content.url = null;
        }
        const stream = await (0, baileys_1.downloadMediaMessage)(message, 'stream', {}, {
            logger: this.logger,
            reuploadRequest: this.session.sock.updateMediaMessage,
        }).finally(() => {
            content.url = url;
        });
        const chunks = [];
        try {
            for (var _d = true, stream_1 = __asyncValues(stream), stream_1_1; stream_1_1 = await stream_1.next(), _a = stream_1_1.done, !_a; _d = true) {
                _c = stream_1_1.value;
                _d = false;
                const chunk = _c;
                chunks.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = stream_1.return)) await _b.call(stream_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return Buffer.concat(chunks);
    }
    getFilename(message) {
        var _a;
        const content = (0, baileys_1.extractMessageContent)(message.message);
        return ((_a = content === null || content === void 0 ? void 0 : content.documentMessage) === null || _a === void 0 ? void 0 : _a.fileName) || null;
    }
}
exports.NOWEBEngineMediaProcessor = NOWEBEngineMediaProcessor;
exports.ALL_JID = 'all@s.whatsapp.net';
function buildMessageId({ id, remoteJid, fromMe, participant, }) {
    const chatId = (0, jids_1.toCusFormat)(remoteJid);
    const parts = [fromMe || false, chatId, id];
    if (participant) {
        parts.push((0, jids_1.toCusFormat)(participant));
    }
    return parts.join('_');
}
function getId(object) {
    return object.id;
}
function isMine(message) {
    var _a;
    return (_a = message === null || message === void 0 ? void 0 : message.key) === null || _a === void 0 ? void 0 : _a.fromMe;
}
function isNotMine(message) {
    var _a;
    return !((_a = message === null || message === void 0 ? void 0 : message.key) === null || _a === void 0 ? void 0 : _a.fromMe);
}
function isAckUpdateMessageEvent(event) {
    return (event === null || event === void 0 ? void 0 : event.update.status) != null;
}
function getFromToParticipant(key) {
    const isGroupMessage = Boolean(key.participant);
    let participant;
    let to;
    if (isGroupMessage) {
        participant = key.participant;
        to = key.remoteJid;
    }
    const from = key.remoteJid;
    return {
        from: from,
        to: to,
        participant: participant,
    };
}
function getTo(key, meId = undefined) {
    const isGroupMessage = Boolean(key.participant);
    if (isGroupMessage) {
        return key.remoteJid;
    }
    if (key.fromMe) {
        return key.remoteJid;
    }
    return meId || 'me';
}
function getFrom(key, meId) {
    const isGroupMessage = Boolean(key.participant);
    if (isGroupMessage) {
        return key.participant;
    }
    if (key.fromMe) {
        return meId || 'me';
    }
    return key.remoteJid;
}
function getDestination(key, meId = undefined) {
    return {
        id: buildMessageId(key),
        to: (0, jids_1.toCusFormat)(getTo(key, meId)),
        from: (0, jids_1.toCusFormat)(getFrom(key, meId)),
        fromMe: key.fromMe,
    };
}
function extractBody(message) {
    var _a, _b, _c, _d, _e;
    if (!message) {
        return null;
    }
    const content = (0, baileys_1.extractMessageContent)(message);
    if (!content) {
        return null;
    }
    let body = content.conversation || null;
    if (!body) {
        body = (_a = content.extendedTextMessage) === null || _a === void 0 ? void 0 : _a.text;
    }
    if (!body) {
        const mediaContent = (0, utils_1.extractMediaContent)(content);
        body = mediaContent === null || mediaContent === void 0 ? void 0 : mediaContent.caption;
    }
    if (!body && ((_b = content.protocolMessage) === null || _b === void 0 ? void 0 : _b.editedMessage)) {
        body = extractBody(content.protocolMessage.editedMessage);
    }
    if (!body && ((_c = content.associatedChildMessage) === null || _c === void 0 ? void 0 : _c.message)) {
        body = extractBody(content.associatedChildMessage.message);
    }
    if (!body) {
        body = (_d = content.templateButtonReplyMessage) === null || _d === void 0 ? void 0 : _d.selectedDisplayText;
    }
    if (!body) {
        body = (_e = content.buttonsResponseMessage) === null || _e === void 0 ? void 0 : _e.selectedDisplayText;
    }
    if (!body) {
        const type = (0, baileys_1.getContentType)(content);
        if (type == 'listMessage') {
            const list = content.listMessage;
            const parts = [list.title, list.description, list.footerText];
            body = parts.filter(Boolean).join('\n');
        }
        else if (type === 'listResponseMessage') {
            const response = content.listResponseMessage;
            const parts = [response.title, response.description];
            body = parts.filter(Boolean).join('\n');
        }
    }
    return body;
}
//# sourceMappingURL=session.noweb.core.js.map