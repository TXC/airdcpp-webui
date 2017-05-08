import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import UserActions from 'actions/UserActions';
import FileUtils from 'utils/FileUtils';

import UserIcon from 'components/icon/UserIcon';

export default function (Component) {
	const UserMenu = ({ text, userIcon, directory, user, className, ...other }) => {
		let nicks = text;
		if (!nicks) {
			nicks = user.nicks ? user.nicks : user.nick;
		}

		let caption = nicks;
		if (userIcon) {
			caption = (
				<div className={ classNames('icon-caption', userIcon) }>
					{ userIcon === 'simple' ? <i className="blue user icon"/> : <UserIcon size="large" flags={ user.flags }/> }
					{ nicks }
				</div>
			);
		}

		const data = {
			user: user,
			directory: FileUtils.getFilePath(directory)
		};

		return (
			<Component 
				{ ...other }
				className={ classNames('user-menu', className) }
				caption={ caption } 
				actions={ UserActions } 
				itemData={ data }
			/>
		);
	};

	UserMenu.defaultProps = {
		directory: '/',
	};

	UserMenu.propTypes = {
		/**
		 * Filelist directory to use for browsing the list
		 */
		directory: PropTypes.string,

		/**
		 * Hinted user
		 */
		user: PropTypes.shape({
			cid: PropTypes.string,
			hub_url: PropTypes.string
		}).isRequired,

		/**
		 * No icon is added by default
		 * Set the 'simple' to use a single color icon for all users
		 */
		userIcon: PropTypes.oneOfType([
			PropTypes.bool,
			PropTypes.string,
		]),

		/**
		 * Optional custom caption to use
		 */
		text : PropTypes.node,
	};

	return UserMenu;
}
