setTimeout(function(){
  var sc = document.createElement("script");
  sc.type = "text/javascript";
  sc.textContent = `

  var chatroom = document.getElementById("chatArea");
  var access_key = null;

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
  
    var instructions_added = false;

    function show_instructions(){
        if (!instructions_added){
          var style = ".screenshot_overlay {display: block; transition: opacity 0.5s; position: fixed; width:100%; height:100%; left:0; top: 0; box-sizing:border-box; background-color:rgba(0,0,0,0.3);z-index: 99999;}";
          style    += ".screenshot_welcome {border-radius: 5px; display: block; position: relative; margin: auto; margin-top:100px; padding: 30px; width: 600px; height: 700px; background-color: white; box-sizing:border-box;box-shadow: 0 0 50px rgba(0,0,0,0.8);}";
          style    += ".screenshot_code {font-size: 0.8em; font-family: mono; background-color:rgba(255,255,0,0.3); border: 1px solid rgb(255,230,0); border-left-width: 5px; padding: 10px; padding-left: 20px; margin: 10px;}";
          style    += ".screenshot_message {background-color:rgba(230,100,255,0.3); border: 0 solid rgb(230,100,255); border-top-width: 5px; border-bottom-width: 5px; padding: 10px; padding-left: 20px; margin: 10px;}";

          var welcome = "<h2><center>Welcome to Wechat Screenshot Helper!</center></h2>";
          welcome    += "<div class='screenshot_message'>";
          welcome    += "  It seems that you have successfully installed this tiny extension. ";
          welcome    += "  However, it seems that your backend is not running now.";
          welcome    += "</div>";
          welcome    += "* if you haven't installed it yet, we need a little bit more thing to be done to get this fully functional. ";
          welcome    += "simply fire up your favorite terminal and run the following command:";
          welcome    += "<div class='screenshot_code'>";
          welcome    += "  cd /path/to/store/the/code";
          welcome    += "  git clone https://github.com/imkzh/WechatScreenshotHelper<br />";
          welcome    += "  cd WechatScreenshotHelper<br />";
          welcome    += "  sudo python3 ./backend.py enable<br />";
          welcome    += "</div>";
          welcome    += "<br />* if you have already installed the backend, it may closed because of some reason, please invoke:";
          welcome    += "<div class='screenshot_code'>"
          welcome    += "  cd WechatScreenshotHelper <br />"
          welcome    += "  python3 ./backend.py enable <br />"
          welcome    += "</div> to start it.</br>";
          welcome    += "Once you have started the backend successfully, <strong>refresh</strong> wechat.";

          welcome    += "<center><h3><strong>double click</strong> <span style='color:gray;'>anywhere to dismiss.</span></h3></center>";
      
          var stl = document.createElement("style");
          stl.textContent = style;
          document.head.appendChild(stl);
      
          var ovl = document.createElement("div");
          ovl.className = "screenshot_overlay";
          ovl.id = "screenshot_overlay";
          var wel = document.createElement("div");
          wel.innerHTML = welcome;
          wel.className = "screenshot_welcome";
      
          ovl.appendChild(wel);
          document.body.appendChild(ovl);
      
          ovl.ondblclick = (e)=>{
              ovl.style.opacity = '0';
              setTimeout(()=>{ovl.style.display="none";}, 510);
          }
        }else{
            var ovl = document.getElementById("screenshot_overlay");
            ovl.style.display="block";
            ovl.style.opacity = '1';
        }
    }

    var tlb = document.getElementById("tool_bar");  // get chat room tool bar

    var btn = null;
    for (var i = 0; i < tlb.children.length; i++){   // iterate througn tlb.children to find the "screensot" button.
      attr = tlb.children[i].attributes.getNamedItem("title")
      if (attr != null && attr.value == "Screenshot"){
        btn = tlb.children[i];
        break;
      }
    }

    var new_btn = btn.cloneNode(true);  // clone the node to remove all wechat-defined event handlers.
    new_btn.onclick = function(e){  // create custom event handler

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

                // simulate the drag-n-drop procdure to send the image we've just captured.
                var dt = new duckDataTransfer([f]);
                var evt_dr = new duckDrop(chatroom, 114, 243, dt);
                
                chatroom.dispatchEvent(evt_dr);
                // console.log("Event Dispatched.");
              }
            } else if (req.readyState == 4){
                show_instructions();
            }
        };

        var u = "http://127.0.0.1:32728/capture" + "?access_key=" + access_key + "&random=" + Math.random();
        req.open("GET", u, true);
        req.send(null);  // signal the python backend to initial a screen shot procdure.
      } else {
        show_instructions();
      }
        
    };

    
    var accesskey_req = new XMLHttpRequest();
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
    accesskey_req.open("GET", "http://127.0.0.1:32728/check_capability", true)
    accesskey_req.send(null);

    tlb.replaceChild(new_btn, btn);
  `;
  
  document.body.appendChild(sc);
  
}, 300);
