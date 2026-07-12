#!/usr/bin/env bash

set -euo pipefail

if [[ "$(uname -s)" == "Darwin" ]]; then
  for java_home in \
    /opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
    /usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  do
    if [[ -x "$java_home/bin/java" ]]; then
      export JAVA_HOME="$java_home"
      export PATH="$JAVA_HOME/bin:$PATH"
      break
    fi
  done
fi

exec npx react-native run-android "$@"
