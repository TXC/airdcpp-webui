'use strict';
import React from 'react';

import StatisticsIcons from 'components/main/navigation/icon/StatisticsIcons';
//import PerformanceTools from './icon/PerformanceTools';
import AwayIcon from 'components/main/navigation/icon/AwayIcon';


const IconPanel: React.FC = () => (
  <div className="icon-panel">
    <StatisticsIcons/>
    <div className="touch-icons">
      <AwayIcon/>
      {/* process.env.NODE_ENV !== 'production' ? <PerformanceTools/> : null */}
    </div>
  </div>
);

export default IconPanel;
