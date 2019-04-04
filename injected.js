// the following code is written in "injected.js" and injected to "fantacy.js" automatically by the simple python script named "make_injection.py".

var chatroom = document.getElementById("chatArea");

var EditorUI = {};
var ToolEvents = {};

var ScreenshotUI = {
    Preview: {added: false, visible: false, element: null}, 
    Instruction: {element: null, added: false},
    sendScreenshotBtn: null, 
    sendScreenshotBtnVisible: false,
};

var EditorStatus = {
    texttool: {}, 
    mouse: {x: 0, y:0, down: false, moved:false}, 
    added: false, 
    currentTool: null, 
    editHistory: [], 
    editFuture: []
};

var access_key = null;
var pending_screenshot = null;  // screenshot to be send.
const host = "http://127.0.0.1:32728"


// object documentation

// EditorUI       The object for accessing editor user interface.
// EditorStatus   The object for storing editor status.


// EditorUI.root               the editor element.
// EditorUI.canvas             the editor canvas.
// EditorUI.ctx                the canvas context

// ScreenshotUI.sendScreenshotBtn  the send screenshot button element.

// EditorStatus.ctxImage     the original context image
// EditorStatus.currentTool  the current selected tool.


var editor_current_color = null;
var Colors = {
    red:    [255,  82,  82],
    yellow: [255, 224,  82],
    green:  [ 82, 255, 115],
    blue:   [ 58, 168, 255],
    white:  [250, 250, 250],
    black:  [ 60,  60,  60]
};

const Tools = {PENCIL: 0, RECT: 1, ARROW: 2, TEXT: 3};
const SVGNS = "http://www.w3.org/2000/svg";

const Icons = {
    // icons source file can be found under "/images", here we store the base64 encoded data URI version of each icon.
    confirm:    "$include<dataurl>(./images/check.svg, image/svg+xml)",
    cancel:     "$include<dataurl>(./images/cross.svg, image/svg+xml)",

    forward:    "$include<dataurl>(./images/forward.svg, image/svg+xml)",
    backward:   "$include<dataurl>(./images/backward.svg, image/svg+xml)",

    discard:    "$include<dataurl>(./images/discard.svg, image/svg+xml)",

    pencil:     "$include<dataurl>(./images/pencil.svg, image/svg+xml)",
    rectangle:  "$include<dataurl>(./images/rect-new.svg, image/svg+xml)",
    arrow:      "$include<dataurl>(./images/line.svg, image/svg+xml)",
    addtext:    "$include<dataurl>(./images/text.svg, image/svg+xml)",

    dot_red:    "$include<dataurl>(./images/dot_red.svg, image/svg+xml)",
    dot_yellow: "$include<dataurl>(./images/dot_yellow.svg, image/svg+xml)",
    dot_green:  "$include<dataurl>(./images/dot_green.svg, image/svg+xml)",
    dot_blue:   "$include<dataurl>(./images/dot_blue.svg, image/svg+xml)",
    dot_white:  "$include<dataurl>(./images/dot_white.svg, image/svg+xml)",
    dot_black:  "$include<dataurl>(./images/dot_black.svg, image/svg+xml)",

    drop_down:  "$include<dataurl>(./images/dropdown.svg, image/svg+xml)",
}

function inject_style(s){
    var stl = document.createElement("style");
    stl.textContent = s;
    document.head.appendChild(stl); 
}

// binary to ascii (utf-8 string to base64 string)
// ============================================================================================
var fromCharCode = String.fromCharCode;
var btoaUTF8 = (function(btoa, replacer){"use strict";
    return function(inputString, BOMit){
        return btoa((BOMit ? "\xEF\xBB\xBF" : "") + inputString.replace(
            /[\x80-\uD7ff\uDC00-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]?/g, replacer
        ));
    }
})(btoa, function(nonAsciiChars){"use strict";
    // make the UTF string into a binary UTF-8 encoded string
    var point = nonAsciiChars.charCodeAt(0);
    if (point >= 0xD800 && point <= 0xDBFF) {
        var nextcode = nonAsciiChars.charCodeAt(1);
        if (nextcode !== nextcode) // NaN because string is 1 code point long
            return fromCharCode(0xef/*11101111*/, 0xbf/*10111111*/, 0xbd/*10111101*/);
        // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        if (nextcode >= 0xDC00 && nextcode <= 0xDFFF) {
            point = (point - 0xD800) * 0x400 + nextcode - 0xDC00 + 0x10000;
            if (point > 0xffff)
                return fromCharCode(
                    (0x1e/*0b11110*/<<3) | (point>>>18),
                    (0x2/*0b10*/<<6) | ((point>>>12)&0x3f/*0b00111111*/),
                    (0x2/*0b10*/<<6) | ((point>>>6)&0x3f/*0b00111111*/),
                    (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
                );
        } else return fromCharCode(0xef, 0xbf, 0xbd);
    }
    if (point <= 0x007f) return inputString;
    else if (point <= 0x07ff) {
        return fromCharCode((0x6<<5)|(point>>>6), (0x2<<6)|(point&0x3f));
    } else return fromCharCode(
        (0xe/*0b1110*/<<4) | (point>>>12),
        (0x2/*0b10*/<<6) | ((point>>>6)&0x3f/*0b00111111*/),
        (0x2/*0b10*/<<6) | (point&0x3f/*0b00111111*/)
    );
});

// ascii to binary (base64 string to utf-8 string)
// ============================================================================================
var clz32 = Math.clz32 || (function(log, LN2){"use strict";
    return function(x) {return 31 - log(x >>> 0) / LN2 | 0};
})(Math.log, Math.LN2);
var fromCharCode = String.fromCharCode;
var atobUTF8 = (function(atob, replacer){"use strict";
    return function(inputString, keepBOM){
        if (!keepBOM && inputString.substring(0,3) === "\xEF\xBB\xBF")
            inputString = inputString.substring(3); // eradicate UTF-8 BOM
        // 0xc0 => 0b11000000; 0xff => 0b11111111; 0xc0-0xff => 0b11xxxxxx
        // 0x80 => 0b10000000; 0xbf => 0b10111111; 0x80-0xbf => 0b10xxxxxx
        return atob(inputString).replace(/[\xc0-\xff][\x80-\xbf]*/g, replacer);
    }
})(atob, function(encoded){"use strict";
    var codePoint = encoded.charCodeAt(0) << 24;
    var leadingOnes = clz32(~codePoint);
    var endPos = 0, stringLen = encoded.length;
    var result = "";
    if (leadingOnes < 5 && stringLen >= leadingOnes) {
        codePoint = (codePoint<<leadingOnes)>>>(24+leadingOnes);
        for (endPos = 1; endPos < leadingOnes; ++endPos)
            codePoint = (codePoint<<6) | (encoded.charCodeAt(endPos)&0x3f/*0b00111111*/);
        if (codePoint <= 0xFFFF) { // BMP code point
            result += fromCharCode(codePoint);
        } else if (codePoint <= 0x10FFFF) {
            // https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            result += fromCharCode(
            (codePoint >> 10) + 0xD800,  // highSurrogate
            (codePoint & 0x3ff) + 0xDC00 // lowSurrogate
            );
        } else endPos = 0; // to fill it in with INVALIDs
    }
    for (; endPos < stringLen; ++endPos) result += "\ufffd"; // replacement character
    return result;
});

