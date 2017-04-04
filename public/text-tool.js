function read_file(filename, onload) {
    var request = new XMLHttpRequest();
  
    function reqListener() {
        if (onload) {
            onload(this.responseText);
        }
    }
  
    request.open('GET', '/' + filename);
    request.addEventListener('load', reqListener);

    request.send();

}

function write_file(filename, contents) {
    var request = new XMLHttpRequest();
    var formData = new FormData();
  
    function reqListener() {
        if (onload) {
            onload(this.responseText);
        }
    }
  
    formData.append('contents', contents);
    request.open('POST', '/' + filename);
    request.addEventListener('load', reqListener);
    request.send(formData);
}


// Remove all children from the specified node
function clear(node) {
    while(node.firstChild) {
        node.removeChild(node.lastChild);
    }
}

function hide(node) {
  if (node) {
    node.className += ' hidden';
  }
}

function show(node) {
  if (node) {
    node.className = node.className.replace(/ hidden/g, '');
  }
}

function toggle(node) {
    if (node) {
        if (/ hidden/.test(node.className)) {
            show(node);
        } else {
            hide(node);
        }
    }
}

function getDestination(x, y, current) {
    var rect;
    var container;
    var index = 0;
    var area;

    for (var c=0, clen=containers.length; c < clen; ++c) {
        rect = containers[c].node.getBoundingClientRect();
        if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
            if (!area || area > (rect.right - rect.left) * (rect.bottom * rect.top)) {
                container = containers[c];
                area = (rect.right - rect.left) * (rect.bottom * rect.top);
            }
        }
    }

    if (container) {    
        while (index < container.views.length && (container.views[index] === current ||
               y > (container.views[index].node.getBoundingClientRect().bottom + container.views[index].node.getBoundingClientRect().top) / 2)) {
            index++;
        }
        return {container: container, index: index};
    }

    return null;
}

var containers = [];

function addContainer(container) {
    containers.push(container);    
}

// Add handlers to make an element dragable
function makeDraggable(subject, onchange) {
    var sx;
    var sy;

    var startRect;
    var position;
    var destination;
    var destination_node;
    var copy;
    var moved;

    function mouseDown(event) {
        event = event || window.event;
        sx = event.clientX;
        sy = event.clientY;
        
        startRect = subject.node.getBoundingClientRect();
        position = subject.node.style.position;
        destination_node = document.createElement('div');
        moved = false;
        destination_node.className = 'destination-indicator';
        destination_node.style.width = (startRect.right - startRect.left) + 'px';
        destination_node.style.height = (startRect.bottom - startRect.top) + 'px';
        subject.node.className += ' dragged';
              
        document.addEventListener('mousemove', mouseMove);        
        document.addEventListener('mouseup', mouseUp);        

        document.addEventListener('touchmove', touchMove);        
        document.addEventListener('touchend', touchEnd);        
  }

  function mouseMove(moveEvent) {
        var deltaX;
        var deltaY;
        var dist;
        var definition;
        var moving = subject;
        moveEvent = moveEvent || window.event;
        moving.node.style.zIndex = 10;
        moving.node.style.position = 'fixed';
        deltaX = moveEvent.clientX - sx;
        deltaY = moveEvent.clientY - sy;
        destination = getDestination(moveEvent.clientX, moveEvent.clientY, subject);

        if (moveEvent.ctrlKey && subject.action) {
            definition = subject.action.toJSON();
            if (copy === undefined) {
                copy = new all_actions[definition.type].action(definition);
                copy = new all_actions[definition.type].view(copy);
                copy.container = subject.container;
                subject.node.style.position = 'static';
                subject.node.style.left = 'auto';
                subject.node.style.top = 'auto';
                subject.node.style.width = 'auto';
                subject.node.style.height = 'auto';

                subject.container.node.appendChild(copy.node);
            }
            moving = copy;
        }
        moving.node.style.left = (startRect.left + deltaX) + 'px';
        moving.node.style.top = (startRect.top + deltaY) + 'px';
        moving.node.style.width = (startRect.right - startRect.left) + 'px';
        moving.node.style.height = (startRect.bottom - startRect.top) + 'px';
        if (destination) {
            if (destination_node.parentElement) {
                destination_node.parentElement.removeChild(destination_node);
            }
            if (destination.index < destination.container.views.length) {
                destination.container.node.insertBefore(destination_node, destination.container.views[destination.index].node);
            } else {
                destination.container.node.appendChild(destination_node);
            }
        }
        dist = deltaX * deltaX + deltaY * deltaY;

        if (dist > 5) {
            moved = true;
        }

    };

    function mouseUp(mouseUpEvent) {
        var moving = subject;
        var definition;

        subject.node.className = subject.node.className.replace(/ dragged/, '');

        mouseUpEvent = mouseUpEvent || window.event;

        if (mouseUpEvent.ctrlKey) {
            definition = subject.action.toJSON();
            if (copy === undefined) {
                copy = new all_actions[definition.type].action(definition);
                copy = new all_actions[definition.type].view(copy);
                copy.container = subject.container;
                subject.node.style.position = 'static';
                subject.node.style.left = 'auto';
                subject.node.style.top = 'auto';
                subject.node.style.width = 'auto';
                subject.node.style.height = 'auto';

                subject.container.node.appendChild(copy.node);
            }
            moving = copy;
        }

        document.removeEventListener('mousemove', mouseMove);
        document.removeEventListener('mouseup', mouseUp);

        document.removeEventListener('touchmove', touchMove);
        document.removeEventListener('touchend', touchEnd);

        if (moved && destination && subject.container) {
            moving.container.remove(moving);
            destination.container.insert(moving, destination.index);
            if (moving.drop) {
                moving.drop(mouseUpEvent, destination);
            }
        } else if (!moved && mouseUpEvent.srcElement === subject.header) {
            subject.shade();
        }
        if (destination_node.parentElement) {
            destination_node.parentElement.removeChild(destination_node);
        }
        moving.node.style.position = 'static';
        moving.node.style.left = 'auto';
        moving.node.style.top = 'auto';
        moving.node.style.width = 'auto';
        moving.node.style.height = 'auto';

        if (onchange) {
            onchange(moving);
        }
    }

    // Simply map the first touch to the mouse
    function touchStart(touchEvent) {
        mouseDown(touchEvent.changedTouches[0]);
    }
  
    // Simply map the first touch to the mouse
    function touchEnd(touchEvent) {
        mouseUp(touchEvent.changedTouches[0]);
    }
  
    // Simply map the first touch to the mouse
    function touchMove(touchEvent) {
        mouseMove(touchEvent.changedTouches[0]);
    }
  
    if (subject.draggable) {
        return;
    }
    subject.draggable = true;
    
    subject.node.addEventListener('mouseenter', function(event) {
        show(subject.buttons);
    });
    subject.node.addEventListener('mouseleave', function(event) {
        hide(subject.buttons);
    });
    subject.header.addEventListener('mousedown', mouseDown);
    subject.header.addEventListener('touchstart', mouseDown);  
}


function ActionView(action) {
    var delete_node = document.createElement('img');
    var configure_node = document.createElement('img');
    var node_active = document.createElement('img');
    var title = action.type;
    var parameter_table = document.createElement('table');
    this.action = action;
    this.node = document.createElement('div');
    this.header = document.createElement('div');
    this.buttons = document.createElement('div');
    this.body = document.createElement('div');
    this.options = document.createElement('div');
    this.parameters_node = document.createElement('tbody');

    makeDraggable(this);

    this.node.className = 'action';
    this.header.className = 'title-bar';
    this.buttons.className = 'button-bar';
    this.body.className = 'action-body';
    this.options.className = 'action-options';
    parameter_table.className = 'parameters-box';

    this.active = true;    
    
    this.node.appendChild(this.header);
    this.body.appendChild(this.buttons);
    this.node.appendChild(this.body);
    this.body.appendChild(this.options);

    this.body.appendChild(parameter_table);
    parameter_table.appendChild(this.parameters_node);
    
    if (this.title) {
        title = this.title + ' (' + this.type + ')';
    }
    this.header.appendChild(document.createTextNode(title));
    
    delete_node.src = 'https://cdn.glitch.com/0cc8bf5e-1e21-4e6f-af44-8651d0d1513b%2Fdialog-close.png?1490874110790';
    delete_node.className = 'delete-action';
    delete_node.onclick = (function(actionView) {
        return function() {
            if (actionView.container) {
                actionView.container.remove(actionView);
            }
        };
    }) (this);
    this.buttons.appendChild(delete_node);

    configure_node.src = 'configure.png';
    configure_node.className = 'configure-action';
    configure_node.onclick = (function(action) {
        return function() {
            action.options.style.display = action.options.style.display === 'none' ? 'block' : 'none';
        };
    }) (this);
    this.buttons.appendChild(configure_node);

    node_active.src = 'stock_macro-stop-after-command.png';
    node_active.className = 'active-action';
    node_active.onclick = (function(action, node) {
        return function() {
            action.active = !action.active;
            if (action.active) {
                node.src = 'stock_macro-stop-after-command.png';
            } else {
                node.src = 'stock_macro-stop-after-procedure.png';
            }            
        };
    }) (this, node_active);
    this.buttons.appendChild(node_active);
    this.shade = shade;
}

