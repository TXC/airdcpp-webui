import PropTypes from 'prop-types';
import React from 'react';

import classNames from 'classnames';
import DownloadableItemActions from 'actions/DownloadableItemActions';
import { ActionMenuDecoratorChildProps, ActionMenuDecoratorProps } from 'decorators/menu/ActionMenuDecorator';


type DownloadHandlerType = () => void;

interface DownloadMenuItemData {
  handler: DownloadHandlerType;
}

interface DownloadMenuDecoratorProps extends ActionMenuDecoratorChildProps {
  user: any;
  itemInfoGetter: () => any;
  downloadHandler: DownloadHandlerType;
  caption: React.ReactNode;
  className?: string;
}

type DownloadMenuDecoratorChildProps = ActionMenuDecoratorProps;

export default function (Component: React.ComponentType<DownloadMenuDecoratorChildProps>) {
  class DownloadMenu extends React.PureComponent<DownloadMenuDecoratorProps> {
    static propTypes = {

      /**
       * Target user
       */
      user: PropTypes.object.isRequired,
  
      /**
       * Context-specific item data getter
       */
      itemInfoGetter: PropTypes.func.isRequired,
  
      /**
       * Context-specific item data getter
       */
      downloadHandler: PropTypes.func.isRequired,
    };

    itemData: DownloadMenuItemData;
    constructor(props: DownloadMenuDecoratorProps) {
      super(props);

      this.itemData = { 
        handler: props.downloadHandler,
      };

      // Since table cells are recycled, the same menu can be re-used for different items
      // as it's not necessarily re-rendered due to performance reasons
      // Use getters so that we get data for the current cell
      Object.defineProperty(this.itemData, 'user', {
        get: () => {
          return this.props.user;
        }
      });

      Object.defineProperty(this.itemData, 'itemInfo', {
        get: () => {
          return this.props.itemInfoGetter();
        }
      });
    }

    itemDataGetter = () => {
      return this.itemData;
    }

    render() {
      const { caption, className, ...other } = this.props;
      return (
        <Component 
          className={ classNames('download', className) }
          caption={ caption } 
          actions={ DownloadableItemActions }
          itemData={ this.itemDataGetter } 
          { ...other }
        />
      );
    }
  };

  return DownloadMenu;
}