class duckDrop extends Event{
    constructor(target_element, x, y, df=null){

    super("drop");

    var de = new DragEvent("drop");
    if (df==null){
        df = new DataTransfer();
    }

    this.clientX = x;
    this.clientY = y;
    this.layerX = x;
    this.layerY = y;
    this.pageX = x;
    this.pageY = y;
    this.screenX = x;
    this.screenY = y;
    this.x = x;
    this.y = y;

    this.movementX = 0;
    this.movementY = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this.altKey = false;
    this.button = 0;
    this.buttons = 0;
    this.cancelBubble = false;

    this.ctrlKey = false;
    this.dataTransfer = df;
    this.detail = 0;
    this.metaKey = false;
    this.mozInputSource = 1;
    this.mozPressure = 0;
    this.rangeOffset = 0;
    this.rangeParent = null;
    this.region = "";
    this.relatedTarget = null;
    this.shiftKey = false;
    this.view = window;
    this.which = 1;
    }
}

function duckDataTransfer(files){
    this.dropEffect = "move";
    this.effectAllowed = "uninitialized";
    this.files = files;
    this.mozCursor = "auto";
    this.mozItemCount = files.length;
    this.mozSourceNode = null;
    this.mozUserCancelled = false;
    this.types = ["application/x-moz-file", "Files"];
}

function show_instructions(){
    if (!ScreenshotUI.Instruction.added){
        
        var welcome = "$include<single-line>(./instructions.html)";
    
        ScreenshotUI.Instruction.element = document.createElement("div");
        ScreenshotUI.Instruction.element.className = "screenshot_overlay";
        ScreenshotUI.Instruction.element.id = "screenshot_overlay";

        var wel = document.createElement("div");
        wel.innerHTML = welcome;
        wel.className = "screenshot_welcome";
    
        ScreenshotUI.Instruction.element.appendChild(wel);
        document.body.appendChild(ScreenshotUI.Instruction.element);
    
        ScreenshotUI.Instruction.element.ondblclick = (e)=>{
            ScreenshotUI.Instruction.element.style.opacity = '0';
            setTimeout(()=>{ScreenshotUI.Instruction.element.style.display="none";}, 510);
        }
    }else{
        ScreenshotUI.Instruction.element.elementerlay.style.display="block";
        ScreenshotUI.Instruction.element.style.opacity = '1';
    }
}

function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1]);
  
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
  
    // create a view into the buffer
    var ia = new Uint8Array(ab);
  
    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
  
    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  
  }

function show_preview(){

    if (!ScreenshotUI.Preview.added){
        inject_style(".thumb_preview {display: block; background-color: #ffe; position: fixed; border-radius: 10px; border: 8px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3); transition: opacity 0.5s; max-width: 200px; max-height: 200px;}")
        ScreenshotUI.Preview.element = document.createElement("img");
        ScreenshotUI.Preview.element.className = "thumb_preview";
        ScreenshotUI.Preview.element.setAttribute("title", "Click to edit, Right-click to hide.");
        ScreenshotUI.Preview.element.onclick = function(e){
            hide_preview();
            show_editor();
        }

        ScreenshotUI.Preview.element.oncontextmenu = function(e){
            hide_preview();
            return false;
        };

        ScreenshotUI.Preview.element.onmouseenter = function(e){
            if (ScreenshotUI.Preview.visible){
                ScreenshotUI.Preview.element.style.opacity = "0.3";
            }
        };
        
        ScreenshotUI.Preview.element.onmouseleave = function(e){
            if(ScreenshotUI.Preview.visible){
                ScreenshotUI.Preview.element.style.opacity = "1";
            }
        };

        hide_preview();
        document.body.appendChild(ScreenshotUI.Preview.element);
        ScreenshotUI.Preview.added = true;
    }

    if (pending_screenshot){
        ScreenshotUI.Preview.visible = true;
        var fr = new FileReader();
        fr.onload = function(e){
            ScreenshotUI.Preview.element.src = e.target.result;
            ScreenshotUI.Preview.element.onload = function(ee){
                var snd_bbox = ScreenshotUI.sendScreenshotBtn.getBoundingClientRect();
                var cx = (snd_bbox.left + snd_bbox.right) / 2;

                var ph = ScreenshotUI.Preview.element.offsetHeight;
                var pw = ScreenshotUI.Preview.element.offsetWidth;
                if (ScreenshotUI.Preview.visible){
                    ScreenshotUI.Preview.element.style.left = (cx - (pw / 2)) + "px" ;
                    ScreenshotUI.Preview.element.style.top = (snd_bbox.top - ph - 5) + "px";
                    ScreenshotUI.Preview.element.style.visibility = "visible";
                    ScreenshotUI.Preview.element.style.opacity = 1;
                }
            };
        };
        fr.readAsDataURL(pending_screenshot);
    }

}

function measure_text_size(text, font_size, font_family="Sans"){
    ensure_texttool_template();
    EditorUI.textTemplate.measurediv.textContent = text;
    EditorUI.textTemplate.measurediv.style.fontSize = font_size;
    EditorUI.textTemplate.measurediv.style.fontFamily = font_family;
    return {width: EditorUI.textTemplate.measurediv.offsetWidth, height: EditorUI.textTemplate.measurediv.offsetHeight};
}

function editor_texttool_setcolor(color){
    EditorUI.textTemplate.rect.setAttribute("fill", "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")");
}