function shade() {
    if (this.body.style.display === 'none') {
        this.body.style.display = 'block';
        clear(this.header);
        this.header.insertBefore(document.createTextNode(this.action.type || 'null'), this.header.firstChild);
    } else {
        this.body.style.display = 'none';
        if (this.shortTitle) {
            clear(this.header);
            this.header.insertBefore(document.createTextNode(this.shortTitle() || 'null'), this.header.firstChild);
        }
    }
}

function get_options() {
    var options = {};
    options.auto = document.getElementById('auto-update').checked;

    return options;    
}


function format_literal(text) {
    return text.replace(/\r\n|\r|\n/g, '<br>').replace('\t', '    ');
}


function MakeTable(definition) {
    definition = definition || {};
    this.row_separator = definition.row || '\\r\\n|\\r|\\n';
    this.column_separator = definition.columns || '\t';
    this.literal = definition.literal || '"';
    this.header_lines = definition.header_lines || 0;
}

MakeTable.prototype = {
    type: 'Make Table',

    exec: function make_table(state) {
        var result;
        var lp;
        var literal_pattern;
        var literals;
        var row_pattern;
        var column_pattern;
        var lines;
        var l;
        var cells = [];
        var row;
        var c;
        var columns = 0;
        var max_columns = 0;
        var header_lines = parseInt(this.header_lines_node.value);
        var header;
        var text = state.result.toString();
        
        if (this.literal_node.value) {
            try {
                lp = this.literal_node.value;
                literal_pattern = lp + '[^' + lp + ']+' + lp;
                literal_pattern = new RegExp(literal_pattern, 'g');
                this.literal_node.style.color = 'black';
                
                text = text.replace(literal_pattern, format_literal);
                text = text.replace(new RegExp(this.literal_node.value, 'g'), '');
            }
            catch (ex) {
                this.literal_node.style.color = 'red';
            }
        }
        try {
            row_pattern = new RegExp(this.row_node.value, 'i');
            this.row_node.style.color = 'black';
        }
        catch (ex) {
            this.row_node.style.color = 'red';
        }
    
        try {
            column_pattern = new RegExp(this.column_node.value, 'gi');
            this.column_node.style.color = 'black';
        }
        catch (ex) {
            this.column_node.style.color = 'red';
        }
        if (row_pattern && column_pattern) {
            result = '<table><thead>';
            lines = text.split(row_pattern);
            if (header_lines) {
                header = lines.slice(0, header_lines).join('</th></tr><tr><th>');
                header = header.replace(column_pattern, '</th><th>');
                result += '<tr><th>' + header + '</th></tr>';
                lines = lines.slice(header_lines);
            }
            result += '</thead><tbody>';
            text = lines.join('</td></tr><tr><td>');
            text = text.replace(column_pattern, '</td><td>');
            result += '<tr><td>' + text;
    
            result +=  '</tr><tbody><tfoot></tfoot></table>';
        } else {
            result = text;
        }
        state.result = result;
        state.html = result;
        return result;
    },
    
    update: function() {
    },
    
    toJSON: function() {
        return {
            type: this.type,
            row: this.row_node.value,
            column: this.column_node.value,
            literal: this.literal_node.value,
            header_lines: this.header_lines_node.value
        };
    }
};

function MakeTableView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};

    this.row_node = document.createElement('input');
    this.column_node = document.createElement('input');
    this.literal_node = document.createElement('input');
    this.header_lines_node = document.createElement('input');
       
    this.row_node.type = 'text';
    this.row_node.value = action.row_separator;
    this.row_node.onchange = this.changed();

    this.column_node.type = 'text';
    this.column_node.value = action.column_separator;
    this.column_node.onchange = this.changed();
    
    this.literal_node.type = 'text';
    this.literal_node.value = action.literal;
    this.literal_node.onchange = this.changed();
    
    this.header_lines_node.type = 'text';
    this.header_lines_node.value = action.header_lines;
    this.header_lines_node.onchange = this.changed();
    
    this.body.appendChild(document.createTextNode('Row Separator:'));
    this.body.appendChild(this.row_node);
    this.body.appendChild(document.createTextNode('Column Separator:'));
    this.body.appendChild(this.column_node);
    this.options.appendChild(document.createTextNode('Literal Marker:'));
    this.options.appendChild(this.literal_node);
    this.options.appendChild(document.createTextNode('Header Lines:'));
    this.options.appendChild(this.header_lines_node);
}

MakeTableView.prototype = {
    type: 'Make Table',
    icon: 'view-form-table.png',

    changed: function make_table(state) {
        var that = this;
        return function () {
            var result;
            var lp;
            var literal_pattern;
            var literals;
            var row_pattern;
            var column_pattern;
            var lines;
            var l;
            var cells = [];
            var row;
            var c;
            var columns = 0;
            var max_columns = 0;
            var header_lines = parseInt(this.header_lines_node.value);
            var header;
            var text = state.result.toString();
            
            if (this.literal_node.value) {
                try {
                    lp = this.literal_node.value;
                    literal_pattern = lp + '[^' + lp + ']+' + lp;
                    literal_pattern = new RegExp(literal_pattern, 'g');
                    this.literal_node.style.color = 'black';
                    
                    text = text.replace(literal_pattern, format_literal);
                    text = text.replace(new RegExp(this.literal_node.value, 'g'), '');
                }
                catch (ex) {
                    this.literal_node.style.color = 'red';
                }
            }
            try {
                row_pattern = new RegExp(this.row_node.value, 'i');
                this.row_node.style.color = 'black';
            }
            catch (ex) {
                this.row_node.style.color = 'red';
            }
        
            try {
                column_pattern = new RegExp(this.column_node.value, 'gi');
                this.column_node.style.color = 'black';
            }
            catch (ex) {
                this.column_node.style.color = 'red';
            }
            if (row_pattern && column_pattern) {
                result = '<table><thead>';
                lines = text.split(row_pattern);
                if (header_lines) {
                    header = lines.slice(0, header_lines).join('</th></tr><tr><th>');
                    header = header.replace(column_pattern, '</th><th>');
                    result += '<tr><th>' + header + '</th></tr>';
                    lines = lines.slice(header_lines);
                }
                result += '</thead><tbody>';
                text = lines.join('</td></tr><tr><td>');
                text = text.replace(column_pattern, '</td><td>');
                result += '<tr><td>' + text;
        
                result +=  '</tr><tbody><tfoot></tfoot></table>';
            } else {
                result = text;
            }
            state.result = result;
            state.html = result;
            return result;
        };
    },
    
    update: function() {
    }
}

function unique(source) {
    var i;
    var result;
    var last;
    
    source.sort();
    last = source[0];
    result = [last];
    
    for (i = 1; i < source.length; ++i) {
        if (source[i] !== last) {
            result.push(source[i]);
            last = source[i];
        }
    }
    return result;
}

function Filter(definition) {}

Filter.prototype = {type: 'Filter'};

