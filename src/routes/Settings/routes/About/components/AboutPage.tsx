'use strict';

import React from 'react';

import Moment from 'moment';

import { Row, Header } from 'components/semantic/Grid';

import LoginStore from 'stores/LoginStore';
import StatisticsDecorator, { StatisticsDecoratorChildProps } from 'decorators/StatisticsDecorator';
import SystemConstants from 'constants/SystemConstants';
import { formatRelativeTime } from 'utils/ValueFormat';
import InstallPrompt from 'components/InstallPrompt';
import { SettingSectionChildProps } from 'routes/Settings/components/SettingSection';
import LinkConstants from 'constants/LinkConstants';
import ExternalLink from 'components/ExternalLink';


interface AboutPageProps extends SettingSectionChildProps {

}

class AboutPage extends React.Component<AboutPageProps & StatisticsDecoratorChildProps<any>> {
  render() {
    const { stats, moduleT } = this.props;
    const { translate } = moduleT;
    const systemInfo = LoginStore.systemInfo;

    const buildDate = Moment(new Date(JSON.parse(UI_BUILD_DATE))).format('LLL');

    return (
      <>
        <div className="ui grid two column">
          <Row title={ translate('Application version') } text={ systemInfo.client_version }/>
          <Row title={ translate('Web UI version') } text={ UI_VERSION }/>
          <Row title={ translate('Web UI build date') } text={ buildDate }/>
          <Row title={ translate('API version') } text={ systemInfo.api_version }/>
          <Row title={ translate('API feature level') } text={ systemInfo.api_feature_level }/>
          <Row title={ translate('Started') } text={ formatRelativeTime(systemInfo.client_started) }/>
          <Row title={ translate('Active sessions') } text={ stats.active_sessions }/>
          <Row title={ translate('Server threads') } text={ stats.server_threads }/>

          <Header title={ translate('Resources') }/>
          <Row
            title={ 
              <ExternalLink url={ LinkConstants.HOME_PAGE_URL }>
                { translate('Home page') }
              </ExternalLink>
            }
            noText={ true }
          />
          <Row
            title={               
              <ExternalLink url={ LinkConstants.HELP_URL }>
                { translate('Documentation') }
              </ExternalLink> 
            }
            noText={ true }
          />
          <Row
            title={               
              <ExternalLink url={ LinkConstants.ISSUE_TRACKER_URL }>
                { translate('Feature request/bug tracker') }
              </ExternalLink> 
            }
            noText={ true }
          />
        </div>
        <InstallPrompt alwaysShow={ true }/>
      </>
    );
  }
}

export default StatisticsDecorator(AboutPage, SystemConstants.STATS_URL, null, 5);
