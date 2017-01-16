import classNames from 'classnames';

import EditableAsset from '../editable_asset/0.1.js';

class Canvas extends skoash.Component {
    constructor() {
        super();

        this.state = {
            background: null,
            items: [],
            messages: [],
            offsetX: 0,
            offsetY: 0,
            active: false,
            valid: true,
        };

        this.deleteItem = this.deleteItem.bind(this);
        this.checkItem = this.checkItem.bind(this);
        this.deactivateItems = this.deactivateItems.bind(this);
        this.relayerItems = this.relayerItems.bind(this);
        this.setValid = this.setValid.bind(this);
    }

    start() {
        var dom = ReactDOM.findDOMNode(this);

        super.start();

        this.setState({
            width: dom.offsetWidth,
            height: dom.offsetHeight,
        });
    }

    getItems() {
        var items;
        var messages;
        var self = this;

        items = this.state.items.map((item, key) => {
            var state;

            if (!self.refs['item-' + key]) return item;

            state = self.refs['item-' + key].state;

            item.state = {
                left: _.floor(state.left, 14),
                top: _.floor(state.top, 14),
                scale: _.floor(state.scale, 14),
                rotation: _.floor(state.rotation, 14),
                layer: state.layer,
                valid: state.valid,
                corners: state.corners,
            };

            item.check = state.check;
            item.mime_type = state.mime_type; // eslint-disable-line camelcase

            return item;
        });

        messages = this.state.messages.map((item, key) => {
            var state;

            if (!self.refs['message-' + key]) return item;

            state = self.refs['message-' + key].state;

            item.state = {
                left: _.floor(state.left, 14),
                top: _.floor(state.top, 14),
                scale: _.floor(state.scale, 14),
                rotation: _.floor(state.rotation, 14),
                layer: state.layer,
                valid: state.valid,
                corners: state.corners,
            };

            item.check = state.check;
            item.mime_type = state.mime_type; // eslint-disable-line camelcase

            return item;
        });

        _.remove(items, n => {
            return !n;
        });

        _.remove(messages, n => {
            return !n;
        });

        return {
            background: this.state.background,
            items,
            messages,
        };
    }

    reset() {
        this.setState({
            background: null,
            items: [],
            messages: []
        });
    }

    setItems(message) {
        if (message) {
            /*
             *
             * This makes sure the EditableAssets get cleared.
             *
             * This prevents the new assets from inheriting
             * state from the old assets.
             *
             */
            this.setState({
                background: null,
                items: [],
                messages: [],
            }, () => {
                this.addItem(message.background);
                message.items.forEach(asset => {
                    this.addItem(asset);
                });
                message.messages.forEach(asset => {
                    this.addItem(asset);
                });
            });
        }
    }

    addItem(asset, cb) {
        var items;
        var messages;
        var index;
        var count;

        if (!asset) return;

        if (asset.asset_type === 'background') {
            this.setState({
                background: asset,
            }, () => {
                skoash.trigger('emit', {
                    name: 'getMedia',
                    'media_id': asset.media_id
                }).then(d => {
                    var background = this.state.background;
                    background.check = d.check;
                    background.mime_type = d.mime_type; // eslint-disable-line camelcase
                    this.setState({
                        background
                    }, cb);
                });
            });
        } else if (asset.asset_type === 'item') {
            items = this.state.items;

            count = _.reduce(items, (c, v) => {
                if (asset.src === v.src) c++;
                return c;
            }, 1);

            if (count > this.props.maxInstances) {
                skoash.trigger('openMenu', {
                    id: 'limitWarning'
                });
                return;
            }

            items.push(asset);
            index = items.indexOf(asset);

            this.setState({
                items,
            }, () => {
                skoash.trigger('emit', {
                    name: 'getMedia',
                    'media_id': asset.media_id
                }).then(d => {
                    asset.check = d.check;
                    asset.mime_type = d.mime_type; // eslint-disable-line camelcase
                    items[index] = asset;
                    this.setState({
                        items
                    }, cb);
                });
            });
        } else if (asset.asset_type === 'message') {
            messages = this.state.messages;

            count = _.reduce(items, (c, v) => {
                if (asset.src === v.src) c++;
                return c;
            }, 1);

            if (count > this.props.maxInstances) return;

            messages.push(asset);
            index = messages.indexOf(asset);

            this.setState({
                messages,
            }, () => {
                skoash.trigger('emit', {
                    name: 'getMedia',
                    'media_id': asset.media_id
                }).then(d => {
                    asset.check = d.check;
                    asset.mime_type = d.mime_type; // eslint-disable-line camelcase
                    messages[index] = asset;
                    this.setState({
                        messages
                    }, cb);
                });
            });
        }
    }

    deleteItem(key, type) {
        var items;

        items = this.state[type + 's'];
        delete items[key];

        this.setState({
            [type + 's']: items,
        });
    }

