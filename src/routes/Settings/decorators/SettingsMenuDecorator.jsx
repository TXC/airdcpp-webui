'use strict';
import React from 'react';

import { RouterMenuItemLink } from 'components/semantic/MenuItem';
import LoginStore from 'stores/LoginStore';


const sectionToUrl = (section, parent) => {
	if (typeof parent === 'object') {
		return '/settings/' + parent.url + '/' + section;
	}

	return '/settings/' + section;
};

export default (Component) => {
	const MenuDecorator = React.createClass({
		contextTypes: {
			router: React.PropTypes.object.isRequired
		},

		propTypes: {
			parent: React.PropTypes.object,
			menuItems: React.PropTypes.array, // required
			advancedMenuItems: React.PropTypes.array,
			location: React.PropTypes.object, // required
		},

		checkChildren(props) {
			if (!props.children) {
				this.context.router.replace({
					pathname: sectionToUrl(props.menuItems[0].url, props.parent)
				});
			}
		},

		componentWillMount() {
			this.checkChildren(this.props);
		},

		componentWillReceiveProps(nextProps) {
			this.checkChildren(nextProps);
		},

		isItemActive(item) {
			const { location, parent } = this.props;
			return location.pathname.indexOf(sectionToUrl(item.url, parent)) === 0;
		},

		findMenuItem(menuItems) {
			if (!menuItems) {
				return null;
			}

			return menuItems.find(this.isItemActive);
		},

		getMenuItem(obj, parent, showIcon) {
			if (obj.access && !LoginStore.hasAccess(obj.access)) {
				return null;
			}

			let url = sectionToUrl(obj.url, parent);

			// Browsing is smoother when the child page is loaded directly
			// Don't use the child URL for currently active parent so that the route is detected as active correctly
			if (obj.menuItems && this.props.location.pathname.indexOf(url) !== 0) {
				url = sectionToUrl(obj.menuItems[0].url, obj);
			}

			return (
				<RouterMenuItemLink 
					key={ url } 
					url={ url } 
					icon={ obj.icon ? ('green ' + obj.icon) : null }
				>
					{ obj.title }
				</RouterMenuItemLink>
			);
		},

		render() {
			const currentMenuItem = this.findMenuItem(this.props.menuItems) || this.findMenuItem(this.props.advancedMenuItems);
			if (!currentMenuItem) {
				return null;
			}

			return (
				<Component 
					{ ...this.props } 
					currentMenuItem={ currentMenuItem } 
					menuItemToLink={ this.getMenuItem }
				/>
			);
		},
	});

	return MenuDecorator;
};