function FilterView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};

    this.pattern_node = document.createElement('input');
    this.join_node = document.createElement('input');
    this.case_node = document.createElement('input');
    this.unique_node = document.createElement('input');
    
    this.pattern_node.type = 'text';
    this.pattern_node.value = definition.pattern || '.*';
    this.pattern_node.size = 40;
    //this.pattern_node.onchange = container.update();
    this.body.appendChild(document.createTextNode('Pattern:'));
    this.body.appendChild(this.pattern_node);
    
    this.case_node.type = 'checkbox';
    //this.case_node.onchange = container.update();
    this.case_node.value = definition.match_case || false;
    this.options.appendChild(this.case_node);
    this.options.appendChild(document.createTextNode('Match Case'));
    
    this.join_node.type = 'text';
    this.join_node.value = definition.join_text || '</br>';
    this.join_node.size = 40;
    //this.join_node.onchange = container.update();
    this.body.appendChild(document.createTextNode('Join:'));
    this.body.appendChild(this.join_node);
    
    this.unique_node.type = 'checkbox';
    //this.unique_node.onchange = container.update();
    this.unique_node.value = definition.unique || false;
    this.options.appendChild(this.unique_node);
    this.options.appendChild(document.createTextNode('Make Unique'));
}

FilterView.prototype = {
    type: 'Filter',
    icon: 'view-filter.png',

    exec: function filter(state) {
        var pattern = this.pattern_node.value;
        var join_text = this.join_node.value;
        var output_text = text;
        var matches;
        var regexp;
        var flags = 'g';
        var text = state.result.toString()
        
        if (! this.case_node.checked) {
            flags += 'i';
        }
    
        try {
            regexp = new RegExp(pattern, flags);
            this.pattern_node.style.color = 'black';
        }
        catch (ex) {
            this.pattern_node.style.color = 'red';
        }
        if (regexp) {
            matches = text.match(regexp);
            if (matches) {
                if (this.unique_node.checked) {
                    matches = unique(matches);
                }
                output_text = matches.join(join_text);
            }
        }
        state.result = output_text;
        return output_text
    },

    update: function() {
    },
        
    toJSON: function () {
        return {
             type: this.type,
             pattern: this.pattern_node.value,
             match_case: this.case_node.checked,
             join_text: this.join_node.value,
             unique: this.unique_node.checked
        };
    }
}


function grep(pattern, separator, join, context_join, before, after, invert) {
    var output_text = this.result.toString();
    var matches;
    var lines;
    var output = [];
    var flags = '';
    var match;
    var pre = [];
    var post = [];
    var count = 0;
    var text;
    separator = separator || '\n';
    join = join || '\n';
    context_join = context_join || '\n';
    before = before || 0;
    after = after || 0;

    if (pattern && separator) {
        lines = output_text.split(separator);
        lines = this.result;
        for (var l=0, len=lines.length; l < len; ++l) {
            pattern.lastIndex = 0;
            match = pattern.test(lines[l]);
            
            match = (!invert) ? match : !match;
            if (match) {
                text = lines[l];
                if (before > 0) {
                    text = pre.join(context_join) + context_join + text;
                }
                output.push(text);
                count = 0;
                post = [];
            } else if ((after > 0) || (before > 0)) {
                if (count < after) {
                    post.push(lines[l]);
                } else if (count === after) {
                    output[output.length - 1] += context_join + post.join(context_join);
                }
                ++count;
                pre.push(lines[l]);
                if (pre.length > before) {
                    pre.shift();
                }
            }
        }
        if (count < after) {
            output[output.length - 1] += context_join + post.join(context_join);
        }
        output_text = output.join(join);
    }
    this.result = output_text;
    return this;
}

function jsFunction(code) {
    var func = new Function('state', code);
    this.result = func(this);
    return this;
}

function map(func) {
    this.result = this.result.map(func, this); 
}

function conditional(test, onTrue, onFalse) {
    if (test) {
        if (onTrue) {
            this.result = onTrue.call(this);
        }
    } else {
        if (onFalse) {
            this.result = onFalse.call(this);
        }
    }
    return this;
}

function ProcessLines(definition) {}

ProcessLines.prototype = {type: 'ProcessLines'};

function ProcessLinesView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};

    this.function_node = document.createElement('textarea');

    this.body.appendChild(document.createTextNode('Function:'));
    this.body.appendChild(document.createElement('br'));

    this.function_node.cols = 80;
    this.function_node.rows = 20;
    this.function_node.value = definition.func || '';
    this.body.appendChild(this.function_node);
}

ProcessLinesView.prototype = {
    type: 'Process Lines',
    icon: 'format-justify-fill.png',

    exec: function process_lines(state) {
        var func = this.function_node.value;
        var output_text = state.result.toString();
        var lines;
        if (func) {
            try {
                func = new Function('line', 'state', func);
                lines = state.result.split(/[\n\r]/);
                output_text = '';
                state = {};
                for (var i=0, ilen=lines.length; i < ilen; ++i) {
                    output_text += func(lines[i], state) + '\n';
                }
            } catch (e) {
                alert ('Failed to parse: ' + this.function_node.value);
            }
        }
        state.result = output_text;
        return output_text
    },
    
    update: function() {
    },
    
    toJSON: function() {
        return {
            type: this.type,
            func: this.function_node.value
       };
    }
}

function prefix(text) {
    this.result = text + this.result;
    return this;
}

function suffix(text) {
    this.result = this.result + text;
    return this;
}

function Func(definition) {
    definition = definition || {};
    this.sequence = new ActionSequence(definition.sequence);
}

Func.prototype = {
    type: 'Function',

    exec: function (state) {
        var that = this;
        state.result = function() {
            var state = this;
            state.result = arguments[0];
            if (that.sequence) {
                state = that.sequence.exec(state);
            }
            return state.result;
        }
        return state;
    },

    toJSON: function toJSON() {
        return {
           type: this.type,
           sequence: this.sequence
        };
    }
};

function FuncView(action, definition, container) {
    ActionView.call(this, action, container);
    this.sequenceContainer = new SequenceView({object: action, property: 'sequence'});
    this.body.appendChild(this.sequenceContainer.node);
}

FuncView.prototype = {
    icon: 'view-group.png',
    
    update: function() {
    }    
}

function Group(definition) {
    definition = definition || {};
    this.sequence = new ActionSequence(definition.sequence);
}

Group.prototype = {
    type: 'Group',

    exec: function (state) {
        var new_state;
        if (this.sequence) {
            new_state = this.sequence.exec(state);
            state.result = new_state.result;
            state.html = new_state.html;
            state.program = new_state.program;
        }
        return state;
    },

    toJSON: function toJSON() {
        return {
           type: this.type,
           sequence: this.sequence
        };
    }
};

function GroupView(action, definition, container) {
    ActionView.call(this, action, container);
    this.sequenceContainer = new SequenceView({object: action, property: 'sequence'});
    this.body.appendChild(this.sequenceContainer.node);
}

GroupView.prototype = {
    icon: 'view-group.png',
    
    update: function() {
    }    
}


function Compile(definition) {
    if (typeof definition == 'string') {
        definition = {name: definition};
    }
    definition = {};
    this.name = definition.name;
}

Compile.prototype = {
    type: 'Compile',

    exec: function (state) {
        var sequence = new ActionSequence(JSON.parse(state.result));
        if (this.name) {
            state.variables[this.name] = sequence;
        } else {
            state.program = sequence;
        }
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           name: this.name
        };
    }    
};

function CompileView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};
    this.name_node = document.createElement('input');
    
    this.name_node.type = 'text';
    this.name_node.size = 40;
    this.name_node.value = definition.source || '';
    this.name_node.onchange = this.changed();
    
    this.options.appendChild(document.createTextNode('Name: '));
    this.options.appendChild(this.name_node);
}

CompileView.prototype = {
    type: 'Compile',
    icon: 'run-build-file.png',
    
    update: function() {
    },
    
    changed: function() {
        var that = this;
        return function() {
            that.action.name = that.name_node.value;
        };
    }
}


function Run(definition) {
    if (typeof definition == 'string') {
        definition = {name: definition};
    }
    definition = {};
    this.name = definition.name;
}

Run.prototype = {
    type: 'Run',

    observe: observe,
    unobserve: unobserve,
    
    exec: function run(state) {
        if (this.name) {
            this.sequence = state.variables[this.name];
        } else {
            this.sequence = state.program;
        }
        state.result = this.sequence.exec(state).result;
        notify.call(this, this);
        return state;
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           name: this.name_node.value
        };
    }
};