function editor_texttool_settext(text, font_size, font_family="Sans"){
    ensure_texttool_template();

    sz = measure_text_size(text, font_size, font_family);
    
    padded = {height: 0, width: 0};
    padded.height = sz.height + 5 * 2;
    padded.width = sz.width + padded.height

    EditorUI.textTemplate.element.setAttribute("width", padded.width);
    EditorUI.textTemplate.element.setAttribute("height", padded.height);
    EditorUI.textTemplate.element.style.borderRadius = padded.height + "px";

    EditorUI.textTemplate.mask_text.setAttribute("style", "font-size: " + font_size + "; font-family: " + font_family + "; font-weight: 900;");
    EditorUI.textTemplate.mask_text.textContent = text;
    EditorUI.textTemplate.mask_text.fontSize = font_size;
    EditorUI.textTemplate.mask_text.fontFamily = font_family;
}

function hide_textprompt(canceled=false){
    EditorStatus.texttool.promptVisible = false;
    EditorUI.textInputOverlay.style.opacity = 0;
    EditorUI.textInputOverlay.style.pointerEvents = 'none';

    if (canceled){
        if (EditorUI.textInputCancel.onclick){
            EditorUI.textInputCancel.onclick();
        }
    }

    setTimeout(() => {
        if (!EditorStatus.texttool.promptVisible){
            EditorUI.textInputOverlay.style.visibility = "hidden";
        }
    }, 500);
}

function show_textprompt(){
    EditorStatus.texttool.promptVisible = true;
    EditorUI.textInputOverlay.style.opacity = 1;
    EditorUI.textInputOverlay.style.visibility = "visible";
    EditorUI.textInputOverlay.style.pointerEvents = 'all';
}

function clear_textprompt(){
    EditorUI.textInput.value = "";
}

function editor_PromptforText(cb_confirm, cb_canceled){
    EditorUI.textInputConfirm.onclick = ()=>{
        hide_textprompt();
        cb_confirm(EditorUI.textInput.value);

        EditorUI.textInputCancel.onclick = null;
        EditorUI.textInputConfirm.onclick = null;
    };

    EditorUI.textInputCancel.onclick = ()=>{
        hide_textprompt();
        cb_canceled(EditorUI.textInput.value);

        EditorUI.textInputCancel.onclick = null;
        EditorUI.textInputConfirm.onclick = null;
    };

    EditorUI.textInput.onkeypress = (e)=>{

        if (e.which == 13){

            if (EditorUI.textInput.value.length > 0){
                EditorUI.textInputConfirm.onclick();
            }else{
                EditorUI.textInputCancel.onclick();
            }
        }
        if (e.which == 27){
            EditorUI.textInputCancel.onclick();
        }
    }

    show_textprompt();
    EditorUI.textInput.focus();
}

function ensure_texttool_template(){
    if (EditorUI.textTemplate){
        return;
    } else {

        EditorUI.textTemplate = {wrapper: document.createElement("div"), element: document.createElementNS(SVGNS, "svg:svg"), measurediv: document.createElement("div")};
        // make div for textsize measurement.
        inject_style(".editor_texttool_measurement {display: block; visibility:hidden/*visible*/; padding: 0; margin: 0; border: none; position: absolute; top: 0; left: 0;}");
        EditorUI.textTemplate.measurediv.className = "editor_texttool_measurement";

        // make svg template
        inject_style(".editor_texttool_template_wrapper {visibility:hidden/*visible*/; position: absolute; top: 0; left: 0;}");
        EditorUI.textTemplate["element"].style.borderRadius = "40px";
        EditorUI.textTemplate["element"].setAttribute("xmlns", SVGNS);
        EditorUI.textTemplate["element"].setAttribute("xmlns:svg", SVGNS);

        EditorUI.textTemplate["wrapper"].className = "editor_texttool_template_wrapper"
        EditorUI.textTemplate["wrapper"].appendChild(EditorUI.textTemplate.element)
        
        EditorUI.textTemplate["style"] = document.createElement("style");

        EditorUI.textTemplate["rect"] = document.createElementNS(SVGNS, "svg:rect");
        EditorUI.textTemplate["rect"].setAttribute("width", "100%");
        EditorUI.textTemplate["rect"].setAttribute("height", "100%");
        EditorUI.textTemplate["rect"].setAttribute("fill", "#fff");
        EditorUI.textTemplate["rect"].setAttribute("x", "0");
        EditorUI.textTemplate["rect"].setAttribute("y", "0");
        EditorUI.textTemplate["rect"].setAttribute("mask", "url(#mask_text)");

        EditorUI.textTemplate["mask"] = document.createElementNS(SVGNS, "svg:mask");
        EditorUI.textTemplate["mask"].id = "mask_text";

        EditorUI.textTemplate["mask_rect"] = document.createElementNS(SVGNS, "svg:rect");
        EditorUI.textTemplate["mask_rect"].setAttribute("width", "100%");
        EditorUI.textTemplate["mask_rect"].setAttribute("height", "100%");
        EditorUI.textTemplate["mask_rect"].setAttribute("fill", "#fff");
        EditorUI.textTemplate["mask_rect"].setAttribute("x", "0");
        EditorUI.textTemplate["mask_rect"].setAttribute("y", "0");

        EditorUI.textTemplate["mask_text"] = document.createElementNS(SVGNS, "svg:text");
        EditorUI.textTemplate["mask_text"].setAttribute("class", "cutout_text"); // .className property cannot be used here.
        EditorUI.textTemplate["mask_text"].setAttribute("fill", "#000");
        EditorUI.textTemplate["mask_text"].setAttribute("dominantBaseline", "middle");
        EditorUI.textTemplate["mask_text"].setAttribute("text-anchor", "middle");
        EditorUI.textTemplate["mask_text"].setAttribute("x", "50%");
        EditorUI.textTemplate["mask_text"].setAttribute("y", "50%");
        EditorUI.textTemplate["mask_text"].setAttribute("dy", ".3em");

        EditorUI.textTemplate["mask"].appendChild(EditorUI.textTemplate["mask_rect"]);
        EditorUI.textTemplate["mask"].appendChild(EditorUI.textTemplate["mask_text"]);

        EditorUI.textTemplate["element"].append(EditorUI.textTemplate["style"]);
        EditorUI.textTemplate["element"].append(EditorUI.textTemplate["rect"]);
        EditorUI.textTemplate["element"].append(EditorUI.textTemplate["mask"]);

        document.body.appendChild(EditorUI.textTemplate.wrapper);
        document.body.appendChild(EditorUI.textTemplate.measurediv);

        // append the text editor input.
        inject_style(".editor_textinput_overlay {background-color: rgba(0,0,0,0.8); position: absolute; left: 0; top: 0; width: 100%; height: 100%; line-height: 50px; transition: opacity 0.5s;}");
        inject_style(".editor_textinput_overlay:before {content:' '; display: inline-block; height: 100%; margin-right:-0.25em; vertical-align: middle;}");
        inject_style(".editor_textinput {float: left; border:none; display: inline-block; font-size: 25px; background-color: white; border-radius: 40px; height: 40px; padding:5px 20px; box-sizing: border-box;}");
        inject_style(".editor_textinput_wrapper {display: inline-block;}");
        inject_style(".editor_textinput_button {float: left; display: inline-block; height: 40px; width: 40px; margin: 0 10px; border: 4px solid rgba(0,0,0,0);}");
        inject_style(".editor_textinput_selection {float:left; border:none; display: inline-block; font-size: 15px; border-radius: 40px; height: 40px; width: 80px; padding:5px 10px; box-sizing: border-box; margin: 0 10px;}");
        inject_style(".editor_textinput_selection {background: url(" + Icons.drop_down + ") no-repeat 100% 50%; background-color: white; -moz-appearance: none; -webkit-appearance: none; appearance: none;}");

        EditorUI.textInputOverlay = document.createElement("div");
        EditorUI.textInputOverlay.className = "editor_textinput_overlay";
        EditorUI.textInputOverlay.style.visibility = "hidden";
        EditorUI.textInputOverlay.style.opacity = 0;

        EditorUI.textInputWrapper = document.createElement("div");
        EditorUI.textInputWrapper.className = "editor_textinput_wrapper";


        EditorUI.textInput = document.createElement("input");
        EditorUI.textInput.className = "editor_textinput";
        EditorUI.textInputConfirm = create_toolbar_item(Icons.confirm);
        EditorUI.textInputCancel = create_toolbar_item(Icons.cancel);
        EditorUI.textInputConfirm.className += " editor_textinput_button";
        EditorUI.textInputCancel.className += " editor_textinput_button";

        options = [["小", "10px"], ["中", "20px", true], ["大", "40px"], ["超大", "50px"]];

        EditorUI.textSizeSelection = document.createElement("select");
        EditorUI.textSizeSelection.className = "editor_textinput_selection";
        for (var idx=0; idx < options.length; idx++){
            var opt = document.createElement("option");
            opt.textContent = options[idx][0];
            opt.value = options[idx][1];
            if (options[idx].length > 2){
                opt.selected = true;
            }
            EditorUI.textSizeSelection.appendChild(opt);
        }
        
        EditorUI.textInputWrapper.appendChild(EditorUI.textSizeSelection);
        EditorUI.textInputWrapper.appendChild(EditorUI.textInput);
        EditorUI.textInputWrapper.appendChild(EditorUI.textInputConfirm);
        EditorUI.textInputWrapper.appendChild(EditorUI.textInputCancel);
        
        EditorUI.textInputOverlay.appendChild(EditorUI.textInputWrapper);

        EditorUI.root.appendChild(EditorUI.textInputOverlay);
    }
}

