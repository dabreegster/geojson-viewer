#!/bin/bash
# This is a shortcut to open the app and load a file from CLI. Use at your own risk.

set -e

rm -rf /tmp/view_gj
mkdir /tmp/view_gj
cp $1 /tmp/view_gj/file.geojson

dir=`dirname $0`
$dir/http_cors.py &

xdg-open "https://dabreegster.github.io/geojson-viewer/?load_url=http://localhost:8000/file.geojson"
sleep 10
kill %1
