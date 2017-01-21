'use strict';
import Reflux from 'reflux';
import { default as QueueConstants, StatusEnum } from 'constants/QueueConstants';
import SocketService from 'services/SocketService';
import History from 'utils/History';

import AccessConstants from 'constants/AccessConstants';
import IconConstants from 'constants/IconConstants';
import { PriorityEnum } from 'constants/PriorityConstants';
import OverlayConstants from 'constants/OverlayConstants';

import ConfirmDialog from 'components/semantic/ConfirmDialog';

import DownloadableItemActions from 'actions/DownloadableItemActions';
import NotificationActions from 'actions/NotificationActions';


const bundleValidationFailed = bundle => bundle.status.id === StatusEnum.COMPLETION_VALIDATION_ERROR;
const itemNotFinished = item => item.time_finished === 0;
const isDirectoryBundle = bundle => bundle.type.id === 'directory';
const hasSources = bundle => bundle.sources.total > 0 && itemNotFinished(bundle);


export const QueueActions = Reflux.createActions([
	{ 'search': { 
		asyncResult: true,
		access: AccessConstants.SEARCH, 
		displayName: 'Search (foreground)', 
		icon: IconConstants.SEARCH,
	} },
	{ 'searchBundleAlternates': { 
		asyncResult: true,
		access: AccessConstants.QUEUE_EDIT, 
		displayName: 'Search for alternates', 
		icon: IconConstants.SEARCH_ALTERNATES,
		filter: itemNotFinished,
	} },
	{ 'setBundlePriority': { 
		asyncResult: true,
	} },
	{ 'removeBundle': { 
		asyncResult: true, 
		children: [ 'confirmed' ], 
		displayName: 'Remove',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.REMOVE,
	} },
	{ 'removeCompleted': { 
		asyncResult: true,
		access: AccessConstants.QUEUE_EDIT, 
		displayName: 'Remove completed bundles', 
		icon: IconConstants.REMOVE,
	} },
	{ 'removeBundleSource': { 
		asyncResult: true,
		access: AccessConstants.QUEUE_EDIT, 
		displayName: 'Remove source', 
		icon: IconConstants.REMOVE,
	} },
	{ 'pause': { 
		asyncResult: true, 
		displayName: 'Pause all bundles',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.PAUSE,
	} },
	{ 'resume': { 
		asyncResult: true, 
		displayName: 'Resume all bundles',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.PLAY,
	} },
	{ 'rescan': { 
		asyncResult: true, 
		displayName: 'Rescan for errors',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.REFRESH,
		filter: bundleValidationFailed,
	} },
	{ 'forceShare': { 
		asyncResult: true, 
		displayName: 'Force in share',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.ERROR,
		filter: bundleValidationFailed,
	} },
	{ 'searchFileAlternates': { 
		asyncResult: true,
		access: AccessConstants.QUEUE_EDIT, 
		displayName: 'Search for alternates', 
		icon: IconConstants.SEARCH_ALTERNATES,
		filter: itemNotFinished,
	} },
	{ 'setFilePriority': { 
		asyncResult: true,
	} },
	{ 'removeFile': { 
		asyncResult: true, 
		children: [ 'confirmed' ], 
		displayName: 'Remove',
		access: AccessConstants.QUEUE_EDIT,
		icon: IconConstants.REMOVE,
	} },
	{ 'removeSource': { 
		asyncResult: true,
	} },
	{ 'sources': { 
		asyncResult: false,
		displayName: 'Manage sources...', 
		icon: IconConstants.USER,
		filter: hasSources,
	} },
	{ 'content': { 
		asyncResult: false,
		displayName: 'Manage files...', 
		icon: IconConstants.FILE,
		filter: isDirectoryBundle,
	} },
]);

const setBundlePriorities = (prio, action) => {
	return SocketService.post(QueueConstants.BUNDLES_URL + '/priority', { priority: prio })
		.then(() => 
			action.completed())
		.catch((error) => 
			action.failed(error)
		);
};

const shareBundle = (bundle, skipValidation, action) => {
	return SocketService.post(QueueConstants.BUNDLES_URL + '/' + bundle.id + '/share', { 
		skip_validation: skipValidation, 
	})
		.then(() => 
			action.completed(bundle))
		.catch((error) => 
			action.failed(error, bundle)
		);
};


QueueActions.setBundlePriority.listen(function (bundle, priority) {
	let that = this;
	return SocketService.post(QueueConstants.BUNDLES_URL + '/' + bundle.id + '/priority', {
		priority
	})
		.then(that.completed)
		.catch(that.failed);
});

QueueActions.pause.listen(function () {
	setBundlePriorities(PriorityEnum.PAUSED_FORCED, QueueActions.pause);
});

QueueActions.resume.listen(function () {
	setBundlePriorities(PriorityEnum.DEFAULT, QueueActions.pause);
});

QueueActions.rescan.listen(function (bundle) {
	shareBundle(bundle, false, QueueActions.rescan);
});

QueueActions.forceShare.listen(function (bundle) {
	shareBundle(bundle, true, QueueActions.forceShare);
});

QueueActions.removeCompleted.listen(function () {
	let that = this;
	return SocketService.post(QueueConstants.BUNDLES_URL + '/remove_completed')
		.then(that.completed)
		.catch(that.failed);
});

