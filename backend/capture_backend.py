import socket
import threading
import os
import inspect
import io
import random
import base64
import urllib.parse
import typing
import sys
import json


class Response:

    def __init__(self):
        self.status_code = "200 OK"
        self.headers = {}

    def normalize_header(self):
        self.headers = self.get_normalized_header(self.headers)

    @staticmethod
    def get_normalized_header(h):
        return {k.strip().title(): h[k].strip() for k in h}


class SimpleHTTPServer:

    def __init__(self, port: int, bind_addr="0.0.0.0"):
        self.port = port
        self.files = {}
        self.isListening = False
        self.bind_addr = bind_addr
        
        self.srv = socket.socket()
        self.srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        
        self.working_thread = None
        self.access_key = self.generate_access_key()

        self.server_name = "simple server"

    @staticmethod
    def template(title: str, msg_body: str):
        template = "<!DOCTYPE HTML>" + \
                   "<html>" + \
                   "<head>" + \
                   "   <title>" + title + "</title>" + \
                   "</head>" + \
                   "<body>" + \
                   "   <h1>" + title + "</h1>" + \
                   "   <p>" + msg_body + "</p>" + \
                   "</body>" + \
                   "</html>"

        return template

    def send_template_message(self, client_socket: socket.socket, title: str, msg_body: str, status_code: str="200 OK"):
        template = self.template(title, msg_body).encode()
        self.send_http_respond(client_socket, template, {}, status_code)

    def send_http_respond(self, client_socket: socket.socket, msgbody: typing.Union[bytearray, bytes], additional_headers: dict, status_code: str="200 OK"):
        additional_headers["Content-Length"] = str(len(msgbody))
        additional_headers["Server"] = self.server_name
        additional_headers["Connection"] = "Closed"
        if "Content-Type" not in additional_headers:
            additional_headers["Content-Type"] = "text/html; charset=utf-8"

        respond = b"HTTP/1.1 " + status_code.encode() + b"\r\n"

        for each in additional_headers:
            respond += each.strip().encode() + b": " + additional_headers[each].strip().encode() + b"\r\n"
        respond += b"\r\n"
        client_socket.send(respond+msgbody)

    @staticmethod    
    def generate_access_key():
        k = bytearray([random.randint(0, 255) for _x in range(20)])
        acckey = base64.b64encode(k).decode("utf-8").replace("=", "")
        return acckey
    
    @staticmethod
    def urldecode(u):
        return urllib.parse.unquote_plus(u)
    
    @staticmethod
    def unpack_get_parameters(p):
    
        # possible input: "abc=def&jkl=asdf==&asdf#anchor"
        if "#" in p:
            p = p.split("#")[0]

        fields = p.strip().split("&")
        para = {}
        
        for kv in fields:
            kv = kv.strip()
            if len(kv) > 0:
                sp = kv.split("=", 1)
                if len(sp) == 2:
                    key, val = sp
                else:
                    key = sp
                    val = ""
                key = SimpleHTTPServer.urldecode(key)
                val = SimpleHTTPServer.urldecode(val)
                para[key] = val
        
        return para
        
    @staticmethod
    def unpack_http_headers(h):
        lines = h.split(b"\r\n")
        
        if lines[-1] == "":
            del lines[-1]
        
        h = {}
        
        for line in lines:
            line = line.decode("utf-8")
            if ":" in line:
                key, val = line.split(":", 1)
            else:
                key, val = line, ""

            key = key.strip().title()
            val = val.strip()
            h[key] = val
            
        return h
    
    @staticmethod
    def split_request_url(u):
        
        # a general request url to: relpath, parameters, anchor.
        # possible input: "/path/to/requested/file.ext?param=value&param2=url%20encoded+value#anchor"
        
        if "#" in u:
            u, anchor = u.rsplit("#", 1)
        else:
            anchor = ""
        
        if "?" in u:
            relpath, param = u.split("?", 1)
        else:
            relpath = u
            param = ""
            
        return relpath, param, anchor
    
    def add_file(self, name: str, path: typing.Union[str, typing.Callable], mime_type: str=None, replaces: dict=None, **kwargs):
        if mime_type is None:
            mime_type = "text/html"

        if not isinstance(replaces, dict):
            replaces = {}

        for k in kwargs:
            replaces[k] = kwargs[k]

        self.files[name] = {"file": path, "dict": replaces, "type": mime_type}

    def client_procdure(self, accept):
        client, addr = accept
        d = bytearray()

        while not d[-4:] == b"\r\n\r\n":
            try:
                d.append(client.recv(1)[0])
            except socket.error:
                try:
                    client.close()
                except socket.error:
                    return
                    
            if len(d) > 8192:
                self.send_template_message(client, "Request Header Too Large", "Size of request header is limited to 8192 bytes.", "494 Request header too large")
                client.close()
                return

        try:
            reqline, headers = d.split(b"\r\n", 1)
            req = reqline.decode("utf-8").split(" ")
            headers = self.unpack_http_headers(headers)
            headers = Response.get_normalized_header(headers)

            req_body = b""
            try:
                if "Content-Length" in headers and int(headers["Content-Length"]) > 0:
                    cl = int(headers["Content-Length"])
                    if cl < 1024 * 1024 * 5:
                        req_body = client.recv(cl)
                    else:
                        self.send_template_message(client, "Request Body Too Long", "Size of request payload is limited to 5MiB (5*1024*1024 Bytes).", "413 Payload Too Large")
                        client.close()
                        return

            except ValueError:
                self.send_template_message(client, "Length Required", "Please set header field `Content-Length` to a valid value.", "411 Length Required")
                client.close()
                return

            if len(req) == 3:
                method = req[0]
                rel_path = req[1]
                ver = req[2]

                request_file_rel_path, request_get_parameters, request_url_anchor = self.split_request_url(rel_path)
                request_get_parameters = self.unpack_get_parameters(request_get_parameters)

                if request_file_rel_path in self.files:

                    f = self.files[request_file_rel_path]
                    
                    if inspect.isfunction(f['file']):

                        resp = Response()
                        respond_bdy = f['file'](self, method=method.upper(), request_headers=headers, http_version=ver,
                                                requested_uri=request_file_rel_path, request_parameters=request_get_parameters, request_body=req_body, response=resp)

                        if "Content-Type" not in resp.headers:
                            resp.headers["Content-Type"] = f["type"]

                        if type(respond_bdy) is str:
                            respond_bdy = respond_bdy.encode("utf-8")

                        self.send_http_respond(client, respond_bdy, resp.headers, resp.status_code)
                        client.close()
                        
                    elif os.path.isfile(f['file']):

                        ff = open(f['file'], "rb")
                        t = ff.read()

                        if f["dict"] is not None:
                            for k in f["dict"]:
                                t = t.replace(k.encode("utf-8"), f["dict"][k].encode("utf-8"))

                        if t[:3] == b'\xef\xbb\xbf':  # remove utf-8 bom.
                            t = t[3:]

                        self.send_http_respond(client, t, {"Content-Type": f["type"]})
                        client.close()
                    else:
                        self.send_template_message(client, "File Not Found",
                                                   "The requested URL" + request_file_rel_path + "was registered to this server, but corrsponding file not found, maybe a typo in file path?",
                                                   "404 NOT FOUND")
                        client.close()
                else:
                    self.send_template_message(client, "File Not Found",
                                               "The requested URL" + request_file_rel_path + "was registered to this server.",
                                               "404 NOT FOUND")

                    client.close()
                    pass
            else:
                try:
                    self.send_template_message(client, "Bad Request", "Bad request line.", "400 Bad Request")
                    client.close()
                except socket.error:
                    pass

        except Exception as ex:
            print(ex)
            try:
                self.send_template_message(client, "Internal Server Error", "Server encountered a internal error. For detailed information, see log file.", "500 Internal Server Error")
                client.close()
                return
            except socket.error:
                return
                pass

    def server_procdure(self):
        self.srv.settimeout(5)
        while self.isListening:
            try:
                client, address = self.srv.accept()
                t = threading.Thread(target=self.client_procdure, args=((client, address),), daemon=True)
                t.start()
            except IOError:
                continue

    def start(self):
        self.isListening = True
        try:
            self.srv.bind((self.bind_addr, self.port))
            self.srv.listen()
        except socket.error:
            return False

        self.working_thread = threading.Thread(target=self.server_procdure, daemon=True)
        self.working_thread.start()
        return True

    def stop(self):
        self.isListening = False
        self.srv.close()
        self.working_thread.join()
        pass


