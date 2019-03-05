'use strict';

import IconConstants from 'constants/IconConstants';
import AccessConstants from 'constants/AccessConstants';

import { FeedItem } from '../types';

import * as UI from 'types/ui';
import { SearchActions } from 'actions/reflux/SearchActions';


interface RSSItemData {
  entry: FeedItem;
  feedUrl: string;
}

const hasLink = ({ entry }: RSSItemData) => !!entry.link;

const getLocation = (href: string) => {
  var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
  return match && {
    protocol: match[1],
    host: match[2],
    hostname: match[3],
    port: match[4],
    pathname: match[5],
    search: match[6],
    hash: match[7]
  };
};


const handleOpenLink: UI.ActionHandler<RSSItemData> = ({ data }) => {
  const { entry, feedUrl } = data;
  let link: string | undefined;

  if (typeof entry.link === 'string') {
    link = entry.link;
  } else if (entry.link && entry.link.href && entry.link.href.length > 2) {
    link = entry.link.href;

    if (entry.link.href[0] === '/' && entry.link.href[1] !== '/') {
      // Relative paths, add the base URL (at least Github seems to use these)
      const urlLocation = getLocation(feedUrl);
      if (urlLocation) {
        link = urlLocation.protocol + '//' + urlLocation.host + link;
      }
    }
  }

  window.open(link);
};

const handleSearch: UI.ActionHandler<RSSItemData> = ({ data, location }) => {
  const item = {
    itemInfo: {
      name: data.entry.title,
    },
  };

  return SearchActions.search(item, location);
};


export const RSSActions: UI.ActionListType<RSSItemData> = {
  openLink: {
    displayName: 'Open link',
    icon: IconConstants.OPEN,
    filter: hasLink,
    handler: handleOpenLink,
  },
  search: {
    displayName: 'Search',
    access: AccessConstants.SEARCH,
    icon: IconConstants.SEARCH,
    handler: handleSearch,
  }
};

export default RSSActions;