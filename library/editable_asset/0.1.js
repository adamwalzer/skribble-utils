import classNames from 'classnames';

import Draggable from '../draggable/0.1.js';

class EditableAsset extends Draggable {
    constructor() {
        super();

        this.state = {
            width: 0,
            height: 0,
            left: 0,
            top: 0,
            scale: .5,
            minScale: .1,
            maxScale: 1,
            rotation: 0,
            layer: 1000,
            zoom: 1,
            active: false,
            valid: true,
            corners: [],
            lastValid: {},
        };

        this.scale = this.scale.bind(this);
        this.adjustScale = this.adjustScale.bind(this);
        this.offScale = this.offScale.bind(this);

        this.rotate = this.rotate.bind(this);
        this.adjustRotation = this.adjustRotation.bind(this);
        this.offRotate = this.offRotate.bind(this);
    }

    shouldDrag() {
        return this.state.active;
    }

    activate() {
        this.setState({
            active: true,
        });

        if (typeof this.props.deactivateItems === 'function') {
            this.props.deactivateItems(this.props['data-ref'], this.props.asset_type);
        }
    }

    deactivate() {
        if (!this.state.valid) {
            this.setState({
                left: this.state.lastValid.left || this.state.left,
                top: this.state.lastValid.top || this.state.top,
                scale: this.state.lastValid.scale || this.state.scale,
                rotation: this.state.lastValid.rotation || this.state.rotation,
                active: false,
            }, () => {
                setTimeout(() => {
                    this.checkItem();
                }, 0);
            });
        } else {
            this.setState({
                active: false,
            });
        }
    }

    moveEvent(e) {
        if (e.targetTouches && e.targetTouches[0]) {
            e.pageX = e.targetTouches[0].pageX;
            e.pageY = e.targetTouches[0].pageY;
        }

        this.setState({
            endX: e.pageX - this.state.grabX,
            endY: e.pageY - this.state.grabY,
            left: ((e.pageX - this.state.grabX - this.state.startX) / this.state.zoom),
            top: ((e.pageY - this.state.grabY - this.state.startY) / this.state.zoom),
        });
        this.checkItem();
    }

    delete() {
        if (typeof this.props.deleteItem === 'function') {
            this.props.deleteItem(this.props['data-ref'], this.props.asset_type);
        }
    }

    rotate() {
        this.refs.el.parentNode.addEventListener('mousemove', this.adjustRotation);
        this.refs.el.parentNode.addEventListener('mouseup', this.offRotate);

        this.refs.el.parentNode.addEventListener('touchmove', this.adjustRotation);
        this.refs.el.parentNode.addEventListener('touchend', this.offRotate);
    }

    offRotate() {
        this.refs.el.parentNode.removeEventListener('mousemove', this.adjustRotation);
        this.refs.el.parentNode.removeEventListener('mouseup', this.offRotate);

        this.refs.el.parentNode.removeEventListener('touchmove', this.adjustRotation);
        this.refs.el.parentNode.removeEventListener('touchend', this.offRotate);
    }

    adjustRotation(e) {
        var rotation;
        var deltaX;
        var deltaY;

        if (e.targetTouches && e.targetTouches[0]) {
            e.pageX = e.targetTouches[0].pageX;
            e.pageY = e.targetTouches[0].pageY;
        }

        deltaX = (e.pageX / this.state.zoom) - (this.refs.li.offsetParent.offsetLeft) -
            (this.state.left + this.state.width / 2);
        deltaY = (e.pageY / this.state.zoom) - (this.refs.li.offsetParent.offsetTop) -
            (this.state.top + this.state.height / 2);

        rotation = Math.atan2(deltaY, deltaX) + (Math.PI / 4) % (2 * Math.PI);

        this.setState({
            rotation,
        });

        this.checkItem();
    }

    layer() {
        var layer;
        var self = this;

        layer = this.state.layer - 1;

        this.setState({
            layer,
        }, () => {
            if (typeof self.props.relayerItems === 'function') {
                self.props.relayerItems(self.props.asset_type);
            }
        });
    }