function editor_update_context_styles(){
    EditorUI.ctx.strokeStyle = "rgb(" + editor_current_color[0] + ", " + editor_current_color[1] + ", " + editor_current_color[2] + ")";
    EditorUI.ctx.fillStyle = "rgb(" + editor_current_color[0] + ", " + editor_current_color[1] + ", " + editor_current_color[2] + ")";
    EditorUI.ctx.lineCap = "round";
    EditorUI.ctx.lineWidth = 3;
}

function select_tool(toolele, toolname){

    for (var idx=0; idx < EditorUI.toolbarItems.length; idx++){
        if (EditorUI.toolbarItems[idx].attributes["selected"].value == "true"){

            // deselect every tool.
            EditorUI.toolbarItems[idx].setAttribute("selected", false);

            if (typeof EditorUI.toolbarItems[idx].toolId !== 'undefined'){
                if (EditorUI.toolbarItems[idx].toolId != toolname){
                    // be sure we are not resetting the tool (we are exiting the tool).
                    if (typeof ToolEvents[EditorUI.toolbarItems[idx].toolId] !== "undefined" && typeof ToolEvents[EditorUI.toolbarItems[idx].toolId].exit !== "undefined"){
                        // if exit Events defined for this tool
                        ToolEvents[EditorUI.toolbarItems[idx].toolId].exit();
                    }
                }
                
            }
        }
    }

    // select the specified tool
    toolele.setAttribute("selected", true);

    if (typeof toolele.toolId !== 'undefined'){
        if (EditorStatus.currentTool == toolname){
            // we are resetting the tool.
            if (typeof ToolEvents[toolele.toolId] !== "undefined" && typeof ToolEvents[toolele.toolId].reset !== "undefined"){
                // if exit Events defined for this tool
                ToolEvents[toolele.toolId].reset();
            }
        } else {
            if (typeof ToolEvents[toolele.toolId] !== "undefined" && typeof ToolEvents[toolele.toolId].enter !== "undefined"){
                // if exit Events defined for this tool
                ToolEvents[toolele.toolId].enter();
            }
        }
    }
    
    EditorStatus.currentTool = toolname;

    // redraw image.
    editor_restore_image();
    editor_update_context_styles();
}

function select_color(colorele, colorname){

    for (var idx=0; idx < EditorUI.colorbarItems.length; idx++){
        EditorUI.colorbarItems[idx].setAttribute("selected", false);
    }
    colorele.setAttribute("selected", true);
    editor_current_color = colorname;

    editor_update_context_styles();

    editor_texttool_update_cache((img)=>{
        EditorUI.ctx.drawImage(img, EditorStatus.texttool.location.x, EditorStatus.texttool.location.y);
        EditorUI.ctx.strokeRect(EditorStatus.texttool.location.x - 3 , EditorStatus.texttool.location.y - 3, EditorStatus.texttool.cachedImage.width + 6, EditorStatus.texttool.cachedImage.height + 6);
    });
}

function create_toolbar_item(icon){
    var ele = document.createElement("img");
    ele.className = "editor_toolbar_item";
    ele.setAttribute("selected", false);
    ele.src = icon;
    return ele;
}

function assign_toolbar_item_id(element, id){
    element.toolId = id;
}

function editor_undo(){

    if (typeof ToolEvents[EditorStatus.currentTool] !== "undefined" && typeof ToolEvents[EditorStatus.currentTool].undo !== "undefined"){
        console.log("undo procedure is defined for current tool:", EditorStatus.currentTool);                    
        rtn = ToolEvents[EditorStatus.currentTool].undo();
        if (typeof rtn !== "undefined" && rtn !== true){
            console.log("undo procedure is blocked.");            
            return;
        }
    }

    if (EditorStatus.editHistory.length > 0){ // if we can redo
        var state = EditorStatus.editHistory.pop();
        EditorStatus.editFuture.push(EditorStatus.currentImage);
        EditorStatus.currentImage = state;

        editor_restore_image();
    }
}

