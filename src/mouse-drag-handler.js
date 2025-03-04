/**
 * @file
 *
 * Defines the {@link MouseDragHandler} class.
 *
 * @module mouse-drag-handler
 */

import Konva from 'konva/lib/Core';

function getMarkerObject(obj) {
  while (obj.parent !== null) {
    if (obj.parent instanceof Konva.Layer) {
      return obj;
    }

    obj = obj.parent;
  }

  return null;
}

/**
 * An object to receive callbacks on mouse drag events. Each function is
 * called with the current mouse X position, relative to the stage's
 * container HTML element.
 *
 * @typedef {Object} MouseDragHandlers
 * @global
 * @property {Function} onMouseDown Mouse down event handler.
 * @property {Function} onMouseMove Mouse move event handler.
 * @property {Function} onMouseUp Mouse up event handler.
 */

/**
 * Creates a handler for mouse events to allow interaction with the waveform
 * views by clicking and dragging the mouse.
 *
 * @class
 * @alias MouseDragHandler
 *
 * @param {Konva.Stage} stage
 * @param {MouseDragHandlers} handlers
 */

function MouseDragHandler(stage, handlers) {
  this._stage     = stage;
  this._handlers  = handlers;
  this._dragging  = false;
  this._mouseDown = this._mouseDown.bind(this);
  this._mouseUp   = this._mouseUp.bind(this);
  this._mouseMove = this._mouseMove.bind(this);

  this._stage.on('mousedown', this._mouseDown);
  this._stage.on('touchstart', this._mouseDown);

  this._lastMouseClientX = null;
}

/**
 * Mouse down event handler.
 *
 * @param {MouseEvent} event
 */

MouseDragHandler.prototype._mouseDown = function(event) {
  if (event.type === 'mousedown' && event.evt.button !== 0) {
    // Mouse drag only applies to the primary mouse button.
    // The secondary button may be used to show a context menu
    // and we don't want to also treat this as a mouse drag operation.
    return;
  }

  var marker = getMarkerObject(event.target);

  // Avoid interfering with drag/drop of point and segment markers.
  if (marker && marker.attrs.draggable) {
    return;
  }

  this._lastMouseClientX = Math.floor(
    event.type === 'touchstart' ? event.evt.touches[0].clientX : event.evt.clientX
  );

  if (this._handlers.onMouseDown) {
    var mouseDownPosX = this._getMousePosX(this._lastMouseClientX);

    this._handlers.onMouseDown(mouseDownPosX);
  }

  // Use the window mousemove and mouseup handlers instead of the
  // Konva.Stage ones so that we still receive events if the user moves the
  // mouse outside the stage.
  window.addEventListener('mousemove', this._mouseMove, false);
  window.addEventListener('touchmove', this._mouseMove, false);
  window.addEventListener('mouseup', this._mouseUp, false);
  window.addEventListener('touchend', this._mouseUp, false);
  window.addEventListener('blur', this._mouseUp, false);
};

/**
 * Mouse move event handler.
 *
 * @param {MouseEvent} event
 */

MouseDragHandler.prototype._mouseMove = function(event) {
  var clientX = Math.floor(
    event.type === 'touchmove' ? event.changedTouches[0].clientX : event.clientX
  );

  // Don't update on vertical mouse movement.
  if (clientX === this._lastMouseClientX) {
    return;
  }

  this._lastMouseClientX = clientX;

  this._dragging = true;

  if (this._handlers.onMouseMove) {
    var mousePosX = this._getMousePosX(clientX);

    this._handlers.onMouseMove(mousePosX);
  }
};

/**
 * Mouse up event handler.
 *
 * @param {MouseEvent} event
 */

MouseDragHandler.prototype._mouseUp = function(event) {
  var clientX;

  if (event.type === 'touchend') {
    clientX = Math.floor(event.changedTouches[0].clientX);

    if (event.cancelable) {
      event.preventDefault();
    }
  }
  else {
    clientX = Math.floor(event.clientX);
  }

  if (this._handlers.onMouseUp) {
    var mousePosX = this._getMousePosX(clientX);

    this._handlers.onMouseUp(mousePosX);
  }

  window.removeEventListener('mousemove', this._mouseMove, false);
  window.removeEventListener('touchmove', this._mouseMove, false);
  window.removeEventListener('mouseup', this._mouseUp, false);
  window.removeEventListener('touchend', this._mouseUp, false);
  window.removeEventListener('blur', this._mouseUp, false);

  this._dragging = false;
};

/**
 * @returns {Number} The mouse X position, relative to the container that
 * received the mouse down event.
 *
 * @private
 * @param {Number} clientX Mouse client X position.
 */

MouseDragHandler.prototype._getMousePosX = function(clientX) {
  var containerPos = this._stage.getContainer().getBoundingClientRect();

  return clientX - containerPos.left;
};

/**
 * Returns <code>true</code> if the mouse is being dragged, i.e., moved with
 * the mouse button held down.
 *
 * @returns {Boolean}
 */

MouseDragHandler.prototype.isDragging = function() {
  return this._dragging;
};

export default MouseDragHandler;
