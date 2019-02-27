import * as API from 'types/api';


export type DownloadHandler<ItemT extends DownloadableItemInfo> = (
  itemInfo: ItemT, 
  user: API.HintedUserBase | undefined, 
  downloadData: API.DownloadData
) => void;

export interface DownloadableItemInfo {
  id: API.IdType;
  name: string;
  tth: string;
  size: number;
  type: API.FileItemType;
  path: string;
  dupe: API.Dupe;
}

export interface DownloadableItemData<ItemT extends DownloadableItemInfo = DownloadableItemInfo> {
  itemInfo: ItemT;
  user: API.HintedUser;
  handler: DownloadHandler<ItemT>;
}