function editor_redo(){

    if (typeof ToolEvents[EditorStatus.currentTool] !== "undefined" && typeof ToolEvents[EditorStatus.currentTool].redo !== "undefined"){
        console.log("redo procedure is defined for current tool:", EditorStatus.currentTool);                    
        rtn = ToolEvents[EditorStatus.currentTool].redo();
        if (typeof rtn !== "undefined" && rtn !== true){
            console.log("redo procedure is blocked.");
            return;
        }
    }

    if (EditorStatus.editFuture.length > 0){ // if we can redo
        var state = EditorStatus.editFuture.pop();
        EditorStatus.editHistory.push(EditorStatus.currentImage);
        EditorStatus.currentImage = state;

        editor_restore_image();
    }
}

function update_pending_screenshot_fromEditor(noHistory=false){
    
    // if we did some edit: 1) add to history, 2) clear the future
    if (!noHistory){
        if (EditorStatus.editHistory.length > 20){
            // we are holding too much history
            EditorStatus.editHistory.shift(); // remove the first(the oldest) item in history. 
        }
        EditorStatus.editHistory.push(EditorStatus.currentImage);
        EditorStatus.editFuture.length = 0;  // this will clear the future array.
    }

    EditorStatus.currentImage = EditorUI.canvas.toDataURL();
    var b = dataURItoBlob(EditorStatus.currentImage);
    pending_screenshot = new File([b], "capture.png", {type: 'image/png'});

}

function editor_restore_image(cb_finished){
    var img = new Image()
    img.onload = ()=>{
        EditorUI.ctx.drawImage(img, 0, 0);
        if (cb_finished){
            cb_finished(img);
        }
    }
    img.src = EditorStatus.currentImage;
}

function editor_texttool_update_cache(cb_cacheloaded){
    if (EditorStatus.currentTool == Tools.TEXT && EditorStatus.texttool.text != null){
        // update the cached image.
        editor_texttool_setcolor(editor_current_color);
        var img = new Image();
        img.onload = function(){
            if (cb_cacheloaded){
                cb_cacheloaded(img);
            }
        } 
        EditorStatus.texttool.cachedImage = img;
        img.src = "data:image/svg+xml;base64," + btoaUTF8(EditorUI.textTemplate.element.outerHTML);
    }
}

function editor_startTextProcedure(){
    editor_PromptforText(
        (txt)=>{
            // on_confirm
            editor_texttool_settext(txt, EditorUI.textSizeSelection.options[EditorUI.textSizeSelection.selectedIndex].value);

            EditorStatus.texttool.text = txt;
            EditorStatus.texttool.location = {x: EditorStatus.mouse.x, y: EditorStatus.mouse.y}; 
            
            editor_texttool_update_cache((img)=>{
                EditorUI.ctx.drawImage(img, EditorStatus.mouse.x, EditorStatus.mouse.y);
                EditorUI.ctx.strokeRect(EditorStatus.texttool.location.x - 3 , EditorStatus.texttool.location.y - 3, EditorStatus.texttool.cachedImage.width + 6, EditorStatus.texttool.cachedImage.height + 6);
            });
        },
        (txt)=>{
            // on_cancel
            EditorStatus.texttool.text = null;
        }
    );
}