    deactivateItems(exclude, type) {
        if (typeof exclude === 'object' && exclude.target) {
            if (exclude.target.tagName !== 'LI') return;
            this.setState({
                active: false,
            });
            if (!this.state.valid) {
                skoash.trigger('passData', {
                    name: 'showCollisionWarning'
                });
            }
        }

        if (typeof exclude === 'number') {
            this.setState({
                active: true,
            });
        }

        this.state.items.map((item, key) => {
            if ((key !== exclude || type !== 'item') && this.refs['item-' + key]) {
                this.refs['item-' + key].deactivate();
            }
        });

        this.state.messages.map((item, key) => {
            if ((key !== exclude || type !== 'message') && this.refs['message-' + key]) {
                this.refs['message-' + key].deactivate();
            }
        });
    }

    relayerItems(type) {
        var layers = [];

        this.state[type + 's'].map((item, key) => {
            var layer;

            layer = this.refs[type + '-' + key].state.layer;

            if (layers.indexOf(layer) === -1) {
                layers.push(layer);
            }
        });

        layers.sort((a, b) => {
            return a < b;
        });

        this.state[type + 's'].map((item, key) => {
            var oldLayer;
            var newLayer;

            oldLayer = this.refs[type + '-' + key].state.layer;
            newLayer = (type === 'message') ? 10000 : 1000;
            newLayer = newLayer - layers.indexOf(oldLayer);

            this.refs[type + '-' + key].relayer(newLayer);
        });
    }

    checkItem(key, type) {
        var self = this;

        return (
            !self.refs[type + '-' + key].state.corners.length ||
            (
                self.isInBounds(key, type) && (
                    self.refs[type + '-' + key].state.can_overlap ||
                    !self.state[type + 's'].some((item, index) =>
                        key !== index &&
                        !self.refs[type + '-' + index].state.can_overlap &&
                        self.refs[type + '-' + index].state.corners.length &&
                        skoash.util.doIntersect(
                            self.refs[type + '-' + key].state.corners,
                            self.refs[type + '-' + index].state.corners
                        )
                    )
                )
            )
        );
    }

    isInBounds(key, type) {
        return !this.state.width ||
            !this.state.height ||
            !(
            // box to left
            skoash.util.doIntersect(
                this.refs[type + '-' + key].state.corners,
                [
                    {x: 0, y: -this.state.height},
                    {x: 0, y: 2 * this.state.height},
                    {x: -this.state.width, y: 2 * this.state.height},
                    {x: -this.state.width, y: -this.state.height}
                ]
            ) ||
            // box above
            skoash.util.doIntersect(
                this.refs[type + '-' + key].state.corners,
                [
                    {x: -this.state.width, y: 0},
                    {x: 2 * this.state.width, y: 0},
                    {x: 2 * this.state.width, y: -this.state.height},
                    {x: this.state.width, y: -this.state.height}
                ]
            ) ||
            // box to right
            skoash.util.doIntersect(
                this.refs[type + '-' + key].state.corners,
                [
                    {x: this.state.width, y: -this.state.height},
                    {x: this.state.width, y: 2 * this.state.height},
                    {x: 2 * this.state.width, y: 2 * this.state.height},
                    {x: 2 * this.state.width, y: -this.state.height}
                ]
            ) ||
            // box below
            skoash.util.doIntersect(
                this.refs[type + '-' + key].state.corners,
                [
                    {x: -this.state.width, y: this.state.height},
                    {x: 2 * this.state.width, y: this.state.height},
                    {x: 2 * this.state.width, y: 2 * this.state.height},
                    {x: -this.state.width, y: 2 * this.state.height}
                ]
            )
        );
    }

    setValid(valid) {
        this.setState({
            valid
        });

        this.props.setValid.call(this, valid);
    }

    getStyle() {
        if (!this.state.background) return;

        return {
            backgroundImage: `url(${this.state.background.src})`,
        };
    }

    renderItems() {
        var self = this;

        return this.state.items.map((item, key) => {
            return (
                <EditableAsset
                    {...item}
                    data-ref={key}
                    minDim={this.props.itemMinDim}
                    deleteItem={self.deleteItem}
                    checkItem={self.checkItem}
                    deactivateItems={self.deactivateItems}
                    relayerItems={self.relayerItems}
                    setValid={self.setValid}
                    ref={'item-' + key}
                    key={key}
                />
            );
        });
    }

    renderMessages() {
        var self = this;

        return this.state.messages.map((item, key) => {
            return (
                <EditableAsset
                    {...item}
                    data-ref={key}
                    minDim={this.props.messageMinDim}
                    deleteItem={self.deleteItem}
                    checkItem={self.checkItem}
                    deactivateItems={self.deactivateItems}
                    relayerItems={self.relayerItems}
                    setValid={self.setValid}
                    canvasWidth={this.state.width}
                    canvasHeight={this.state.height}
                    ref={'message-' + key}
                    key={key}
                />
            );
        });
    }

    getClassNames() {
        return classNames({
            canvas: true,
            ACTIVE: !this.props.preview && this.state.active,
        });
    }

    render() {
        return (
            <ul
                className={this.getClassNames()}
                style={this.getStyle()}
                onClick={this.deactivateItems}
            >
                {this.renderItems()}
                {this.renderMessages()}
            </ul>
        );
    }
}

Canvas.defaultProps = _.defaults({
    maxInstances: 5,
    setValid: _.noop,
}, skoash.Component.defaultProps);

export default Canvas;