def f_capab(svr: SimpleHTTPServer, method: str, request_headers: dict, http_version: str, requested_uri: str, request_parameters: dict, request_body, response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    return json.dumps({"capabilities": ["capture"], "version": "0.1", "access_key": svr.access_key})

        
def f_cap(svr: SimpleHTTPServer, method, request_headers, http_version, requested_uri, request_parameters, request_body, response: Response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"

    if "access_key" in request_parameters and request_parameters["access_key"] == svr.access_key:
        os.system("import /tmp/firefox-screenshot.png")    # call ImageMagick import to make a screenshot.
        f = io.open("/tmp/firefox-screenshot.png", "rb")
        result = f.read()
        f.close()
        return result
    else:
        bdy = svr.template("Permission Denied", "You are not qualified to access this page.")
        response.headers["Content-Type"] = "text/html; charset=utf-8"
        response.status_code = "403 Forbidden"
        return bdy


def main():

    httpd = SimpleHTTPServer(32728, bind_addr="127.0.0.1")
    
    httpd.add_file("/capture", f_cap, mime_type="image/png")
    httpd.add_file("/check_capability", f_capab, mime_type="application/json")
    
    if httpd.start():
        httpd.working_thread.join()
    else:
        print("Failed to start http server, may already running or port used by other program?")


if __name__ == "__main__":
    main()