function bind_canvas_events(){
    EditorUI.canvas.onmousedown = (e)=>{

        // console.log("Mouse Down.");
        var x = (e.layerX-10) * (EditorStatus.ctxImage.width / (EditorUI.canvas.offsetWidth-20));
        var y = (e.layerY-10) * (EditorStatus.ctxImage.width / (EditorUI.canvas.offsetWidth-20));

        EditorStatus.mouse = {x: x, y: y};
        EditorStatus.mouse.downLocation = {x: x, y: y};
        EditorStatus.mouse.down = true;
        EditorStatus.mouse.moved = false;

    };

    EditorUI.canvas.onmousemove = (e)=>{
        if (!EditorStatus.mouse.down) return;
        // console.log("Mouse Move.");
        
        EditorStatus.mouse.moved = true;

        EditorStatus.mouse.previousLocation = {x: EditorStatus.mouse.x, y: EditorStatus.mouse.y};

        // offset 10 px for border: EditorUI.canvas.style.borderWidth = "10px";
        var x = (e.layerX-10) * (EditorStatus.ctxImage.width / (EditorUI.canvas.offsetWidth-20)); 
        var y = (e.layerY-10) * (EditorStatus.ctxImage.width / (EditorUI.canvas.offsetWidth-20));

        EditorStatus.mouse.x = x;
        EditorStatus.mouse.y = y;

        editor_update_context_styles();

        if (EditorStatus.currentTool == Tools.PENCIL){
            EditorUI.ctx.beginPath();
            EditorUI.ctx.moveTo(EditorStatus.mouse.previousLocation.x, EditorStatus.mouse.previousLocation.y);
            EditorUI.ctx.lineTo(EditorStatus.mouse.x, EditorStatus.mouse.y);
            EditorUI.ctx.stroke();
        } else if (EditorStatus.currentTool == Tools.ARROW){
            // restore the current image and draw arrow from start location to end location.

            editor_restore_image((img)=>{
                dx = EditorStatus.mouse.x - EditorStatus.mouse.downLocation.x;
                dy = EditorStatus.mouse.y - EditorStatus.mouse.downLocation.y;
                
                var arrow_length = Math.sqrt(dx*dx + dy*dy);
                var head_size = arrow_length * 0.15;
                head_size = head_size < 10 ? 10 : head_size;
                head_size = head_size > 40 ? 40 : head_size;
                var head_height = head_size / 1.8;

                var hratio = head_size / arrow_length;
                var neck_point = {x: EditorStatus.mouse.x - dx * hratio, y: EditorStatus.mouse.y - dy * hratio};
                var neck_point_back = {x: EditorStatus.mouse.x - dx * (hratio * 1.1), y: EditorStatus.mouse.y - dy * (hratio * 1.1)};

                var vperp = {x: -dy/arrow_length, y: dx/arrow_length};
                
                EditorUI.ctx.beginPath();
                EditorUI.ctx.moveTo(EditorStatus.mouse.downLocation.x, EditorStatus.mouse.downLocation.y);
                EditorUI.ctx.lineTo(neck_point.x + vperp.x * head_height / 3, neck_point.y + vperp.y * head_height / 3);
                EditorUI.ctx.lineTo(neck_point_back.x + vperp.x * head_height, neck_point_back.y + vperp.y * head_height);
                EditorUI.ctx.lineTo(EditorStatus.mouse.x, EditorStatus.mouse.y);
                EditorUI.ctx.lineTo(neck_point_back.x - vperp.x * head_height, neck_point_back.y - vperp.y * head_height);
                EditorUI.ctx.lineTo(neck_point.x - vperp.x * head_height / 3, neck_point.y - vperp.y * head_height / 3);
                EditorUI.ctx.closePath()
                EditorUI.ctx.fill();

                if (!EditorStatus.mouse.down){
                    update_pending_screenshot_fromEditor(true);
                }
            });

        } else if (EditorStatus.currentTool == Tools.RECT){
            editor_restore_image((img)=>{
                dx = EditorStatus.mouse.x - EditorStatus.mouse.downLocation.x;
                dy = EditorStatus.mouse.y - EditorStatus.mouse.downLocation.y;
                EditorUI.ctx.strokeRect(EditorStatus.mouse.downLocation.x, EditorStatus.mouse.downLocation.y, dx, dy);
            
                if (!EditorStatus.mouse.down){
                    update_pending_screenshot_fromEditor(true);
                }
            });
        } else if (EditorStatus.currentTool == Tools.TEXT) {

            if (EditorStatus.texttool.text){
                editor_restore_image((img)=>{
                    var dx = (EditorStatus.mouse.x - EditorStatus.mouse.previousLocation.x);
                    var dy = (EditorStatus.mouse.y - EditorStatus.mouse.previousLocation.y);
                    var r = (EditorStatus.ctxImage.width / EditorUI.canvas.offsetWidth);

                    EditorStatus.texttool.location.x += dx;
                    EditorStatus.texttool.location.y += dy;

                    EditorUI.ctx.drawImage(EditorStatus.texttool.cachedImage, EditorStatus.texttool.location.x, EditorStatus.texttool.location.y);
                    EditorUI.ctx.strokeRect(EditorStatus.texttool.location.x - 3 , EditorStatus.texttool.location.y - 3, EditorStatus.texttool.cachedImage.width + 6, EditorStatus.texttool.cachedImage.height + 6);
                });
            }
        }
    };

    EditorUI.canvas.onmouseup = (e) => {
        if (!EditorStatus.mouse.down) return;
        EditorStatus.mouse.down = false;
        EditorStatus.mouse.down = false;

        // console.log("Mouse Up.");
        if (EditorStatus.currentTool == Tools.PENCIL){
            // update image.
            update_pending_screenshot_fromEditor()
        } else if (EditorStatus.currentTool == Tools.ARROW){
            update_pending_screenshot_fromEditor()
        } else if (EditorStatus.currentTool == Tools.RECT){
            update_pending_screenshot_fromEditor()
        } else if (EditorStatus.currentTool == Tools.TEXT) {
            if (EditorStatus.texttool.text == null){
                if (!EditorStatus.mouse.moved){ // click when no text is defined.
                    editor_startTextProcedure();
                }
            } else {
                if (!EditorStatus.mouse.moved){ // click when text is defined.
                    var img = new Image();
                    img.onload = ()=>{ 
                        EditorUI.ctx.drawImage(img, 0, 0);
                        EditorUI.ctx.drawImage(EditorStatus.texttool.cachedImage, EditorStatus.texttool.location.x, EditorStatus.texttool.location.y);
                        update_pending_screenshot_fromEditor();
                    }
                    img.src = EditorStatus.currentImage;
                    EditorStatus.texttool.text = null;
                }
            }
        }
    };
}

