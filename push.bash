#!/usr/bin/env bash

ROOT_PATH="$(dirname $0)"

rsync -r "${ROOT_PATH}" static@cguille.net:www/bibli-naheulbeuk