QueueActions.removeCompleted.completed.listen(function (data) {
	NotificationActions.success({ 
		title: 'Action completed',
		message: data.count > 0 ? data.count + ' completed bundles were removed' : 'No bundles were removed',
	});
});

QueueActions.removeBundleSource.listen(function ({ source, bundle }) {
	let that = this;
	return SocketService.delete(QueueConstants.BUNDLES_URL + '/' + bundle.id + '/sources/' + source.user.cid)
		.then(that.completed.bind(that, source, bundle))
		.catch(that.failed.bind(that, source, bundle));
});

QueueActions.removeBundle.shouldEmit = function (bundle) {
	if (bundle.status.completed) {
		// No need to confirm completed bundles
		this.confirmed(bundle, false);
	} else {
		const options = {
			title: this.displayName,
			content: 'Are you sure that you want to remove the bundle ' + bundle.name + '?',
			icon: this.icon,
			approveCaption: 'Remove bundle',
			rejectCaption: "Don't remove",
			checkboxCaption: 'Remove finished files',
		};

		ConfirmDialog(options, this.confirmed.bind(this, bundle));
	}
	return false;
};

QueueActions.removeBundle.confirmed.listen(function (bundle, removeFinished) {
	let that = this;
	return SocketService.post(QueueConstants.BUNDLES_URL + '/' + bundle.id + '/remove', { 
		remove_finished: removeFinished,
	})
		.then(QueueActions.removeBundle.completed.bind(that, bundle))
		.catch(QueueActions.removeBundle.failed.bind(that, bundle));
});

QueueActions.search.listen(function (itemInfo, location) {
	return DownloadableItemActions.search({ 
		itemInfo,
	}, location);
});

QueueActions.searchBundleAlternates.listen(function (bundle) {
	let that = this;
	return SocketService.post(QueueConstants.BUNDLES_URL + '/' + bundle.id + '/search')
		.then(that.completed.bind(that, bundle))
		.catch(that.failed.bind(that, bundle));
});

QueueActions.searchBundleAlternates.completed.listen(function (bundle, data) {
	NotificationActions.success({ 
		title: 'Action completed',
		message: 'The bundle ' + bundle.name + ' was searched for alternates',
	});
});

QueueActions.searchBundleAlternates.failed.listen(function (bundle, error) {
	NotificationActions.error({ 
		title: 'Action failed',
		message: 'Failed to search the bundle ' + bundle.name + ' for alternates: ' + error.message,
	});
});

QueueActions.removeFile.shouldEmit = function (file) {
	const options = {
		title: this.displayName,
		content: 'Are you sure that you want to remove the file ' + file.name + '?',
		icon: this.icon,
		approveCaption: 'Remove file',
		rejectCaption: "Don't remove",
		checkboxCaption: 'Remove on disk',
	};

	ConfirmDialog(options, this.confirmed.bind(this, file));
	return false;
};

QueueActions.removeFile.confirmed.listen(function (item, removeFinished) {
	const that = this;
	const { target, id } = item;
	return SocketService.post(QueueConstants.FILES_URL + '/' + id + '/remove', {
		remove_finished: removeFinished,
	})
		.then(QueueActions.removeFile.completed.bind(that, target))
		.catch(QueueActions.removeFile.failed.bind(that, target));
});

QueueActions.removeFile.completed.listen(function (target, data) {
	NotificationActions.success({ 
		title: 'Queued file removed',
		message: 'The file ' + target + ' was removed from queue',
	});
});

QueueActions.removeFile.failed.listen(function (target, error) {
	NotificationActions.apiError('Failed to remove ' + target, error);
});

QueueActions.removeSource.listen(function (item) {
	let that = this;
	const { user } = item;
	return SocketService.post(QueueConstants.SOURCES_URL + '/' + user.cid)
		.then(that.completed.bind(that, user))
		.catch(that.failed.bind(that, user));
});

QueueActions.removeSource.completed.listen(function (user, data) {
	NotificationActions.info({ 
		title: 'Source removed',
		message: 'The user ' + user.nicks + ' was removed from ' + data.count + ' files',
	});
});

QueueActions.sources.listen(function (data, location) {
	History.pushModal(location, location.pathname + '/sources', OverlayConstants.BUNDLE_SOURCE_MODAL, { bundle: data });
});

QueueActions.content.listen(function (data, location) {
	History.pushModal(location, location.pathname + '/content', OverlayConstants.BUNDLE_CONTENT_MODAL, { bundle: data });
});

QueueActions.searchFileAlternates.listen(function (file) {
	let that = this;
	return SocketService.post(QueueConstants.FILES_URL + '/' + file.id + '/search')
		.then(that.completed.bind(that, file))
		.catch(this.failed.bind(that, file));
});

QueueActions.searchFileAlternates.completed.listen(function (file, data) {
	NotificationActions.success({ 
		title: 'Action completed',
		message: 'The file ' + file.name + ' was searched for alternates',
	});
});

QueueActions.searchFileAlternates.failed.listen(function (file, error) {
	NotificationActions.error({ 
		title: 'Action failed',
		message: 'Failed to search the file ' + file.name + ' for alternates: ' + error.message,
	});
});

QueueActions.setFilePriority.listen(function (file, priority) {
	let that = this;
	return SocketService.post(QueueConstants.FILES_URL + '/' + file.id + '/priority', {
		priority
	})
		.then(that.completed.bind(that, file))
		.catch(that.failed.bind(that, file));
});

export default QueueActions;
