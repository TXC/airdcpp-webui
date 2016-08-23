import Reflux from 'reflux';

import WidgetActions from 'actions/WidgetActions';

import reject from 'lodash/reject';
import BrowserUtils from 'utils/BrowserUtils';

import Application from 'widgets/Application';
import RSS from 'widgets/RSS';
import Transfers from 'widgets/Transfers';


// HELPERS
const idToSettingKey = (id) => 'widget_' + id;

const idToWidgetType = (id) => {
	const pos = id.indexOf('_');
	return pos !== -1 ? id.substring(0, pos) : id;
};

const getWidgetSettings = (id) => {
	return BrowserUtils.loadLocalProperty(idToSettingKey(id), { });
};

const saveSettings = (id, settings) => {
	BrowserUtils.saveLocalProperty(idToSettingKey(id), settings);
};

const getWidgetInfoById = (id) => {
	const widgetType = idToWidgetType(id);
	return widgets.find(item => item.typeId === widgetType);
};

const createWidget = (layouts, widgetInfo, id, x, y) => {
	// Add the same widget for all layouts (we are lazy and use the same size for all layouts)
	Object.keys(cols).forEach(key => {
		layouts[key] = layouts[key] || [];
		layouts[key] = layouts[key].concat({ 
			i: id, 
			x: x || layouts[key].length * 2 % (cols[key] || 12), 
			y: y || 0, 
			...widgetInfo.size
		});
	});
};

const createDefaultWidget = (layouts, widgetInfo, x, y, name, settings, suffix = '_default') => {
	const id = widgetInfo.typeId + suffix;
	createWidget(layouts, widgetInfo, id, x, y);

	saveSettings(id, {
		name,
		widget: settings,
	});
};


// CONSTANTS
const cols = { xlg: 14, lg: 10, sm: 6, xs: 4, xxs: 2 };
const breakpoints = { xlg: 1600, lg: 1100, sm: 768, xs: 480, xxs: 0 };

const widgets = [
	Application,
	RSS,
	Transfers,
];

const LAYOUT_STORAGE_KEY = 'home_layout';


const WidgetStore = Reflux.createStore({
	listenables: WidgetActions,
	init: function () {
		let layoutInfo = BrowserUtils.loadLocalProperty(LAYOUT_STORAGE_KEY);
		if (layoutInfo && layoutInfo.items) {
			if (layoutInfo.version === 1) {
				// Convert old layouts
				this.layouts = {};
				Object.keys(cols).forEach(key => {
					this.layouts[key] = layoutInfo.items;
				});
			} else {
				this.layouts = layoutInfo.items;
			}
		} else {
			// Initialize the default layout
			this.layouts = {};
			createDefaultWidget(this.layouts, Application, 0, 0, Application.name);
			createDefaultWidget(this.layouts, RSS, 2, 0, 'Client releases', {
				feed_url: 'https://github.com/airdcpp-web/airdcpp-webclient/releases.atom',
			}, '_releases');
			createDefaultWidget(this.layouts, Transfers, 5, 0, Transfers.name);
		}
	},

	getInitialState: function () {
		return this.layouts;
	},

	onCreateSaved(id, settings, widgetInfo) {
		saveSettings(id, settings);

		createWidget(this.layouts, widgetInfo, id);

		//console.log('Widget added', this.layout);
		this.trigger(this.layouts);
	},

	onEditSaved(id, settings) {
		saveSettings(id, settings);
		this.trigger(this.layouts);
	},

	onRemoveConfirmed(id) {
		BrowserUtils.removeLocalProperty(idToSettingKey(id));

		Object.keys(cols).forEach(key => {
			if (this.layouts[key]) {
				this.layouts[key] = reject(this.layouts[key], { i: id });
			}
		});

		this.trigger(this.layouts);
	},

	getWidgetInfoById: getWidgetInfoById,
	getWidgetSettings: getWidgetSettings,

	get widgets() {
		return widgets;
	},

	get cols() {
		return cols;
	},

	get breakpoints() {
		return breakpoints;
	},

	onLayoutChange(layout, layouts) {
		BrowserUtils.saveLocalProperty(LAYOUT_STORAGE_KEY, {
			version: 2,
			items: layouts,
		});

		this.layouts = layouts;

		this.trigger(this.layouts);
		//console.log('New layout', layout);
	},
});

export default WidgetStore;
