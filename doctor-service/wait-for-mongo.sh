#!/bin/sh
# wait-for-mongo.sh

set -e

host="mongodb-doctor"
port="27017"
cmd="node index.js"

echo "Waiting for MongoDB at $host:$port to be ready..."

while ! nc -z $host $port; do
  echo "MongoDB not yet available at $host:$port. Sleeping for 1 second..."
  sleep 1
done

echo "MongoDB is available. Starting service..."
exec $cmd
