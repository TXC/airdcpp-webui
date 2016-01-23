import React from 'react';

import LinkConstants from 'constants/LinkConstants';
import Message from 'components/semantic/Message';


const DemoIntro = () => {
	if (process.env.DEMO_MODE !== '1') {
		return <span/>;
	}

	return (
			<Message 
				title="Welcome to AirDC++ Web Demo"
				description={ (
					<div className="demo-message">
						<p>
							Edit permissions are limited in order to keep the content somewhat persistent.
						</p>
						<p>
							Note that this is a locally installed application that is usually run by a single user. 
							Most changes, such as browsing of filelists, are propagated to all active sessions.
						</p>
						<p>
							Please visit the <a href={ LinkConstants.HOME_PAGE_URL } target="_blank">home page</a> for more information about the client and its features.
						</p>
					</div>
				) }
			/>
	);
};

export default DemoIntro;