function add_editor(){
    if (!EditorStatus.added){
        inject_style("$include<single-line>(./editor.css)");

        EditorStatus.mouse = {};

        EditorUI.root = document.createElement("div");
        EditorUI.root.className = "editor";

        EditorUI.canvas = document.createElement("canvas");
        EditorUI.canvas.className = "editor_canvas";

        EditorUI.ctx = EditorUI.canvas.getContext("2d");

        bind_canvas_events();

        EditorUI.toolbar = document.createElement("div");
        EditorUI.toolbar.className = "editor_toolbar";

        EditorUI.deliverBtn = create_toolbar_item(Icons.confirm);
        EditorUI.deliverBtn.onclick = function(){
            hide_editor();
            send_pending_screenshot();
        }; EditorUI.deliverBtn.title = "发送截图";

        EditorUI.quitEditingBtn = create_toolbar_item(Icons.cancel);
        EditorUI.quitEditingBtn.onclick = function(){
            hide_editor();
        }; EditorUI.quitEditingBtn.title = "隐藏编辑器";

        var undobutton = create_toolbar_item(Icons.backward);
        undobutton.onclick = function(){editor_undo()};
        undobutton.title = "撤销";
        
        var redobutton = create_toolbar_item(Icons.forward);
        redobutton.title = "重做";
        redobutton.onclick = function(){editor_redo()};


        var drawbox = create_toolbar_item(Icons.rectangle);
        assign_toolbar_item_id(drawbox, Tools.RECT);
        drawbox.onclick = function(){select_tool(drawbox, Tools.RECT);};
        drawbox.title = "绘制工具: 矩形";

        var pencil = create_toolbar_item(Icons.pencil);
        assign_toolbar_item_id(pencil, Tools.PENCIL);
        pencil.onclick = function(){select_tool(pencil, Tools.PENCIL);};
        pencil.title = "绘制工具: 画笔";

        var arrowtool = create_toolbar_item(Icons.arrow);
        assign_toolbar_item_id(arrowtool, Tools.ARROW);
        arrowtool.onclick = function(){
            select_tool(arrowtool, Tools.ARROW);
        }; arrowtool.title = "绘制工具: 箭头";
        
        EditorStatus.texttool = {fontsize: 1, text: null};

        ToolEvents[Tools.TEXT] = {
            enter: ()=>{
                EditorStatus.texttool.text = null;
            },
            exit: ()=>{
                if (EditorStatus.texttool.text){
                    // if the pending text is not placed down.
                    EditorStatus.texttool.text = null;
                    editor_restore_image();
                } else {
                    // if there is no pending text.
                }

                if (EditorStatus.texttool.promptVisible){
                    hide_textprompt(true);
                }
            },
            reset: ()=>{
                // the tool icon is clicked for a second time.
                if (EditorStatus.texttool.text){
                    
                    editor_PromptforText(
                        (txt)=>{
                            // on_confirm
                            // we are changing text here.
                            editor_texttool_settext(txt, EditorUI.textSizeSelection.options[EditorUI.textSizeSelection.selectedIndex].value);

                            EditorStatus.texttool.text = txt;
                            EditorStatus.texttool.location = {x: EditorStatus.mouse.x, y: EditorStatus.mouse.y}; 
                            
                            editor_restore_image((background)=>{
                                editor_texttool_update_cache((img)=>{
                                    EditorUI.ctx.drawImage(img, EditorStatus.mouse.x, EditorStatus.mouse.y);
                                    EditorUI.ctx.strokeRect(EditorStatus.texttool.location.x - 3 , EditorStatus.texttool.location.y - 3, EditorStatus.texttool.cachedImage.width + 6, EditorStatus.texttool.cachedImage.height + 6);
                                });
                            });
                        },
                        (txt)=>{
                            EditorStatus.texttool.text = null;
                        }
                    );
                } else {
                    // we are initializing a new text procedure:
                    EditorStatus.mouse.x = EditorStatus.ctxImage.width / 2
                    EditorStatus.mouse.y = EditorStatus.ctxImage.height / 2
                    editor_startTextProcedure();
                }
            },
            redo: ()=>{
                if (EditorStatus.texttool.text) {
                    console.log("texttool.redo() blocked the redo procedure.");
                    EditorStatus.texttool.text = null;
                    editor_restore_image();
                    return false;
                }
                return true;
            },
            undo: ()=>{
                if (EditorStatus.texttool.text) {
                    console.log("texttool.undo() blocked the redo procedure.");
                    EditorStatus.texttool.text = null;
                    editor_restore_image();
                    return false;
                }
                return true;
            }
        };

        var texttool = create_toolbar_item(Icons.addtext);
        assign_toolbar_item_id(texttool, Tools.TEXT);
        texttool.onclick = function(){
            select_tool(texttool, Tools.TEXT);
        }; texttool.title = "添加文字";

        var discard = create_toolbar_item(Icons.discard);
        discard.onclick = function(){
            hide_editor();
            hide_sendscreenshot_button();
            pending_screenshot = null;
            EditorStatus.editHistory.length = 0;
            EditorStatus.editFuture.length = 0;
        }; discard.title = "丢弃截图";

        var color_white = create_toolbar_item(Icons.dot_white);
        var color_black = create_toolbar_item(Icons.dot_black);
        var color_red = create_toolbar_item(Icons.dot_red);
        var color_yellow = create_toolbar_item(Icons.dot_yellow);
        var color_green = create_toolbar_item(Icons.dot_green);
        var color_blue = create_toolbar_item(Icons.dot_blue);

        color_white.onclick = () => {select_color(color_white, Colors.white)}; 
        color_black.onclick = () => {select_color(color_black, Colors.black)};
        color_red.onclick = () => {select_color(color_red, Colors.red)};
        color_yellow.onclick = () => {select_color(color_yellow, Colors.yellow)};
        color_green.onclick = () => {select_color(color_green, Colors.green)};
        color_blue.onclick = () => {select_color(color_blue, Colors.blue)};

        var toolbarItems = [];
        var colorbarItems = [];

        toolbarItems.push(discard);
        toolbarItems.push(undobutton);
        toolbarItems.push(redobutton);
        toolbarItems.push(pencil);
        toolbarItems.push(drawbox);
        toolbarItems.push(arrowtool);
        toolbarItems.push(texttool);

        colorbarItems.push(color_red);
        colorbarItems.push(color_yellow);
        colorbarItems.push(color_green);
        colorbarItems.push(color_blue);
        colorbarItems.push(color_white);
        colorbarItems.push(color_black);

        EditorUI["toolbarItems"] = toolbarItems;
        EditorUI["colorbarItems"] = colorbarItems;

        for (var idx=0; idx < toolbarItems.length; idx++){
            EditorUI.toolbar.appendChild(toolbarItems[idx]);
        }
        for (var idx=0; idx < colorbarItems.length; idx++){
            colorbarItems[idx].setAttribute("color", true);
            EditorUI.toolbar.appendChild(colorbarItems[idx]);
        }

        EditorUI.toolbar.appendChild(EditorUI.quitEditingBtn);
        EditorUI.toolbar.appendChild(EditorUI.deliverBtn);

        EditorUI.root.appendChild(EditorUI.canvas);
        EditorUI.root.appendChild(EditorUI.toolbar);
        
        document.body.appendChild(EditorUI.root);
        
        select_color(color_red, Colors.red);
        select_tool(pencil, Tools.PENCIL);

        EditorStatus.added = true;
        hide_editor();
    }
    ensure_texttool_template();
}

function show_editor(){
    if (!EditorStatus.added){
        add_editor();
    }

    if (pending_screenshot){ // editor can only show up when there is a pending image. 
        EditorStatus.visible = true;
        EditorStatus.mouse.donw = false;

        EditorStatus.ctxImage = new Image()
        EditorStatus.ctxImage.onload = function(){
            if (EditorStatus.visible){
                EditorUI.canvas.width = EditorStatus.ctxImage.width;
                EditorUI.canvas.height = EditorStatus.ctxImage.height;

                EditorUI.ctx.drawImage(EditorStatus.ctxImage, 0, 0);

                EditorUI.root.setAttribute("disabled", false);
                EditorUI.root.style.visibility = "visible";
                EditorUI.root.style.opacity = 1;
            }
            EditorStatus.currentImage = EditorUI.canvas.toDataURL();
        };
        EditorStatus.ctxImage.src = ScreenshotUI.Preview.element.src;
    }
}

function hide_editor(){
    // save current edited image to preview and hide editor.
    
    if (!EditorStatus.added) {
        return;
    }
    EditorStatus.visible = false;
    EditorStatus.mouse.down = false;
    
    EditorUI.root.setAttribute("disabled", true);
    
    EditorUI.root.style.opacity = 0;
    setTimeout(() => {
        if (!EditorStatus.visible){
            EditorUI.root.style.visibility = "hidden";
        }
    }, 500);
    
    

}

function hide_preview(){
    if (ScreenshotUI.Preview.added){
        ScreenshotUI.Preview.visible = false;
        ScreenshotUI.Preview.element.style.opacity = 0;
        setTimeout(() => {
            if (!ScreenshotUI.Preview.visible){
                ScreenshotUI.Preview.element.style.visibility = "hidden";
            }
        }, 500);
    }
}