    relayer(layer) {
        this.setState({
            layer,
        });
    }

    scale() {
        this.refs.el.parentNode.addEventListener('mousemove', this.adjustScale);
        this.refs.el.parentNode.addEventListener('mouseup', this.offScale);

        this.refs.el.parentNode.addEventListener('touchmove', this.adjustScale);
        this.refs.el.parentNode.addEventListener('touchend', this.offScale);
    }

    offScale() {
        this.refs.el.parentNode.removeEventListener('mousemove', this.adjustScale);
        this.refs.el.parentNode.removeEventListener('mouseup', this.offScale);

        this.refs.el.parentNode.removeEventListener('touchmove', this.adjustScale);
        this.refs.el.parentNode.removeEventListener('touchend', this.offScale);
    }

    adjustScale(e) {
        var scale;
        var deltaX;
        var deltaY;
        var delta;
        var base;

        if (e.targetTouches && e.targetTouches[0]) {
            e.pageX = e.targetTouches[0].pageX;
            e.pageY = e.targetTouches[0].pageY;
        }

        deltaX = (e.pageX / this.state.zoom) - (this.refs.li.offsetParent.offsetLeft / this.state.zoom) -
            (this.state.left + this.state.width / 2);
        deltaY = (e.pageY / this.state.zoom) - (this.refs.li.offsetParent.offsetTop / this.state.zoom) -
            (this.state.top + this.state.height / 2);

        delta = Math.pow(Math.pow(deltaX, 2) + Math.pow(deltaY, 2), .5);
        base = Math.pow(Math.pow(this.state.width / 2, 2) + Math.pow(this.state.height / 2, 2), .5);

        scale = Math.max(Math.min(delta / base, 1), this.state.minScale);

        this.setState({
            scale,
        });

        this.checkItem();
    }

    checkItem() {
        this.setCorners(() => {
            var valid;

            if (typeof this.props.checkItem === 'function') {
                valid = this.props.checkItem(this.props['data-ref'], this.props.asset_type);

                if (valid) {
                    this.setState({
                        valid,
                        lastValid: new Object(this.state),
                    });
                } else {
                    this.setState({
                        valid,
                    });
                }

                this.props.setValid.call(this, valid);
            }
        });
    }

    setCorners(cb) {
        var center;
        var distance;
        var angle;
        var corners = [];

        center = {
            x: this.state.left + this.state.width / 2,
            y: this.state.top + this.state.height / 2,
        };

        distance = Math.pow(Math.pow(this.state.width * this.state.scale / 2, 2) +
            Math.pow(this.state.height * this.state.scale / 2, 2), .5);

        for (let i = 0; i < 4; i++) {
            angle = this.state.rotation;
            angle += (i < 2 ? 0 : Math.PI);
            angle += Math.pow(-1, i) * Math.atan2(this.state.height, this.state.width);

            corners.push({
                x: center.x + distance * Math.cos(angle),
                y: center.y + distance * Math.sin(angle),
            });
        }

        this.setState({
            corners,
        }, cb);
    }

    getSize() {
        var image;
        var self = this;

        image = new Image();

        image.onload = () => {
            var offset;
            var left;
            var top;
            var width;
            var height;
            var minDim;
            var maxDim;
            var minScale;
            var maxScale;
            var scale;

            minDim = this.props.minDim || 40;
            maxDim = this.props.maxDim || 400;
            left = this.state.left;
            top = this.state.top;
            width = image.width;
            height = image.height;

            minScale = Math.max(minDim / width, minDim / height);
            maxScale = Math.min(maxDim / width, maxDim / height, this.state.maxScale);
            scale = self.props.state && self.props.state.scale ?
                self.props.state.scale :
                Math.max(Math.min(self.state.scale, maxScale), minScale);

            if ((!this.state.height || !this.state.width) && (!this.state.left && !this.state.top)) {
                left = (this.props.canvasWidth - width) / 2;
                top = (this.props.canvasHeight - height) / 2;
            }

            offset = this.refs.el.getBoundingClientRect();

            self.setState({
                left,
                top,
                startX: left * scale - offset.left / this.state.zoom,
                startY: top * scale - offset.top / this.state.zoom,
                grabX: width / 2,
                grabY: height / 2,
                width,
                height,
                minScale,
                scale,
            }, () => {
                self.activate();
                self.checkItem();
            });
        };

        image.src = this.props.src;
    }