function RunView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};
    
    action.observe(this, this.update);
    
    this.name_node = document.createElement('input');
    
    this.name_node.type = 'text';
    this.name_node.size = 40;
    this.name_node.value = definition.source || '';
    this.name_node.onchange = this.changed();
    
    this.options.appendChild(document.createTextNode('Name: '));
    this.options.appendChild(this.name_node);
}

RunView.prototype = {
    type: 'Run',
    icon: 'run-build.png',
    
    update: function(run) {
        var sequenceView = new SequenceView({object: run, property: 'sequence'});
        clear(this.body);
        this.body.appendChild(sequenceView.node);
    },
    
    changed: function() {
        var that = this;
        return function() {
            that.action.name = that.name_node.value;
        };
    } 
}


function StringLiteral(definition) {
    if (typeof definition === 'string') {
        definition = {value: definition};
    }
    definition = definition || {};
    this.value = definition.value;
}

StringLiteral.prototype = {
    type: 'String',

    exec: function run(state) {
        state.result = this.value;
        return state;
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           value: this.value
        };
    }
}

function StringLiteralView(action, definition) {
    definition = definition || {};
    this.title = definition.title;
    ActionView.call(this, action);
    this.value_node = document.createElement('input');
    
    this.value_node.type = 'text';
    this.value_node.size = 40;
    this.value_node.value = action.value || '';
    this.value_node.onchange = this.changed();
    
    this.body.appendChild(this.value_node);
}

StringLiteralView.prototype = {
    icon: 'edit-rename.png',
    
    shortTitle: function() {
        var text = this.action.value;
        text = text ? JSON.stringify(this.action.value).slice(1, -1) : 'null';
        return text;
    },
    
    update: function() {
    },
    
    changed: function() {
        var that = this;
        return function() {
            var text = that.value_node.value;
            text = text.replace(/"/g, '\\"');
            try {
                that.action.value = JSON.parse('"' + text + '"');
                that.value_node.style.color = 'black';
            }
            catch (ex) {
                that.value_node.style.color = 'red';
            }
        };
    }
}


function BooleanLiteral(definition) {
    if (typeof definition === 'string') {
        definition = definition.toLower();
        switch (definition) {
          case 'true':
          case 't':
          case 'yes':
          case 'y':
            definition = {value: true};
            break;
          default:
            definition = {value: false};
            break;
        }
    }
    definition = definition || {};
    this.value = definition.value;
}

BooleanLiteral.prototype = {
    type: 'Boolean',

    exec: function(state) {
        state.result = this.value;
        return state;
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           value: this.value
        };
    }
}

function BooleanLiteralView(action, definition) {
    definition = definition || {};
    this.title = definition.title;
    ActionView.call(this, action);
    this.value_node = document.createElement('input');
    
    this.value_node.type = 'checkbox';
    this.value_node.value = action.value || '';
    this.value_node.onchange = this.changed();
    
    this.body.appendChild(this.value_node);
}

BooleanLiteralView.prototype = {
    icon: 'edit-rename.png',
    
    shortTitle: function() {
        return this.value_node.checked ? 'True' : 'False';
    },
    
    update: function() {
    },
    
    changed: function() {
        var that = this;
        return function() {
            that.action.value = that.value_node.checked;
        };
    }
}

function array() {
  var result = [];
  for (var a=0, len=arguments.length; a < len; ++a) {
    result.push(arguments[a]);
  }
  this.result = result;
  return this;
}

function RegExpLiteral(definition) {
    var flags = 'g';
    if (typeof definition === 'string') {
        definition = {expression: definition};
    }
    definition = definition || {expression: '/.*/'};
    if (!definition.match_case) {
        flags += 'i';
    }
    this.value = new RegExp(definition.expression.replace(/\//g, '\\/'), flags);
}

RegExpLiteral.prototype = {
    type: 'Regular Expression',
    
    exec: function run(state) {
        state.result = this.value;
        return state;
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           expression: this.value.source,
           match_case: !this.value.ignoreCase
        };
    }
}


function RegExpLiteralView(action, definition, container) {
    var text = JSON.stringify(action.value.source);
    text = text.slice(1, -1).replace(/\\\\\//g, '/');
    definition = definition || {};
    this.title = definition.title;
    ActionView.call(this, action, container);
    this.value_node = document.createElement('input');
    this.case_node = document.createElement('input');

    this.value_node.type = 'text';
    this.value_node.size = 40;
    this.value_node.value = text;
    this.value_node.onchange = this.changed();
    
    this.body.appendChild(this.value_node);

    this.case_node.type = 'checkbox';
    this.case_node.value = !action.ignoreCase;
    this.case_node.onchange = this.changed();

    this.options.appendChild(this.case_node);
    this.options.appendChild(document.createTextNode('Match Case'));
}

RegExpLiteralView.prototype = {
    icon: 'edit-rename.png',
    
    shortTitle: function() {
        return  this.value_node.value
    },
    
    update: function() {
    },
    
    changed: function () {
        var that = this;
        return function(event) {
            var flags = 'g';
            var text = that.value_node.value;
            if (!that.case_node.checked) {
                flags += 'i';
            }
            text = text.replace(/\//g, '\\/');
            try {
                that.action.value = new RegExp(text, flags);
                that.value_node.style.color = 'black';
            }
            catch (ex) {
                that.value_node.style.color = 'red';
            }
        }
    }    
}


function RegExpProcess(definition) {
    definition = definition || {};
    this.pattern = definition.pattern;
    this.sequence = new ActionSequence(definition.sequence);
}

RegExpProcess.prototype = {
    type: 'RegExpProcess',

    exec: function regexpProcess(state) {
        var pattern = this.pattern_node.value;
        var flags = 'g';
        var output_text = state.result.toString();
        var regexp;
        
        if (this.pattern) {
            output_text = output_text.replace(this.pattern, function(match) {
                return this.sequence.exec(match);
            });
            state.result = output_text;
        }
        return state;
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           pattern: this.pattern,
           //match_case: this.case_node.checked,
           sequence: this.sequence
        };
    }
};

function RegExpProcessView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};
    this.pattern_node = document.createElement('input');
    this.case_node = document.createElement('input');
    this.sequenceContainer = new SequenceView({object: action, property: 'sequence'});

    this.pattern_node.type = 'text';
    this.pattern_node.size = 60;
    this.pattern_node.value = action.pattern;
    this.pattern_node.onchange = this.changed();

    this.case_node.type = 'checkbox';
    this.case_node.value = action.match_case || false;
    this.case_node.onchange = this.changed();

    this.body.appendChild(document.createTextNode('Find: '));
    this.body.appendChild(this.pattern_node);
    this.body.appendChild(document.createElement('br'));
    this.body.appendChild(this.container.node);
    this.options.appendChild(this.case_node);
    this.options.appendChild(document.createTextNode('Match Case'));
}

RegExpProcessView.prototype = {
    type: 'RegExpProcess',
    icon: 'system-search.png',
    
    changed: function (state) {
        var that = this;
        return function(event) {
            var pattern = this.pattern_node.value;
            var flags = 'g';
            var output_text = state.result.toString();
            var regexp;
            
            if (! this.case_node.checked) {
                flags += 'i';
            }
        
            try {
                regexp = new RegExp(pattern, flags);
                this.pattern_node.style.color = 'black';
            }
            catch (ex) {
                this.pattern_node.style.color = 'red';
            }
            if (regexp) {
                this.action.pattern = regexp;
            }
            state.result = output_text;
            return state;
        }
    },
    
    update: function() {
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           pattern: this.pattern_node.value,
           match_case: this.case_node.checked,
           sequence: this.sequenceContainer.sequence.actions
        };
    }
}

function RegExpFunction(definition) {}

RegExpFunction.prototype = {type: 'RegExpFunction'};

