import React from 'react';
import SocketService from 'services/SocketService';
import SocketSubscriptionMixin from 'mixins/SocketSubscriptionMixin';

import Button from 'components/semantic/Button';
import Loader from 'components/semantic/Loader';

import { CONNECTIVITY_MODULE_URL, CONNECTIVITY_STATUS_URL, CONNECTIVITY_DETECT_URL, CONNECTIVITY_STARTED, CONNECTIVITY_FINISHED } from 'constants/ConnectivityConstants';

const formatStatus = (status) => {
	let ret = status.text;
	if (status.auto_detect) {
		ret += ' (auto detected)';
	} else {
		ret += ' (manual configuration)';
	}

	return ret;
};

const StatusRow = ({ title, status, running, detect }) => (
	<div className="ui row">
		<div className="three wide column">
			<div className="ui tiny header">
			{ title }
			</div>
		</div>
		<div className="twelve wide column">
			{ (running ? 'Detecting...' : formatStatus(status)) }
		</div>
	</div>
);

const DetectPanel = React.createClass({
	mixins: [ SocketSubscriptionMixin() ],
	onSocketConnected(addSocketListener) {
		addSocketListener(CONNECTIVITY_MODULE_URL, CONNECTIVITY_STARTED, this.onDetectStarted);
		addSocketListener(CONNECTIVITY_MODULE_URL, CONNECTIVITY_FINISHED, this.onDetectFinished);
	},

	getInitialState() {
		return {
			status: null
		};
	},

	componentDidMount() {
		this.updateStatus();
	},

	onStatusReceived(data) {
		this.setState({ status: data });
	},

	onDetectStarted(data) {
		this.setProtocolDetectState(data.v6, true);
	},

	onDetectFinished(data) {
		this.setProtocolDetectState(data.v6, false);
		this.updateStatus();
	},

	setProtocolDetectState(v6, enabled) {
		const value = 'detecting' + (v6 ? 'V6' : 'V4');
		this.setState({ [value]: enabled });
	},

	updateStatus() {
		SocketService.get(CONNECTIVITY_STATUS_URL)
			.then(this.onStatusReceived)
			.catch(error => 
				console.error('Failed to get status: ' + error)
			);
	},

	handleDetect() {
		SocketService.post(CONNECTIVITY_DETECT_URL)
			.then(this.onSettingsReceived)
			.catch(error => 
				console.error('Failed to start detection: ' + error)
			);
	},

	render() {
		const { status } = this.state;
		if (!status) {
			return <Loader text="Loading detection status"/>;
		}

		return (
			<div className="ui segment detect-panel">
				<h3 className="header">Current auto detection status</h3>
				<div className="ui grid two column detect-grid">
					<StatusRow title="IPv4 connectivity" status={status.status_v4} running={this.state.detectingV4}/>
					<StatusRow title="IPv6 connectivity" status={status.status_v6} running={this.state.detectingV6}/>
				</div>
				<Button 
					className="detect-button"
					caption="Detect now"
					icon={ "gray configure" } 
					disabled={ !status.status_v4.auto_detect && !status.status_v6.auto_detect }
					loading={ this.state.detectingV6 || this.state.detectingV4 } 
					onClick={this.handleDetect}
				/>
			</div>
		);
	}
});

export default DetectPanel;