    getLayer() {
        var layer = 1000;

        if (this.props.state && this.props.state.layer) {
            layer = this.props.state.layer;
        } else {
            switch (this.props.asset_type) {
                case 'background':
                    layer = 1;
                    break;
                case 'message':
                    layer = 10000;
                    break;
            }
        }

        this.setState({
            layer,
        });
    }

    attachEvents() {
        this.refs.scale.addEventListener('mousedown', this.scale);
        this.refs.rotate.addEventListener('mousedown', this.rotate);

        this.refs.scale.addEventListener('touchstart', this.scale);
        this.refs.rotate.addEventListener('touchstart', this.rotate);
    }

    componentDidMount() {
        this.bootstrap();
    }

    bootstrap() {
        super.bootstrap();

        if (this.props.state) {
            this.setState(this.props.state);
        }

        this.getSize();
        this.getLayer();

        this.attachEvents();

        skoash.trigger('emit', {
            name: 'getMedia',
            'media_id': this.props.media_id
        }).then(d => {
            this.setState(d, () => {
                this.checkItem();
            });
        });
    }

    componentDidUpdate() {
        this.attachEvents();
    }

    getButtonStyle(extraRotation = 0) {
        var style;
        var transform = '';

        transform += `scale(${(1 / this.state.scale)}) `;
        transform += `rotate(${(-this.state.rotation - extraRotation)}rad) `;

        style = {
            transform,
        };

        return style;
    }

    getAssetStyle() {
        var style;
        var transform = '';

        transform += `scale(${this.state.scale}) `;
        transform += `rotate(${this.state.rotation}rad) `;

        style = {
            backgroundImage: `url("${this.props.src}")`,
            width: this.state.width,
            height: this.state.height,
            left: this.state.left,
            top: this.state.top,
            transform,
            zIndex: this.state.layer,
        };

        return style;
    }

    getButtonsStyle() {
        var style;
        var transform = '';

        transform += `scale(${this.state.scale}) `;
        transform += `rotate(${this.state.rotation}rad) `;

        style = {
            width: this.state.width,
            height: this.state.height,
            left: this.state.left,
            top: this.state.top,
            transform,
        };

        return style;
    }

    getClasses() {
        return classNames({
            DRAGGING: this.state.dragging,
            RETURN: this.state.return,
            ACTIVE: this.state.active,
            INVALID: !this.state.valid,
        }, 'editable-asset', this.props.asset_type);
    }

    renderAsset() {
        return (
            <div
                ref="el"
                className="asset"
                style={this.getAssetStyle()}
            />
        );
    }

    renderButtons() {
        return (
            <div
                className="buttons"
                style={this.getButtonsStyle()}
            >
                <button
                    className="delete"
                    style={this.getButtonStyle()}
                    onClick={this.delete.bind(this)}
                />
                <button
                    ref="rotate"
                    className="rotate"
                    style={this.getButtonStyle()}
                />
                <button
                    className="layer"
                    onClick={this.layer.bind(this)}
                    style={this.getButtonStyle()}
                />
                <button
                    ref="scale"
                    className="scale"
                    style={this.getButtonStyle(1.5708)}
                />
            </div>
        );
    }

    render() {
        return (
            <li
                ref="li"
                className={this.getClasses()}
                onClick={this.activate.bind(this)}
            >
                {this.renderAsset()}
                {this.renderButtons()}
            </li>
        );
    }
}

EditableAsset.defaultProps = _.defaults({
    canvasWidth: 1280,
    canvasHeight: 720,
    setValid: _.identity,
}, Draggable.defaultProps);

export default EditableAsset;
