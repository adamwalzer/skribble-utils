import classNames from 'classnames';

class Draggable extends skoash.Component {
    constructor() {
        super();

        this.state = {
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            zoom: 1,
        };

        this.mouseDown = this.mouseDown.bind(this);
        this.mouseUp = this.mouseUp.bind(this);

        this.moveEvent = this.moveEvent.bind(this);

        this.touchStart = this.touchStart.bind(this);
        this.touchEnd = this.touchEnd.bind(this);
    }

    shouldDrag() {
        return true;
    }

    incomplete() {
        this.markIncorrect();
        this.returnToStart();

        super.incomplete();
    }

    markCorrect() {
        this.setState({
            correct: true,
        });
    }

    markIncorrect() {
        this.setState({
            correct: false,
        });
    }

    startEvent(e, cb) {
        var pageX;
        var pageY;
        var rect;
        var startX;
        var startY;
        var endX;
        var endY;
        var grabX;
        var grabY;

        if (e.target !== this.refs.el) return;
        if (!this.shouldDrag()) return;

        if (e.targetTouches && e.targetTouches[0]) {
            pageX = e.targetTouches[0].pageX;
            pageY = e.targetTouches[0].pageY;
            rect = e.target.getBoundingClientRect();
            e = e.targetTouches[0];
            e.offsetX = pageX - rect.left;
            e.offsetY = pageY - rect.top;
        }

        grabX = e.offsetX;
        grabY = e.offsetY;

        startX = endX = e.pageX - grabX;
        startY = endY = e.pageY - grabY;

        if (!this.state.firstX) {
            this.setState({
                firstX: startX,
                firstY: startY,
            });
        }

        if (!this.props.return) {
            startX = _.isFinite(this.state.grabX) ?
        this.state.startX + this.state.grabX - grabX :
        startX;
            startY = _.isFinite(this.state.grabY) ?
        this.state.startY + this.state.grabY - grabY :
        startY;
        }

        this.setState({
            dragging: true,
            return: false,
            startX,
            startY,
            grabX,
            grabY,
            endX,
            endY,
        });

        if (typeof this.props.dragRespond === 'function') {
            this.props.dragRespond(this.props.message);
        }

        if (typeof cb === 'function') {
            cb.call(this);
        }
    }

    attachMouseEvents() {
        window.addEventListener('mousemove', this.moveEvent);
        window.addEventListener('mouseup', this.mouseUp);
    }

    attachTouchEvents() {
        window.addEventListener('touchmove', this.moveEvent);
        window.addEventListener('touchend', this.touchEnd);
    }

    mouseDown(e) {
        this.startEvent(e, this.attachMouseEvents);
    }

    touchStart(e) {
        this.startEvent(e, this.attachTouchEvents);
    }

    moveEvent(e) {
        if (e.targetTouches && e.targetTouches[0]) {
            e.pageX = e.targetTouches[0].pageX;
            e.pageY = e.targetTouches[0].pageY;
        }

        this.setState({
            endX: e.pageX - this.state.grabX,
            endY: e.pageY - this.state.grabY,
        });
    }

    returnToStart() {
        if (this.state.firstX) {
            this.setState({
                dragging: false,
                return: true,
                endX: this.state.firstX,
                endY: this.state.firstY,
            });
        }
    }

    endEvent(cb) {
        this.dropRespond();

        if (this.props.return) {
            this.returnToStart();
        } else {
            this.setState({
                dragging: false,
                return: this.state.return,
            });
        }

        if (typeof cb === 'function') {
            cb.call(this);
        }
    }

    detachMouseEvents() {
        window.removeEventListener('mousemove', this.moveEvent);
        window.removeEventListener('mouseup', this.mouseUp);
    }

    detachTouchEvents() {
        window.removeEventListener('touchmove', this.moveEvent);
        window.removeEventListener('touchend', this.touchEnd);
    }

    mouseUp() {
        this.endEvent(this.detachMouseEvents);
    }

    touchEnd() {
        this.endEvent(this.detachTouchEvents);
    }

    dropRespond() {
        var corners;

        corners = this.setCorners();

        if (typeof this.props.dropRespond === 'function') {
            this.props.dropRespond(this.props.message, corners);
        }
    }

    setCorners() {
        var top;
        var left;
        var width;
        var height;
        var el;
        var corners = [];

        left = 0;
        top = 0;
        el = this.refs.el;
        width = el.offsetWidth;
        height = el.offsetHeight;

        while (el) {
            if (el.className.indexOf('screen') !== -1) {
                break;
            }

            left += el.offsetLeft || 0;
            top += el.offsetTop || 0;
            el = el.offsetParent;
        }

        left += ((this.state.endX - this.state.startX) / this.state.zoom);
        top += ((this.state.endY - this.state.startY) / this.state.zoom);

        for (let i = 0; i < 4; i++) {
            corners.push({
                x: left + width * (i === 1 || i === 2 ? 1 : 0),
                y: top + height * (i > 1 ? 1 : 0),
            });
        }

        this.setState({
            corners,
        });

        return corners;
    }

    componentDidMount() {
        this.bootstrap();
    }

    bootstrap() {
        super.bootstrap();

        this.setZoom();

        this.refs.el.addEventListener('mousedown', this.mouseDown);
        this.refs.el.addEventListener('touchstart', this.touchStart);

        window.addEventListener('resize', this.setZoom.bind(this));
    }

    setZoom() {
        skoash.trigger('getState').then(state => {
            this.setState({
                zoom: state.scale,
            });
        });
    }

    getStyle() {
        var x;
        var y;

        x = ((this.state.endX - this.state.startX) / this.state.zoom);
        y = ((this.state.endY - this.state.startY) / this.state.zoom);

        return {
            transform: `translateX(${x}px) translateY(${y}px)`,
            WebkitTransform: `translateX(${x}px) translateY(${y}px)`,
        };
    }

    getClassNames() {
        return classNames({
            draggable: true,
            [this.props.className]: this.props.className,
            [this.props.message]: this.props.message,
            DRAGGING: this.state.dragging,
            RETURN: this.state.return,
            CORRECT: this.state.correct,
        }, super.getClassNames());
    }

    render() {
        return (
            <div
                ref="el"
                className={this.getClassNames()}
                style={this.getStyle()}
            >
                {this.renderContentList()}
            </div>
        );
    }
}

export default Draggable;
