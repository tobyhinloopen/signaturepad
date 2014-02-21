function SignatureField(settings) {
  this.canvas = document.createElement("canvas");
  this.context2d = this.canvas.getContext("2d");

  this.paths = [];
  this.current_path = null;

  for(var x in SignatureField.DEFAULTS) {
    if(SignatureField.DEFAULTS.hasOwnProperty(x)) {
      this[x] = settings[x] == undefined ? SignatureField.DEFAULTS[x] : settings[x];
    }
  }

  this.repaint_later();
  this.bind_mouse_events();
}

SignatureField.DEFAULTS = {
  color: "black",
  width: 320,
  height: 180,
  before_repaint: function(signature_field) { },
  after_repaint: function(signature_field) { }
};

SignatureField.prototype.bind_mouse_events = function() {
  var offset_x, offset_y, signature_field = this;

  var mousemove_callback = function(e) {
    e.preventDefault();
    var x = e.clientX - offset_x, y = e.clientY - offset_y;
    signature_field.current_path.push(x, y);
    signature_field.context2d.lineTo(x, y);
    signature_field.context2d.stroke();
  };

  var mouseup_callback = function(e) {
    e.preventDefault();
    signature_field.paths.push(signature_field.current_path);
    signature_field.current_path = null;
    window.removeEventListener("mousemove", mousemove_callback, true);
    window.removeEventListener("mouseup", mouseup_callback, true);
    signature_field.repaint_later();
  };

  this.canvas.addEventListener("mousedown", function(e) {
    e.preventDefault();
    offset_x = signature_field.canvas.offsetLeft;
    offset_y = signature_field.canvas.offsetTop;
    window.addEventListener("mousemove", mousemove_callback, true);
    window.addEventListener("mouseup", mouseup_callback, true);
    var x = e.clientX - offset_x, y = e.clientY - offset_y;
    signature_field.current_path = [x, y];
    signature_field.context2d.beginPath();
    signature_field.context2d.lineTo(x, y);
  }, true);
};

SignatureField.prototype.repaint = function() {
  this.before_repaint && this.before_repaint(this);

  this.context2d.clearRect(0, 0, this.width, this.height);
  this.context2d.setTransform(1, 0, 0, 1, 0, 0);
  this.repaint_without_callbacks();

  this.after_repaint && this.after_repaint(this);
};

SignatureField.prototype.compose_path_in_rendering_context = function(path) {
  this.context2d.moveTo(path[0], path[1]);
  for(var i=1; i<path.length; i++) {
    this.context2d.lineTo(path[i*2], path[i*2+1]);
  }
};

SignatureField.prototype.repaint_without_callbacks = function() {
  this.context2d.strokeStyle = this.color;
  this.context2d.beginPath();
  for(var i=0; i<this.paths.length; i++) {
    this.compose_path_in_rendering_context(this.paths[i]);
  }
  this.current_path && this.compose_path_in_rendering_context(this.current_path);
  this.context2d.stroke();
};

// Schedule a complete render as soon as possible when the browser is idle.
// Used when applying multiple changes without redrawing every change.
SignatureField.prototype.repaint_later = function() {
  if(this.will_repaint_later) return;
  this.will_repaint_later = true;
  var signature_field = this;
  window.requestAnimationFrame(function() {
    signature_field.repaint();
    signature_field.will_repaint_later = false;
  });
};

SignatureField.prototype.clear = function() {
  this.paths = [];
  this.repaint_later();
}

Object.defineProperty(SignatureField.prototype, "width", {
  get: function() {
    return this.canvas.width;
  },
  set: function(value) {
    this.canvas.width = value;
    this.repaint_later();
    return this.width;
  }
});

Object.defineProperty(SignatureField.prototype, "height", {
  get: function() {
    return this.canvas.height;
  },
  set: function(value) {
    this.canvas.height = value;
    this.repaint_later();
    return this.height;
  }
});
