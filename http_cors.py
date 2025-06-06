#!/usr/bin/env python3

from http.server import HTTPServer, SimpleHTTPRequestHandler, test
import os
import sys


class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        SimpleHTTPRequestHandler.end_headers(self)


if __name__ == "__main__":
    os.chdir("/tmp/view_gj")
    test(CORSRequestHandler, HTTPServer, port=8000)
