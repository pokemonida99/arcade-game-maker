import http.server, base64, sys, os
OUT = os.path.dirname(os.path.abspath(__file__))
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers['Content-Length']); body = self.rfile.read(n).decode()
        name, data = body.split('|', 1)
        open(os.path.join(OUT, name), 'wb').write(base64.b64decode(data.split(',', 1)[1]))
        self.send_response(200); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers(); self.wfile.write(b'ok')
    def log_message(self, *a): pass
http.server.HTTPServer(('127.0.0.1', 4211), H).serve_forever()
