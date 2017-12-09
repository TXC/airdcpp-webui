import React, { Fragment } from 'react';
import Icon from './Icon';

const MenuSection = ({ caption, icon, children }) => {
  if (React.Children.count(children) === 0) {
    return null;
  }
  
  return (
    <Fragment>
      { caption && (
        <div className="header">
          { !!icon ? caption : (
            <Fragment>    
              <Icon icon={ icon }/>
              { caption }
            </Fragment>
          ) }
        </div>
      ) }
      { children }
    </Fragment> 
  );
};

export default MenuSection;