function RegExpFunctionView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};
    
    this.pattern_node = document.createElement('input');
    this.function_node = document.createElement('textarea');
    this.case_node = document.createElement('input');

    this.pattern_node.type = 'text';
    this.pattern_node.size = 60;
    this.pattern_node.value = definition.pattern || '';
    //this.pattern_node.onchange = container.update();
    
    this.function_node.value = definition.func || 'return all;';
    this.function_node.cols = 120;
    this.function_node.rows = 20;
    //this.function_node.onchange = container.update();
    
    this.case_node.type = 'checkbox';
    this.case_node.value = definition.match_case || false;
    //this.case_node.onchange = container.update();
    
    this.body.appendChild(document.createTextNode('Find:'));
    this.body.appendChild(this.pattern_node);
    this.body.appendChild(this.case_node);
    this.body.appendChild(document.createTextNode('Match Case'));
    this.body.appendChild(document.createElement('br'));
    this.body.appendChild(document.createTextNode('Function:'));
    this.body.appendChild(document.createElement('br'));
    this.body.appendChild(this.function_node);
}

RegExpFunctionView.prototype = {
    type: 'RegExp Function',
    // initialise: Action,
    icon: 'system-search.png',
    
    exec: function regexpFunction(state) {   
        var pattern = this.pattern_node.value;//.replace('<', '&lt;').replace('>', '&gt;');
        var function_text = this.function_node.value;
        var output_text = state.result.toString();
        var regexp;
        var func;
        var flags = 'g';
        
        if (! this.case_node.checked) {
            flags += 'i';
        }
    
        try {
            regexp = new RegExp(pattern, flags);
            this.pattern_node.style.color = 'black';
        }
        catch (ex) {
            this.pattern_node.style.color = 'red';
        }
        try {
            func = new Function('all', 'match1', 'match2', 'match3', 'match4', 'match5', function_text);
            this.function_node.style.color = 'black';
        }
        catch (ex) {
            this.function_node.style.color = 'red';
        }
        if (regexp && func) {
            try {
                
                output_text = output_text.replace(regexp, func);
            }
            catch (ex) {
                this.function_node.style.color = 'red';
            }
        }
        state.result = output_text;
        return state.result
    },

    update: function() {
    },
    
    toJSON: function toJSON() {
        return {
           type: this.type,
           pattern: this.pattern_node.value,
           func: this.function_node.value,
           match_case: this.case_node.checked
        };
    }
}

function load(location, onload) {
    if (location) {
        try {
            this.result = read_file(location, onload);
        } catch(e) {
        }
    }
    return this;
}

function save(location) {
    if (location) {
        write_file(location, this.result);
    }
    return this;
}

function Edit(definition) {
    if (typeof definition === 'string') {
        definition = {text: definition};
    }
    definition = definition || {};
    this.text = definition.text || '';
}

Edit.prototype = {
    type: 'Editor',
    
    exec: function(state) {
        state.result = this.text;
        return state;
    },
    
    toJSON: function toJSON() {
        return {
            type: this.type,
            text: this.text
        };
    }
}    

function EditView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};

    this.editor_node = document.createElement('textarea');

    this.editor_node.value = action.text || '';
    this.editor_node.className = 'editor';
    this.editor_node.cols = 120;
    this.editor_node.rows = 20;
    this.editor_node.addEventListener('blur', this.changed());

    this.body.appendChild(this.editor_node);
}

EditView.prototype = {
    type: 'Editor',
    icon: 'https://cdn.glitch.com/0cc8bf5e-1e21-4e6f-af44-8651d0d1513b%2Fstory-editor.png?1490874109977',

    update: function() {
    },
    
    changed: function() {
        var that = this;
        return function(event) {
            that.action.text = that.editor_node.value;
        }
    }
}

function observe(observer, func) {
    if (this.observers === undefined) {
        this.observers = [];
    }
    this.observers.push({observer: observer, callback: func});
    return this.observers.length;
}

function unobserve(observer, func) {
    var index = 0;
    if (func) {
        while (index < this.observers.length) {
            if (this.observers.observer === observer && this.observers.callback === func) {
                this.observers.splice(index, 0);
            } else {
                ++index;
            }
        }
    } else {
        this.observers.splice(observer);
    }
    return this.observers.length;
}

function notify(state) {
    for (var o=0, olen=this.observers.length; o < olen; ++o) {
        if (this.observers[o] !== undefined) {
            this.observers[o].callback.call(this.observers[o].observer, state);
        }
    }
}

function Show(definition) {
}

Show.prototype = {
    type: 'Show',
    
    observe: observe,
    
    exec: function(state) {
        notify.call(this, state);
        return state;
    },

    toJSON: function toJSON() {
        return {
            type: this.type
            //as_html: this.html_node.checked,
            //as_code: this.code_node.checked,
            //show_control_characters: this.ctrl_node.checked
        };
    }
};

function ShowView(action, definition, container) {
    ActionView.call(this, action, container);
    definition = definition || {};
    
    action.observe(this, this.update);
    
    this.output_node = document.createElement('div');
    this.html_node = document.createElement('input');
    this.code_node = document.createElement('input');
    this.ctrl_node = document.createElement('input');
    
    this.html_node.type = 'checkbox';
    this.html_node.checked = definition.as_html;
//    this.html_node.onclick = container.update();
    
    this.code_node.type = 'checkbox';
    this.code_node.checked = definition.as_code !== undefined ? definition.as_html : true;;
//    this.code_node.onclick = container.update();
    
    this.ctrl_node.type = 'checkbox';
    this.ctrl_node.checked = definition.show_control_characters;
//    this.ctrl_node.onclick = container.update();
    
    this.body.appendChild(this.output_node);
    this.options.appendChild(this.html_node);
    this.options.appendChild(document.createTextNode('HTML '));
    this.options.appendChild(this.code_node);
    this.options.appendChild(document.createTextNode('Code '));
    this.options.appendChild(this.ctrl_node);
    this.options.appendChild(document.createTextNode('Control Characters'));
}

