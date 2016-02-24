import React from 'react';

import Promise from 'utils/Promise';
import { Lifecycle } from 'react-router';

import AccessConstants from 'constants/AccessConstants';
import LoginStore from 'stores/LoginStore';


const SettingPageMixin = function () {
	const refs = Array.prototype.slice.call(arguments);

	const Mixin = {
		mixins: [ Lifecycle ],
		propTypes: {
			onSettingsChanged: React.PropTypes.func,
			location: React.PropTypes.object,
		},

		contextTypes: {
			onSettingsChanged: React.PropTypes.func,
			routerLocation: React.PropTypes.object,
		},

		childContextTypes: {
			onSettingsChanged: React.PropTypes.func.isRequired,
			routerLocation: React.PropTypes.object.isRequired
		},

		componentWillMount() {
			this.changedProperties = new Set();
		},

		getChildContext() {
			return {
				onSettingsChanged: this.onSettingsChangedInternal,
				routerLocation: this.context.routerLocation || this.props.location,
			};
		},

		save() {
			const promises = refs.map(ref => this.refs[ref].save());
			this.changedProperties.clear();

			return Promise.all(promises);
		},

		onSettingsChangedInternal(id, value, hasChanges) {
			if (this.context.onSettingsChanged) {
				// Only the topmost mixin keeps track of changed settings
				this.context.onSettingsChanged(id, value, hasChanges);
				return;
			}

			if (hasChanges) {
				this.changedProperties.add(...id);
			} else {
				this.changedProperties.delete(...id);
			}

			this.props.onSettingsChanged(this.changedProperties.size > 0);
		},

		routerWillLeave(nextLocation) {
			if (this.changedProperties.size > 0 && LoginStore.hasAccess(AccessConstants.SETTINGS_EDIT)) {
				return 'You have unsaved changes. Are you sure you want to leave?';
			}

			return null;
		},
	};

	return Mixin;
};

export default SettingPageMixin;