function send_pending_screenshot(){
    if (pending_screenshot){
        var dt = new duckDataTransfer([pending_screenshot]);
        var evt_dr = new duckDrop(chatroom, 114, 243, dt);

        // simulate the drag-n-drop procdure to send the image we've just captured.
        chatroom.dispatchEvent(evt_dr);

        // remove the pending screenshot and editing history.
        pending_screenshot = null;
        EditorStatus.editHistory.length = 0;
        EditorStatus.editFuture.length = 0;

        hide_sendscreenshot_button();
    }
}

/* Add send screenshot button near the send button. */
function add_sendscreenshot_button(){

    action_bar = $(".action")[0];
    inject_style(".btn_sendscreenshot {transition: margin 0.5s, opacity 0.5s; background-color:white; z-index:999; color:#222;} .btn_sendscreenshot:hover {background-color: #f8f8f8}");
    
    ScreenshotUI.sendScreenshotBtn = document.createElement("a");
    ScreenshotUI.sendScreenshotBtn.className = "btn btn_sendscreenshot";
    ScreenshotUI.sendScreenshotBtn.href = "javascript:;"
    ScreenshotUI.sendScreenshotBtn.style.marginRight = "5px";
    ScreenshotUI.sendScreenshotBtn.textContent = "编辑截图";
    ScreenshotUI.sendScreenshotBtn.title = "点击编辑截图, 右键直接发送";

    ScreenshotUI.sendScreenshotBtn.onclick = function(e){
        hide_preview();
        show_editor();
    };

    ScreenshotUI.sendScreenshotBtn.oncontextmenu = function(){
        hide_sendscreenshot_button();
        send_pending_screenshot();
        return false;
    }

    ScreenshotUI.sendScreenshotBtn.onmouseenter = function(e){
        show_preview();
    }

    // ScreenshotUI.sendScreenshotBtn.onmouseleave = function(e){
    //     hide_preview();
    // }

    var btn_send = null;
    for (var idx=0; idx < action_bar.childNodes.length; idx++){
        // iterate through childNodes to find actual send button.
        if(action_bar.childNodes[idx].classList) {
            for (var idx_cls=0; idx_cls < action_bar.childNodes[idx].classList.length; idx_cls++){
                if (action_bar.childNodes[idx].classList[idx_cls] == "btn_send"){
                    btn_send = action_bar.childNodes[idx];
                    break;
                }
            }
        }
        if (btn_send !== null){
            break;
        }
    }
    hide_sendscreenshot_button();
    action_bar.insertBefore(ScreenshotUI.sendScreenshotBtn, btn_send);
}


function hide_sendscreenshot_button(){
    ScreenshotUI.sendScreenshotBtnVisible = false;
    ScreenshotUI.sendScreenshotBtn.setAttribute("disabled", true);

    if (ScreenshotUI.sendScreenshotBtn.offsetWidth > 0){
        ScreenshotUI.sendScreenshotBtn.style.marginRight = "-" + ScreenshotUI.sendScreenshotBtn.offsetWidth + "px";
    } else {
        ScreenshotUI.sendScreenshotBtn.style.marginRight = "-98px";
    }

    ScreenshotUI.sendScreenshotBtn.style.opacity = "0";
    setTimeout(() => {
        if (!ScreenshotUI.sendScreenshotBtnVisible){
            ScreenshotUI.sendScreenshotBtn.style.visibility="hidden";
        }
    }, 2000);
    hide_preview();
}

function show_sendscreenshot_button(){
    ScreenshotUI.sendScreenshotBtn.setAttribute("disabled", false);
    ScreenshotUI.sendScreenshotBtnVisible = true;
    ScreenshotUI.sendScreenshotBtn.style.visibility="visible";
    ScreenshotUI.sendScreenshotBtn.style.marginRight = "6px";
    ScreenshotUI.sendScreenshotBtn.style.opacity = "1";
    setTimeout(() => {
        show_preview();
    }, 500);
}

function toggle_sendscreenshot_button(){
    if (ScreenshotUI.sendScreenshotBtnVisible){
        hide_sendscreenshot_button();
    }else{
        show_sendscreenshot_button();
    }
}


function request_capture(){
    if (access_key){
        var req = new XMLHttpRequest();
        req.responseType = 'arraybuffer';
        req.onreadystatechange = function(e){
            if (req.readyState == 4 && req.status == '200'){
                // returned from python backend.
                // console.log("GOT: ", req.response);
                if (req.response.byteLength > 0){
                    var b = new Blob([req.response], {type: 'image/png'});
                    var f = new File([b], "capture.png", {type: 'image/png'});
                    pending_screenshot = f;

                    // clear edit history.
                    EditorStatus.editHistory.length = 0;
                    EditorStatus.editFuture.length = 0;
                    
                    show_sendscreenshot_button();
                }
            } else if (req.readyState == 4){
                show_instructions();
            }
        };

        var u = host + "/capture" + "?access_key=" + access_key + "&random=" + Math.random();
        req.open("GET", u, true);
        req.send(null);  // signal the python backend to initial a screen shot procdure.
    } else {
        show_instructions();
    }
}

function hook_toolbar_screenshot(){
    
    var tlb = document.getElementById("tool_bar");  // get chat room tool bar
    var btn = null;
    for (var i = 0; i < tlb.children.length; i++){   // iterate througn tlb.children to find the "screensot" button.
        attr = tlb.children[i].attributes.getNamedItem("title")
        if (attr != null && (attr.value == "Screenshot" || attr.value == "截屏" || attr.value == "螢幕截圖")){
        btn = tlb.children[i];
        break;
        }
    }
    
    var new_btn = btn.cloneNode(true);  // clone the node to remove all wechat-defined event handlers.
    new_btn.onclick = function(e){  // create custom event handler
    
        if (!access_key){ // if no access key acquired, try get one first.
            getAccessKey();
            setTimeout(() => {
                request_capture();
            }, 500); 
            return;
        }
        request_capture();
    };
    tlb.replaceChild(new_btn, btn);
}

function getAccessKey(){
    var accesskey_req = new XMLHttpRequest();
    accesskey_req.timeout = 500;
    accesskey_req.onreadystatechange = function (e){
        if (accesskey_req.readyState == 4 && accesskey_req.status == '200'){
            try{
                var rtn = JSON.parse(accesskey_req.response);
                access_key = rtn["access_key"];
                console.log("Server access_key: " + access_key);
            }catch(ex){
                console.log("failed to retrieve access_key from screen capture backend.");
            }
        }
    }
    accesskey_req.open("GET", host + "/check_capability", true)
    accesskey_req.send(null);
}


add_sendscreenshot_button();
hook_toolbar_screenshot();
getAccessKey();
