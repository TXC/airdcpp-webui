import Reflux from 'reflux';

import { default as EventConstants, SeverityEnum } from 'constants/EventConstants';
import { EventActions } from 'actions/EventActions';

import { LogMessageUrgencies } from 'constants/UrgencyConstants';
import UrgencyUtils from 'utils/UrgencyUtils';

import SocketSubscriptionDecorator from 'decorators/SocketSubscriptionDecorator';
import AccessConstants from 'constants/AccessConstants';
import MessageUtils from 'utils/MessageUtils';


const EventStore = Reflux.createStore({
	listenables: EventActions,
	init: function () {
		this._logMessages = undefined;
		this._info = undefined;
		this._active = false;
	},

	getInitialState: function () {
		return this._logMessages;
	},

	onSetActive(active) {
		this._active = active;
	},

	onFetchMessagesCompleted: function (cacheMessages) {
		this._logMessages = MessageUtils.mergeCacheMessages(cacheMessages, this._logMessages);;
		this.trigger(this._logMessages);
	},

	onFetchInfoCompleted: function (data) {
		this.onLogInfo(data);
	},

	onLogMessage: function (data) {
		if (!this._info || data.severity === SeverityEnum.NOTIFY) {
			return;
		}

		this._logMessages = MessageUtils.pushMessage(data, this._logMessages);
		this.trigger(this._logMessages);
	},

	onLogInfo: function (newInfo) {
		if (this._active) {
			newInfo = MessageUtils.checkUnread(newInfo, EventActions);
		}

		this._logMessages = MessageUtils.checkSplice(this._logMessages, newInfo.total_messages);
		this._info = newInfo;

		this.trigger(this._logMessages);
	},

	getTotalUrgencies() {
		if (!this._info) {
			return null;
		}

		return UrgencyUtils.toUrgencyMap(this._info.unread_messages, LogMessageUrgencies);
	},

	get logMessages() {
		return this._logMessages;
	},

	onSocketConnected(addSocketListener) {
		const url = EventConstants.MODULE_URL;
		addSocketListener(url, EventConstants.MESSAGE, this.onLogMessage);
		addSocketListener(url, EventConstants.COUNTS, this.onLogInfo);
	},

	onSocketDisconnected() {
		this._logMessages = undefined;
	},
});

export default SocketSubscriptionDecorator(EventStore, AccessConstants.EVENTS_VIEW);