ShowView.prototype = {
    type: 'Show',
    icon: 'page-simple.png',
    
    update: function (state) {   
        var as_html = this.html_node.checked;
        var as_code = this.code_node.checked;
        var display_text = state.result.toString();
        if (this.ctrl_node.checked) {
            display_text = JSON.stringify(display_text);
        }
        if (as_html) {
            this.output_node.innerHTML = display_text;
        } else if (as_code) {
            display_text = display_text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            this.output_node.innerHTML = '<pre>' + display_text + '</pre>';
        } else {
            while(this.output_node.firstChild) {
                this.output_node.removeChild(this.output_node.lastChild);
            }
            this.output_node.appendChild(document.createTextNode(display_text));
        }
        return state.result
    }
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function to_html(string, line_nos) {
    var lines = string.match(/^.*((\r\n|\n|\r)|$)/gm);
    var result = '';
    var l, c;
    var indent = '';
    var num_length = lines.length.toString().length;
    
    for (l = 0; l < lines.length; ++l) {
        if (line_nos) {
            result += '<span class="line-number">';
            result += pad(l + 1, num_length);
            result += '</span>';
        }
        
        c = 0;
        indent = '';
        while (lines[l][c] === ' ' && c < lines[l].length) {
            indent += '&nbsp;';
            ++c;
        }
        result += indent + lines[l] + '</br>';
    }
    return result;
}



function makeAction(name, method, signature, options, icon) {
    var parameter_types = {
        string: {literal: 'String'},
        regexp: {literal: 'Regular Expression',
                 process: function(node) {
                     var value = '';
                     try {
                        value = new RegExp(node.value, 'gi');
                        node.style.color = 'black';
                     }
                     catch (ex) {
                         node.style.color = 'red';
                     }
                     return value;
                 }},
        text: {literal: 'Editor'},
        boolean: {literal: 'Boolean'},
        int: {},
        float: {},
        function: {literal: 'Function'}
    };
    var parameters = signature.parameters;

    var newAction = function(definition) {
        var options;
        var sequence;
        var defaultAction;
        var parameterContainer;
        definition = definition || {};
        this.func = method;
        this.parameters = {};
        for (var a=0, alen=parameters.length; a < alen; ++a) {
            if (parameters[a].name == '...') {
              break;
            }
            if (definition[parameters[a].name] && definition[parameters[a].name].type) {
                defaultAction = new all_actions[definition[parameters[a].name].type].action(definition[parameters[a].name]);
            } else {
                defaultAction = new all_actions[parameter_types[parameters[a].type].literal].action(definition[parameters[a].name]);
            }
            this.parameters[parameters[a].name] = defaultAction;
        }
    }

    newAction.prototype = {
        type: name,
        input: signature.input,
        output: signature.output,
    
        exec: function (state) {
            var args = [];
            var arg;
            var local_state;
            for (var a=0, len=parameters.length; a < len; ++a) {
                if (parameters[a].name === '...') {
                  continue;
                }
                local_state = {outer: state, variables: {}};
                if (this.parameters[parameters[a].name]) {
                    arg = this.parameters[parameters[a].name].exec(local_state);
                } else {
                    arg = this.parameters[a].exec(local_state);
                }
                args.push(arg.result);
            }
            
            if (typeof this.func === 'function') {
                state = this.func.apply(state, args);
            } else {
                if (state.result[this.func]) {
                    state.result = state.result[this.func].apply(state.result, args);
                }
            }
            return state;
        },
        
        toJSON: function toJSON() {
            var def = {type: this.type};
            for (var a=0, len=parameters.length; a < len; ++a) {
                def[parameters[a].name] = this.parameters[parameters[a].name];
            }

            return def;
        }
    }
    
    var newActionView = function(action, definition, container) {
        var options;
        var text;
        var parameter_node;
        var label;
        var addParameter;
        var sequence;
        var parameterContainer;
        var sequence_container;
        
        ActionView.call(this, action, container);
        definition = definition || {};

        for (var a=0, alen=parameters.length; a < alen; ++a) {
            parameter_node = document.createElement('tr');
            parameter_node.className = 'parameter';

            label = document.createElement('td');
            label.className = 'parameter-label';
            if (parameters[a].name === '...') {
              addParameter = document.createElement('button');
              addParameter.appendChild(document.createTextNode('...'));
              addParameter.addEventListener('click', (function(view, action) {
                return function(event) {
                  var row = document.createElement('tr');
                  var label = document.createElement('td');
                  label.className = 'parameter-label';
                  label.appendChild(document.createTextNode(parameters.length));
                  row.appendChild(label);
                  var parameterContainer = new SequenceView({object: action.parameters, property: parameters.length});
                  var sequence_container = document.createElement('td');
                  sequence_container.className = 'parameter-value';
                  sequence_container.appendChild(parameterContainer.node);
                  row.appendChild(sequence_container);
                  parameter_node.parentElement.insertBefore(row, parameter_node);
                  parameters.push(parameters.length);

                };
              })(this, action, parameter_node));
              label.appendChild(addParameter);
              parameter_node.appendChild(label);
            } else {
              if (parameters[a].title) {
                  text = parameters[a].title || parameters[a].name;
                  label.appendChild(document.createTextNode(text));
                  text = parameters[a].type;
                  label.title = text;
              }
              parameter_node.appendChild(label);
            
              parameterContainer = new SequenceView({object: this.action.parameters, property: parameters[a].name});
              sequence_container = document.createElement('td');
              sequence_container.className = 'parameter-value';
              sequence_container.appendChild(parameterContainer.node);
              parameter_node.appendChild(sequence_container);
            }
            this.parameters_node.appendChild(parameter_node);
        }
    }

    newActionView.prototype = {
        icon: icon,
    
        changed: function () {
            var that = this;
            
            return function(event) {};
        }
    }

    all_actions[name] = {action: newAction, view: newActionView};
}

// Create a place holder that is use to insert specific actions into a sequence.
//
function PlaceholderActionView() {
    var title = 'New Action';
    var titleNode = document.createElement('span');
    this.node = document.createElement('div');
    this.header = document.createElement('div');
    this.buttons = document.createElement('div');
    this.body = document.createElement('div');

    makeDraggable(this);

    this.node.className = 'action';
    this.header.className = 'title-bar';
    this.buttons.className = 'button-bar';
    this.body.className = 'action-body';

    this.header.style.fontWeight = 'normal';
    this.active = true;    
    
    this.node.appendChild(this.header);
    this.body.appendChild(this.buttons);
    this.node.appendChild(this.body);
    
    titleNode.appendChild(document.createTextNode(title));
    titleNode.contentEditable = 'true';
    titleNode.addEventListener('mousedown', function(event) {event.stopPropagation;return false;});
    this.header.appendChild(document.createTextNode('<'));
    this.header.appendChild(titleNode);
    this.header.appendChild(document.createTextNode('>'));
}

PlaceholderActionView.prototype.drop = function(event, destination) {
    this.destination = destination;
    menu.show(event, this, destination);

    this.node.addEventListener('click', function(that) {
        return function (event) {
            menu.show(event, that, that.destination);
        };
    }(this));
}

PlaceholderActionView.prototype.shade = function() {
}

var all_actions = {
    sequence: {action: ActionSequence, view: SequenceView},
    Editor: {action: Edit, view: EditView},
    Show: {action: Show, view: ShowView},
    Boolean: {action: BooleanLiteral, view: BooleanLiteralView},
    String: {action: StringLiteral, view: StringLiteralView},
    'Regular Expression': {action: RegExpLiteral, view: RegExpLiteralView},
    Group: {action: Group, view: GroupView},
    RegExpFunction: {action: RegExpFunction, view: RegExpFunctionView},
    RegExpProcess: {action: RegExpProcess, view: RegExpProcessView},
    Filter: {action: Filter, view: FilterView},
    ProcessLines: {action: ProcessLines, view: ProcessLinesView},
    Compile: {action: Compile, view: CompileView},
    Run: {action: Run, view: RunView},
    'Make Table': {action: MakeTable, view: MakeTableView},
    Function: {action: Func, view: FuncView}
}; 


function Menu() {
    this.node = document.createElement('div');
    this.node.className = 'menu';
    document.getElementById('content').appendChild(this.node);
    hide(this.node);
}

Menu.prototype = {
    
    show: function(event, view, container, group) {
        var action_node;
        var image_node;
        var container = container || getDestination(event.clientX, event.clientY);
        var rect;
        var groups = {};
        var g;
        var windowHeight = document.documentElement.clientHeight;
        clear(this.node);
        this.node.style.left = event.clientX + 'px';
        this.node.style.top = event.clientY + 'px';
        
        for (var action in all_actions) {
            if (all_actions.hasOwnProperty(action)) {
                if (all_actions[action].action.prototype.input && all_actions[action].action.prototype.input.type) {
                    g = all_actions[action].action.prototype.input.type;
                } else {
                    g = 'General';
                }
                if (groups[g]) {
                    groups[g].push(all_actions[action]);
                } else {
                    groups[g] = [all_actions[action]];
                }
            }
        }

        if (group) {
            action_node = document.createElement('button');
            action_node.className = 'action-button';
            /*
                image_node = document.createElement('img');
                image_node.src = all_actions[action].view.prototype.icon;
                image_node.className = 'action-icon';
                action_node.appendChild(image_node);
            */
            action_node.appendChild(document.createTextNode('Back'));
            this.node.appendChild(action_node);
                    
            action_node.onclick = (function(view, container) {
                return function(event) {
                    menu.show(event, view, container)
                };
            })(view, container);
            for (var action in groups[group]) {
                if (groups[group].hasOwnProperty(action) && 
                    groups[group][action].action.prototype.type) {
                    action_node = document.createElement('button');
                    action_node.className = 'action-button';
                    if (groups[group][action].view.prototype.icon) {
                        image_node = document.createElement('img');
                        image_node.src = groups[group][action].view.prototype.icon;
                        image_node.className = 'action-icon';
                        action_node.appendChild(image_node);
                    }
                    action_node.appendChild(document.createTextNode(groups[group][action].action.prototype.type));
                    this.node.appendChild(action_node);
                    action_node.onclick = (function(actionType, viewType, menu) {
                        return function() {
                            var newAction = new actionType();
                            var newView = new viewType(newAction);
                            container.container.replace(view, newView);
                            
                            container.container.update();
                            menu.hide();
                        };
                    })(groups[group][action].action, groups[group][action].view, this);
                }
            }
        } else {
            for (var group in groups) {
                if (groups.hasOwnProperty(group)) {
                    action_node = document.createElement('button');
                    action_node.className = 'action-button';
                    if (groups[group][0].view.prototype.icon) {
                        image_node = document.createElement('img');
                        image_node.src = all_actions[action].view.prototype.icon;
                        image_node.className = 'action-icon';
                        action_node.appendChild(image_node);
                    }
                    action_node.appendChild(document.createTextNode(group));
                    this.node.appendChild(action_node);
                    
                    action_node.onclick = (function(view, container, group) {
                        return function(event) {
                            menu.show(event, view, container, group)
                        };
                    })(view, container, group);                    
                }
            }
        }
        action_node = document.createElement('button');
        action_node.className = 'action-button-cancel';
        action_node.appendChild(document.createTextNode('Cancel'));
        this.node.appendChild(action_node);
        action_node.onclick = function() {menu.hide();};

        rect = this.node.getBoundingClientRect();
        if (rect.bottom > windowHeight) {
            this.node.style.top = (windowHeight - (rect.bottom - rect.top)) + 'px';
        }
        show(this.node);
        return this.node;
    },
    
    hide: function() {
        hide(this.node);
    }
};

function SequenceView(attachmentPoint, parent, defaultView, min, max) {
    var view;
    this.parent = parent;
    this.attachmentPoint = attachmentPoint;
    
    this.node = document.createElement('div');
    this.node.className = 'action-sequence';
    this.auto_update_node = document.createElement('input');
    this.defaultView = defaultView;
    this.min = min || 0;
    this.max = max;
    this.views = [];

    this.node.addEventListener('click', (function(that, node) {
        return function(event) {
            var newAction = new PlaceholderActionView();
            if (event.srcElement === node) {
                that.add(newAction);
                newAction.drop(event, {container: that, index:that.views.length});
                event.returnValue = false;
            }
        };
    })(this, this.node));

    this.refresh();
    addContainer(this);

    if (this.views.length < this.min) {
        this.add(new this.defaultView());
    }
}

SequenceView.prototype.refresh = function() {
    var sequence
    var view;
    sequence = this.attachmentPoint.object[this.attachmentPoint.property];
    if (sequence) {
        if (sequence instanceof ActionSequence) {
            for (var a=0, alen=sequence.actions.length; a < alen; ++a) {
                view = new all_actions[sequence.actions[a].type].view(sequence.actions[a], null, this);
                this.views.push(view);
                this.node.appendChild(view.node);
                view.container = this;
            }
        } else {
            view = new all_actions[sequence.type].view(sequence, null, this);
            this.views = [view];
            this.node.appendChild(view.node);
            view.container = this;
            view.shade();
        }    
    }
}

SequenceView.prototype.update = function(force) {
}

SequenceView.prototype.replace = function(oldView, newView) {
    var position = 0;
    var currentAction;
    var sequence;

    if (this.views.length === 1) {
      if (newView.action) {
          this.attachmentPoint.object[this.attachmentPoint.property] = newView.action;
      }
      this.node.removeChild(oldView.node);
      this.node.appendChild(newView.node);
      this.views[0] = newView;
    } else {
      for (var index=0, len=this.views.length; index < len; ++index) {
          if (this.views[index] === oldView) {
              if (oldView.action) {
                  this.attachmentPoint.object[this.attachmentPoint.property].removeAt(position);
              }
              if (newView.action) {
                  if (!this.attachmentPoint.object[this.attachmentPoint.property] || !this.attachmentPoint.object[this.attachmentPoint.property].insert) {
                      currentAction = this.views[0].action;
                      sequence = new ActionSequence();
                      sequence.add(currentAction);
                      this.attachmentPoint.object[this.attachmentPoint.property] = sequence;
                  }
                  this.attachmentPoint.object[this.attachmentPoint.property].insert(newView.action, position);
              }
              this.views.splice(index, 1, newView);
              this.node.insertBefore(newView.node, oldView.node);
              this.node.removeChild(oldView.node);
              newView.container = this;
              break;
          }
          if (this.views[index].action) {
              ++position;
          }
      }
    }
}

SequenceView.prototype.add = function(actionView) {
    var currentAction;
    var sequence;
    var rect;

    if (!this.max || this.views.length < this.max) {
        if (actionView.action) {
            if (this.views.length === 0) {
                clear(this.node);
                this.attachmentPoint.object[this.attachmentPoint.property] = actionView.action;
            } else if (this.views.length === 1) {
                currentAction = this.views[0].action;
                sequence = new ActionSequence();
                sequence.add(currentAction);
                sequence.add(actionView.action);
                this.attachmentPoint.object[this.attachmentPoint.property] = sequence;
            } else {
                this.attachmentPoint.object[this.attachmentPoint.property].add(actionView.action);
            }
        }
      
        this.node.appendChild(actionView.node);
        this.views.push(actionView);
        actionView.container = this;
        makeDraggable(actionView);
    }
};

SequenceView.prototype.insert = function(actionView, index) {
    var currentAction;
    var sequence;
    if (!this.max || this.views.length < this.max) {
        if (actionView.action) {
            if (this.views.length === 0) {
                clear(this.node);
                this.attachmentPoint.object[this.attachmentPoint.property] = actionView.action;
            } else if (this.views.length === 1) {
                currentAction = this.views[0].action;
                sequence = new ActionSequence();
                sequence.add(currentAction);
                sequence.add(actionView.action);
                this.attachmentPoint.object[this.attachmentPoint.property] = sequence;
            } else {
                this.attachmentPoint.object[this.attachmentPoint.property].insert(actionView.action, index);
            }
        }
        if (index < this.views.length) {
            this.node.insertBefore(actionView.node, this.views[index].node);
        } else {
            this.node.appendChild(actionView.node);
        }
        this.views.splice(index, 0, actionView);
        actionView.container = this;
        makeDraggable(actionView);
    }
};

SequenceView.prototype.remove = function(actionView) {
    var node;
    var position = 0;
    for (var index=0, len=this.views.length; index < len; ++index) {
        if (this.views[index] === actionView) {
            if (this.views.length > 1 && actionView.action) {
                this.attachmentPoint.object[this.attachmentPoint.property].removeAt(position);
            } else {
                this.attachmentPoint.object[this.attachmentPoint.property] = undefined;
            }
            this.views.splice(index, 1);
            this.node.removeChild(actionView.node);
            break;
        }
        if (this.views[index].action) {
            position++;
        }
    }
    
    if (this.views.length === 1) {
        this.attachmentPoint.object[this.attachmentPoint.property] = this.views[0].action;
    }
    
    if (this.views.length < this.min) {
        this.add(new this.defaultView());
    }

    if (this.views.length === 0) {
        node = document.createElement('span');
        node.className = 'undefined';
        node.appendChild(document.createTextNode('undefined'));
        this.node.appendChild(node);
    }
};

SequenceView.prototype.clear = function() {
    clear(this.node);
    if (this.attachmentPoint.object[this.attachmentPoint.property].clear) {
        this.attachmentPoint.object[this.attachmentPoint.property].clear();
    }
    this.views = [];

    if (this.views.length < this.min) {
        this.add(new this.defaultView());
    }
}

SequenceView.prototype.parse = function(stored_actions) {
    var action;

    for(var i=0, ilen=stored_actions.length; i < ilen; ++i) {
        action = new all_actions[stored_actions[i].type].action(stored_actions[i], this);
        if (action) {
            this.add(action);
        } else {
            alert('Unrecognised action: ' + stored_actions[i].type);
        }
    }
}

function ActionSequence(definition) {
    var update_node = document.createElement('button');
    definition = definition || {};
    
    this.actions = [];

    this.parse(definition);
}

ActionSequence.prototype.toJSON = function () {
    return {sequence: this.actions};
}


ActionSequence.prototype.update = function(force) {
    var parent = this.parent;
    return function() {
        parent.update(force);
    }
}

ActionSequence.prototype.exec = function(outer_state) {
    outer_state = outer_state || {};
    var state = {
        result: outer_state.result || '',
        html: outer_state.result || '',
        outer: outer_state,
        variables: {}};
    for (var a=0, len=this.actions.length; a < len; ++a) {
        if (this.actions[a] && this.actions[a].exec && !this.actions[a].disabled) {
            this.actions[a].exec(state);
        }
    }
    return state;
}

ActionSequence.prototype.add = function(action) {
    this.actions.push(action);
};

ActionSequence.prototype.insert = function(action, index) {
    if (index < this.actions.length) {
        this.actions.splice(index, 0, action);
    } else {
        this.actions.push(action);
    }
};

ActionSequence.prototype.remove = function(action) {
    for (var index=0, len=this.actions.length; index < len; ++index) {
        if (this.actions[index] === action) {
            this.actions.splice(index, 1);
            break;
        }
    }
};

ActionSequence.prototype.removeAt = function(index) {
    if (index < this.actions.length) {
        this.actions.splice(index, 1);
    }
};

ActionSequence.prototype.clear = function(action) {
    this.actions = [];
};

ActionSequence.prototype.parse = function(actions) {
    var action;
    actions = actions || [];
    
    for(var i=0, ilen=actions.length; i < ilen; ++i) {
        action = new all_actions[actions[i].type].action(actions[i], this);
        if (action) {
            this.add(action);
        } else {
            alert('Unrecognised action: ' + actions[i].type);
        }
    }
}


function ProcessView(process) {
    var button_node = document.createElement('button');
    var header = document.createElement('div');
    this.process = process || new Process({});
    this.view = new SequenceView({object: this.process, property: 'sequence'});

    this.node = document.createElement('div');
    this.node.appendChild(header);
    
    this.newAction = new SequenceView({object: this, property: 'newAction'}, undefined, PlaceholderActionView, 1, 1);
    this.recycleActions = new SequenceView({object: this, property: 'recycle'});
    
    this.node.className = 'process-view';
    this.auto_update_node = document.createElement('input');
    
    this.auto_update_node.type = 'checkbox';
    //this.auto_update_node.onchange = this.update();
    header.appendChild(this.auto_update_node);
    header.appendChild(document.createTextNode('Automatic Update'));

    button_node.appendChild(document.createTextNode('Update'));
    button_node.onclick = this.update(true);
    header.appendChild(button_node);

    button_node = document.createElement('button');
    button_node.appendChild(document.createTextNode('Load Process'));
    button_node.onclick = this.load();
    header.appendChild(button_node);

    button_node = document.createElement('button');
    button_node.appendChild(document.createTextNode('Save Process'));
    button_node.onclick = this.save();
    header.appendChild(button_node);
    this.title = document.createElement('input');
    this.title.type = 'text';
    this.title.size = 40;
    header.appendChild(this.title);

    button_node = document.createElement('button');
    button_node.appendChild(document.createTextNode('Clear'));
    button_node.onclick = this.clear();
    header.appendChild(button_node);
    
    this.node.appendChild(this.newAction.node);
    this.node.appendChild(this.recycleActions.node);
    this.node.appendChild(document.createElement('br'));
    this.node.appendChild(this.view.node);
    this.view.node.style.clear = 'both';
}

ProcessView.prototype.update = function(force) {
    var that = this;
    return function() {
        var auto = that.auto_update_node.checked;
        var a;
        
        if (force || auto) {
            that.process.exec();
        }
   //     that.view.update();
    }
}

ProcessView.prototype.load = function() {
    var that = this;
    return function() {
        var path = '';
        
        var content;
        var fso, file;
        var filename = that.title.value || 'actions';

        function onload(text) {
            if (text) {
                that.process.parse(text);
                that.view.refresh();
            }
        }
      
        read_file(path + filename, onload);
    }
}

ProcessView.prototype.save = function() {
    var that = this;
    return function () {
        var path = '';
        var fso, file;
        var filename = that.title.value || 'actions';
        
        write_file(path + filename, that.process.serialise());
    };
}

ProcessView.prototype.clear = function() {
    var that = this;
    return function () {
        that.process.clear();
        that.view.clear();
    };
}


function Process(definition) {
    this.sequence = new ActionSequence(definition);
}

Process.prototype.exec = function() {
    this.sequence.exec();
}

Process.prototype.parse = function(content) {
    var process = JSON.parse(content);
    this.sequence.parse(process.sequence);
}

Process.prototype.serialise = function() {
    function filter(k, v) {
        if (k[0] === '_') {
            return undefined;
        }
        return v;
    }
    return JSON.stringify(this.sequence, filter, 2);
}

Process.prototype.clear = function() {
    this.sequence.clear();
}


var log = (function() {
    var my = {};
    var container = document.createElement('div');
    container.className = 'log';
    
    var output_node = document.createElement('pre');
    var close_node = document.createElement('img');
    close_node.src = 'https://cdn.glitch.com/0cc8bf5e-1e21-4e6f-af44-8651d0d1513b%2Fdialog-close.png?1490874110790';
    close_node.className = 'delete-action';
    close_node.onclick = function() {container.style.display = 'none';};
    
    container.appendChild(output_node);
    container.appendChild(close_node);
    
    container.addEventListener('mousedown', function(event) {
        event = event || window.event;
        var sx = event.clientX;
        var sy = event.clientY;
        
        var startRect = container.getBoundingClientRect();
                
        function mouseMove(moveEvent) {
            var deltaX;
            var deltaY;
            moveEvent = moveEvent || window.event;
            deltaX = moveEvent.clientX - sx;
            deltaY = moveEvent.clientY - sy;
            container.style.left = (startRect.left + deltaX) + 'px';
            container.style.top = (startRect.top + deltaY) + 'px';
        };
 
        function mouseUp(mouseUpEvent) {
            document.removeEventListener('mousemove', mouseMove);
            document.removeEventListener('mouseup', mouseUp);
        }
               
        document.addEventListener('mousemove', mouseMove);        
        document.addEventListener('mouseup', mouseUp);        
    });
    
    my.clear = function(text) {
        clear(output_node);
    }

    my.write = function(text) {
        if (!container.parentElement) {
            document.getElementById('content').appendChild(container);
        }
        container.style.display = 'block';
        output_node.appendChild(document.createTextNode(text));
    }
    
    return my;
}());

var menu;

function initialise() {
    var content_node = document.getElementById('content');
    var available_actions_node = document.createElement('div');
    var output_node = document.createElement('div');

    makeAction('Load', load, {parameters: [{name: 'location', title: 'Path:', type: 'string'},
                                           {name: 'process', title: 'Process:', type: 'function'}],
                              output: 'String'}, 'document-open.png');
    makeAction('Save', save, {parameters: [{name: 'location', title: 'Path:', type: 'string'}], output: 'as input'}, 'document-save.png');
    makeAction('Join', 'join', {input: {type: 'Array'}, parameters: [{name: 'separator', title: 'Separator:', type: 'string'}], output: 'String'});
    makeAction('Map', map, {input: {type: 'Array'}, parameters: [{name: 'process', title: 'Process:', type: 'function'}], output: 'Array'});
    makeAction('Split', 'split', {input: {type: 'String'}, parameters: [{name: 'separator', title: 'Separator:', type: 'regexp'}], output: 'Array'});
    makeAction('Grep', grep, {input: {type: 'Array'}, parameters: [{name: 'pattern', title: 'Pattern:', type: 'regexp', initialisation: {expression: '.*'}}], output: 'Array'}, 'edit-find.png');
    makeAction('Prefix', prefix, {input: {type: 'String'}, parameters: [{name: 'text', type: 'text'}], output: 'String'}, 'stock_insert-header.png');
    makeAction('Suffix', suffix, {input: {type: 'String'}, parameters: [{name: 'text', type: 'text'}], output: 'String'}, 'stock_insert-footer.png');
    makeAction('JavaScript', jsFunction, {parameters: [{name: 'text', type: 'text'}], output: ''}, 'stock_insert-footer.png');
    makeAction('Replace', 'replace', {input: {type: 'String'},
                                      parameters: [{name: 'pattern', title: 'Pattern:', type: 'regexp', initialisation: {expression: '.*'}},
                                                   {name: 'replacement', title: 'Replacement:', type: 'string', initialisation: {value: '$&'}}],
                                      output: 'String'},
               'edit-find-replace.png');
    makeAction('If', conditional, {parameters: [{name: 'test', type: 'boolean'},
                                                {name: 'onTrue', title: 'Then:', type: 'function'},
                                                {name: 'onFalse', title: 'Else:', type: 'function'}]});
    makeAction('Array', array, {parameters: [{name: '...'}]});

    menu = new Menu();

    var process = new ProcessView();
    
    content_node.appendChild(process.node);

    content_node.appendChild(document.createElement('br'));
    
    output_node.id = 'output';
    content_node.appendChild(output_node);    
}
