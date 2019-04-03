import os
import io
import sys
import json
import subprocess
import re
import stat
import shutil

from simphttpd import Response, SimpleHTTPServer

last_exec = ""

SCRIPT_ROOT, SCRIPT_NAME = os.path.split(__file__)
CACHE_ROOT = os.path.join(SCRIPT_ROOT, ".cache")
CONF_FILE = os.path.join(CACHE_ROOT, ".conf")
LOG_FILE = os.path.join(SCRIPT_ROOT, ".log")


def chatroom(userid, roomid):
    root = os.path.join(CACHE_ROOT, "chatrooms", str(userid), str(roomid))
    os.makedirs(root, exist_ok=True)
    return root


def daemonize():
    try:
        pid = os.fork()
        if pid > 0:
            # exit first parent
            exit(0)
    except OSError as ex:
        print("Failed to deamonize (1st fork failed).", file=sys.stderr)
        exit(1)
    
    try:  # decouple from parent environment
        # os.chdir("/") 
        os.setsid()
        os.umask(0)
    except PermissionError as ex:
        print("Failed to deamonize(setsid failed).", file=sys.stderr)
        exit(2)
        pass

    try:
        pid = os.fork()
        if pid > 0:
            # exit second parent
            exit(0)
    except OSError as err:
        print("Failed to deamonize(2nd fork failed).", file=sys.stderr)
        exit(3)
    
    sys.stdout = io.open(os.devnull, "w")
    sys.stderr = io.open(os.devnull, "a")
    sys.stdin = io.open(os.devnull, "r")


def f_capab(svr: SimpleHTTPServer, method: str, request_headers: dict, http_version: str, requested_uri: str, request_parameters: dict, request_body, response: Response):

    return json.dumps({
        "capabilities": ["capture", "sync", "config", "internals", "quit", "poll"],
        "version": "0.1",
        "access_key": svr.access_key
    })

        
def f_capture(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    
    global last_exec

    if "access_key" in request_parameters and request_parameters["access_key"] == svr.access_key:
        rtn = subprocess.call(["/usr/bin/gnome-screenshot", "-a", "-f", "/tmp/firefox-screenshot.png"], close_fds=True)  # call ImageMagick import to make a screenshot.
        last_exec = "f_cap: " + str(rtn)
        
        if rtn == 0 and os.path.exists("/tmp/firefox-screenshot.png"):
            f = io.open("/tmp/firefox-screenshot.png", "rb")
            result = f.read()
            f.close()

            os.remove("/tmp/firefox-screenshot.png")
            return result
            
        else:
            return bytearray()
    else:
        bdy = svr.template("Permission Denied", "You are not qualified to access this page.")
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.status_code = "403 Forbidden"
        return bdy


def f_quit(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    
    if "access_key" in request_parameters and request_parameters["access_key"] == svr.access_key:
        response.headers["X-Will-Quit-After"] = "YES"
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        bdy = svr.template("Exit", "Request accepted.")
        response.status_code = "200 OK"
        return bdy
    else:
        response.headers["X-Will-Quit-After"] = "NO"
        bdy = svr.template("Permission Denied", "You are not qualified to access this page.")
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.status_code = "403 Forbidden"
        return bdy


def f_internals(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    d = {
        "env": dict(os.environ),
        "Last-Exec": last_exec,
        "access_key": svr.access_key
    }

    try:
        return json.dumps(d, sort_keys=True) 
    except Exception as ex:
        return "err" + str(ex)


def f_poll(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):

    return "FEATURE UNDER CONSTRUCTION"


def f_conf(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    if method == "GET":
        
        pass
    elif method == "POST":
        # a post request made to change settings.
        
        pass
    
    return "FEATURE UNDER CONSTRUCTION"


def f_sync(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    # sync the chat log.
    if method == "GET":
        # request from webclient, return chatroom log
        
        pass
    elif method == "POST":
        # update from webclient, save to chatroom log.
        pass
    pass
    return "FEATURE UNDER CONSTRUCTION"


def prepare():
    os.makedirs(CACHE_ROOT, exist_ok=True)

    os.umask(stat.S_IXUSR + stat.S_IRWXG + stat.S_IRWXO)
    # deny access to others. and deny execution from anything this script written.
    
    if not os.path.exists(CONF_FILE):
        save_configurations({})


def name_filtering(n):
    flt = re.compile(r"[^a-zA-Z0-9]")
    n = flt.sub("", n)
    return n.lower()


def load_configurations():
    with io.open(CONF_FILE, "r") as f:
        return json.load(f)


def backup_configurations(backupname):
    if os.path.exists(CONF_FILE + "." + name_filtering(backupname)):
        os.remove(CONF_FILE+".old")
    
    shutil.copy2(CONF_FILE, CONF_FILE + ".old")  # backup old configurations.
    
    with io.open(CONF_FILE, "w") as f:
        json.dump(conf, f, indent=2, sort_keys=True)


def save_configurations(conf):
    if os.path.exists(CONF_FILE + ".old"):
        os.remove(CONF_FILE+".old")
    
    if os.path.exists(CONF_FILE):
        shutil.copy2(CONF_FILE, CONF_FILE + ".old")  # backup old configurations.
    
    with io.open(CONF_FILE, "w") as f:
        json.dump(conf, f, indent=2, sort_keys=True)
    

def main():

    prepare()
    daemonize()
        
    httpd = SimpleHTTPServer(32728, bind_addr="127.0.0.1")
    
    httpd.configurations = load_configurations()
    
    httpd.additional_headers = {  # allow cross site requests.
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    httpd.add_file("/capture", f_capture, mime_type="image/png")
    httpd.add_file("/poll", f_poll, mime_type="image/png")  # for long connection image polling, send images after captured from other place.
    httpd.add_file("/check_capability", f_capab, mime_type="application/json")
    httpd.add_file("/quit", f_quit, mime_type="application/json")
    # httpd.add_file("/internals", f_internals, mime_type="application/json")
    httpd.add_file("/config", f_conf, mime_type="text/html")
    
    if httpd.start():
        try:
            httpd.working_thread.join()
        except KeyboardInterrupt:
            print(" Stopping backend server ...")
            httpd.stop()
    else:
        print("Failed to start http server, may already running or port used by other program?")
        exit(5)
    
    print("Saving configurations ...")
    save_configurations(httpd.configurations)
    print("Bye!")


if __name__ == "__main__":
    main()

